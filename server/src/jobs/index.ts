import cron from 'node-cron';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { FineService } from '../services/fine.service';
import { CopyStatus, ReservationStatus } from '../types';
import { SettingService } from '../services/setting.service';

export function setupBackgroundJobs() {
  logger.info('Initializing background cron jobs...');

  // 1. Due date reminders - Runs daily at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running cron: Due date reminders...');
    try {
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(twoDaysFromNow.setHours(0, 0, 0, 0));
      const endOfDay = new Date(twoDaysFromNow.setHours(23, 59, 59, 999));

      const loansDueSoon = await prisma.loan.findMany({
        where: {
          status: 'ACTIVE',
          dueDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          copy: { include: { book: true } },
          member: { include: { user: true } }
        }
      });

      for (const loan of loansDueSoon) {
        await prisma.notification.create({
          data: {
            userId: loan.member.userId,
            type: 'DUE_DATE_REMINDER',
            title: 'Book Due in 2 Days',
            message: `Friendly reminder: "${loan.copy.book.title}" is due on ${loan.dueDate.toLocaleDateString()}. Please return or renew it to avoid fines.`
          }
        });
      }
      logger.info(`Cron: Sent ${loansDueSoon.length} due date reminders.`);
    } catch (error) {
      logger.error({ error }, 'Error in due date reminders cron job');
    }
  });

  // 2. Overdue fine calculation - Runs daily at midnight 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    logger.info('Running cron: Overdue fine recalculation...');
    try {
      const updated = await FineService.recalculateOverdueFines();
      logger.info(`Cron: Overdue fines calculated/updated for ${updated} records.`);
    } catch (error) {
      logger.error({ error }, 'Error in overdue fine calculation cron job');
    }
  });

  // 3. Expiring reservations check - Runs every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running cron: Expiring reservations check...');
    try {
      const now = new Date();
      const holdPeriodHours = await SettingService.getNumber('holdPeriodHours', 48);

      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: ReservationStatus.READY,
          expiresAt: { lt: now }
        },
        include: {
          book: true,
          member: { include: { user: true } }
        }
      });

      for (const res of expiredReservations) {
        // Expire this reservation
        await prisma.reservation.update({
          where: { id: res.id },
          data: { status: ReservationStatus.EXPIRED }
        });

        // Notify member
        await prisma.notification.create({
          data: {
            userId: res.member.userId,
            type: 'RESERVATION_EXPIRED',
            title: 'Reservation Hold Expired',
            message: `Your hold on "${res.book.title}" has expired because it was not picked up in time.`
          }
        });

        // Check if another reservation is pending for this book
        const nextPending = await prisma.reservation.findFirst({
          where: {
            bookId: res.bookId,
            status: ReservationStatus.PENDING
          },
          orderBy: [{ queuePosition: 'asc' }, { requestedAt: 'asc' }],
          include: { member: true }
        });

        const reservedCopy = await prisma.bookCopy.findFirst({
          where: {
            bookId: res.bookId,
            status: CopyStatus.RESERVED
          }
        });

        if (nextPending && reservedCopy) {
          const nextExpiry = new Date(now.getTime() + holdPeriodHours * 60 * 60 * 1000);
          await prisma.reservation.update({
            where: { id: nextPending.id },
            data: {
              status: ReservationStatus.READY,
              readyAt: now,
              expiresAt: nextExpiry
            }
          });

          await prisma.notification.create({
            data: {
              userId: nextPending.member.userId,
              type: 'RESERVATION_READY',
              title: 'Reserved Book Ready for Pickup!',
              message: `"${res.book.title}" is now ready for you! Pickup by ${nextExpiry.toLocaleString()}.`
            }
          });
        } else if (reservedCopy) {
          // No more pending reservations, make copy available
          await prisma.bookCopy.update({
            where: { id: reservedCopy.id },
            data: { status: CopyStatus.AVAILABLE }
          });
        }
      }

      logger.info(`Cron: Processed ${expiredReservations.length} expired reservations.`);
    } catch (error) {
      logger.error({ error }, 'Error in expiring reservations cron job');
    }
  });

  logger.info('Background cron jobs scheduled successfully.');
}

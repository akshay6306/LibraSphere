import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';
import { SettingService } from './setting.service';

export class FineService {
  static async getFines(query: { memberId?: string; isPaid?: boolean | string }) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.isPaid !== undefined) {
      where.isPaid = String(query.isPaid) === 'true';
    }

    return prisma.fine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          include: {
            copy: { include: { book: true } }
          }
        },
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        payments: true
      }
    });
  }

  static async getFineById(id: string) {
    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            copy: { include: { book: true } }
          }
        },
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        payments: true
      }
    });

    if (!fine) {
      throw new AppError('Fine record not found.', 404);
    }

    return fine;
  }

  static async payFine(
    fineId: string,
    data: { amount?: number; method: string; memberId?: string },
    userId?: string
  ) {
    const fine = await prisma.fine.findUnique({
      where: { id: fineId },
      include: {
        loan: { include: { copy: { include: { book: true } } } },
        member: true
      }
    });

    if (!fine) {
      throw new AppError('Fine record not found.', 404);
    }

    if (fine.isPaid) {
      throw new AppError('This fine has already been paid in full.', 400);
    }

    if (data.memberId && fine.memberId !== data.memberId) {
      throw new AppError('Unauthorized: You can only pay your own fines.', 403);
    }

    const payAmount = data.amount || fine.amount;
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark fine paid
      const updatedFine = await tx.fine.update({
        where: { id: fineId },
        data: { isPaid: true }
      });

      // 2. Create payment record
      const payment = await tx.payment.create({
        data: {
          fineId: fine.id,
          memberId: fine.memberId,
          amount: payAmount,
          method: data.method || 'ONLINE',
          transactionId
        }
      });

      // 3. Decrement member totalFines
      await tx.member.update({
        where: { id: fine.memberId },
        data: {
          totalFines: { decrement: payAmount }
        }
      });

      // 4. Create confirmation notification
      await tx.notification.create({
        data: {
          userId: fine.member.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Fine Payment Confirmed',
          message: `Payment of $${payAmount.toFixed(2)} received for "${fine.loan.copy.book.title}". Transaction ID: ${transactionId}.`
        }
      });

      return { fine: updatedFine, payment };
    });

    await AuditService.log({
      userId,
      action: 'FINE_PAID',
      entityType: 'FINE',
      entityId: fineId,
      details: `Paid $${payAmount.toFixed(2)} for fine ${fineId} via ${data.method} (Txn: ${transactionId})`
    });

    return result;
  }

  static async recalculateOverdueFines(): Promise<number> {
    const now = new Date();
    const finePerDay = await SettingService.getNumber('finePerDay', 5);
    const gracePeriod = await SettingService.getNumber('gracePeriod', 2);

    // Find all ACTIVE or OVERDUE loans past due date
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        dueDate: { lt: now }
      },
      include: {
        copy: { include: { book: true } },
        member: true,
        fines: true
      }
    });

    let updatedCount = 0;

    for (const loan of overdueLoans) {
      const diffMs = now.getTime() - loan.dueDate.getTime();
      const overdueDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      // Check grace period
      if (overdueDays > gracePeriod) {
        // Mark loan OVERDUE if still ACTIVE
        if (loan.status === 'ACTIVE') {
          await prisma.loan.update({
            where: { id: loan.id },
            data: { status: 'OVERDUE' }
          });
        }

        const calculatedFine = Math.min((overdueDays - gracePeriod) * finePerDay, loan.copy.book.price);
        const existingFine = loan.fines.find((f) => !f.isPaid);

        if (existingFine) {
          if (existingFine.amount !== calculatedFine) {
            const difference = calculatedFine - existingFine.amount;
            await prisma.fine.update({
              where: { id: existingFine.id },
              data: {
                amount: calculatedFine,
                reason: `Overdue fine updated (${overdueDays} days past due)`
              }
            });

            await prisma.member.update({
              where: { id: loan.memberId },
              data: { totalFines: { increment: difference } }
            });
            updatedCount++;
          }
        } else {
          await prisma.fine.create({
            data: {
              loanId: loan.id,
              memberId: loan.memberId,
              amount: calculatedFine,
              reason: `Overdue fine assessed (${overdueDays} days past due)`,
              isPaid: false
            }
          });

          await prisma.member.update({
            where: { id: loan.memberId },
            data: { totalFines: { increment: calculatedFine } }
          });
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }
}

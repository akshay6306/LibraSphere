import prisma from '../lib/prisma';
import { ReservationStatus } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';

export class ReservationService {
  static async getReservations(query: {
    memberId?: string;
    bookId?: string;
    status?: ReservationStatus;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.bookId) where.bookId = query.bookId;
    if (query.status) where.status = query.status;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { queuePosition: 'asc' }, { requestedAt: 'asc' }],
        include: {
          book: true,
          branch: true,
          member: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      }),
      prisma.reservation.count({ where })
    ]);

    return {
      reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getReservationById(id: string) {
    const res = await prisma.reservation.findUnique({
      where: { id },
      include: {
        book: true,
        branch: true,
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!res) {
      throw new AppError('Reservation not found.', 404);
    }

    return res;
  }

  static async createReservation(
    data: {
      bookId: string;
      memberId: string;
      branchId?: string;
    },
    userId?: string
  ) {
    // 1. Check if member already has active or pending reservation for this book
    const existing = await prisma.reservation.findFirst({
      where: {
        bookId: data.bookId,
        memberId: data.memberId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY] }
      }
    });

    if (existing) {
      throw new AppError('You already have an active hold / reservation for this book.', 400);
    }

    // 2. Pick branch if not provided (default to first available branch)
    let branchId = data.branchId;
    if (!branchId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { isActive: true }
      });
      if (!defaultBranch) {
        throw new AppError('No active library branch available.', 400);
      }
      branchId = defaultBranch.id;
    }

    // 3. Calculate queue position (FIFO)
    const currentQueueLength = await prisma.reservation.count({
      where: {
        bookId: data.bookId,
        status: ReservationStatus.PENDING
      }
    });

    const reservation = await prisma.reservation.create({
      data: {
        bookId: data.bookId,
        memberId: data.memberId,
        branchId,
        status: ReservationStatus.PENDING,
        queuePosition: currentQueueLength + 1
      },
      include: {
        book: true,
        branch: true
      }
    });

    await AuditService.log({
      userId,
      action: 'RESERVATION_CREATED',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      details: `Reserved "${reservation.book.title}" at ${reservation.branch.name} (Position: #${reservation.queuePosition})`
    });

    return reservation;
  }

  static async cancelReservation(id: string, memberId?: string, userId?: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { book: true }
    });

    if (!reservation) {
      throw new AppError('Reservation not found.', 404);
    }

    if (memberId && reservation.memberId !== memberId) {
      throw new AppError('Unauthorized: You can only cancel your own reservation.', 403);
    }

    if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.READY) {
      throw new AppError('Only pending or ready reservations can be cancelled.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED }
      });

      // Shift subsequent positions down by 1
      await tx.reservation.updateMany({
        where: {
          bookId: reservation.bookId,
          status: ReservationStatus.PENDING,
          queuePosition: { gt: reservation.queuePosition }
        },
        data: {
          queuePosition: { decrement: 1 }
        }
      });
    });

    await AuditService.log({
      userId,
      action: 'RESERVATION_CANCELLED',
      entityType: 'RESERVATION',
      entityId: id,
      details: `Cancelled reservation for "${reservation.book.title}"`
    });

    return { message: 'Reservation cancelled successfully.' };
  }

  static async getBookQueue(bookId: string) {
    return prisma.reservation.findMany({
      where: {
        bookId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY] }
      },
      orderBy: { queuePosition: 'asc' },
      include: {
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        branch: { select: { id: true, name: true } }
      }
    });
  }
}

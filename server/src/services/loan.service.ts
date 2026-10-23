import prisma from '../lib/prisma';
import cache from '../lib/cache';
import { CopyStatus, LoanStatus, ReservationStatus } from '../types';
import { AppError } from '../middleware/error.middleware';
import { SettingService } from './setting.service';
import { AuditService } from './audit.service';

export interface IssueLoanDTO {
  copyBarcode: string;
  membershipId: string;
  librarianId: string;
  branchId?: string;
  idempotencyKey?: string;
  conditionNote?: string;
}

export class LoanService {
  static async getLoans(query: {
    memberId?: string;
    branchId?: string;
    status?: LoanStatus;
    search?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { copy: { barcode: { contains: query.search } } },
        { copy: { book: { title: { contains: query.search } } } },
        { member: { membershipId: { contains: query.search } } },
        { member: { user: { name: { contains: query.search } } } }
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          copy: {
            include: {
              book: true,
              branch: true
            }
          },
          member: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true }
              }
            }
          },
          librarian: {
            select: { id: true, name: true }
          },
          branch: {
            select: { id: true, name: true }
          },
          fines: true
        }
      }),
      prisma.loan.count({ where })
    ]);

    return {
      loans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getLoanById(id: string) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        copy: {
          include: {
            book: true,
            branch: true
          }
        },
        member: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        librarian: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        fines: true
      }
    });

    if (!loan) {
      throw new AppError('Loan record not found.', 404);
    }

    return loan;
  }

  static async issueLoan(dto: IssueLoanDTO, ipAddress?: string) {
    // 1. Check idempotency
    if (dto.idempotencyKey) {
      const existing = await prisma.loan.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          copy: { include: { book: true } },
          member: { include: { user: true } }
        }
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Fetch system settings
    const [maxBooks, fineThreshold, loanPeriodDays] = await Promise.all([
      SettingService.getNumber('maxBooksPerMember', 5),
      SettingService.getNumber('fineThreshold', 500),
      SettingService.getNumber('loanPeriodDays', 14)
    ]);

    // 3. Find member by membershipId or ID
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { membershipId: dto.membershipId },
          { id: dto.membershipId }
        ]
      },
      include: {
        user: true,
        loans: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } }
        }
      }
    });

    if (!member) {
      throw new AppError('Member not found with the provided identifier.', 404);
    }

    if (!member.user.isActive) {
      throw new AppError('This member account is deactivated/suspended.', 400);
    }

    if (new Date() > member.membershipExpiry) {
      throw new AppError('Membership card has expired. Please renew membership first.', 400);
    }

    // Check fine threshold
    if (member.totalFines >= fineThreshold) {
      throw new AppError(
        `Borrowing blocked: Member has unpaid fines of $${member.totalFines.toFixed(2)}, exceeding threshold of $${fineThreshold}.`,
        400
      );
    }

    // Check max books limit
    if (member.loans.length >= maxBooks) {
      throw new AppError(
        `Borrowing limit reached: Member already has ${member.loans.length} active loans (maximum allowed is ${maxBooks}).`,
        400
      );
    }

    // 4. Find book copy
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode: dto.copyBarcode },
      include: { book: true, branch: true }
    });

    if (!copy) {
      throw new AppError(`Book copy with barcode "${dto.copyBarcode}" not found.`, 404);
    }

    if (copy.status !== CopyStatus.AVAILABLE) {
      // Check if it's reserved specifically for this member
      const memberReservation = await prisma.reservation.findFirst({
        where: {
          bookId: copy.bookId,
          memberId: member.id,
          status: ReservationStatus.READY
        }
      });

      if (copy.status === CopyStatus.RESERVED && memberReservation) {
        // Allow the member holding the reservation to borrow
        await prisma.reservation.update({
          where: { id: memberReservation.id },
          data: { status: ReservationStatus.FULFILLED }
        });
      } else {
        throw new AppError(`This copy is currently ${copy.status.toLowerCase()} and cannot be issued.`, 400);
      }
    }

    // 5. Execute with optimistic locking on BookCopy.version
    const now = new Date();
    const dueDate = new Date(now.getTime() + loanPeriodDays * 24 * 60 * 60 * 1000);
    const branchId = dto.branchId || copy.branchId;

    const result = await prisma.$transaction(
      async (tx) => {
        // Optimistic lock check
        const updateResult = await tx.bookCopy.updateMany({
          where: {
            id: copy.id,
            version: copy.version
          },
          data: {
            status: CopyStatus.BORROWED,
            version: { increment: 1 }
          }
        });

        if (updateResult.count === 0) {
          throw new AppError('Concurrent update detected on book copy. Please try again.', 409);
        }

        const loan = await tx.loan.create({
          data: {
            copyId: copy.id,
            memberId: member.id,
            librarianId: dto.librarianId,
            branchId,
            issuedAt: now,
            dueDate,
            status: LoanStatus.ACTIVE,
            conditionNote: dto.conditionNote || null,
            idempotencyKey: dto.idempotencyKey || null
          },
          include: {
            copy: { include: { book: true } },
            member: { include: { user: true } }
          }
        });

        // Member notification
        await tx.notification.create({
          data: {
            userId: member.userId,
            type: 'LOAN_ISSUED',
            title: 'Book Issued Successfully',
            message: `"${copy.book.title}" was checked out. Due date is ${dueDate.toLocaleDateString()}.`
          }
        });

        return loan;
      },
      {
        maxWait: 20000,
        timeout: 30000
      }
    );

    cache.delPattern('books_*');

    await AuditService.log({
      userId: dto.librarianId,
      action: 'LOAN_ISSUED',
      entityType: 'LOAN',
      entityId: result.id,
      details: `Issued book "${copy.book.title}" (Barcode: ${copy.barcode}) to member ${member.membershipId}`,
      ipAddress
    });

    return result;
  }

  static async returnLoan(
    loanId: string,
    librarianId: string,
    conditionNote?: string,
    ipAddress?: string
  ) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: { include: { book: true } },
        member: { include: { user: true } }
      }
    });

    if (!loan) {
      throw new AppError('Loan record not found.', 404);
    }

    if (loan.status === LoanStatus.RETURNED) {
      throw new AppError('This book has already been marked as returned.', 400);
    }

    const now = new Date();
    const finePerDay = await SettingService.getNumber('finePerDay', 5);
    const holdPeriodHours = await SettingService.getNumber('holdPeriodHours', 48);

    // Calculate overdue fine if applicable
    let fineAmount = 0;
    if (now > loan.dueDate) {
      const diffMs = now.getTime() - loan.dueDate.getTime();
      const overdueDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      // Cap at book price
      fineAmount = Math.min(overdueDays * finePerDay, loan.copy.book.price);
    }

    // Check next pending reservation for this book
    const nextReservation = await prisma.reservation.findFirst({
      where: {
        bookId: loan.copy.bookId,
        status: ReservationStatus.PENDING
      },
      orderBy: [
        { queuePosition: 'asc' },
        { requestedAt: 'asc' }
      ],
      include: {
        member: { include: { user: true } }
      }
    });

    const newCopyStatus = nextReservation ? CopyStatus.RESERVED : CopyStatus.AVAILABLE;

    const updatedLoan = await prisma.$transaction(async (tx) => {
      // 1. Update loan
      const l = await tx.loan.update({
        where: { id: loanId },
        data: {
          returnedAt: now,
          status: LoanStatus.RETURNED,
          conditionNote: conditionNote || loan.conditionNote
        }
      });

      // 2. Update copy status and version
      await tx.bookCopy.update({
        where: { id: loan.copyId },
        data: {
          status: newCopyStatus,
          version: { increment: 1 }
        }
      });

      // 3. Create Fine if overdue
      if (fineAmount > 0) {
        await tx.fine.create({
          data: {
            loanId: loan.id,
            memberId: loan.memberId,
            amount: fineAmount,
            reason: `Overdue return for "${loan.copy.book.title}".`,
            isPaid: false
          }
        });

        await tx.member.update({
          where: { id: loan.memberId },
          data: { totalFines: { increment: fineAmount } }
        });

        await tx.notification.create({
          data: {
            userId: loan.member.userId,
            type: 'FINE_ASSESSED',
            title: 'Overdue Fine Assessed',
            message: `A fine of $${fineAmount.toFixed(2)} was charged for late return of "${loan.copy.book.title}".`
          }
        });
      }

      // 4. If reservation waiting, fulfill queue transition
      if (nextReservation) {
        const expiresAt = new Date(now.getTime() + holdPeriodHours * 60 * 60 * 1000);
        await tx.reservation.update({
          where: { id: nextReservation.id },
          data: {
            status: ReservationStatus.READY,
            readyAt: now,
            expiresAt
          }
        });

        // Notify member their reserved book is ready
        await tx.notification.create({
          data: {
            userId: nextReservation.member.userId,
            type: 'RESERVATION_READY',
            title: 'Reserved Book Ready for Pickup!',
            message: `Your reserved book "${loan.copy.book.title}" is ready at the library. It will be held until ${expiresAt.toLocaleString()}.`
          }
        });
      }

      return l;
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId: librarianId,
      action: 'LOAN_RETURNED',
      entityType: 'LOAN',
      entityId: loanId,
      details: `Returned book copy ${loan.copy.barcode}. Fine: $${fineAmount.toFixed(2)}`,
      ipAddress
    });

    return {
      loan: updatedLoan,
      fineAmount,
      reservationNotified: !!nextReservation
    };
  }

  static async renewLoan(loanId: string, memberId: string, ipAddress?: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        copy: { include: { book: true } },
        member: true
      }
    });

    if (!loan) {
      throw new AppError('Loan record not found.', 404);
    }

    if (loan.memberId !== memberId) {
      throw new AppError('You can only renew your own loans.', 403);
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new AppError('Only active loans can be renewed. Overdue loans must be returned.', 400);
    }

    const maxRenewals = await SettingService.getNumber('maxRenewals', 2);
    if (loan.renewalCount >= maxRenewals) {
      throw new AppError(`Maximum renewals (${maxRenewals}) reached for this book loan.`, 400);
    }

    // Check if another member has a pending reservation for this book
    const reservationCount = await prisma.reservation.count({
      where: {
        bookId: loan.copy.bookId,
        status: ReservationStatus.PENDING
      }
    });

    if (reservationCount > 0) {
      throw new AppError('Cannot renew: Another member has reserved this book.', 400);
    }

    const loanPeriodDays = await SettingService.getNumber('loanPeriodDays', 14);
    const newDueDate = new Date(loan.dueDate.getTime() + loanPeriodDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 }
      },
      include: { copy: { include: { book: true } } }
    });

    await AuditService.log({
      userId: loan.member.userId,
      action: 'LOAN_RENEWED',
      entityType: 'LOAN',
      entityId: loanId,
      details: `Renewed loan for "${loan.copy.book.title}". New due date: ${newDueDate.toLocaleDateString()}`,
      ipAddress
    });

    return updated;
  }
}

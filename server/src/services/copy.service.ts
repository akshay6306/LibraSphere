import prisma from '../lib/prisma';
import cache from '../lib/cache';
import { CopyStatus } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';

export class CopyService {
  static async getCopies(filter: { bookId?: string; branchId?: string; status?: CopyStatus }) {
    const where: any = {};
    if (filter.bookId) where.bookId = filter.bookId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.status) where.status = filter.status;

    return prisma.bookCopy.findMany({
      where,
      include: {
        book: {
          select: { id: true, title: true, author: true, isbn: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      },
      orderBy: { barcode: 'asc' }
    });
  }

  static async createCopy(
    data: {
      bookId: string;
      branchId: string;
      barcode?: string;
      shelfLocation: string;
      status?: CopyStatus;
    },
    userId?: string
  ) {
    const barcode = data.barcode || `BC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const existingBarcode = await prisma.bookCopy.findUnique({
      where: { barcode }
    });

    if (existingBarcode) {
      throw new AppError('A copy with this barcode already exists.', 409);
    }

    const copy = await prisma.bookCopy.create({
      data: {
        bookId: data.bookId,
        branchId: data.branchId,
        barcode,
        shelfLocation: data.shelfLocation,
        status: data.status || CopyStatus.AVAILABLE,
        version: 1
      },
      include: {
        book: true,
        branch: true
      }
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'COPY_CREATED',
      entityType: 'BOOK_COPY',
      entityId: copy.id,
      details: `Created copy barcode ${copy.barcode} for book "${copy.book.title}" at ${copy.branch.name}`
    });

    return copy;
  }

  static async updateCopy(
    id: string,
    data: {
      shelfLocation?: string;
      status?: CopyStatus;
      branchId?: string;
    },
    userId?: string
  ) {
    const copy = await prisma.bookCopy.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 }
      },
      include: {
        book: true,
        branch: true
      }
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'COPY_UPDATED',
      entityType: 'BOOK_COPY',
      entityId: copy.id,
      details: `Updated copy barcode ${copy.barcode} (status: ${copy.status})`
    });

    return copy;
  }

  static async deleteCopy(id: string, userId?: string) {
    const copy = await prisma.bookCopy.findUnique({
      where: { id },
      include: {
        loans: {
          where: { status: { in: ['ACTIVE', 'OVERDUE'] } }
        }
      }
    });

    if (!copy) {
      throw new AppError('Copy not found.', 404);
    }

    if (copy.loans.length > 0) {
      throw new AppError('Cannot delete copy that is currently loaned out.', 400);
    }

    await prisma.bookCopy.delete({
      where: { id }
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'COPY_DELETED',
      entityType: 'BOOK_COPY',
      entityId: id,
      details: `Deleted copy barcode ${copy.barcode}`
    });

    return { message: 'Copy deleted successfully.' };
  }
}

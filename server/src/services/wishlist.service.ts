import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export class WishlistService {
  static async getWishlist(memberId: string) {
    return prisma.wishlist.findMany({
      where: { memberId },
      include: {
        book: {
          include: {
            _count: {
              select: {
                copies: true
              }
            },
            copies: {
              select: { status: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async addToWishlist(memberId: string, bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      throw new AppError('Book not found.', 404);
    }

    return prisma.wishlist.upsert({
      where: {
        memberId_bookId: {
          memberId,
          bookId
        }
      },
      update: {},
      create: {
        memberId,
        bookId
      },
      include: {
        book: true
      }
    });
  }

  static async removeFromWishlist(memberId: string, bookId: string) {
    await prisma.wishlist.deleteMany({
      where: {
        memberId,
        bookId
      }
    });

    return { message: 'Removed from wishlist successfully.' };
  }
}

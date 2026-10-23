import prisma from '../lib/prisma';
import cache from '../lib/cache';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';
import { CopyStatus } from '../types';

import { CATEGORIES } from '../config/categories';

export interface BookFilterParams {
  query?: string;
  category?: string;
  subcategory?: string;
  author?: string;
  isbn?: string;
  branchId?: string;
  available?: boolean | string;
  year?: number | string;
  yearMin?: number | string;
  yearMax?: number | string;
  language?: string;
  format?: string;
  minRating?: number | string;
  ageRange?: string;
  isNewArrival?: boolean | string;
  isStaffPick?: boolean | string;
  hasPreview?: boolean | string;
  series?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

export class BookService {
  static async getBooks(params: BookFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.query) {
      const q = params.query.trim();
      where.OR = [
        { title: { contains: q } },
        { author: { contains: q } },
        { isbn: { contains: q } },
        { description: { contains: q } },
        { seriesName: { contains: q } },
        { subcategory: { contains: q } }
      ];
    }

    if (params.category && params.category !== 'All') {
      where.category = params.category;
    }

    if (params.subcategory && params.subcategory !== 'All') {
      where.subcategory = params.subcategory;
    }

    if (params.author) {
      where.author = { contains: params.author };
    }

    if (params.isbn) {
      where.isbn = { contains: params.isbn };
    }

    if (params.language && params.language !== 'All') {
      where.language = params.language;
    }

    if (params.format && params.format !== 'All') {
      where.format = params.format;
    }

    if (params.minRating) {
      where.rating = { gte: Number(params.minRating) };
    }

    if (params.ageRange && params.ageRange !== 'All') {
      where.ageRange = params.ageRange;
    }

    if (String(params.isNewArrival) === 'true') {
      where.isNewArrival = true;
    }

    if (String(params.isStaffPick) === 'true') {
      where.isStaffPick = true;
    }

    if (String(params.hasPreview) === 'true') {
      where.previewUrl = { not: null };
    }

    if (params.series) {
      where.seriesName = { contains: params.series };
    }

    if (params.year) {
      where.publishedYear = Number(params.year);
    } else if (params.yearMin || params.yearMax) {
      where.publishedYear = {
        ...(params.yearMin ? { gte: Number(params.yearMin) } : {}),
        ...(params.yearMax ? { lte: Number(params.yearMax) } : {})
      };
    }

    if (params.branchId) {
      where.copies = {
        some: {
          branchId: params.branchId,
          ...(String(params.available) === 'true' ? { status: CopyStatus.AVAILABLE } : {})
        }
      };
    } else if (String(params.available) === 'true') {
      where.copies = {
        some: {
          status: CopyStatus.AVAILABLE
        }
      };
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'title_asc') orderBy = { title: 'asc' };
    else if (params.sort === 'title_desc') orderBy = { title: 'desc' };
    else if (params.sort === 'year_desc') orderBy = { publishedYear: 'desc' };
    else if (params.sort === 'year_asc') orderBy = { publishedYear: 'asc' };
    else if (params.sort === 'rating_desc') orderBy = { rating: 'desc' };
    else if (params.sort === 'popular') orderBy = { ratingCount: 'desc' };
    else if (params.sort === 'new_arrivals') orderBy = [{ isNewArrival: 'desc' }, { publishedYear: 'desc' }];
    else if (params.sort === 'staff_picks') orderBy = [{ isStaffPick: 'desc' }, { rating: 'desc' }];
    else if (params.sort === 'oldest') orderBy = { createdAt: 'asc' };

    const cacheKey = `books_${JSON.stringify({ ...params, page, limit })}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return cached;

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              copies: true,
              reservations: { where: { status: 'PENDING' } },
              reviews: true
            }
          },
          copies: {
            select: {
              id: true,
              status: true,
              branchId: true
            }
          },
          reviews: {
            select: { rating: true }
          }
        }
      }),
      prisma.book.count({ where })
    ]);

    const enrichedBooks = books.map((b) => {
      const availableCopies = b.copies.filter((c) => c.status === CopyStatus.AVAILABLE).length;
      const avgRating =
        b.reviews.length > 0
          ? Number((b.reviews.reduce((acc, r) => acc + r.rating, 0) / b.reviews.length).toFixed(1))
          : b.rating || 4.5;

      const { copies, reviews, ...rest } = b;
      return {
        ...rest,
        totalCopies: b._count.copies,
        availableCopies,
        avgRating,
        reviewCount: b.ratingCount || b._count.reviews
      };
    });

    const result = {
      books: enrichedBooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    cache.set(cacheKey, result, 60); // 1 minute cache
    return result;
  }

  static async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            branch: {
              select: { id: true, name: true, address: true }
            }
          }
        },
        reviews: {
          include: {
            member: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            copies: true,
            reservations: { where: { status: 'PENDING' } }
          }
        }
      }
    });

    if (!book) {
      throw new AppError('Book not found.', 404);
    }

    const availableCopies = book.copies.filter((c) => c.status === CopyStatus.AVAILABLE).length;
    const avgRating =
      book.reviews.length > 0
        ? Number((book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length).toFixed(1))
        : 0;

    return {
      ...book,
      availableCopies,
      avgRating
    };
  }

  static async getBookAvailability(bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          include: {
            branch: true
          }
        }
      }
    });

    if (!book) {
      throw new AppError('Book not found.', 404);
    }

    const branches = await prisma.branch.findMany({
      where: { isActive: true }
    });

    const availabilityByBranch = branches.map((branch) => {
      const branchCopies = book.copies.filter((c) => c.branchId === branch.id);
      const available = branchCopies.filter((c) => c.status === CopyStatus.AVAILABLE).length;
      return {
        branchId: branch.id,
        branchName: branch.name,
        address: branch.address,
        totalCopies: branchCopies.length,
        availableCopies: available,
        shelfLocations: Array.from(new Set(branchCopies.map((c) => c.shelfLocation)))
      };
    });

    return availabilityByBranch;
  }

  static async createBook(
    data: {
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      publishedYear: number;
      category: string;
      description: string;
      coverUrl?: string;
      language?: string;
      pages: number;
      price: number;
    },
    userId?: string
  ) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn }
    });

    if (existing) {
      throw new AppError('A book with this ISBN already exists.', 409);
    }

    const book = await prisma.book.create({
      data: {
        isbn: data.isbn,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        publishedYear: data.publishedYear,
        category: data.category,
        description: data.description,
        coverUrl: data.coverUrl,
        language: data.language || 'English',
        pages: data.pages,
        price: data.price
      }
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'BOOK_CREATED',
      entityType: 'BOOK',
      entityId: book.id,
      details: `Created book "${book.title}" (ISBN: ${book.isbn})`
    });

    return book;
  }

  static async updateBook(
    id: string,
    data: Partial<{
      isbn: string;
      title: string;
      author: string;
      publisher: string;
      publishedYear: number;
      category: string;
      description: string;
      coverUrl?: string;
      language?: string;
      pages: number;
      price: number;
    }>,
    userId?: string
  ) {
    const book = await prisma.book.update({
      where: { id },
      data
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'BOOK_UPDATED',
      entityType: 'BOOK',
      entityId: book.id,
      details: `Updated details for book "${book.title}"`
    });

    return book;
  }

  static async deleteBook(id: string, userId?: string) {
    const activeLoans = await prisma.loan.count({
      where: {
        copy: { bookId: id },
        status: { in: ['ACTIVE', 'OVERDUE'] }
      }
    });

    if (activeLoans > 0) {
      throw new AppError('Cannot delete book with active or overdue borrowed copies.', 400);
    }

    const book = await prisma.book.delete({
      where: { id }
    });

    cache.delPattern('books_*');

    await AuditService.log({
      userId,
      action: 'BOOK_DELETED',
      entityType: 'BOOK',
      entityId: id,
      details: `Deleted book "${book.title}"`
    });

    return { message: 'Book deleted successfully.' };
  }

  static async addReview(
    bookId: string,
    memberId: string,
    data: { rating: number; comment: string }
  ) {
    const review = await prisma.review.create({
      data: {
        bookId,
        memberId,
        rating: data.rating,
        comment: data.comment
      },
      include: {
        member: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    cache.delPattern('books_*');
    return review;
  }

  static async getReviews(bookId: string) {
    return prisma.review.findMany({
      where: { bookId },
      include: {
        member: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Returns dynamic facet counts for all filter dropdowns
   */
  static async getFacets(category?: string) {
    const cacheKey = `facets_${category || 'all'}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return cached;

    const baseWhere = category && category !== 'All' ? { category } : {};

    const [categoriesRaw, subcategoriesRaw, languagesRaw, formatsRaw, ageRangesRaw] =
      await Promise.all([
        prisma.book.groupBy({ by: ['category'], _count: true }),
        prisma.book.groupBy({ where: baseWhere, by: ['subcategory'], _count: true }),
        prisma.book.groupBy({ where: baseWhere, by: ['language'], _count: true }),
        prisma.book.groupBy({ where: baseWhere, by: ['format'], _count: true }),
        prisma.book.groupBy({ where: baseWhere, by: ['ageRange'], _count: true })
      ]);

    const result = {
      categories: categoriesRaw.map((c) => ({ name: c.category, count: c._count })),
      subcategories: subcategoriesRaw
        .filter((s) => Boolean(s.subcategory))
        .map((s) => ({ name: s.subcategory, count: s._count })),
      languages: languagesRaw
        .filter((l) => Boolean(l.language))
        .map((l) => ({ code: l.language, count: l._count })),
      formats: formatsRaw
        .filter((f) => Boolean(f.format))
        .map((f) => ({ name: f.format, count: f._count })),
      ageRanges: ageRangesRaw
        .filter((a) => Boolean(a.ageRange))
        .map((a) => ({ name: a.ageRange as string, count: a._count }))
    };

    cache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  /**
   * Provides "Did you mean" typo suggestions for search queries
   */
  static async getTypoSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();

    // Search direct substring matches first
    const directMatches = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } }
        ]
      },
      select: { title: true, author: true },
      take: 5
    });

    const suggestions = new Set<string>();
    for (const m of directMatches) {
      if (m.title.toLowerCase().includes(q.toLowerCase())) {
        suggestions.add(m.title);
      } else {
        suggestions.add(m.author);
      }
    }

    if (suggestions.size < 5) {
      // Fallback to initial prefix
      const prefix = q.slice(0, 3);
      const prefixMatches = await prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: prefix } },
            { author: { contains: prefix } }
          ]
        },
        select: { title: true, author: true },
        take: 5
      });
      for (const m of prefixMatches) {
        suggestions.add(m.title);
        if (suggestions.size >= 5) break;
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * "Surprise Me" random book generator
   */
  static async getRandomBook() {
    const count = await prisma.book.count();
    if (count === 0) throw new AppError('No books available.', 404);
    const skip = Math.floor(Math.random() * count);
    const [book] = await prisma.book.findMany({
      skip,
      take: 1,
      include: {
        copies: {
          select: { id: true, status: true, branchId: true }
        }
      }
    });
    return book;
  }

  /**
   * Returns curated home page rows for high-impact merchandising
   */
  static async getHomeSections() {
    const cacheKey = 'home_sections';
    const cached = cache.get<any>(cacheKey);
    if (cached) return cached;

    const [
      newArrivals,
      staffPicks,
      topRated,
      trending,
      childrenCorner,
      indianAuthors,
      examPrep,
      freePreviews
    ] = await Promise.all([
      prisma.book.findMany({
        where: { isNewArrival: true },
        take: 10,
        orderBy: { publishedYear: 'desc' }
      }),
      prisma.book.findMany({
        where: { isStaffPick: true },
        take: 10,
        orderBy: { rating: 'desc' }
      }),
      prisma.book.findMany({
        take: 10,
        orderBy: { rating: 'desc' }
      }),
      prisma.book.findMany({
        take: 10,
        orderBy: { ratingCount: 'desc' }
      }),
      prisma.book.findMany({
        where: { category: "Children's Books" },
        take: 10,
        orderBy: { rating: 'desc' }
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { category: 'Indian Authors & Culture' },
            { language: { in: ['hi', 'sa', 'bn', 'ta', 'te', 'mr', 'gu', 'pa'] } }
          ]
        },
        take: 10,
        orderBy: { rating: 'desc' }
      }),
      prisma.book.findMany({
        where: { category: 'Education & Exam Prep' },
        take: 10,
        orderBy: { publishedYear: 'desc' }
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { category: 'Audiobook & E-book Previews' },
            { previewUrl: { not: null } }
          ]
        },
        take: 10,
        orderBy: { rating: 'desc' }
      })
    ]);

    const result = {
      newArrivals,
      staffPicks,
      topRated,
      trending,
      childrenCorner,
      indianAuthors,
      examPrep,
      freePreviews
    };

    cache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  /**
   * Returns category tree with live book counts for mega-menu and category pages
   */
  static async getCategoryTree() {
    const cacheKey = 'category_tree';
    const cached = cache.get<any>(cacheKey);
    if (cached) return cached;

    const groupCounts = await prisma.book.groupBy({
      by: ['category', 'subcategory'],
      _count: true
    });

    const categoryCountsMap: Record<string, { total: number; subcategories: Record<string, number> }> = {};

    for (const g of groupCounts) {
      if (!categoryCountsMap[g.category]) {
        categoryCountsMap[g.category] = { total: 0, subcategories: {} };
      }
      categoryCountsMap[g.category].total += g._count;
      const sub = g.subcategory || 'General';
      categoryCountsMap[g.category].subcategories[sub] =
        (categoryCountsMap[g.category].subcategories[sub] || 0) + g._count;
    }

    const tree = CATEGORIES.map((cat) => {
      const data = categoryCountsMap[cat.name] || { total: 0, subcategories: {} };
      return {
        ...cat,
        totalBooks: data.total,
        subcategoriesWithCounts: cat.subcategories.map((sub) => ({
          name: sub,
          count: data.subcategories[sub] || 0
        }))
      };
    });

    cache.set(cacheKey, tree, 300);
    return tree;
  }

  /**
   * Author biography, book collection, and genre distribution
   */
  static async getAuthorDetails(authorName: string) {
    const books = await prisma.book.findMany({
      where: { author: { contains: authorName } },
      orderBy: { publishedYear: 'desc' },
      include: {
        copies: { select: { id: true, status: true, branchId: true } }
      }
    });

    if (books.length === 0) {
      throw new AppError(`No books found for author "${authorName}".`, 404);
    }

    const categories = Array.from(new Set(books.map((b) => b.category)));
    const avgRating = Number(
      (books.reduce((acc, b) => acc + (b.rating || 4.5), 0) / books.length).toFixed(1)
    );

    return {
      author: books[0].author,
      bookCount: books.length,
      categories,
      avgRating,
      books
    };
  }

  /**
   * Series details with all numbered volumes
   */
  static async getSeriesDetails(seriesName: string) {
    const books = await prisma.book.findMany({
      where: { seriesName: { contains: seriesName } },
      orderBy: { seriesNumber: 'asc' },
      include: {
        copies: { select: { id: true, status: true, branchId: true } }
      }
    });

    if (books.length === 0) {
      throw new AppError(`No books found for series "${seriesName}".`, 404);
    }

    return {
      seriesName: books[0].seriesName,
      volumeCount: books.length,
      books
    };
  }
}

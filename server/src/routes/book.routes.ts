import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BookService } from '../services/book.service';
import { ReservationService } from '../services/reservation.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const createBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(5),
    title: z.string().min(1),
    author: z.string().min(1),
    publisher: z.string().min(1),
    publishedYear: z.coerce.number().int().min(1000).max(2100),
    category: z.string().min(1),
    description: z.string().min(1),
    coverUrl: z.string().optional(),
    language: z.string().default('English'),
    pages: z.coerce.number().int().positive(),
    price: z.coerce.number().positive()
  })
});

const updateBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(5).optional(),
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    publisher: z.string().min(1).optional(),
    publishedYear: z.coerce.number().int().min(1000).max(2100).optional(),
    category: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    coverUrl: z.string().optional().nullable(),
    language: z.string().optional(),
    pages: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().positive().optional()
  })
});

const reviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().min(3)
  })
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const result = await BookService.getBooks(req.query as any);
  res.json({
    success: true,
    data: result.books,
    pagination: result.pagination
  });
});

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(createBookSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const book = await BookService.createBook(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Book created successfully.',
      data: book
    });
  }
);

router.get('/random', async (req: Request, res: Response): Promise<void> => {
  const book = await BookService.getRandomBook();
  res.json({
    success: true,
    data: book
  });
});

router.get('/facets', async (req: Request, res: Response): Promise<void> => {
  const facets = await BookService.getFacets(req.query.category as string);
  res.json({
    success: true,
    data: facets
  });
});

router.get('/suggestions', async (req: Request, res: Response): Promise<void> => {
  const suggestions = await BookService.getTypoSuggestions(req.query.q as string);
  res.json({
    success: true,
    data: suggestions
  });
});

router.get('/home-sections', async (req: Request, res: Response): Promise<void> => {
  const sections = await BookService.getHomeSections();
  res.json({
    success: true,
    data: sections
  });
});

router.get('/categories-tree', async (req: Request, res: Response): Promise<void> => {
  const tree = await BookService.getCategoryTree();
  res.json({
    success: true,
    data: tree
  });
});

router.get('/authors/:author', async (req: Request, res: Response): Promise<void> => {
  const authorData = await BookService.getAuthorDetails(req.params.author);
  res.json({
    success: true,
    data: authorData
  });
});

router.get('/series/:series', async (req: Request, res: Response): Promise<void> => {
  const seriesData = await BookService.getSeriesDetails(req.params.series);
  res.json({
    success: true,
    data: seriesData
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const book = await BookService.getBookById(req.params.id);
  res.json({
    success: true,
    data: book
  });
});

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(updateBookSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const book = await BookService.updateBook(req.params.id, req.body, req.user?.id);
    res.json({
      success: true,
      message: 'Book updated successfully.',
      data: book
    });
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await BookService.deleteBook(req.params.id, req.user?.id);
    res.json({
      success: true,
      message: result.message
    });
  }
);

router.get('/:id/availability', async (req: Request, res: Response): Promise<void> => {
  const availability = await BookService.getBookAvailability(req.params.id);
  res.json({
    success: true,
    data: availability
  });
});

router.get('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  const reviews = await BookService.getReviews(req.params.id);
  res.json({
    success: true,
    data: reviews
  });
});

router.post(
  '/:id/reviews',
  authenticate,
  validate(reviewSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({
        success: false,
        error: 'Only registered members can submit reviews.'
      });
      return;
    }

    const review = await BookService.addReview(req.params.id, req.user.memberId, req.body);
    res.status(201).json({
      success: true,
      message: 'Review posted successfully.',
      data: review
    });
  }
);

router.get(
  '/:id/reservation-queue',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const queue = await ReservationService.getBookQueue(req.params.id);
    res.json({
      success: true,
      data: queue
    });
  }
);

export default router;

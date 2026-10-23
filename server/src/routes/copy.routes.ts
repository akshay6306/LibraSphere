import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CopyService } from '../services/copy.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role, CopyStatus } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const createCopySchema = z.object({
  body: z.object({
    bookId: z.string().min(1),
    branchId: z.string().min(1),
    barcode: z.string().optional(),
    shelfLocation: z.string().min(1),
    status: z.nativeEnum(CopyStatus).optional()
  })
});

const updateCopySchema = z.object({
  body: z.object({
    shelfLocation: z.string().optional(),
    status: z.nativeEnum(CopyStatus).optional(),
    branchId: z.string().optional()
  })
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const copies = await CopyService.getCopies(req.query as any);
  res.json({
    success: true,
    data: copies
  });
});

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(createCopySchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const copy = await CopyService.createCopy(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Copy added successfully.',
      data: copy
    });
  }
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(updateCopySchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const copy = await CopyService.updateCopy(req.params.id, req.body, req.user?.id);
    res.json({
      success: true,
      message: 'Copy updated successfully.',
      data: copy
    });
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await CopyService.deleteCopy(req.params.id, req.user?.id);
    res.json({
      success: true,
      message: result.message
    });
  }
);

export default router;

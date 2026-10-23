import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BranchService } from '../services/branch.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
    phone: z.string().min(5),
    email: z.string().email(),
    managerId: z.string().optional()
  })
});

const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(3).optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email().optional(),
    managerId: z.string().optional().nullable(),
    isActive: z.boolean().optional()
  })
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const branches = await BranchService.getAllBranches();
  res.json({
    success: true,
    data: branches
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const branch = await BranchService.getBranchById(req.params.id);
  res.json({
    success: true,
    data: branch
  });
});

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createBranchSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const branch = await BranchService.createBranch(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Branch created successfully.',
      data: branch
    });
  }
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(updateBranchSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const branch = await BranchService.updateBranch(req.params.id, req.body, req.user?.id);
    res.json({
      success: true,
      message: 'Branch updated successfully.',
      data: branch
    });
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await BranchService.deleteBranch(req.params.id, req.user?.id);
    res.json({
      success: true,
      message: result.message
    });
  }
);

export default router;

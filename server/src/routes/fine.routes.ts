import { Router, Response } from 'express';
import { z } from 'zod';
import { FineService } from '../services/fine.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const payFineSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    method: z.string().default('CARD')
  })
});

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query: any = { ...req.query };

    // If member, only see their own fines
    if (req.user?.role === Role.MEMBER) {
      query.memberId = req.user.memberId;
    }

    const fines = await FineService.getFines(query);
    res.json({
      success: true,
      data: fines
    });
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const fine = await FineService.getFineById(req.params.id);

    if (req.user?.role === Role.MEMBER && fine.memberId !== req.user.memberId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized access to fine record.'
      });
      return;
    }

    res.json({
      success: true,
      data: fine
    });
  }
);

router.post(
  '/:id/pay',
  authenticate,
  validate(payFineSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const memberId = req.user?.role === Role.MEMBER ? req.user.memberId : undefined;
    const result = await FineService.payFine(
      req.params.id,
      {
        ...req.body,
        memberId
      },
      req.user?.id
    );

    res.json({
      success: true,
      message: 'Fine payment processed successfully.',
      data: result
    });
  }
);

export default router;

import { Router, Response } from 'express';
import { z } from 'zod';
import { ReservationService } from '../services/reservation.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const createReservationSchema = z.object({
  body: z.object({
    bookId: z.string().min(1),
    branchId: z.string().optional()
  })
});

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query: any = { ...req.query };

    // If member, only see their own reservations
    if (req.user?.role === Role.MEMBER) {
      query.memberId = req.user.memberId;
    }

    const result = await ReservationService.getReservations(query);
    res.json({
      success: true,
      data: result.reservations,
      pagination: result.pagination
    });
  }
);

router.post(
  '/',
  authenticate,
  validate(createReservationSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({
        success: false,
        error: 'Only library members can place reservations.'
      });
      return;
    }

    const reservation = await ReservationService.createReservation(
      {
        bookId: req.body.bookId,
        branchId: req.body.branchId,
        memberId: req.user.memberId
      },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Reservation placed successfully.',
      data: reservation
    });
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const reservation = await ReservationService.getReservationById(req.params.id);

    if (req.user?.role === Role.MEMBER && reservation.memberId !== req.user.memberId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized access to reservation.'
      });
      return;
    }

    res.json({
      success: true,
      data: reservation
    });
  }
);

router.put(
  '/:id/cancel',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const memberId = req.user?.role === Role.MEMBER ? req.user.memberId : undefined;
    const result = await ReservationService.cancelReservation(req.params.id, memberId, req.user?.id);

    res.json({
      success: true,
      message: result.message
    });
  }
);

export default router;

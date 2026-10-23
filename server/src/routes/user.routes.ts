import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z.string().optional()
  })
});

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const result = await UserService.getUsers(req.query as any);
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Member can only view their own user id
    if (req.user?.role === Role.MEMBER && req.user.id !== req.params.id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized access to user details.'
      });
      return;
    }

    const user = await UserService.getUserById(req.params.id);
    res.json({
      success: true,
      data: user
    });
  }
);

router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user?.role === Role.MEMBER && req.user.id !== req.params.id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized to modify another user.'
      });
      return;
    }

    const updated = await UserService.updateUser(req.params.id, req.body, req.user?.id);
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: updated
    });
  }
);

router.put(
  '/:id/suspend',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await UserService.setStatus(req.params.id, false, req.user?.id);
    res.json({
      success: true,
      message: 'User account suspended.',
      data: user
    });
  }
);

router.put(
  '/:id/activate',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await UserService.setStatus(req.params.id, true, req.user?.id);
    res.json({
      success: true,
      message: 'User account activated.',
      data: user
    });
  }
);

router.get(
  '/:id/loans',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user?.role === Role.MEMBER && req.user.id !== req.params.id) {
      res.status(403).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const loans = await UserService.getUserLoans(req.params.id);
    res.json({ success: true, data: loans });
  }
);

router.get(
  '/:id/fines',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user?.role === Role.MEMBER && req.user.id !== req.params.id) {
      res.status(403).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const fines = await UserService.getUserFines(req.params.id);
    res.json({ success: true, data: fines });
  }
);

router.get(
  '/:id/reservations',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user?.role === Role.MEMBER && req.user.id !== req.params.id) {
      res.status(403).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const reservations = await UserService.getUserReservations(req.params.id);
    res.json({ success: true, data: reservations });
  }
);

export default router;

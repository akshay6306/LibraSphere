import { Router, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const notifications = await NotificationService.getUserNotifications(req.user!.id);
    res.json({
      success: true,
      data: notifications
    });
  }
);

router.put(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const notification = await NotificationService.markAsRead(req.params.id, req.user!.id);
    res.json({
      success: true,
      data: notification
    });
  }
);

router.put(
  '/read-all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await NotificationService.markAllAsRead(req.user!.id);
    res.json({
      success: true,
      message: result.message
    });
  }
);

export default router;

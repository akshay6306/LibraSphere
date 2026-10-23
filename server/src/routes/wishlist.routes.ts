import { Router, Response } from 'express';
import { z } from 'zod';
import { WishlistService } from '../services/wishlist.service';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

const addWishlistSchema = z.object({
  body: z.object({
    bookId: z.string().min(1)
  })
});

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({ success: false, error: 'Only members have a reading wishlist.' });
      return;
    }

    const items = await WishlistService.getWishlist(req.user.memberId);
    res.json({
      success: true,
      data: items
    });
  }
);

router.post(
  '/',
  authenticate,
  validate(addWishlistSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({ success: false, error: 'Only members can add to wishlist.' });
      return;
    }

    const item = await WishlistService.addToWishlist(req.user.memberId, req.body.bookId);
    res.status(201).json({
      success: true,
      message: 'Added to wishlist.',
      data: item
    });
  }
);

router.delete(
  '/:bookId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({ success: false, error: 'Only members have a wishlist.' });
      return;
    }

    const result = await WishlistService.removeFromWishlist(req.user.memberId, req.params.bookId);
    res.json({
      success: true,
      message: result.message
    });
  }
);

export default router;

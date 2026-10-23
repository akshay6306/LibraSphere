import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';
import copyRoutes from './copy.routes';
import branchRoutes from './branch.routes';
import loanRoutes from './loan.routes';
import reservationRoutes from './reservation.routes';
import fineRoutes from './fine.routes';
import userRoutes from './user.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import wishlistRoutes from './wishlist.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/copies', copyRoutes);
router.use('/branches', branchRoutes);
router.use('/loans', loanRoutes);
router.use('/reservations', reservationRoutes);
router.use('/fines', fineRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

export default router;

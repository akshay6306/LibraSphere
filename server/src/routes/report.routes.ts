import { Router, Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../types';

const router = Router();

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const stats = await ReportService.getOverviewStats();
  res.json({
    success: true,
    data: stats
  });
});

router.get(
  '/loans-per-day',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const days = Number(req.query.days) || 14;
    const data = await ReportService.getLoansPerDay(days);
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/top-books',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit) || 10;
    const data = await ReportService.getTopBooks(limit);
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/category-distribution',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const data = await ReportService.getCategoryDistribution();
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/branch-comparison',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const data = await ReportService.getBranchComparison();
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/fine-revenue',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    const data = await ReportService.getFineRevenue();
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/member-growth',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    const data = await ReportService.getMemberGrowth();
    res.json({
      success: true,
      data
    });
  }
);

router.get(
  '/overdue',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  async (req: Request, res: Response): Promise<void> => {
    const data = await ReportService.getOverdueSummary();
    res.json({
      success: true,
      data
    });
  }
);

export default router;

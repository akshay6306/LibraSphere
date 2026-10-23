import { Router, Response } from 'express';
import { z } from 'zod';
import { LoanService } from '../services/loan.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';

const router = Router();

const issueLoanSchema = z.object({
  body: z.object({
    copyBarcode: z.string().min(1),
    membershipId: z.string().min(1),
    branchId: z.string().optional(),
    idempotencyKey: z.string().optional(),
    conditionNote: z.string().optional()
  })
});

const returnLoanSchema = z.object({
  body: z.object({
    conditionNote: z.string().optional()
  })
});

router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query: any = { ...req.query };

    // If member, force filter to their own loans
    if (req.user?.role === Role.MEMBER) {
      query.memberId = req.user.memberId;
    }

    const result = await LoanService.getLoans(query);
    res.json({
      success: true,
      data: result.loans,
      pagination: result.pagination
    });
  }
);

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(issueLoanSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loan = await LoanService.issueLoan(
      {
        ...req.body,
        librarianId: req.user!.id
      },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Book issued successfully.',
      data: loan
    });
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const loan = await LoanService.getLoanById(req.params.id);

    // If member, check ownership
    if (req.user?.role === Role.MEMBER && loan.memberId !== req.user.memberId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized access to loan record.'
      });
      return;
    }

    res.json({
      success: true,
      data: loan
    });
  }
);

router.put(
  '/:id/return',
  authenticate,
  authorize(Role.ADMIN, Role.LIBRARIAN),
  validate(returnLoanSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const result = await LoanService.returnLoan(
      req.params.id,
      req.user!.id,
      req.body.conditionNote,
      req.ip
    );

    res.json({
      success: true,
      message: 'Book returned successfully.',
      data: result
    });
  }
);

router.put(
  '/:id/renew',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.memberId) {
      res.status(403).json({
        success: false,
        error: 'Only library members can renew loans.'
      });
      return;
    }

    const updated = await LoanService.renewLoan(req.params.id, req.user.memberId, req.ip);

    res.json({
      success: true,
      message: 'Loan renewed successfully.',
      data: updated
    });
  }
);

export default router;

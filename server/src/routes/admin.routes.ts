import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuditService } from '../services/audit.service';
import { SettingService } from '../services/setting.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '../types';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

const router = Router();

const createLibrarianSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
    branchId: z.string().optional()
  })
});

router.get(
  '/audit-log',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuditService.getLogs(req.query as any);
    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  }
);

router.get(
  '/settings',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    const settings = await SettingService.getAll();
    res.json({
      success: true,
      data: settings
    });
  }
);

router.put(
  '/settings',
  authenticate,
  authorize(Role.ADMIN),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const updated = await SettingService.updateSettings(req.body);
    await AuditService.log({
      userId: req.user?.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTING',
      details: `Updated system settings: ${JSON.stringify(req.body)}`
    });

    res.json({
      success: true,
      message: 'System settings updated successfully.',
      data: updated
    });
  }
);

router.post(
  '/librarians',
  authenticate,
  authorize(Role.ADMIN),
  validate(createLibrarianSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password, name, phone, branchId } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone,
        role: Role.LIBRARIAN,
        isActive: true
      }
    });

    if (branchId) {
      await prisma.branch.update({
        where: { id: branchId },
        data: { managerId: user.id }
      });
    }

    await AuditService.log({
      userId: req.user?.id,
      action: 'LIBRARIAN_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: `Created librarian account ${user.email}${branchId ? ` assigned to branch ${branchId}` : ''}`
    });

    res.status(201).json({
      success: true,
      message: 'Librarian created successfully.',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }
);

export default router;

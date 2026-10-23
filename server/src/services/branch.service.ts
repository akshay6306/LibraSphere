import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';

export class BranchService {
  static async getAllBranches() {
    return prisma.branch.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            copies: true,
            loans: { where: { status: 'ACTIVE' } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, name: true, email: true, phone: true }
        },
        _count: {
          select: {
            copies: true,
            loans: { where: { status: 'ACTIVE' } },
            reservations: { where: { status: 'PENDING' } }
          }
        }
      }
    });

    if (!branch) {
      throw new AppError('Branch not found.', 404);
    }

    return branch;
  }

  static async createBranch(
    data: {
      name: string;
      address: string;
      phone: string;
      email: string;
      managerId?: string;
    },
    userId?: string
  ) {
    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        managerId: data.managerId || null,
        isActive: true
      },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    await AuditService.log({
      userId,
      action: 'BRANCH_CREATED',
      entityType: 'BRANCH',
      entityId: branch.id,
      details: `Created branch ${branch.name}`
    });

    return branch;
  }

  static async updateBranch(
    id: string,
    data: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      managerId?: string;
      isActive?: boolean;
    },
    userId?: string
  ) {
    const branch = await prisma.branch.update({
      where: { id },
      data,
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    await AuditService.log({
      userId,
      action: 'BRANCH_UPDATED',
      entityType: 'BRANCH',
      entityId: branch.id,
      details: `Updated branch ${branch.name}`
    });

    return branch;
  }

  static async deleteBranch(id: string, userId?: string) {
    const activeCopies = await prisma.bookCopy.count({
      where: { branchId: id }
    });

    if (activeCopies > 0) {
      throw new AppError('Cannot delete branch with assigned book copies. Transfer or remove copies first.', 400);
    }

    await prisma.branch.delete({
      where: { id }
    });

    await AuditService.log({
      userId,
      action: 'BRANCH_DELETED',
      entityType: 'BRANCH',
      entityId: id,
      details: `Deleted branch with ID ${id}`
    });

    return { message: 'Branch deleted successfully.' };
  }
}

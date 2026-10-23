import prisma from '../lib/prisma';
import { Role } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';

export class UserService {
  static async getUsers(query: {
    page?: number | string;
    limit?: number | string;
    search?: string;
    role?: Role;
    isActive?: boolean | string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) {
      where.isActive = String(query.isActive) === 'true';
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { memberProfile: { membershipId: { contains: query.search } } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          memberProfile: true,
          _count: {
            select: {
              issuedLoans: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        memberProfile: {
          include: {
            _count: {
              select: {
                loans: true,
                reservations: true,
                fines: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }

  static async updateUser(
    id: string,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      dateOfBirth?: string;
    },
    currentUserId?: string
  ) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        memberProfile: data.address || data.dateOfBirth
          ? {
              update: {
                address: data.address,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
              }
            }
          : undefined
      },
      include: { memberProfile: true }
    });

    await AuditService.log({
      userId: currentUserId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      details: `Profile updated for user ${user.email}`
    });

    return user;
  }

  static async setStatus(id: string, isActive: boolean, currentUserId?: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    await AuditService.log({
      userId: currentUserId,
      action: isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      entityType: 'USER',
      entityId: id,
      details: `User status set to ${isActive ? 'ACTIVE' : 'SUSPENDED'}`
    });

    return user;
  }

  static async getUserLoans(userId: string) {
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return [];
    }

    return prisma.loan.findMany({
      where: { memberId: member.id },
      orderBy: { issuedAt: 'desc' },
      include: {
        copy: {
          include: { book: true, branch: true }
        },
        fines: true
      }
    });
  }

  static async getUserFines(userId: string) {
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return [];
    }

    return prisma.fine.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          include: {
            copy: { include: { book: true } }
          }
        },
        payments: true
      }
    });
  }

  static async getUserReservations(userId: string) {
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return [];
    }

    return prisma.reservation.findMany({
      where: { memberId: member.id },
      orderBy: { requestedAt: 'desc' },
      include: {
        book: true,
        branch: true
      }
    });
  }
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '../types';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';
import { EmailService } from './email.service';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static generateAccessToken(user: { id: string; email: string; role: Role | string; name: string }): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwt.accessSecret,
      { expiresIn: '15m' }
    );
  }

  static async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    return token;
  }

  static async register(dto: RegisterDTO, ipAddress?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user and member profile in a transaction
    const { user, member } = await prisma.$transaction(async (tx) => {
      const count = await tx.member.count();
      const membershipId = `LIB-${1000 + count + 1}`;
      const oneYearExpiry = new Date();
      oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1);

      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          role: Role.MEMBER,
          isActive: true
        }
      });

      const newMember = await tx.member.create({
        data: {
          userId: newUser.id,
          membershipId,
          address: dto.address,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          membershipExpiry: oneYearExpiry,
          isEmailVerified: true, // auto-verified for smooth local dev / testing
          emailVerificationToken
        }
      });

      // Welcome notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'WELCOME',
          title: 'Welcome to LibraSphere',
          message: `Your membership card ${membershipId} is active! Start browsing our books today.`
        }
      });

      return { user: newUser, member: newMember };
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: `User registered with email ${user.email}`,
      ipAddress
    });

    // Notify administrator at krishnarathore2302@gmail.com
    EmailService.sendNewMemberNotification({
      membershipId: member.membershipId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: member.address,
      dateOfBirth: member.dateOfBirth,
      membershipExpiry: member.membershipExpiry,
      ipAddress,
      registeredAt: user.createdAt
    }).catch((err: any) => {
      logger.error(`Error sending new member email notification: ${err.message}`);
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role
      },
      accessToken,
      refreshToken
    };
  }

  static async login(dto: LoginDTO, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { memberProfile: true }
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact library administration.', 403);
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: `User logged in from ${ipAddress || 'unknown'}`,
      ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        memberProfile: user.memberProfile
      },
      accessToken,
      refreshToken
    };
  }

  static async refreshTokens(rawRefreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
      include: {
        user: {
          include: { memberProfile: true }
        }
      }
    });

    if (!tokenRecord || tokenRecord.isRevoked || new Date() > tokenRecord.expiresAt) {
      throw new AppError('Refresh token is invalid or expired.', 401);
    }

    if (!tokenRecord.user.isActive) {
      throw new AppError('User account is inactive.', 403);
    }

    // Token rotation: revoke used token, create new token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true }
    });

    const accessToken = this.generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role as Role,
        memberProfile: tokenRecord.user.memberProfile
      }
    };
  }

  static async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true }
      });
    }

    if (userId) {
      await AuditService.log({
        userId,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: userId,
        details: 'User logged out'
      });
    }
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { memberProfile: true }
    });

    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'If this email exists, a password reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (user.memberProfile) {
      await prisma.member.update({
        where: { id: user.memberProfile.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry
        }
      });
    }

    await AuditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      details: `Password reset requested for ${user.email}`
    });

    return {
      message: 'If this email exists, a password reset link has been dispatched.',
      token: resetToken // provided for testing/local dev
    };
  }

  static async resetPassword(token: string, newPass: string) {
    const member = await prisma.member.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!member) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.userId },
        data: { password: hashedPassword }
      }),
      prisma.member.update({
        where: { id: member.id },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null
        }
      }),
      // Invalidate all existing refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: member.userId },
        data: { isRevoked: true }
      })
    ]);

    await AuditService.log({
      userId: member.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'USER',
      entityId: member.userId,
      details: 'Password was successfully reset'
    });

    return { message: 'Password has been reset successfully. You can now login.' };
  }

  static async verifyEmail(token: string) {
    const member = await prisma.member.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!member) {
      throw new AppError('Invalid email verification token.', 400);
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    return { message: 'Email address verified successfully.' };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        memberProfile: {
          include: {
            _count: {
              select: {
                loans: { where: { status: 'ACTIVE' } },
                reservations: { where: { status: 'PENDING' } },
                fines: { where: { isPaid: false } }
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
}

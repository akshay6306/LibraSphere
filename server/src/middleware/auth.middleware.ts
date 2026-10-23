import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types';
import { config } from '../config';
import prisma from '../lib/prisma';
import { AuthenticatedRequest, AuthUser } from '../types';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      id: string;
      email: string;
      role: Role;
      name: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { memberProfile: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User not found or account has been suspended.'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      memberId: user.memberProfile?.id
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token has expired. Please refresh your token.'
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { memberProfile: true }
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        memberId: user.memberProfile?.id
      };
    }
    next();
  } catch {
    next();
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have permission to perform this action.'
      });
      return;
    }

    next();
  };
};

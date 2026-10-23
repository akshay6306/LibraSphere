import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
  })
});

router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.register(req.body, req.ip);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  }
);

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.login(req.body, req.ip);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
        accessToken: result.accessToken
      }
    });
  }
);

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  await AuthService.logout(token);
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Refresh token not found.'
    });
    return;
  }

  const result = await AuthService.refreshTokens(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.forgotPassword(req.body.email);
    res.json({
      success: true,
      message: result.message,
      data: { token: result.token }
    });
  }
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const result = await AuthService.resetPassword(req.body.token, req.body.password);
    res.json({
      success: true,
      message: result.message
    });
  }
);

router.get('/verify-email/:token', async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.verifyEmail(req.params.token);
  res.json({
    success: true,
    message: result.message
  });
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await AuthService.getMe(req.user!.id);
  res.json({
    success: true,
    data: user
  });
});

export default router;

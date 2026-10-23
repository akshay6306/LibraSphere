import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import cache from '../lib/cache';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    dbStatus = `unhealthy: ${error.message}`;
  }

  res.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    cache: {
      items: cache.size(),
      type: 'in-memory-lru'
    },
    version: '1.0.0'
  });
});

export default router;

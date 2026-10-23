import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

// Optimize SQLite for concurrent transactions
if (process.env.DATABASE_URL?.includes('file:')) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;').catch(() => {});
  prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;').catch(() => {});
  prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;').catch(() => {});
}

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;

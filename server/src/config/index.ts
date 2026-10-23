import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'librasphere_jwt_access_secret_super_secure_key_123456',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'librasphere_jwt_refresh_secret_super_secure_key_654321',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  settingsDefaults: {
    loanPeriodDays: 14,
    maxBooksPerMember: 5,
    finePerDay: 5,
    gracePeriod: 2,
    maxRenewals: 2,
    fineThreshold: 500,
    holdPeriodHours: 48
  }
};

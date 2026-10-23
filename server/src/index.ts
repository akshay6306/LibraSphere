import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { pinoHttp } from 'pino-http';

import { config } from './config';
import logger from './lib/logger';
import prisma from './lib/prisma';
import swaggerSpec from './config/swagger';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { setupBackgroundJobs } from './jobs';

const app = express();

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow swagger-ui in dev
}));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified client URL
      if (!origin || origin === config.clientUrl || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url?.startsWith('/api/docs') || req.url === '/health'
      }
    })
  );
}

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Root health & welcome
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'LibraSphere Library Management API',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: '/api/v1'
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Background Jobs (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  setupBackgroundJobs();
}

// Server Start
let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, () => {
    logger.info(` LibraSphere API Server running at http://localhost:${config.port}`);
    logger.info(` Swagger Docs available at http://localhost:${config.port}/api/docs`);
  });
}

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;

/**
 * Health check routes for Phase 1
 */

import { Router } from 'express';
import { Phase1DatabaseService } from '../services/phase1-database-service';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const dbService = new Phase1DatabaseService();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database connectivity
  const dbHealthy = await dbService.healthCheck();
  
  const responseTime = Date.now() - startTime;
  
  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    phase: 'Phase 1 - MVP',
    services: {
      database: {
        status: dbHealthy ? 'up' : 'down',
        provider: 'Supabase',
      },
      storage: {
        status: 'up', // Assume Cloudinary is up
        provider: 'Cloudinary',
      },
      ai: {
        status: 'up', // Assume AI services are up
        providers: ['Hugging Face', 'OpenAI'],
      },
    },
    metrics: {
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check all services
  const checks = await Promise.allSettled([
    dbService.healthCheck(),
    dbService.getDatabaseStats(),
    // Add more service checks here
  ]);

  const dbHealthy = checks[0].status === 'fulfilled' && checks[0].value;
  const dbStats = checks[1].status === 'fulfilled' ? checks[1].value : null;

  const responseTime = Date.now() - startTime;
  
  const detailedHealth = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    phase: 'Phase 1 - MVP',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbHealthy ? 'up' : 'down',
        provider: 'Supabase',
        stats: dbStats,
        responseTime: `${responseTime}ms`,
      },
      storage: {
        status: 'up',
        provider: 'Cloudinary',
        // Would add storage stats here
      },
      ai: {
        status: 'up',
        providers: {
          huggingface: {
            status: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'not_configured',
          },
          openai: {
            status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
          },
        },
      },
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB',
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    },
    configuration: {
      maxFileSize: process.env.MAX_FILE_SIZE_MB || '10',
      allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || [],
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || '900000',
      rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    },
  };

  const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
}));

// Readiness check (for container orchestration)
router.get('/ready', asyncHandler(async (req, res) => {
  const dbHealthy = await dbService.healthCheck();
  
  if (dbHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Liveness check (for container orchestration)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
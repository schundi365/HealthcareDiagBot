/**
 * Phase 1 Express Server
 * Main server file for the Diagnostic Risk Analyzer MVP
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import { phase1Config, validatePhase1Config } from './config/phase1-config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth-middleware';

// Import routes
import authRoutes from './routes/auth-routes';
import patientRoutes from './routes/patient-routes';
import imageRoutes from './routes/image-routes';
import analysisRoutes from './routes/analysis-routes';
import healthRoutes from './routes/health-routes';

// Load environment variables
dotenv.config();

// Validate configuration
try {
  validatePhase1Config();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

const app = express();
const PORT = phase1Config.app.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    phase1Config.app.frontendUrl,
    'http://localhost:3000',
    'https://*.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (phase1Config.app.environment !== 'test') {
  app.use(morgan('combined'));
}

// Health check (before auth middleware)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/images', authMiddleware, imageRoutes);
app.use('/api/analysis', authMiddleware, analysisRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Diagnostic Risk Analyzer API',
    version: '1.0.0',
    phase: 'Phase 1 - MVP',
    status: 'running',
    environment: phase1Config.app.environment,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Phase 1 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${phase1Config.app.environment}`);
  console.log(`🌐 Frontend URL: ${phase1Config.app.frontendUrl}`);
  console.log(`💾 Database: Supabase`);
  console.log(`🤖 AI: Hugging Face + OpenAI`);
  console.log(`📁 Storage: Cloudinary`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
/**
 * Authentication routes for Phase 1
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Phase1DatabaseService } from '../services/phase1-database-service';
import { asyncHandler, createError } from '../middleware/error-handler';

const router = Router();
const dbService = new Phase1DatabaseService();

// Validation middleware
const validateSignUp = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['doctor', 'nurse', 'admin', 'researcher']),
];

const validateSignIn = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Sign up
router.post('/signup', validateSignUp, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password, role = 'doctor' } = req.body;

  try {
    const result = await dbService.signUp(email, password, role);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: result.user,
        session: result.session,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already registered')) {
      throw createError('Email already registered', 409);
    }
    throw error;
  }
}));

// Sign in
router.post('/signin', validateSignIn, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password } = req.body;

  try {
    const result = await dbService.signIn(email, password);
    
    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: result.user,
        session: result.session,
        access_token: result.session.access_token,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid login')) {
      throw createError('Invalid email or password', 401);
    }
    throw error;
  }
}));

// Sign out
router.post('/signout', asyncHandler(async (req, res) => {
  await dbService.signOut();
  
  res.json({
    success: true,
    message: 'Signed out successfully',
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('No token provided', 401);
  }

  try {
    const user = await dbService.getCurrentUser();
    
    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    throw createError('Invalid token', 401);
  }
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw createError('Refresh token required', 400);
  }

  // Note: Supabase handles token refresh automatically
  // This endpoint is for compatibility
  res.json({
    success: true,
    message: 'Token refresh handled by Supabase client',
  });
}));

export default router;
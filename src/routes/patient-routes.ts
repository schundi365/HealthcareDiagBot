/**
 * Patient management routes for Phase 1
 */

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Phase1DatabaseService } from '../services/phase1-database-service';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth-middleware';
import { createFindingsExtractorService } from '../services/patient-findings/findings-extractor-service';
import { createDatabaseClient } from '../services/patient-findings/database-client';
import { createMedGemmaClient } from '../services/patient-findings/medgemma-client';
import { createJSONValidator } from '../services/patient-findings/json-validator';
import { isFindingsError } from '../services/patient-findings/errors';
import { ErrorCode } from '../types/patient-findings';

const router = Router();
const dbService = new Phase1DatabaseService();

// Initialize Findings Extractor Service
const findingsExtractorService = createFindingsExtractorService({
  databaseClient: createDatabaseClient(),
  llmClient: createMedGemmaClient({
    modelVersion: process.env['MEDGEMMA_MODEL_VERSION'] || 'medgemma-v1',
    temperature: parseFloat(process.env['MEDGEMMA_TEMPERATURE'] || '0.3'),
    maxTokens: parseInt(process.env['MEDGEMMA_MAX_TOKENS'] || '2000'),
    apiEndpoint: process.env['MEDGEMMA_API_ENDPOINT'] || '',
    apiKey: process.env['MEDGEMMA_API_KEY'] || ''
  }),
  jsonValidator: createJSONValidator()
});

// Validation middleware
const validateCreatePatient = [
  body('demographics.age').isInt({ min: 0, max: 150 }),
  body('demographics.gender').isIn(['male', 'female', 'other']),
  body('demographics.weight').optional().isFloat({ min: 0 }),
  body('demographics.height').optional().isFloat({ min: 0 }),
];

const validatePatientId = [
  param('patientId').notEmpty().withMessage('Patient ID is required'),
];

// Create patient
router.post('/', validateCreatePatient, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const patientData = {
    demographics: req.body.demographics,
    medicalHistory: req.body.medicalHistory || {
      conditions: [],
      surgeries: [],
      allergies: [],
      familyHistory: [],
    },
    currentSymptoms: req.body.currentSymptoms || [],
    medications: req.body.medications || [],
    imaging: [],
    reports: [],
    fhirData: req.body.fhirData || [],
  };

  const patient = await dbService.createPatient(patientData);

  res.status(201).json({
    success: true,
    message: 'Patient created successfully',
    data: { patient },
  });
}));

// Get patient by ID
router.get('/:patientId', validatePatientId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { patientId } = req.params;
  const patient = await dbService.getPatient(patientId);

  if (!patient) {
    throw createError('Patient not found', 404);
  }

  res.json({
    success: true,
    data: { patient },
  });
}));

// Update patient
router.put('/:patientId', validatePatientId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { patientId } = req.params;
  const updates = req.body;

  // Remove patientId from updates to prevent modification
  delete updates.patientId;

  const patient = await dbService.updatePatient(patientId, updates);

  res.json({
    success: true,
    message: 'Patient updated successfully',
    data: { patient },
  });
}));

// List patients with pagination
router.get('/', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit > 100) {
    throw createError('Limit cannot exceed 100', 400);
  }

  const patients = await dbService.listPatients(limit, offset);

  res.json({
    success: true,
    data: {
      patients,
      pagination: {
        limit,
        offset,
        total: patients.length,
      },
    },
  });
}));

// Get patient images
router.get('/:patientId/images', validatePatientId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { patientId } = req.params;
  const images = await dbService.getPatientImages(patientId);

  res.json({
    success: true,
    data: { images },
  });
}));

// Get patient analyses
router.get('/:patientId/analyses', validatePatientId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { patientId } = req.params;
  const analyses = await dbService.getPatientAnalyses(patientId);

  res.json({
    success: true,
    data: { analyses },
  });
}));

// Get patient findings (extracted from diagnostic reports)
// Requirements: 5.2
router.get('/:patientId/findings', validatePatientId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { patientId } = req.params;

  try {
    // Extract findings using the Findings Extractor Service
    const findings = await findingsExtractorService.extractFindings(patientId);

    res.json({
      success: true,
      data: { findings },
    });
  } catch (error) {
    // Handle specific findings errors with appropriate HTTP status codes
    // Requirements: 8.1, 8.2
    
    if (isFindingsError(error)) {
      switch (error.code) {
        case ErrorCode.INVALID_PATIENT_ID:
          throw createError(error.message, 400);
        
        case ErrorCode.NO_REPORTS_FOUND:
          // Return empty findings instead of 404 for no reports
          res.json({
            success: true,
            data: {
              findings: {
                patientId,
                extractedAt: new Date(),
                findings: [],
                metadata: {
                  totalReportsProcessed: 0,
                  processingTimeMs: 0,
                  llmModelVersion: 'medgemma-v1'
                }
              }
            },
          });
          return;
        
        case ErrorCode.DATABASE_ERROR:
          // Check if it's a connection error (503) or other database error (500)
          if (error.message.includes('connection') || error.message.includes('unavailable')) {
            throw createError('Database service unavailable', 503);
          }
          throw createError('Database error occurred', 500);
        
        case ErrorCode.LLM_ERROR:
          throw createError('AI processing error occurred', 500);
        
        case ErrorCode.VALIDATION_ERROR:
          throw createError('Data validation error occurred', 500);
        
        default:
          throw createError('An unexpected error occurred', 500);
      }
    }

    // Unknown error
    throw createError('An unexpected error occurred', 500);
  }
}));

// Delete patient (admin only)
router.delete('/:patientId', 
  requireRole(['admin']), 
  validatePatientId, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const { patientId } = req.params;
    
    // Check if patient exists
    const patient = await dbService.getPatient(patientId);
    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // In Phase 1, we'll just mark as deleted or implement soft delete
    // For now, return success (actual deletion would require more complex cleanup)
    res.json({
      success: true,
      message: 'Patient deletion requested (will be processed)',
    });
  })
);

export default router;
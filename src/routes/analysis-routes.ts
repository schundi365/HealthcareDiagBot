/**
 * Medical analysis routes for Phase 1
 */

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Phase1AIService } from '../services/phase1-ai-service';
import { Phase1DatabaseService } from '../services/phase1-database-service';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth-middleware';

const router = Router();
const aiService = new Phase1AIService();
const dbService = new Phase1DatabaseService();

// Validation middleware
const validateAnalysisRequest = [
  body('imageId').notEmpty().withMessage('Image ID is required'),
  body('analysisType').optional().isIn(['imaging', 'report', 'combined']),
];

const validateAnalysisId = [
  param('analysisId').notEmpty().withMessage('Analysis ID is required'),
];

// Start image analysis
router.post('/analyze', validateAnalysisRequest, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { imageId, analysisType = 'imaging' } = req.body;

  // Get the medical image
  const image = await dbService.getMedicalImage(imageId);
  if (!image) {
    throw createError('Image not found', 404);
  }

  // Check if patient exists
  const patient = await dbService.getPatient(image.patientId);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  try {
    // Perform AI analysis
    const analysisResult = await aiService.analyzeMedicalImage(image);

    // Save analysis result to database
    await dbService.saveAnalysisResult(analysisResult);

    res.status(201).json({
      success: true,
      message: 'Analysis completed successfully',
      data: {
        analysis: analysisResult,
      },
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Create a failed analysis record
    const failedAnalysis = {
      analysisId: `analysis_${Date.now()}`,
      patientId: image.patientId,
      timestamp: new Date(),
      analysisType,
      findings: [],
      riskAssessment: {
        riskLevel: 'Low' as const,
        riskFactors: [],
        clinicalSuggestions: [],
        urgencyScore: 0,
        evidenceQuality: 0,
      },
      clinicalSuggestions: [],
      processingMetrics: {
        processingTime: 0,
        modelVersion: 'phase1-v1.0',
        confidenceDistribution: { high: 0, medium: 0, low: 1 },
        resourceUsage: {
          computeUnits: 0,
          memoryUsage: 0,
          storageAccessed: 0,
          networkEgress: 0,
          vertexAIPredictions: 0,
        },
        costEstimate: {
          computeCost: 0,
          storageCost: 0,
          networkCost: 0,
          vertexAICost: 0,
          totalCost: 0,
          currency: 'USD',
        },
      },
      status: 'failed' as const,
      vertexAIModelUsed: 'none',
      gcpProcessingRegion: 'none',
    };

    await dbService.saveAnalysisResult(failedAnalysis);

    throw createError('Analysis failed', 500);
  }
}));

// Get analysis result
router.get('/:analysisId', validateAnalysisId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { analysisId } = req.params;
  const analysis = await dbService.getAnalysisResult(analysisId);

  if (!analysis) {
    throw createError('Analysis not found', 404);
  }

  res.json({
    success: true,
    data: { analysis },
  });
}));

// Get patient analyses
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  // Check if patient exists
  const patient = await dbService.getPatient(patientId);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  const analyses = await dbService.getPatientAnalyses(patientId);

  // Apply pagination
  const paginatedAnalyses = analyses.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      patientId,
      analyses: paginatedAnalyses,
      pagination: {
        total: analyses.length,
        limit,
        offset,
        hasMore: offset + limit < analyses.length,
      },
    },
  });
}));

// Get analysis summary for patient
router.get('/patient/:patientId/summary', asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Check if patient exists
  const patient = await dbService.getPatient(patientId);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  const analyses = await dbService.getPatientAnalyses(patientId);

  // Calculate summary statistics
  const summary = {
    totalAnalyses: analyses.length,
    completedAnalyses: analyses.filter(a => a.status === 'completed').length,
    failedAnalyses: analyses.filter(a => a.status === 'failed').length,
    pendingAnalyses: analyses.filter(a => a.status === 'pending').length,
    riskDistribution: {
      Low: analyses.filter(a => a.riskAssessment.riskLevel === 'Low').length,
      Medium: analyses.filter(a => a.riskAssessment.riskLevel === 'Medium').length,
      High: analyses.filter(a => a.riskAssessment.riskLevel === 'High').length,
      Critical: analyses.filter(a => a.riskAssessment.riskLevel === 'Critical').length,
    },
    averageProcessingTime: analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.processingMetrics.processingTime, 0) / analyses.length 
      : 0,
    latestAnalysis: analyses.length > 0 ? analyses[0] : null,
    totalCost: analyses.reduce((sum, a) => sum + a.processingMetrics.costEstimate.totalCost, 0),
  };

  res.json({
    success: true,
    data: {
      patientId,
      summary,
    },
  });
}));

// Rerun analysis
router.post('/:analysisId/rerun', validateAnalysisId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { analysisId } = req.params;
  const existingAnalysis = await dbService.getAnalysisResult(analysisId);

  if (!existingAnalysis) {
    throw createError('Analysis not found', 404);
  }

  // Get the original image
  const images = await dbService.getPatientImages(existingAnalysis.patientId);
  const originalImage = images.find(img => 
    // Find image that was likely used for this analysis (by timestamp proximity)
    Math.abs(img.timestamp.getTime() - existingAnalysis.timestamp.getTime()) < 60000 // Within 1 minute
  );

  if (!originalImage) {
    throw createError('Original image not found for reanalysis', 404);
  }

  try {
    // Perform new analysis
    const newAnalysisResult = await aiService.analyzeMedicalImage(originalImage);
    
    // Update analysis ID to indicate it's a rerun
    newAnalysisResult.analysisId = `${analysisId}_rerun_${Date.now()}`;

    // Save new analysis result
    await dbService.saveAnalysisResult(newAnalysisResult);

    res.json({
      success: true,
      message: 'Analysis rerun completed successfully',
      data: {
        originalAnalysisId: analysisId,
        newAnalysis: newAnalysisResult,
      },
    });
  } catch (error) {
    console.error('Analysis rerun failed:', error);
    throw createError('Analysis rerun failed', 500);
  }
}));

// Get analysis statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const dbStats = await dbService.getDatabaseStats();

  // Get recent analyses for trends
  const recentAnalyses = await dbService.getPatientAnalyses(''); // This would need to be modified to get all analyses

  const stats = {
    database: dbStats,
    analysis: {
      totalAnalyses: dbStats.totalAnalyses,
      averageProcessingTime: 15000, // Placeholder - would calculate from actual data
      successRate: 0.95, // Placeholder
      costPerAnalysis: 0.10, // Placeholder
    },
    usage: {
      dailyAnalyses: 0, // Would calculate from recent data
      weeklyAnalyses: 0,
      monthlyAnalyses: 0,
    },
  };

  res.json({
    success: true,
    data: { stats },
  });
}));

export default router;
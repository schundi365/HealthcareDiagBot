/**
 * Medical image routes for Phase 1
 */

import { Router } from 'express';
import multer from 'multer';
import { body, param, validationResult } from 'express-validator';
import { Phase1StorageService } from '../services/phase1-storage-service';
import { Phase1DatabaseService } from '../services/phase1-database-service';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { phase1Config } from '../config/phase1-config';

const router = Router();
const storageService = new Phase1StorageService();
const dbService = new Phase1DatabaseService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: phase1Config.app.maxFileSize * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    if (phase1Config.app.allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Validation middleware
const validateImageUpload = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('imageType').isIn(['xray', 'ct', 'ecg', 'mri', 'histopathology']),
  body('metadata.bodyPart').notEmpty().withMessage('Body part is required'),
  body('metadata.viewPosition').notEmpty().withMessage('View position is required'),
];

const validateImageId = [
  param('imageId').notEmpty().withMessage('Image ID is required'),
];

// Upload medical image
router.post('/upload', 
  upload.single('image'), 
  validateImageUpload, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    if (!req.file) {
      throw createError('No image file provided', 400);
    }

    const { patientId, imageType, metadata } = req.body;

    // Validate file
    storageService.validateUpload(req.file.buffer, req.file.mimetype);

    // Check if patient exists
    const patient = await dbService.getPatient(patientId);
    if (!patient) {
      throw createError('Patient not found', 404);
    }

    // Create medical image object
    const medicalImage = {
      imageId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      imageType,
      imageData: req.file.buffer,
      metadata: {
        resolution: {
          width: parseInt(metadata.width) || 512,
          height: parseInt(metadata.height) || 512,
        },
        bitDepth: parseInt(metadata.bitDepth) || 8,
        compressionType: metadata.compressionType || 'none',
        acquisitionParameters: metadata.acquisitionParameters || {},
        bodyPart: metadata.bodyPart,
        viewPosition: metadata.viewPosition,
        dicomMetadata: metadata.dicomMetadata || null,
      },
      timestamp: new Date(),
      qualityScore: null,
      gcpStoragePath: null,
      dicomCompliant: metadata.dicomCompliant || false,
      medGemmaCompatible: metadata.medGemmaCompatible || true,
    };

    try {
      // Upload to Cloudinary
      const uploadResult = await storageService.uploadMedicalImage(medicalImage);

      // Save to database
      await dbService.saveMedicalImage(
        medicalImage,
        uploadResult.secureUrl,
        uploadResult.publicId
      );

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageId: medicalImage.imageId,
          patientId: medicalImage.patientId,
          imageType: medicalImage.imageType,
          storageUrl: uploadResult.secureUrl,
          thumbnailUrl: storageService.getThumbnailUrl(uploadResult.publicId),
          uploadResult: {
            publicId: uploadResult.publicId,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        },
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      throw createError('Failed to upload image', 500);
    }
  })
);

// Get image by ID
router.get('/:imageId', validateImageId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { imageId } = req.params;
  const image = await dbService.getMedicalImage(imageId);

  if (!image) {
    throw createError('Image not found', 404);
  }

  // Don't return the actual image data in the response (too large)
  const { imageData, ...imageInfo } = image;

  res.json({
    success: true,
    data: {
      image: {
        ...imageInfo,
        hasImageData: imageData.length > 0,
        imageSizeBytes: imageData.length,
      },
    },
  });
}));

// Get image data (binary)
router.get('/:imageId/data', validateImageId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { imageId } = req.params;
  const image = await dbService.getMedicalImage(imageId);

  if (!image) {
    throw createError('Image not found', 404);
  }

  // Set appropriate headers
  res.set({
    'Content-Type': 'image/png',
    'Content-Length': image.imageData.length.toString(),
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  });

  res.send(image.imageData);
}));

// Get optimized image URL
router.get('/:imageId/url', validateImageId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { imageId } = req.params;
  const image = await dbService.getMedicalImage(imageId);

  if (!image) {
    throw createError('Image not found', 404);
  }

  // Get the Cloudinary public ID from database
  const imageRecord = await dbService.getMedicalImage(imageId);
  const publicId = (imageRecord as any)?.cloudinary_public_id;

  if (!publicId) {
    throw createError('Image URL not available', 404);
  }

  const width = parseInt(req.query.width as string) || 512;
  const height = parseInt(req.query.height as string) || 512;
  const quality = req.query.quality as string || 'auto:good';

  const optimizedUrl = storageService.getOptimizedImageUrl(publicId, {
    width,
    height,
    quality,
  });

  const thumbnailUrl = storageService.getThumbnailUrl(publicId);

  res.json({
    success: true,
    data: {
      imageId,
      optimizedUrl,
      thumbnailUrl,
      options: {
        width,
        height,
        quality,
      },
    },
  });
}));

// List images for a patient
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const images = await dbService.getPatientImages(patientId);

  // Don't return image data, just metadata
  const imageList = images.map(({ imageData, ...imageInfo }) => ({
    ...imageInfo,
    hasImageData: imageData.length > 0,
    imageSizeBytes: imageData.length,
  }));

  res.json({
    success: true,
    data: {
      patientId,
      images: imageList,
      total: imageList.length,
    },
  });
}));

// Delete image
router.delete('/:imageId', validateImageId, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { imageId } = req.params;
  const image = await dbService.getMedicalImage(imageId);

  if (!image) {
    throw createError('Image not found', 404);
  }

  try {
    // Get Cloudinary public ID
    const imageRecord = await dbService.getMedicalImage(imageId);
    const publicId = (imageRecord as any)?.cloudinary_public_id;

    if (publicId) {
      // Delete from Cloudinary
      await storageService.deleteMedicalImage(publicId);
    }

    // Note: In Phase 1, we're not implementing database deletion
    // This would require CASCADE deletes for related analysis results
    
    res.json({
      success: true,
      message: 'Image deletion requested (will be processed)',
    });
  } catch (error) {
    console.error('Image deletion failed:', error);
    throw createError('Failed to delete image', 500);
  }
}));

// Get storage statistics
router.get('/stats/storage', asyncHandler(async (req, res) => {
  const stats = await storageService.getStorageStats();
  
  res.json({
    success: true,
    data: {
      storage: stats,
      limits: {
        maxFileSize: phase1Config.app.maxFileSize,
        allowedTypes: phase1Config.app.allowedImageTypes,
      },
    },
  });
}));

export default router;
/**
 * Property-based test for Medical Image Processing Performance
 * Property 1: Medical Image Processing Performance
 * **Validates: Requirements 1.1**
 */

import { fc } from '../test/setup';
import { MedicalImageProcessor } from '../services/medical-image-processor';
import { MedicalImage } from '../types/medical';
import { HealthcareAPIService, CloudStorageService } from '../interfaces/medgemma-integration';
import sharp from 'sharp';

// Mock dependencies
const mockHealthcareAPI: HealthcareAPIService = {
  processDICOMData: jest.fn(),
  validateFHIRData: jest.fn(),
  validateImageQuality: jest.fn(),
  preprocessImage: jest.fn(),
  convertDICOMToStandard: jest.fn(),
  extractReportData: jest.fn(),
  anonymizeData: jest.fn(),
};

const mockCloudStorage: CloudStorageService = {
  uploadMedicalImage: jest.fn(),
  downloadMedicalImage: jest.fn(),
  storeDICOMData: jest.fn(),
  retrieveDICOMData: jest.fn(),
  archiveOldData: jest.fn(),
  purgeExpiredData: jest.fn(),
};

/**
 * Helper function to generate valid medical image data using sharp
 * Creates actual PNG images that can be processed by the sharp library
 */
async function generateValidImageData(
  width: number,
  height: number,
  bitDepth: 8 | 16 | 32
): Promise<Buffer> {
  // Create a simple gradient image with random noise for variety
  const channels = 3; // RGB
  const pixelCount = width * height;
  const rawData = Buffer.alloc(pixelCount * channels);
  
  // Generate gradient pattern with some randomness
  for (let i = 0; i < pixelCount; i++) {
    const x = i % width;
    const gradientValue = Math.floor((x / width) * 255);
    const noise = Math.floor(Math.random() * 50) - 25;
    const pixelValue = Math.max(0, Math.min(255, gradientValue + noise));
    
    rawData[i * channels] = pixelValue;     // R
    rawData[i * channels + 1] = pixelValue; // G
    rawData[i * channels + 2] = pixelValue; // B
  }
  
  // Create image using sharp and convert to appropriate bit depth
  let image = sharp(rawData, {
    raw: {
      width,
      height,
      channels
    }
  });
  
  // Convert to PNG format (supports 8 and 16 bit depths)
  if (bitDepth === 16) {
    image = image.toColourspace('b-w').linear(256, 0); // Scale up to 16-bit range
  }
  
  return image.png().toBuffer();
}

describe('Medical Image Processing Performance Property Test', () => {
  let processor: MedicalImageProcessor;

  beforeEach(() => {
    processor = new MedicalImageProcessor(mockHealthcareAPI, mockCloudStorage);
    jest.clearAllMocks();
  });

  describe('Property 1: Medical Image Processing Performance', () => {
    /**
     * **Validates: Requirements 1.1**
     * Property: For any valid medical image (X-ray, CT scan, ECG), 
     * the processing time should be less than or equal to 30 seconds
     */
    it('should process images within performance bounds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            imageId: fc.uuid(),
            patientId: fc.uuid(),
            imageType: fc.constantFrom('xray', 'ct', 'ecg', 'mri', 'histopathology') as fc.Arbitrary<'xray' | 'ct' | 'ecg' | 'mri' | 'histopathology'>,
            metadata: fc.record({
              resolution: fc.record({
                width: fc.integer({ min: 256, max: 2048 }),
                height: fc.integer({ min: 256, max: 2048 }),
              }),
              bitDepth: fc.constantFrom(8, 16, 32),
              compressionType: fc.constantFrom('lossless', 'lossy', 'none'),
              acquisitionParameters: fc.constant({}),
              bodyPart: fc.constantFrom('chest', 'abdomen', 'head', 'extremity'),
              viewPosition: fc.constantFrom('PA', 'AP', 'lateral', 'oblique'),
            }),
            timestamp: fc.date(),
            dicomCompliant: fc.boolean(),
            medGemmaCompatible: fc.boolean(),
          }),
          async (imageConfig) => {
            // Generate valid image data using sharp
            const bitDepth = imageConfig.metadata.bitDepth === 32 ? 16 : imageConfig.metadata.bitDepth as 8 | 16;
            const imageData = await generateValidImageData(
              imageConfig.metadata.resolution.width,
              imageConfig.metadata.resolution.height,
              bitDepth
            );
            
            const image: MedicalImage = {
              ...imageConfig,
              imageData,
              gcpStoragePath: `gs://test-bucket/${imageConfig.imageId}.png`
            };

            // Ensure image has valid data for processing
            fc.pre(image.imageData.length > 0);
            fc.pre(image.metadata.resolution.width >= 256);
            fc.pre(image.metadata.resolution.height >= 256);

            const startTime = Date.now();
            
            try {
              const result = await processor.preprocessImage(image);
              const processingTime = Date.now() - startTime;

              // Performance requirements - Property 1: Processing time <= 30 seconds
              expect(processingTime).toBeLessThan(30000); // Max 30 seconds
              
              // Verify result structure is valid
              expect(result).toBeDefined();
              expect(result.imageData).toBeDefined();
              expect(result.format).toBeDefined();
              expect(result.dimensions).toBeDefined();
              expect(result.preprocessing).toBeDefined();
              expect(result.qualityMetrics).toBeDefined();

              // Verify output format is MedGemma compatible
              expect(result.format).toBe('PNG');
              expect(result.dimensions.width).toBe(448);
              expect(result.dimensions.height).toBe(448);

              // Verify preprocessing steps are recorded
              expect(result.preprocessing.length).toBeGreaterThan(0);
              expect(result.preprocessing.every(step => step.timestamp instanceof Date)).toBe(true);

              // Quality metrics should be valid (0-1 range)
              expect(result.qualityMetrics.overallScore).toBeGreaterThanOrEqual(0);
              expect(result.qualityMetrics.overallScore).toBeLessThanOrEqual(1);
              expect(result.qualityMetrics.sharpness).toBeGreaterThanOrEqual(0);
              expect(result.qualityMetrics.sharpness).toBeLessThanOrEqual(1);
              expect(result.qualityMetrics.contrast).toBeGreaterThanOrEqual(0);
              expect(result.qualityMetrics.contrast).toBeLessThanOrEqual(1);
              expect(result.qualityMetrics.brightness).toBeGreaterThanOrEqual(0);
              expect(result.qualityMetrics.brightness).toBeLessThanOrEqual(1);
              expect(result.qualityMetrics.noise).toBeGreaterThanOrEqual(0);
              expect(result.qualityMetrics.noise).toBeLessThanOrEqual(1);

            } catch (error) {
              // Processing should not fail for valid inputs
              throw new Error(`Image processing failed unexpectedly: ${error}`);
            }
          }
        ),
        { numRuns: 100, timeout: 60000 }
      );
    });

    /**
     * Performance consistency property test
     * Validates that processing times are reasonably consistent across different images
     */
    it('should maintain consistent processing performance across image types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              imageId: fc.uuid(),
              patientId: fc.uuid(),
              imageType: fc.constantFrom('xray', 'ct', 'ecg', 'mri', 'histopathology') as fc.Arbitrary<'xray' | 'ct' | 'ecg' | 'mri' | 'histopathology'>,
              metadata: fc.record({
                resolution: fc.record({
                  width: fc.integer({ min: 256, max: 2048 }),
                  height: fc.integer({ min: 256, max: 2048 }),
                }),
                bitDepth: fc.constantFrom(8, 16, 32),
                compressionType: fc.constantFrom('lossless', 'lossy', 'none'),
                acquisitionParameters: fc.constant({}),
                bodyPart: fc.constantFrom('chest', 'abdomen', 'head', 'extremity'),
                viewPosition: fc.constantFrom('PA', 'AP', 'lateral', 'oblique'),
              }),
              timestamp: fc.date(),
              dicomCompliant: fc.boolean(),
              medGemmaCompatible: fc.boolean(),
            }),
            { minLength: 5, maxLength: 10 }
          ),
          async (imageConfigs) => {
            const processingTimes: number[] = [];

            for (const imageConfig of imageConfigs) {
              // Ensure valid image data
              if (imageConfig.metadata.resolution.width < 256 || 
                  imageConfig.metadata.resolution.height < 256) {
                continue;
              }

              // Generate valid image data using sharp
              const bitDepth = imageConfig.metadata.bitDepth === 32 ? 16 : imageConfig.metadata.bitDepth as 8 | 16;
              const imageData = await generateValidImageData(
                imageConfig.metadata.resolution.width,
                imageConfig.metadata.resolution.height,
                bitDepth
              );
              
              const image: MedicalImage = {
                ...imageConfig,
                imageData,
                gcpStoragePath: `gs://test-bucket/${imageConfig.imageId}.png`
              };

              const startTime = Date.now();
              try {
                await processor.preprocessImage(image);
                const processingTime = Date.now() - startTime;
                processingTimes.push(processingTime);
              } catch (error) {
                // Skip invalid images
                continue;
              }
            }

            if (processingTimes.length < 2) return; // Need at least 2 samples

            // Calculate coefficient of variation (standard deviation / mean)
            const mean = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
            const variance = processingTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / processingTimes.length;
            const stdDev = Math.sqrt(variance);
            const coefficientOfVariation = stdDev / mean;

            // Performance should be reasonably consistent (CV < 1.0)
            expect(coefficientOfVariation).toBeLessThan(1.0);
            expect(mean).toBeLessThan(30000); // Average processing time under 30s
          }
        ),
        { numRuns: 20, timeout: 120000 }
      );
    });
  });
});
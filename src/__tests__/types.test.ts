/**
 * Unit tests for type definitions and interfaces
 */

import * as fc from 'fast-check';
import { 
  MedicalImage, 
  RiskAssessment 
} from '../types';
import { 
  medicalImageArbitrary, 
  patientDataArbitrary 
} from '../test/generators';

describe('Type Definitions', () => {
  describe('MedicalImage', () => {
    test('should have required properties', () => {
      const mockImage: MedicalImage = {
        imageId: 'test-123',
        patientId: 'patient-456',
        imageType: 'xray',
        imageData: Buffer.from('test-data'),
        metadata: {
          resolution: { width: 512, height: 512 },
          bitDepth: 16,
          compressionType: 'lossless',
          acquisitionParameters: {},
          bodyPart: 'chest',
          viewPosition: 'PA',
        },
        timestamp: new Date(),
      };

      expect(mockImage.imageId).toBe('test-123');
      expect(mockImage.patientId).toBe('patient-456');
      expect(mockImage.imageType).toBe('xray');
      expect(Buffer.isBuffer(mockImage.imageData)).toBe(true);
      expect(mockImage.metadata).toBeDefined();
      expect(mockImage.timestamp).toBeInstanceOf(Date);
    });

    test('should support all image types', () => {
      const validTypes: Array<MedicalImage['imageType']> = ['xray', 'ct', 'ecg', 'mri'];
      
      validTypes.forEach(type => {
        const image: MedicalImage = {
          imageId: 'test',
          patientId: 'patient',
          imageType: type,
          imageData: Buffer.from('data'),
          metadata: {
            resolution: { width: 256, height: 256 },
            bitDepth: 8,
            compressionType: 'none',
            acquisitionParameters: {},
            bodyPart: 'test',
            viewPosition: 'test',
          },
          timestamp: new Date(),
        };
        
        expect(image.imageType).toBe(type);
      });
    });
  });

  describe('RiskAssessment', () => {
    test('should have valid risk levels', () => {
      const validLevels: Array<RiskAssessment['riskLevel']> = ['Low', 'Medium', 'High', 'Critical'];
      
      validLevels.forEach(level => {
        const assessment: RiskAssessment = {
          riskLevel: level,
          riskFactors: [],
          clinicalSuggestions: [],
          urgencyScore: 5,
        };
        
        expect(assessment.riskLevel).toBe(level);
      });
    });

    test('should have urgency score within valid range', () => {
      const assessment: RiskAssessment = {
        riskLevel: 'Medium',
        riskFactors: [],
        clinicalSuggestions: [],
        urgencyScore: 7,
      };
      
      expect(assessment.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(assessment.urgencyScore).toBeLessThanOrEqual(10);
    });
  });
});

describe('Property-Based Tests', () => {
  test('Property: Medical images should have valid structure', () => {
    fc.assert(fc.property(medicalImageArbitrary(), (image) => {
      // Image ID should be non-empty string
      expect(typeof image.imageId).toBe('string');
      expect(image.imageId.length).toBeGreaterThan(0);
      
      // Patient ID should be non-empty string
      expect(typeof image.patientId).toBe('string');
      expect(image.patientId.length).toBeGreaterThan(0);
      
      // Image type should be valid
      expect(['xray', 'ct', 'ecg', 'mri']).toContain(image.imageType);
      
      // Image data should be a Buffer
      expect(Buffer.isBuffer(image.imageData)).toBe(true);
      expect(image.imageData.length).toBeGreaterThan(0);
      
      // Metadata should have required properties
      expect(image.metadata.resolution.width).toBeGreaterThan(0);
      expect(image.metadata.resolution.height).toBeGreaterThan(0);
      expect(image.metadata.bitDepth).toBeGreaterThan(0);
      
      // Timestamp should be a valid Date
      expect(image.timestamp).toBeInstanceOf(Date);
      
      // Quality score should be in valid range if present
      if (image.qualityScore !== undefined) {
        expect(image.qualityScore).toBeGreaterThanOrEqual(0);
        expect(image.qualityScore).toBeLessThanOrEqual(100);
      }
    }));
  });

  test('Property: Patient data should have consistent structure', () => {
    fc.assert(fc.property(patientDataArbitrary(), (patient) => {
      // Patient ID should be non-empty string
      expect(typeof patient.patientId).toBe('string');
      expect(patient.patientId.length).toBeGreaterThan(0);
      
      // Demographics should have valid age
      expect(patient.demographics.age).toBeGreaterThanOrEqual(0);
      expect(patient.demographics.age).toBeLessThanOrEqual(120);
      
      // Gender should be valid
      expect(['male', 'female', 'other']).toContain(patient.demographics.gender);
      
      // Medical history should be defined
      expect(patient.medicalHistory).toBeDefined();
      expect(Array.isArray(patient.medicalHistory.conditions)).toBe(true);
      expect(Array.isArray(patient.medicalHistory.surgeries)).toBe(true);
      expect(Array.isArray(patient.medicalHistory.allergies)).toBe(true);
      expect(Array.isArray(patient.medicalHistory.familyHistory)).toBe(true);
      
      // Arrays should be defined
      expect(Array.isArray(patient.currentSymptoms)).toBe(true);
      expect(Array.isArray(patient.medications)).toBe(true);
      expect(Array.isArray(patient.imaging)).toBe(true);
      expect(Array.isArray(patient.reports)).toBe(true);
    }));
  });
});
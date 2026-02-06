/**
 * Jest test setup configuration
 * Enhanced for property-based testing with fast-check
 */

import * as fc from 'fast-check';

// Global test timeout
jest.setTimeout(30000);

// Configure fast-check for property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per requirements
  verbose: process.env['NODE_ENV'] === 'test' ? 2 : 0,
  seed: process.env['FAST_CHECK_SEED'] ? parseInt(process.env['FAST_CHECK_SEED']) : 42,
});

// Mock console methods in tests to reduce noise
const originalConsole = console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test utilities
(global as any).testUtils = {
  createMockPatientData: () => ({
    patientId: 'test-patient-123',
    demographics: {
      age: 45,
      gender: 'male' as const,
      weight: 75,
      height: 180,
    },
    medicalHistory: {
      conditions: [],
      surgeries: [],
      allergies: [],
      familyHistory: [],
    },
    currentSymptoms: [],
    medications: [],
    imaging: [],
    reports: [],
    fhirData: [],
  }),
  
  createMockMedicalImage: () => ({
    imageId: 'test-image-123',
    patientId: 'test-patient-123',
    imageType: 'xray' as const,
    imageData: Buffer.from('mock-image-data'),
    metadata: {
      resolution: { width: 512, height: 512 },
      bitDepth: 16,
      compressionType: 'lossless',
      acquisitionParameters: {},
      bodyPart: 'chest',
      viewPosition: 'PA',
      dicomMetadata: {
        studyInstanceUID: '1.2.3.4.5',
        seriesInstanceUID: '1.2.3.4.5.6',
        sopInstanceUID: '1.2.3.4.5.6.7',
        patientName: 'Test Patient',
        patientID: 'TEST123',
        studyDate: '20240101',
        modality: 'CR',
        bodyPartExamined: 'CHEST',
        viewPosition: 'PA',
        institutionName: 'Test Hospital',
        manufacturerModelName: 'Test Scanner',
        pixelSpacing: [0.1, 0.1],
        transferSyntax: '1.2.840.10008.1.2.1',
        complianceLevel: 'strict' as const,
      },
    },
    timestamp: new Date(),
    qualityScore: 85,
    gcpStoragePath: 'gs://test-bucket/images/test-image-123.dcm',
    dicomCompliant: true,
    medGemmaCompatible: true,
  }),

  createMockMedGemmaAnalysis: () => ({
    findings: [],
    confidence: 0.85,
    anatomicalAnnotations: [],
    processingTime: 15000,
    modelVersion: 'medgemma-4b-v1',
    specialtyInsights: [],
  }),

  // Property-based testing helpers
  propertyTestConfig: {
    numRuns: 100,
    timeout: 30000,
    verbose: false,
  },
};

// Export fast-check for use in tests
export { fc };
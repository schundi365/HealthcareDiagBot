/**
 * Unit Tests for JSONValidator
 * 
 * Tests the JSON validation logic for StructuredFindings output
 * 
 * Requirements: 3.5, 8.3
 */

import * as fc from 'fast-check';
import { JSONValidatorImpl, createJSONValidator } from '../../services/patient-findings/json-validator';
import { arbitraryValidFindingsJSON } from '../../test/patient-findings-generators';

describe('JSONValidator', () => {
  let validator: JSONValidatorImpl;

  beforeEach(() => {
    validator = new JSONValidatorImpl();
  });

  describe('validate - valid JSON', () => {
    test('should validate correct StructuredFindings JSON', () => {
      const validJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T09:00:00.000Z',
            findingName: 'Hemoglobin',
            value: '12.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: 'abnormal',
            interpretation: 'Below normal range'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(validJson);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      
      if (!result.data) {
        throw new Error('Expected data to be defined');
      }
      
      expect(result.data.patientId).toBe('patient-123');
      expect(result.data.findings).toHaveLength(1);
      expect(result.data.findings[0]?.findingName).toBe('Hemoglobin');
      expect(result.errors).toBeUndefined();
    });

    test('should convert date strings to Date objects', () => {
      const validJson = JSON.stringify({
        patientId: 'patient-456',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'ecg',
            reportDate: '2024-01-14T14:00:00.000Z',
            findingName: 'Heart Rate',
            value: '85 bpm',
            normalRange: '60-100 bpm',
            significance: 'normal',
            interpretation: 'Within normal range'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 300,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(validJson);

      expect(result.isValid).toBe(true);
      
      if (!result.data) {
        throw new Error('Expected data to be defined');
      }
      
      expect(result.data.extractedAt).toBeInstanceOf(Date);
      expect(result.data.findings[0]?.reportDate).toBeInstanceOf(Date);
    });

    test('should validate findings with null values', () => {
      const validJson = JSON.stringify({
        patientId: 'patient-789',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'radiology',
            reportDate: '2024-01-15T11:00:00.000Z',
            findingName: 'Chest X-Ray',
            value: null,
            normalRange: null,
            significance: 'normal',
            interpretation: 'No abnormalities detected'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 400,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(validJson);

      expect(result.isValid).toBe(true);
      
      if (!result.data) {
        throw new Error('Expected data to be defined');
      }
      
      expect(result.data.findings[0]?.value).toBeNull();
      expect(result.data.findings[0]?.normalRange).toBeNull();
    });

    test('should validate empty findings array', () => {
      const validJson = JSON.stringify({
        patientId: 'patient-empty',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [],
        metadata: {
          totalReportsProcessed: 0,
          processingTimeMs: 100,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(validJson);

      expect(result.isValid).toBe(true);
      expect(result.data?.findings).toHaveLength(0);
    });
  });

  describe('validate - invalid JSON', () => {
    test('should reject malformed JSON string', () => {
      const malformedJson = '{ invalid json }';

      const result = validator.validate(malformedJson);

      expect(result.isValid).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      
      if (!result.errors) {
        throw new Error('Expected errors to be defined');
      }
      
      expect(result.errors[0]?.path).toBe('$');
      expect(result.errors[0]?.message).toContain('Invalid JSON');
    });

    test('should reject JSON with missing required fields', () => {
      const missingFieldsJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        // missing 'findings' field
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(missingFieldsJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should reject findings with missing required fields', () => {
      const invalidFindingJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T09:00:00.000Z',
            findingName: 'Hemoglobin'
            // missing value, normalRange, significance, interpretation
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(invalidFindingJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid reportType enum value', () => {
      const invalidEnumJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'invalid_type',
            reportDate: '2024-01-15T09:00:00.000Z',
            findingName: 'Test',
            value: 'value',
            normalRange: 'range',
            significance: 'normal',
            interpretation: 'interpretation'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(invalidEnumJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid significance enum value', () => {
      const invalidSignificanceJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T09:00:00.000Z',
            findingName: 'Test',
            value: 'value',
            normalRange: 'range',
            significance: 'invalid_significance',
            interpretation: 'interpretation'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(invalidSignificanceJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject invalid date format', () => {
      const invalidDateJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: 'not-a-date',
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T09:00:00.000Z',
            findingName: 'Test',
            value: 'value',
            normalRange: 'range',
            significance: 'normal',
            interpretation: 'interpretation'
          }
        ],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(invalidDateJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject negative metadata values', () => {
      const negativeMetadataJson = JSON.stringify({
        patientId: 'patient-123',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [],
        metadata: {
          totalReportsProcessed: -1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(negativeMetadataJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject empty patientId', () => {
      const emptyPatientIdJson = JSON.stringify({
        patientId: '',
        extractedAt: '2024-01-15T10:30:00.000Z',
        findings: [],
        metadata: {
          totalReportsProcessed: 0,
          processingTimeMs: 100,
          llmModelVersion: 'medgemma-v1'
        }
      });

      const result = validator.validate(emptyPatientIdJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('getSchema', () => {
    test('should return the JSON schema', () => {
      const schema = validator.getSchema();

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('patientId');
      expect(schema.required).toContain('extractedAt');
      expect(schema.required).toContain('findings');
      expect(schema.required).toContain('metadata');
    });
  });

  describe('createJSONValidator factory', () => {
    test('should create a JSONValidator instance', () => {
      const validator = createJSONValidator();

      expect(validator).toBeDefined();
      expect(typeof validator.validate).toBe('function');
      expect(typeof validator.getSchema).toBe('function');
    });
  });

  // Property-Based Tests
  describe('Property Tests', () => {
    /**
     * Property 4: Valid JSON Output
     * Feature: patient-findings-display, Property 4: Valid JSON Output
     * 
     * For any successful extraction, the Findings_Extractor output should be 
     * valid, parseable JSON.
     * 
     * Validates: Requirements 3.1
     */
    test('Property 4: Valid JSON Output - validator accepts all valid StructuredFindings JSON', () => {
      fc.assert(
        fc.property(
          arbitraryValidFindingsJSON(),
          (validJson) => {
            // Execute: validate the JSON string
            const result = validator.validate(validJson);

            // Verify: validation should succeed
            expect(result.isValid).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toBeUndefined();

            // Verify: parsed data has correct structure
            if (result.data) {
              expect(typeof result.data.patientId).toBe('string');
              expect(result.data.extractedAt).toBeInstanceOf(Date);
              expect(Array.isArray(result.data.findings)).toBe(true);
              expect(result.data.metadata).toBeDefined();
              expect(typeof result.data.metadata.totalReportsProcessed).toBe('number');
              expect(typeof result.data.metadata.processingTimeMs).toBe('number');
              expect(typeof result.data.metadata.llmModelVersion).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


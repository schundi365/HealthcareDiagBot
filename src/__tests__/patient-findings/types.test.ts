/**
 * Patient Findings Display - Type Definitions Tests
 * 
 * This test suite verifies that the core type definitions and error handling
 * utilities are correctly defined and working as expected.
 * 
 * Requirements: 1.1, 2.1, 3.1, 5.1, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import {
  ReportType,
  Significance,
  ErrorCode,
  DiagnosticReport,
  Finding,
  StructuredFindings
} from '../../types/patient-findings';

import {
  FindingsError,
  createDatabaseError,
  createLLMError,
  createValidationError,
  createNoReportsError,
  createInvalidPatientIdError,
  isFindingsError,
  wrapError
} from '../../services/patient-findings/errors';

describe('Patient Findings Type Definitions', () => {
  describe('Enums', () => {
    test('ReportType enum has correct values', () => {
      expect(ReportType.BLOOD_TEST).toBe('blood_test');
      expect(ReportType.RADIOLOGY).toBe('radiology');
      expect(ReportType.ECG).toBe('ecg');
    });

    test('Significance enum has correct values', () => {
      expect(Significance.NORMAL).toBe('normal');
      expect(Significance.ABNORMAL).toBe('abnormal');
      expect(Significance.CRITICAL).toBe('critical');
    });

    test('ErrorCode enum has correct values', () => {
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.LLM_ERROR).toBe('LLM_ERROR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.NO_REPORTS_FOUND).toBe('NO_REPORTS_FOUND');
      expect(ErrorCode.INVALID_PATIENT_ID).toBe('INVALID_PATIENT_ID');
    });
  });

  describe('Type Structures', () => {
    test('DiagnosticReport type structure is valid', () => {
      const report: DiagnosticReport = {
        reportId: 'report-123',
        patientId: 'patient-456',
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date('2024-01-15'),
        reportText: 'Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5)',
        metadata: { lab: 'Lab A' }
      };

      expect(report.reportId).toBe('report-123');
      expect(report.patientId).toBe('patient-456');
      expect(report.reportType).toBe(ReportType.BLOOD_TEST);
      expect(report.reportText).toContain('Hemoglobin');
    });

    test('Finding type structure is valid', () => {
      const finding: Finding = {
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date('2024-01-15'),
        findingName: 'Hemoglobin',
        value: '12.5 g/dL',
        normalRange: '13.5-17.5 g/dL',
        significance: Significance.ABNORMAL,
        interpretation: 'Below normal range'
      };

      expect(finding.findingName).toBe('Hemoglobin');
      expect(finding.significance).toBe(Significance.ABNORMAL);
    });

    test('StructuredFindings type structure is valid', () => {
      const findings: StructuredFindings = {
        patientId: 'patient-123',
        extractedAt: new Date(),
        findings: [],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      };

      expect(findings.patientId).toBe('patient-123');
      expect(findings.findings).toEqual([]);
      expect(findings.metadata.llmModelVersion).toBe('medgemma-v1');
    });
  });
});

describe('FindingsError Class', () => {
  test('creates error with correct properties', () => {
    const error = new FindingsError(
      ErrorCode.DATABASE_ERROR,
      'Database connection failed',
      { host: 'localhost' }
    );

    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.message).toBe('Database connection failed');
    expect(error.details).toEqual({ host: 'localhost' });
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.name).toBe('FindingsError');
  });

  test('toJSON returns serializable object', () => {
    const error = new FindingsError(
      ErrorCode.LLM_ERROR,
      'LLM timeout',
      { timeout: 30000 }
    );

    const json = error.toJSON();

    expect(json.name).toBe('FindingsError');
    expect(json.code).toBe(ErrorCode.LLM_ERROR);
    expect(json.message).toBe('LLM timeout');
    expect(json.details).toEqual({ timeout: 30000 });
    expect(json.timestamp).toBeInstanceOf(Date);
  });

  test('maintains stack trace', () => {
    const error = new FindingsError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid JSON'
    );

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('FindingsError');
  });
});

describe('Error Factory Functions', () => {
  test('createDatabaseError creates correct error', () => {
    const originalError = new Error('Connection timeout');
    const error = createDatabaseError('Failed to connect', originalError);

    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.message).toBe('Failed to connect');
    expect(error.details.originalError).toBe('Connection timeout');
  });

  test('createLLMError creates correct error', () => {
    const originalError = new Error('API timeout');
    const error = createLLMError('LLM request failed', originalError);

    expect(error.code).toBe(ErrorCode.LLM_ERROR);
    expect(error.message).toBe('LLM request failed');
    expect(error.details.originalError).toBe('API timeout');
  });

  test('createValidationError creates correct error', () => {
    const validationErrors = [
      { path: 'findings[0].value', message: 'Required field missing' }
    ];
    const error = createValidationError('Validation failed', validationErrors);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Validation failed');
    expect(error.details.validationErrors).toEqual(validationErrors);
  });

  test('createNoReportsError creates correct error', () => {
    const error = createNoReportsError('patient-123');

    expect(error.code).toBe(ErrorCode.NO_REPORTS_FOUND);
    expect(error.message).toContain('patient-123');
    expect(error.details.patientId).toBe('patient-123');
  });

  test('createInvalidPatientIdError creates correct error', () => {
    const error = createInvalidPatientIdError('invalid@id');

    expect(error.code).toBe(ErrorCode.INVALID_PATIENT_ID);
    expect(error.message).toContain('invalid@id');
    expect(error.details.patientId).toBe('invalid@id');
  });
});

describe('Error Utility Functions', () => {
  test('isFindingsError identifies FindingsError instances', () => {
    const error = new FindingsError(ErrorCode.DATABASE_ERROR, 'Test error');
    expect(isFindingsError(error)).toBe(true);
  });

  test('isFindingsError identifies error-like objects', () => {
    const errorLike = {
      code: ErrorCode.LLM_ERROR,
      message: 'Test error'
    };
    expect(isFindingsError(errorLike)).toBe(true);
  });

  test('isFindingsError rejects non-FindingsError objects', () => {
    const regularError = new Error('Regular error');
    expect(isFindingsError(regularError)).toBe(false);

    const notAnError = { foo: 'bar' };
    expect(isFindingsError(notAnError)).toBe(false);
  });

  test('wrapError wraps FindingsError as-is', () => {
    const original = new FindingsError(ErrorCode.DATABASE_ERROR, 'Original');
    const wrapped = wrapError(original);

    expect(wrapped).toBe(original);
  });

  test('wrapError wraps regular Error', () => {
    const original = new Error('Regular error');
    const wrapped = wrapError(original, ErrorCode.VALIDATION_ERROR);

    expect(wrapped.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(wrapped.message).toBe('Regular error');
    expect(wrapped.details.originalError).toBe(original);
  });

  test('wrapError wraps unknown errors', () => {
    const wrapped = wrapError('string error');

    expect(wrapped.code).toBe(ErrorCode.LLM_ERROR); // default
    expect(wrapped.message).toBe('An unknown error occurred');
    expect(wrapped.details.originalError).toBe('string error');
  });
});

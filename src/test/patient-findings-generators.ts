/**
 * Patient Findings Display - Property-Based Test Generators
 * 
 * This module provides fast-check arbitraries (generators) for property-based testing
 * of the Patient Findings Display system.
 * 
 * These generators create random but valid test data that conforms to the system's
 * type definitions, enabling comprehensive property-based testing.
 */

import * as fc from 'fast-check';
import {
  ReportType,
  Significance,
  DiagnosticReport,
  Finding,
  StructuredFindings,
  FindingsMetadata,
  ErrorCode
} from '../types/patient-findings';

/**
 * Generates a random patient ID
 * Format: alphanumeric string, 5-50 characters
 */
export const arbitraryPatientId = (): fc.Arbitrary<string> =>
  fc.string({ 
    minLength: 5, 
    maxLength: 50,
    unit: fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
    )
  });

/**
 * Generates a random report type
 */
export const arbitraryReportType = (): fc.Arbitrary<ReportType> =>
  fc.constantFrom(
    ReportType.BLOOD_TEST,
    ReportType.RADIOLOGY,
    ReportType.ECG
  );

/**
 * Generates a random significance level
 */
export const arbitrarySignificance = (): fc.Arbitrary<Significance> =>
  fc.constantFrom(
    Significance.NORMAL,
    Significance.ABNORMAL,
    Significance.CRITICAL
  );

/**
 * Generates a random error code
 */
export const arbitraryErrorCode = (): fc.Arbitrary<ErrorCode> =>
  fc.constantFrom(
    ErrorCode.DATABASE_ERROR,
    ErrorCode.LLM_ERROR,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.NO_REPORTS_FOUND,
    ErrorCode.INVALID_PATIENT_ID
  );

/**
 * Generates realistic medical report text based on report type
 */
export const arbitraryReportText = (reportType?: ReportType): fc.Arbitrary<string> => {
  if (reportType === ReportType.BLOOD_TEST) {
    return fc.constantFrom(
      'Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5). White Blood Cell Count: 7.2 K/uL (Normal: 4.5-11.0).',
      'Glucose: 105 mg/dL (Normal: 70-100). HbA1c: 6.2% (Normal: <5.7%).',
      'Total Cholesterol: 220 mg/dL (Normal: <200). LDL: 140 mg/dL (Normal: <100).',
      'Creatinine: 1.2 mg/dL (Normal: 0.7-1.3). BUN: 18 mg/dL (Normal: 7-20).'
    );
  } else if (reportType === ReportType.RADIOLOGY) {
    return fc.constantFrom(
      'Chest X-ray shows clear lung fields. No acute cardiopulmonary abnormality.',
      'CT scan reveals a 2.5 cm mass in the right upper lobe. Further evaluation recommended.',
      'MRI brain shows no acute intracranial abnormality. Normal study.',
      'Abdominal ultrasound demonstrates mild hepatomegaly. No focal lesions identified.'
    );
  } else if (reportType === ReportType.ECG) {
    return fc.constantFrom(
      'Normal sinus rhythm at 72 bpm. No ST-T wave abnormalities.',
      'Sinus tachycardia at 110 bpm. Otherwise normal ECG.',
      'Atrial fibrillation with rapid ventricular response. Rate 140 bpm.',
      'ST elevation in leads II, III, aVF consistent with inferior wall MI.'
    );
  }
  
  // Generic report text if type not specified
  return fc.lorem({ maxCount: 5 });
};

/**
 * Generates a random diagnostic report
 */
export const arbitraryDiagnosticReport = (): fc.Arbitrary<DiagnosticReport> =>
  fc.tuple(
    fc.uuid(),
    arbitraryPatientId(),
    arbitraryReportType(),
    fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.anything()
      )
    )
  ).chain(([reportId, patientId, reportType, reportDate, metadata]) =>
    arbitraryReportText(reportType).map(text => ({
      reportId,
      patientId,
      reportType,
      reportDate,
      reportText: text,
      ...(metadata !== null ? { metadata } : {})
    }))
  );

/**
 * Generates a random finding
 */
export const arbitraryFinding = (): fc.Arbitrary<Finding> =>
  fc.record({
    reportType: arbitraryReportType(),
    reportDate: fc.date({ 
      min: new Date('2020-01-01'), 
      max: new Date() 
    }),
    findingName: fc.string({ minLength: 3, maxLength: 50 }),
    value: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
    normalRange: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    significance: arbitrarySignificance(),
    interpretation: fc.lorem({ maxCount: 3 })
  });

/**
 * Generates realistic findings based on report type
 */
export const arbitraryRealisticFinding = (reportType: ReportType): fc.Arbitrary<Finding> => {
  const baseDate = fc.date({ min: new Date('2020-01-01'), max: new Date() });
  
  if (reportType === ReportType.BLOOD_TEST) {
    return fc.record({
      reportType: fc.constant(ReportType.BLOOD_TEST),
      reportDate: baseDate,
      findingName: fc.constantFrom('Hemoglobin', 'Glucose', 'Cholesterol', 'Creatinine', 'WBC'),
      value: fc.constantFrom('12.5 g/dL', '105 mg/dL', '220 mg/dL', '1.2 mg/dL', '7.2 K/uL'),
      normalRange: fc.constantFrom('13.5-17.5 g/dL', '70-100 mg/dL', '<200 mg/dL', '0.7-1.3 mg/dL', '4.5-11.0 K/uL'),
      significance: arbitrarySignificance(),
      interpretation: fc.lorem({ maxCount: 2 })
    });
  } else if (reportType === ReportType.RADIOLOGY) {
    return fc.record({
      reportType: fc.constant(ReportType.RADIOLOGY),
      reportDate: baseDate,
      findingName: fc.constantFrom('Lung Mass', 'Hepatomegaly', 'Clear Lung Fields', 'Normal Study'),
      value: fc.option(fc.constantFrom('2.5 cm', 'Mild', 'None'), { nil: null }),
      normalRange: fc.constant(null),
      significance: arbitrarySignificance(),
      interpretation: fc.lorem({ maxCount: 3 })
    });
  } else {
    return fc.record({
      reportType: fc.constant(ReportType.ECG),
      reportDate: baseDate,
      findingName: fc.constantFrom('Heart Rate', 'Rhythm', 'ST Segment', 'QRS Duration'),
      value: fc.constantFrom('72 bpm', '110 bpm', 'Normal', 'Elevated', '90 ms'),
      normalRange: fc.constantFrom('60-100 bpm', 'Normal', 'Isoelectric', '80-120 ms'),
      significance: arbitrarySignificance(),
      interpretation: fc.lorem({ maxCount: 2 })
    });
  }
};

/**
 * Generates findings metadata
 */
export const arbitraryFindingsMetadata = (): fc.Arbitrary<FindingsMetadata> =>
  fc.record({
    totalReportsProcessed: fc.nat({ max: 100 }),
    processingTimeMs: fc.nat({ max: 10000 }),
    llmModelVersion: fc.constantFrom('medgemma-v1', 'medgemma-v1.5', 'medgemma-2b', 'medgemma-4b')
  });

/**
 * Generates structured findings
 */
export const arbitraryStructuredFindings = (): fc.Arbitrary<StructuredFindings> =>
  fc.record({
    patientId: arbitraryPatientId(),
    extractedAt: fc.date(),
    findings: fc.array(arbitraryFinding(), { minLength: 0, maxLength: 20 }),
    metadata: arbitraryFindingsMetadata()
  });

/**
 * Generates structured findings with realistic data
 */
export const arbitraryRealisticStructuredFindings = (): fc.Arbitrary<StructuredFindings> =>
  fc.record({
    patientId: arbitraryPatientId(),
    extractedAt: fc.date(),
    findings: fc.array(
      arbitraryReportType().chain(type => arbitraryRealisticFinding(type)),
      { minLength: 1, maxLength: 10 }
    ),
    metadata: arbitraryFindingsMetadata()
  });

/**
 * Generates an array of diagnostic reports for the same patient
 */
export const arbitraryPatientReports = (): fc.Arbitrary<{ patientId: string; reports: DiagnosticReport[] }> =>
  arbitraryPatientId().chain(patientId =>
    fc.array(arbitraryDiagnosticReport(), { minLength: 1, maxLength: 10 })
      .map(reports => ({
        patientId,
        reports: reports.map(r => ({ ...r, patientId }))
      }))
  );

/**
 * Generates invalid JSON strings for testing validation
 */
export const arbitraryInvalidJSON = (): fc.Arbitrary<string> =>
  fc.constantFrom(
    '{ invalid json',
    '{ "findings": [{ "missing": "fields" }] }',
    '{ "patientId": 123 }', // wrong type
    'not json at all',
    '{ "findings": "should be array" }',
    '{}', // missing required fields
    '{ "patientId": "", "findings": [], "metadata": {} }' // empty required fields
  );

/**
 * Generates valid JSON strings representing structured findings
 * Note: Dates are constrained to years 1000-9999 to comply with ISO 8601 date-time format
 * validation in AJV, which doesn't support extended year formats (+010000, etc.)
 */
export const arbitraryValidFindingsJSON = (): fc.Arbitrary<string> =>
  fc.record({
    patientId: arbitraryPatientId(),
    extractedAt: fc.date({ 
      min: new Date('1000-01-01T00:00:00.000Z'), 
      max: new Date('9999-12-31T23:59:59.999Z') 
    }),
    findings: fc.array(
      fc.record({
        reportType: arbitraryReportType(),
        reportDate: fc.date({ 
          min: new Date('1000-01-01T00:00:00.000Z'), 
          max: new Date('9999-12-31T23:59:59.999Z') 
        }),
        findingName: fc.string({ minLength: 3, maxLength: 50 }),
        value: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
        normalRange: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
        significance: arbitrarySignificance(),
        interpretation: fc.lorem({ maxCount: 3 })
      }),
      { minLength: 0, maxLength: 20 }
    ),
    metadata: arbitraryFindingsMetadata()
  }).map(findings => JSON.stringify({
    patientId: findings.patientId,
    extractedAt: findings.extractedAt.toISOString(),
    findings: findings.findings.map(f => ({
      ...f,
      reportDate: f.reportDate.toISOString()
    })),
    metadata: findings.metadata
  }));

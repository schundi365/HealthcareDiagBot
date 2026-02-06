/**
 * Patient Findings Display - Test Generators Validation
 * 
 * This test suite verifies that the property-based test generators
 * produce valid data that conforms to the system's type definitions.
 * 
 * Requirements: Testing infrastructure validation
 */

import * as fc from 'fast-check';
import {
  arbitraryPatientId,
  arbitraryReportType,
  arbitrarySignificance,
  arbitraryErrorCode,
  arbitraryDiagnosticReport,
  arbitraryFinding,
  arbitraryStructuredFindings,
  arbitraryPatientReports,
  arbitraryInvalidJSON,
  arbitraryValidFindingsJSON
} from '../../test/patient-findings-generators';

import {
  ReportType,
  Significance,
  ErrorCode
} from '../../types/patient-findings';

describe('Patient Findings Test Generators', () => {
  describe('arbitraryPatientId', () => {
    test('generates valid patient IDs', () => {
      fc.assert(
        fc.property(arbitraryPatientId(), (patientId) => {
          expect(typeof patientId).toBe('string');
          expect(patientId.length).toBeGreaterThanOrEqual(5);
          expect(patientId.length).toBeLessThanOrEqual(50);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryReportType', () => {
    test('generates valid report types', () => {
      fc.assert(
        fc.property(arbitraryReportType(), (reportType) => {
          expect(Object.values(ReportType)).toContain(reportType);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitrarySignificance', () => {
    test('generates valid significance levels', () => {
      fc.assert(
        fc.property(arbitrarySignificance(), (significance) => {
          expect(Object.values(Significance)).toContain(significance);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryErrorCode', () => {
    test('generates valid error codes', () => {
      fc.assert(
        fc.property(arbitraryErrorCode(), (errorCode) => {
          expect(Object.values(ErrorCode)).toContain(errorCode);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryDiagnosticReport', () => {
    test('generates valid diagnostic reports', () => {
      fc.assert(
        fc.property(arbitraryDiagnosticReport(), (report) => {
          expect(typeof report.reportId).toBe('string');
          expect(typeof report.patientId).toBe('string');
          expect(Object.values(ReportType)).toContain(report.reportType);
          expect(report.reportDate).toBeInstanceOf(Date);
          expect(typeof report.reportText).toBe('string');
          expect(report.reportText.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryFinding', () => {
    test('generates valid findings', () => {
      fc.assert(
        fc.property(arbitraryFinding(), (finding) => {
          expect(Object.values(ReportType)).toContain(finding.reportType);
          expect(finding.reportDate).toBeInstanceOf(Date);
          expect(typeof finding.findingName).toBe('string');
          expect(finding.findingName.length).toBeGreaterThanOrEqual(3);
          expect(Object.values(Significance)).toContain(finding.significance);
          expect(typeof finding.interpretation).toBe('string');
          
          // value and normalRange can be null or string
          if (finding.value !== null) {
            expect(typeof finding.value).toBe('string');
          }
          if (finding.normalRange !== null) {
            expect(typeof finding.normalRange).toBe('string');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryStructuredFindings', () => {
    test('generates valid structured findings', () => {
      fc.assert(
        fc.property(arbitraryStructuredFindings(), (findings) => {
          expect(typeof findings.patientId).toBe('string');
          expect(findings.extractedAt).toBeInstanceOf(Date);
          expect(Array.isArray(findings.findings)).toBe(true);
          expect(findings.findings.length).toBeLessThanOrEqual(20);
          
          expect(typeof findings.metadata.totalReportsProcessed).toBe('number');
          expect(findings.metadata.totalReportsProcessed).toBeGreaterThanOrEqual(0);
          expect(typeof findings.metadata.processingTimeMs).toBe('number');
          expect(findings.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
          expect(typeof findings.metadata.llmModelVersion).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryPatientReports', () => {
    test('generates reports for the same patient', () => {
      fc.assert(
        fc.property(arbitraryPatientReports(), ({ patientId, reports }) => {
          expect(typeof patientId).toBe('string');
          expect(Array.isArray(reports)).toBe(true);
          expect(reports.length).toBeGreaterThanOrEqual(1);
          expect(reports.length).toBeLessThanOrEqual(10);
          
          // All reports should have the same patient ID
          reports.forEach(report => {
            expect(report.patientId).toBe(patientId);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryInvalidJSON', () => {
    test('generates invalid JSON strings', () => {
      fc.assert(
        fc.property(arbitraryInvalidJSON(), (jsonString) => {
          expect(typeof jsonString).toBe('string');
          
          // Should either fail to parse or parse to invalid structure
          let isInvalid = false;
          try {
            const parsed = JSON.parse(jsonString);
            // Even if it parses, it should be missing required fields
            isInvalid = !parsed.patientId || !parsed.findings || !parsed.metadata;
          } catch (e) {
            // Failed to parse - that's what we want
            isInvalid = true;
          }
          
          expect(isInvalid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('arbitraryValidFindingsJSON', () => {
    test('generates valid JSON strings', () => {
      fc.assert(
        fc.property(arbitraryValidFindingsJSON(), (jsonString) => {
          expect(typeof jsonString).toBe('string');
          
          // Should parse successfully
          const parsed = JSON.parse(jsonString);
          
          expect(typeof parsed.patientId).toBe('string');
          expect(typeof parsed.extractedAt).toBe('string');
          expect(Array.isArray(parsed.findings)).toBe(true);
          expect(typeof parsed.metadata).toBe('object');
          expect(typeof parsed.metadata.totalReportsProcessed).toBe('number');
          expect(typeof parsed.metadata.processingTimeMs).toBe('number');
          expect(typeof parsed.metadata.llmModelVersion).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });
});

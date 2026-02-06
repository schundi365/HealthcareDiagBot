/**
 * Property-based tests for FindingsExtractorService
 * 
 * Feature: patient-findings-display
 * Tests universal properties that should hold across all valid inputs
 */

import * as fc from 'fast-check';
import { FindingsExtractorServiceImpl } from '../../services/patient-findings/findings-extractor-service';
import {
  DatabaseClient,
  MedGemmaClient,
  JSONValidator,
  DiagnosticReport,
  ReportType,
  ValidationResult,
  ErrorCode
} from '../../types/patient-findings';
import { FindingsError } from '../../services/patient-findings/errors';
import {
  arbitraryPatientId,
  arbitraryDiagnosticReport,
  arbitraryStructuredFindings
} from '../../test/patient-findings-generators';

// Mock implementations for property tests
class PropertyTestDatabaseClient implements DatabaseClient {
  constructor(private reports: DiagnosticReport[]) {}

  async getPatientReports(patientId: string): Promise<DiagnosticReport[]> {
    return this.reports.filter(r => r.patientId === patientId);
  }

  async getReportsByType(patientId: string, reportType: ReportType): Promise<DiagnosticReport[]> {
    return this.reports.filter(r => r.patientId === patientId && r.reportType === reportType);
  }
}

class PropertyTestMedGemmaClient implements MedGemmaClient {
  constructor(private response: string) {}

  async extractFindings(_reports: DiagnosticReport[]): Promise<string> {
    return this.response;
  }

  configure(): void {}
}

class PropertyTestJSONValidator implements JSONValidator {
  constructor(private result: ValidationResult) {}

  validate(_jsonString: string): ValidationResult {
    return this.result;
  }

  getSchema(): any {
    return {};
  }
}

describe('FindingsExtractorService - Property Tests', () => {
  describe('Property 11: Report Type Indication', () => {
    /**
     * Feature: patient-findings-display, Property 11: Report Type Indication
     * 
     * For any finding in the structured output, the reportType field should be 
     * present and indicate the source report type.
     * 
     * Validates: Requirements 7.5
     */
    test('all findings must have a valid reportType field', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPatientId(),
          fc.array(arbitraryDiagnosticReport(), { minLength: 1, maxLength: 10 }),
          arbitraryStructuredFindings(),
          async (patientId, reports, structuredFindings) => {
            // Setup: Ensure reports belong to the patient
            const patientReports = reports.map(r => ({ ...r, patientId }));

            // Setup: Ensure structured findings match the patient
            const findings = {
              ...structuredFindings,
              patientId,
              findings: structuredFindings.findings.map((f, idx) => ({
                ...f,
                // Ensure reportType matches one of the input reports
                reportType: patientReports[idx % patientReports.length]?.reportType || ReportType.BLOOD_TEST
              }))
            };

            const dbClient = new PropertyTestDatabaseClient(patientReports);
            const llmClient = new PropertyTestMedGemmaClient(JSON.stringify({ findings: [] }));
            const validator = new PropertyTestJSONValidator({
              isValid: true,
              data: findings
            });

            const service = new FindingsExtractorServiceImpl({
              databaseClient: dbClient,
              llmClient: llmClient,
              jsonValidator: validator
            });

            // Execute
            const result = await service.extractFindings(patientId);

            // Verify: All findings have a reportType field
            for (const finding of result.findings) {
              expect(finding.reportType).toBeDefined();
              expect(Object.values(ReportType)).toContain(finding.reportType);
            }

            // Verify: Each finding's reportType matches one of the input report types
            const inputReportTypes = new Set(patientReports.map(r => r.reportType));
            for (const finding of result.findings) {
              expect(inputReportTypes.has(finding.reportType)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Database Error Handling', () => {
    /**
     * Feature: patient-findings-display, Property 12: Database Error Handling
     * 
     * For any database query failure, the system should catch the error, 
     * return an error message, and not crash.
     * 
     * Validates: Requirements 8.1
     */
    test('database errors are caught and wrapped properly', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPatientId(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (patientId, errorMessage) => {
            // Setup: Database client that always fails
            class FailingDatabaseClient implements DatabaseClient {
              async getPatientReports(): Promise<DiagnosticReport[]> {
                throw new Error(errorMessage);
              }

              async getReportsByType(): Promise<DiagnosticReport[]> {
                throw new Error(errorMessage);
              }
            }

            const dbClient = new FailingDatabaseClient();
            const llmClient = new PropertyTestMedGemmaClient('{}');
            const validator = new PropertyTestJSONValidator({ isValid: true });

            const service = new FindingsExtractorServiceImpl({
              databaseClient: dbClient,
              llmClient: llmClient,
              jsonValidator: validator
            });

            // Execute & Verify: Should throw FindingsError, not crash
            try {
              await service.extractFindings(patientId);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify it's a FindingsError with DATABASE_ERROR code
              expect(error).toBeInstanceOf(FindingsError);
              expect((error as FindingsError).code).toBe(ErrorCode.DATABASE_ERROR);
              expect((error as FindingsError).message).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: LLM Error Handling', () => {
    /**
     * Feature: patient-findings-display, Property 13: LLM Error Handling
     * 
     * For any LLM processing failure, the system should catch the error, 
     * log it, and return a user-friendly error message.
     * 
     * Validates: Requirements 8.2
     */
    test('LLM errors are caught and wrapped properly', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPatientId(),
          fc.array(arbitraryDiagnosticReport(), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (patientId, reports, errorMessage) => {
            // Setup: Ensure reports belong to the patient
            const patientReports = reports.map(r => ({ ...r, patientId }));

            // Setup: LLM client that always fails
            class FailingLLMClient implements MedGemmaClient {
              async extractFindings(): Promise<string> {
                throw new Error(errorMessage);
              }

              configure(): void {}
            }

            const dbClient = new PropertyTestDatabaseClient(patientReports);
            const llmClient = new FailingLLMClient();
            const validator = new PropertyTestJSONValidator({ isValid: true });

            const service = new FindingsExtractorServiceImpl({
              databaseClient: dbClient,
              llmClient: llmClient,
              jsonValidator: validator
            });

            // Execute & Verify: Should throw FindingsError, not crash
            try {
              await service.extractFindings(patientId);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify it's a FindingsError with LLM_ERROR code
              expect(error).toBeInstanceOf(FindingsError);
              expect((error as FindingsError).code).toBe(ErrorCode.LLM_ERROR);
              expect((error as FindingsError).message).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Invalid JSON Handling', () => {
    /**
     * Feature: patient-findings-display, Property 14: Invalid JSON Handling
     * 
     * For any invalid JSON generated by the LLM, the validator should catch it 
     * and handle the error gracefully.
     * 
     * Validates: Requirements 8.3
     */
    test('validation errors are caught and wrapped properly', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPatientId(),
          fc.array(arbitraryDiagnosticReport(), { minLength: 1, maxLength: 5 }),
          fc.array(
            fc.record({
              path: fc.string({ minLength: 1, maxLength: 50 }),
              message: fc.string({ minLength: 1, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (patientId, reports, validationErrors) => {
            // Setup: Ensure reports belong to the patient
            const patientReports = reports.map(r => ({ ...r, patientId }));

            // Setup: Validator that always fails
            class FailingValidator implements JSONValidator {
              validate(): ValidationResult {
                return {
                  isValid: false,
                  errors: validationErrors
                };
              }

              getSchema(): any {
                return {};
              }
            }

            const dbClient = new PropertyTestDatabaseClient(patientReports);
            const llmClient = new PropertyTestMedGemmaClient('{"findings": []}');
            const validator = new FailingValidator();

            const service = new FindingsExtractorServiceImpl({
              databaseClient: dbClient,
              llmClient: llmClient,
              jsonValidator: validator
            });

            // Execute & Verify: Should throw FindingsError, not crash
            try {
              await service.extractFindings(patientId);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify it's a FindingsError with VALIDATION_ERROR code
              expect(error).toBeInstanceOf(FindingsError);
              expect((error as FindingsError).code).toBe(ErrorCode.VALIDATION_ERROR);
              expect((error as FindingsError).message).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Error Logging', () => {
    /**
     * Feature: patient-findings-display, Property 16: Error Logging
     * 
     * For any error that occurs in the system, the error should be logged 
     * with relevant details.
     * 
     * Validates: Requirements 8.5
     */
    test('all errors are logged with context', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPatientId(),
          fc.constantFrom('database', 'llm', 'validation'),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (patientId, errorType, errorMessage) => {
            // Setup: Spy on console.error to capture log output
            const originalConsoleError = console.error;
            const loggedErrors: any[] = [];
            console.error = jest.fn((...args: any[]) => {
              loggedErrors.push(args);
            });

            try {
              // Setup: Create clients that fail based on error type
              let dbClient: DatabaseClient;
              let llmClient: MedGemmaClient;
              let validator: JSONValidator;

              if (errorType === 'database') {
                // Database client that fails
                class FailingDatabaseClient implements DatabaseClient {
                  async getPatientReports(): Promise<DiagnosticReport[]> {
                    throw new Error(errorMessage);
                  }
                  async getReportsByType(): Promise<DiagnosticReport[]> {
                    throw new Error(errorMessage);
                  }
                }
                dbClient = new FailingDatabaseClient();
                llmClient = new PropertyTestMedGemmaClient('{}');
                validator = new PropertyTestJSONValidator({ isValid: true });
              } else if (errorType === 'llm') {
                // LLM client that fails
                class FailingLLMClient implements MedGemmaClient {
                  async extractFindings(): Promise<string> {
                    throw new Error(errorMessage);
                  }
                  configure(): void {}
                }
                dbClient = new PropertyTestDatabaseClient([]);
                llmClient = new FailingLLMClient();
                validator = new PropertyTestJSONValidator({ isValid: true });
              } else {
                // Validator that fails
                class FailingValidator implements JSONValidator {
                  validate(): ValidationResult {
                    return {
                      isValid: false,
                      errors: [{ path: 'test', message: errorMessage }]
                    };
                  }
                  getSchema(): any {
                    return {};
                  }
                }
                dbClient = new PropertyTestDatabaseClient([{
                  reportId: 'test-1',
                  patientId,
                  reportType: ReportType.BLOOD_TEST,
                  reportDate: new Date(),
                  reportText: 'test report'
                }]);
                llmClient = new PropertyTestMedGemmaClient('{"findings": []}');
                validator = new FailingValidator();
              }

              const service = new FindingsExtractorServiceImpl({
                databaseClient: dbClient,
                llmClient: llmClient,
                jsonValidator: validator
              });

              // Execute: Trigger error
              try {
                await service.extractFindings(patientId);
                // Should not reach here
                expect(true).toBe(false);
              } catch (error) {
                // Error is expected
              }

              // Verify: Error was logged
              expect(loggedErrors.length).toBeGreaterThan(0);

              // Verify: Log contains FindingsError marker
              const hasErrorLog = loggedErrors.some(args => 
                args.some((arg: any) => 
                  typeof arg === 'string' && arg.includes('[FindingsError]')
                )
              );
              expect(hasErrorLog).toBe(true);

              // Verify: Log contains patient ID context
              const logString = JSON.stringify(loggedErrors);
              expect(logString).toContain(patientId);

              // Verify: Log contains error code
              const expectedCode = errorType === 'database' 
                ? ErrorCode.DATABASE_ERROR 
                : errorType === 'llm' 
                  ? ErrorCode.LLM_ERROR 
                  : ErrorCode.VALIDATION_ERROR;
              expect(logString).toContain(expectedCode);

            } finally {
              // Restore console.error
              console.error = originalConsoleError;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

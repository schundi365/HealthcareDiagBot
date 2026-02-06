/**
 * Patient Findings Display - Findings Extractor Service
 * 
 * This module implements the FindingsExtractorService that orchestrates
 * the complete pipeline: Database → LLM → JSON Validation → Structured Findings
 * 
 * Requirements: 1.1, 2.2, 3.1, 3.3, 8.1, 8.2, 8.3, 8.5
 */

import {
  FindingsExtractorService as IFindingsExtractorService,
  FindingsExtractorConfig,
  StructuredFindings,
  DatabaseClient,
  MedGemmaClient,
  JSONValidator,
  DiagnosticReport,
  ReportType
} from '../../types/patient-findings';
import {
  createDatabaseError,
  createLLMError,
  createValidationError,
  createInvalidPatientIdError,
  logError,
  wrapError,
  isFindingsError
} from './errors';

/**
 * Implementation of the Findings Extractor Service
 * 
 * This service orchestrates the complete findings extraction pipeline:
 * 1. Query database for patient reports
 * 2. Process reports through MedGemma LLM
 * 3. Validate JSON output
 * 4. Return structured findings
 * 
 * Each step includes comprehensive error handling and logging.
 */
export class FindingsExtractorServiceImpl implements IFindingsExtractorService {
  private databaseClient: DatabaseClient;
  private llmClient: MedGemmaClient;
  private jsonValidator: JSONValidator;

  /**
   * Creates a new Findings Extractor Service
   * 
   * @param config - Configuration containing database, LLM, and validator clients
   */
  constructor(config: FindingsExtractorConfig) {
    this.databaseClient = config.databaseClient;
    this.llmClient = config.llmClient;
    this.jsonValidator = config.jsonValidator;
  }

  /**
   * Extracts findings for a patient by orchestrating the complete pipeline
   * 
   * Pipeline steps:
   * 1. Validate patient ID
   * 2. Query database for diagnostic reports
   * 3. Process reports through MedGemma LLM
   * 4. Validate JSON output
   * 5. Organize findings by report type
   * 6. Return structured findings
   * 
   * @param patientId - The unique identifier for the patient
   * @returns StructuredFindings containing all extracted findings
   * @throws FindingsError with appropriate error code if any step fails
   * 
   * Requirements: 1.1, 2.2, 3.1, 3.3
   */
  async extractFindings(patientId: string): Promise<StructuredFindings> {
    const startTime = Date.now();

    // Step 1: Validate patient ID
    if (!patientId || typeof patientId !== 'string' || patientId.trim().length === 0) {
      const error = createInvalidPatientIdError(patientId);
      logError(error, { operation: 'extractFindings', step: 'validation' });
      throw error;
    }

    try {
      // Step 2: Query database for patient reports
      const reports = await this.queryDatabaseForReports(patientId);

      // Step 3: Process reports through LLM
      const jsonString = await this.processReportsWithLLM(reports, patientId);

      // Step 4: Validate JSON output
      const structuredFindings = await this.validateAndParseJSON(jsonString, patientId);

      // Step 5: Organize findings by report type
      const organizedFindings = this.organizeFindingsByType(structuredFindings);

      // Step 6: Add metadata and return
      const processingTimeMs = Date.now() - startTime;
      
      return {
        ...organizedFindings,
        patientId,
        extractedAt: new Date(),
        metadata: {
          ...organizedFindings.metadata,
          processingTimeMs
        }
      };
    } catch (error) {
      // Comprehensive error handling - catch and wrap all errors
      // Requirements: 8.1, 8.2, 8.3, 8.5
      
      if (isFindingsError(error)) {
        // Already a FindingsError, just log and rethrow
        logError(error, { patientId, operation: 'extractFindings' });
        throw error;
      }

      // Wrap unknown errors
      const wrappedError = wrapError(error);
      logError(wrappedError, { patientId, operation: 'extractFindings' });
      throw wrappedError;
    }
  }

  /**
   * Step 2: Query database for patient reports
   * 
   * Handles database errors and empty result sets
   * 
   * @param patientId - Patient identifier
   * @returns Array of diagnostic reports
   * @throws FindingsError with DATABASE_ERROR code if query fails
   * 
   * Requirements: 1.1, 8.1
   */
  private async queryDatabaseForReports(patientId: string): Promise<DiagnosticReport[]> {
    try {
      const reports = await this.databaseClient.getPatientReports(patientId);

      // Note: Empty reports array is NOT an error condition
      // The LLM will handle empty arrays gracefully
      return reports;
    } catch (error) {
      // Catch and wrap database errors
      // Requirements: 8.1
      
      if (isFindingsError(error)) {
        // Already wrapped by database client
        throw error;
      }

      const dbError = createDatabaseError(
        `Failed to retrieve reports for patient: ${patientId}`,
        error instanceof Error ? error : undefined
      );
      logError(dbError, { patientId, operation: 'queryDatabaseForReports' });
      throw dbError;
    }
  }

  /**
   * Step 3: Process reports through MedGemma LLM
   * 
   * Handles LLM errors including API failures, timeouts, and malformed responses
   * 
   * @param reports - Diagnostic reports to process
   * @param patientId - Patient identifier (for logging)
   * @returns JSON string from LLM
   * @throws FindingsError with LLM_ERROR code if processing fails
   * 
   * Requirements: 2.2, 8.2
   */
  private async processReportsWithLLM(reports: DiagnosticReport[], patientId: string): Promise<string> {
    try {
      const jsonString = await this.llmClient.extractFindings(reports);
      return jsonString;
    } catch (error) {
      // Catch and wrap LLM errors
      // Requirements: 8.2
      
      if (isFindingsError(error)) {
        // Already wrapped by LLM client
        throw error;
      }

      const llmError = createLLMError(
        `Failed to process reports with LLM for patient: ${patientId}`,
        error instanceof Error ? error : undefined
      );
      logError(llmError, { 
        patientId, 
        reportCount: reports.length,
        operation: 'processReportsWithLLM' 
      });
      throw llmError;
    }
  }

  /**
   * Step 4: Validate and parse JSON output from LLM
   * 
   * Handles validation errors and invalid JSON
   * 
   * @param jsonString - JSON string from LLM
   * @param patientId - Patient identifier (for logging)
   * @returns Parsed and validated StructuredFindings
   * @throws FindingsError with VALIDATION_ERROR code if validation fails
   * 
   * Requirements: 3.1, 8.3
   */
  private async validateAndParseJSON(jsonString: string, patientId: string): Promise<StructuredFindings> {
    try {
      const validationResult = this.jsonValidator.validate(jsonString);

      if (!validationResult.isValid) {
        // Validation failed - create detailed error
        const error = createValidationError(
          `JSON validation failed for patient: ${patientId}`,
          validationResult.errors
        );
        logError(error, { 
          patientId, 
          validationErrors: validationResult.errors,
          operation: 'validateAndParseJSON' 
        });
        throw error;
      }

      if (!validationResult.data) {
        // Should not happen if isValid is true, but handle defensively
        const error = createValidationError(
          `Validation succeeded but no data returned for patient: ${patientId}`
        );
        logError(error, { patientId, operation: 'validateAndParseJSON' });
        throw error;
      }

      return validationResult.data;
    } catch (error) {
      // Catch and wrap validation errors
      // Requirements: 8.3
      
      if (isFindingsError(error)) {
        // Already wrapped above
        throw error;
      }

      const validationError = createValidationError(
        `Failed to validate JSON for patient: ${patientId}`,
        [{ path: 'unknown', message: error instanceof Error ? error.message : 'Unknown error' }]
      );
      logError(validationError, { patientId, operation: 'validateAndParseJSON' });
      throw validationError;
    }
  }

  /**
   * Step 5: Organize findings by report type
   * 
   * Sorts findings so they are grouped by report type for better display
   * 
   * @param findings - Structured findings to organize
   * @returns Organized structured findings
   * 
   * Requirements: 3.3
   */
  private organizeFindingsByType(findings: StructuredFindings): StructuredFindings {
    // Sort findings by report type, then by report date
    const sortedFindings = [...findings.findings].sort((a, b) => {
      // First sort by report type
      if (a.reportType !== b.reportType) {
        // Define sort order: blood_test, radiology, ecg
        const typeOrder = {
          [ReportType.BLOOD_TEST]: 0,
          [ReportType.RADIOLOGY]: 1,
          [ReportType.ECG]: 2
        };
        return typeOrder[a.reportType] - typeOrder[b.reportType];
      }

      // Then sort by report date (newest first)
      return b.reportDate.getTime() - a.reportDate.getTime();
    });

    return {
      ...findings,
      findings: sortedFindings
    };
  }

  /**
   * Gets the database client (for testing)
   */
  getDatabaseClient(): DatabaseClient {
    return this.databaseClient;
  }

  /**
   * Gets the LLM client (for testing)
   */
  getLLMClient(): MedGemmaClient {
    return this.llmClient;
  }

  /**
   * Gets the JSON validator (for testing)
   */
  getJSONValidator(): JSONValidator {
    return this.jsonValidator;
  }
}

/**
 * Factory function to create a configured Findings Extractor Service
 * 
 * @param config - Configuration containing database, LLM, and validator clients
 * @returns Configured FindingsExtractorServiceImpl instance
 */
export function createFindingsExtractorService(
  config: FindingsExtractorConfig
): IFindingsExtractorService {
  return new FindingsExtractorServiceImpl(config);
}

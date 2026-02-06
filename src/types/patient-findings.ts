/**
 * Patient Findings Display - Core Type Definitions
 * 
 * This module defines all TypeScript interfaces and types for the Patient Findings Display system.
 * The system follows a simple pipeline: Database → MedGemma LLM → JSON Validation → Display Component
 * 
 * Requirements: 1.1, 2.1, 3.1, 5.1
 */

/**
 * Enum representing the types of diagnostic reports supported by the system
 */
export enum ReportType {
  BLOOD_TEST = 'blood_test',
  RADIOLOGY = 'radiology',
  ECG = 'ecg'
}

/**
 * Enum representing the clinical significance of a finding
 */
export enum Significance {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  CRITICAL = 'critical'
}

/**
 * Enum representing error codes for the findings extraction system
 */
export enum ErrorCode {
  DATABASE_ERROR = 'DATABASE_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NO_REPORTS_FOUND = 'NO_REPORTS_FOUND',
  INVALID_PATIENT_ID = 'INVALID_PATIENT_ID'
}

/**
 * Represents a diagnostic report stored in the database
 */
export interface DiagnosticReport {
  reportId: string;
  patientId: string;
  reportType: ReportType;
  reportDate: Date;
  reportText: string;
  metadata?: Record<string, any>;
}

/**
 * Represents a single medical finding extracted from a diagnostic report
 */
export interface Finding {
  reportType: ReportType;
  reportDate: Date;
  findingName: string;
  value: string | null;
  normalRange: string | null;
  significance: Significance;
  interpretation: string;
}

/**
 * Metadata about the findings extraction process
 */
export interface FindingsMetadata {
  totalReportsProcessed: number;
  processingTimeMs: number;
  llmModelVersion: string;
}

/**
 * Complete structured findings output from the extraction process
 */
export interface StructuredFindings {
  patientId: string;
  extractedAt: Date;
  findings: Finding[];
  metadata: FindingsMetadata;
}

/**
 * Custom error type for findings extraction failures
 */
export interface FindingsError extends Error {
  code: ErrorCode;
  details?: any;
}

/**
 * Configuration for the MedGemma LLM client
 */
export interface LLMConfig {
  modelVersion: string;
  temperature: number;
  maxTokens: number;
  apiEndpoint: string;
  apiKey: string;
}

/**
 * Result of JSON schema validation
 */
export interface ValidationResult {
  isValid: boolean;
  data?: StructuredFindings;
  errors?: ValidationError[];
}

/**
 * Represents a validation error with path and message
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Props for the Findings Display Component
 */
export interface FindingsDisplayProps {
  patientId: string;
  onError?: (error: Error) => void;
  onLoad?: (findings: StructuredFindings) => void;
  className?: string;
}

/**
 * Configuration for the Findings Extractor Service
 */
export interface FindingsExtractorConfig {
  databaseClient: DatabaseClient;
  llmClient: MedGemmaClient;
  jsonValidator: JSONValidator;
}

/**
 * Interface for database client operations
 */
export interface DatabaseClient {
  getPatientReports(patientId: string): Promise<DiagnosticReport[]>;
  getReportsByType(patientId: string, reportType: ReportType): Promise<DiagnosticReport[]>;
}

/**
 * Interface for MedGemma LLM client operations
 */
export interface MedGemmaClient {
  extractFindings(reports: DiagnosticReport[]): Promise<string>;
  configure(config: LLMConfig): void;
}

/**
 * Interface for JSON validation operations
 */
export interface JSONValidator {
  validate(jsonString: string): ValidationResult;
  getSchema(): any;
}

/**
 * Interface for the Findings Extractor Service
 */
export interface FindingsExtractorService {
  extractFindings(patientId: string): Promise<StructuredFindings>;
}

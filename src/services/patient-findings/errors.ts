/**
 * Patient Findings Display - Error Handling Utilities
 * 
 * This module provides error classes and utilities for handling errors
 * throughout the findings extraction pipeline.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { ErrorCode, FindingsError as IFindingsError } from '../../types/patient-findings';

/**
 * Custom error class for findings extraction failures
 * Extends the standard Error class with additional context
 */
export class FindingsError extends Error implements IFindingsError {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'FindingsError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FindingsError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Creates a database error with appropriate context
 */
export function createDatabaseError(message: string, originalError?: Error): FindingsError {
  return new FindingsError(
    ErrorCode.DATABASE_ERROR,
    message,
    {
      originalError: originalError?.message,
      stack: originalError?.stack
    }
  );
}

/**
 * Creates an LLM processing error with appropriate context
 */
export function createLLMError(message: string, originalError?: Error): FindingsError {
  return new FindingsError(
    ErrorCode.LLM_ERROR,
    message,
    {
      originalError: originalError?.message,
      stack: originalError?.stack
    }
  );
}

/**
 * Creates a validation error with appropriate context
 */
export function createValidationError(message: string, validationErrors?: any[]): FindingsError {
  return new FindingsError(
    ErrorCode.VALIDATION_ERROR,
    message,
    {
      validationErrors
    }
  );
}

/**
 * Creates a no reports found error
 */
export function createNoReportsError(patientId: string): FindingsError {
  return new FindingsError(
    ErrorCode.NO_REPORTS_FOUND,
    `No diagnostic reports found for patient: ${patientId}`,
    { patientId }
  );
}

/**
 * Creates an invalid patient ID error
 */
export function createInvalidPatientIdError(patientId: string): FindingsError {
  return new FindingsError(
    ErrorCode.INVALID_PATIENT_ID,
    `Invalid patient ID format: ${patientId}`,
    { patientId }
  );
}

/**
 * Logs an error with appropriate context
 * In production, this would integrate with a logging service
 */
export function logError(error: FindingsError, context?: Record<string, any>): void {
  const logEntry = {
    timestamp: error.timestamp,
    code: error.code,
    message: error.message,
    details: error.details,
    context,
    stack: error.stack
  };

  // In production, send to logging service (e.g., Cloud Logging, Sentry)
  console.error('[FindingsError]', JSON.stringify(logEntry, null, 2));
}

/**
 * Determines if an error is a FindingsError
 */
export function isFindingsError(error: any): error is FindingsError {
  return error instanceof FindingsError || (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    Object.values(ErrorCode).includes(error.code)
  );
}

/**
 * Wraps an unknown error into a FindingsError
 */
export function wrapError(error: unknown, defaultCode: ErrorCode = ErrorCode.LLM_ERROR): FindingsError {
  if (isFindingsError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new FindingsError(defaultCode, error.message, { originalError: error });
  }

  return new FindingsError(
    defaultCode,
    'An unknown error occurred',
    { originalError: String(error) }
  );
}

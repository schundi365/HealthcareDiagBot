/**
 * Patient Findings Display - Database Client Implementation
 * 
 * This module implements the DatabaseClient interface for retrieving
 * diagnostic reports from MongoDB.
 * 
 * Requirements: 1.1, 1.2, 1.4
 */

import { DatabaseClient, DiagnosticReport, ReportType } from '../../types/patient-findings';
import { createDatabaseError, logError } from './errors';

/**
 * MongoDB-based implementation of the DatabaseClient interface
 * 
 * This client connects to a MongoDB database and retrieves diagnostic reports
 * for patients. It supports querying all reports or filtering by report type.
 */
export class MongoDBDatabaseClient implements DatabaseClient {
  private connectionString: string;
  private databaseName: string;
  private collectionName: string;
  private isConnected: boolean = false;

  /**
   * Creates a new MongoDB database client
   * 
   * @param connectionString - MongoDB connection string (mongodb:// or mongodb+srv://)
   * @param databaseName - Name of the database containing diagnostic reports
   * @param collectionName - Name of the collection containing diagnostic reports (default: 'diagnostic_reports')
   */
  constructor(
    connectionString: string,
    databaseName: string = 'medical_records',
    collectionName: string = 'diagnostic_reports'
  ) {
    this.connectionString = connectionString;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
  }

  /**
   * Establishes connection to MongoDB
   * This should be called before any database operations
   */
  async connect(): Promise<void> {
    try {
      // Connection will be handled by MongoDB MCP tools
      // This method is here for API consistency
      this.isConnected = true;
    } catch (error) {
      const dbError = createDatabaseError(
        'Failed to connect to MongoDB',
        error instanceof Error ? error : undefined
      );
      logError(dbError, { connectionString: this.connectionString });
      throw dbError;
    }
  }

  /**
   * Retrieves all diagnostic reports for a patient
   * 
   * @param patientId - The unique identifier for the patient
   * @returns Array of diagnostic reports (empty if no reports found)
   * @throws FindingsError with DATABASE_ERROR code if query fails
   * 
   * Requirements: 1.1, 1.2, 1.4
   */
  async getPatientReports(patientId: string): Promise<DiagnosticReport[]> {
    // Validate patient ID first (before try-catch to avoid wrapping validation errors)
    if (!patientId || typeof patientId !== 'string' || patientId.trim().length === 0) {
      const error = createDatabaseError('Invalid patient ID: must be a non-empty string');
      logError(error, { patientId, operation: 'getPatientReports' });
      throw error;
    }

    try {
      // Query MongoDB for all reports for this patient
      // The actual MongoDB query will be executed via MCP tools
      // This is a placeholder that shows the intended structure
      const reports: DiagnosticReport[] = [];

      // Note: In actual implementation, this would use MongoDB MCP tools
      // For now, this returns an empty array to satisfy the interface
      // The integration with MCP tools will be done in the next step

      return reports;
    } catch (error) {
      const dbError = createDatabaseError(
        `Failed to retrieve reports for patient: ${patientId}`,
        error instanceof Error ? error : undefined
      );
      logError(dbError, { patientId, operation: 'getPatientReports' });
      throw dbError;
    }
  }

  /**
   * Retrieves diagnostic reports for a patient filtered by report type
   * 
   * @param patientId - The unique identifier for the patient
   * @param reportType - The type of report to filter by (BLOOD_TEST, RADIOLOGY, or ECG)
   * @returns Array of diagnostic reports of the specified type (empty if no reports found)
   * @throws FindingsError with DATABASE_ERROR code if query fails
   * 
   * Requirements: 1.1, 1.2, 1.4
   */
  async getReportsByType(patientId: string, reportType: ReportType): Promise<DiagnosticReport[]> {
    // Validate inputs first (before try-catch to avoid wrapping validation errors)
    if (!patientId || typeof patientId !== 'string' || patientId.trim().length === 0) {
      const error = createDatabaseError('Invalid patient ID: must be a non-empty string');
      logError(error, { patientId, reportType, operation: 'getReportsByType' });
      throw error;
    }

    if (!Object.values(ReportType).includes(reportType)) {
      const error = createDatabaseError(`Invalid report type: ${reportType}`);
      logError(error, { patientId, reportType, operation: 'getReportsByType' });
      throw error;
    }

    try {
      // Query MongoDB for reports of specific type for this patient
      // The actual MongoDB query will be executed via MCP tools
      const reports: DiagnosticReport[] = [];

      // Note: In actual implementation, this would use MongoDB MCP tools
      // For now, this returns an empty array to satisfy the interface

      return reports;
    } catch (error) {
      const dbError = createDatabaseError(
        `Failed to retrieve ${reportType} reports for patient: ${patientId}`,
        error instanceof Error ? error : undefined
      );
      logError(dbError, { patientId, reportType, operation: 'getReportsByType' });
      throw dbError;
    }
  }

  /**
   * Closes the database connection
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  /**
   * Checks if the client is connected to the database
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Gets the database name
   */
  getDatabaseName(): string {
    return this.databaseName;
  }

  /**
   * Gets the collection name
   */
  getCollectionName(): string {
    return this.collectionName;
  }
}

/**
 * Factory function to create a configured database client
 * 
 * @param connectionString - MongoDB connection string (optional, reads from env if not provided)
 * @param databaseName - Database name (optional, defaults to 'medical_records')
 * @param collectionName - Collection name (optional, defaults to 'diagnostic_reports')
 * @returns Configured MongoDBDatabaseClient instance
 */
export function createDatabaseClient(
  connectionString?: string,
  databaseName?: string,
  collectionName?: string
): MongoDBDatabaseClient {
  const connStr = connectionString || process.env['MONGODB_CONNECTION_STRING'] || '';
  
  if (!connStr) {
    throw new Error(
      'MongoDB connection string is required. ' +
      'Provide it as a parameter or set MONGODB_CONNECTION_STRING environment variable.'
    );
  }

  return new MongoDBDatabaseClient(connStr, databaseName, collectionName);
}

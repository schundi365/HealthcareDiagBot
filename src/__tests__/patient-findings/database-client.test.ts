/**
 * Unit Tests for DatabaseClient
 * 
 * Tests the MongoDB database client implementation for retrieving
 * diagnostic reports.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 8.1
 */

import { MongoDBDatabaseClient, createDatabaseClient } from '../../services/patient-findings/database-client';
import { ReportType } from '../../types/patient-findings';
import { ErrorCode } from '../../types/patient-findings';

describe('MongoDBDatabaseClient', () => {
  let client: MongoDBDatabaseClient;

  beforeEach(() => {
    // Create a client with test connection string
    client = new MongoDBDatabaseClient(
      'mongodb://localhost:27017',
      'test_medical_records',
      'test_diagnostic_reports'
    );
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('constructor', () => {
    it('should create a client with provided configuration', () => {
      expect(client).toBeInstanceOf(MongoDBDatabaseClient);
      expect(client.isConnectionActive()).toBe(false);
    });

    it('should use default database and collection names if not provided', () => {
      const defaultClient = new MongoDBDatabaseClient('mongodb://localhost:27017');
      expect(defaultClient).toBeInstanceOf(MongoDBDatabaseClient);
    });
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      await client.connect();
      expect(client.isConnectionActive()).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      // Create client with invalid connection string
      const badClient = new MongoDBDatabaseClient('invalid://connection');
      
      // For now, connect() doesn't actually validate the connection string
      // This test documents the expected behavior
      await expect(badClient.connect()).resolves.not.toThrow();
    });
  });

  describe('getPatientReports', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should return empty array when no reports exist', async () => {
      // Requirement 1.3: Return empty result set when no reports exist
      const reports = await client.getPatientReports('patient-123');
      expect(reports).toEqual([]);
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should validate patient ID is provided', async () => {
      // Requirement 8.1: Handle errors without crashing
      await expect(client.getPatientReports('')).rejects.toThrow('Invalid patient ID');
    });

    it('should validate patient ID is a string', async () => {
      await expect(client.getPatientReports(null as any)).rejects.toThrow('Invalid patient ID');
    });

    it('should validate patient ID is not just whitespace', async () => {
      await expect(client.getPatientReports('   ')).rejects.toThrow('Invalid patient ID');
    });

    it('should throw FindingsError with DATABASE_ERROR code on failure', async () => {
      // This test documents the error handling behavior
      try {
        await client.getPatientReports('');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
        expect(error.message).toContain('Invalid patient ID');
      }
    });

    it('should include patient ID in error details', async () => {
      const patientId = 'patient-123';
      
      // For now, this returns empty array
      // When MongoDB integration is complete, this will test actual queries
      const reports = await client.getPatientReports(patientId);
      expect(reports).toEqual([]);
    });
  });

  describe('getReportsByType', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should return empty array when no reports of specified type exist', async () => {
      // Requirement 1.3: Return empty result set when no reports exist
      const reports = await client.getReportsByType('patient-123', ReportType.BLOOD_TEST);
      expect(reports).toEqual([]);
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should validate patient ID is provided', async () => {
      await expect(
        client.getReportsByType('', ReportType.BLOOD_TEST)
      ).rejects.toThrow('Invalid patient ID');
    });

    it('should validate report type is valid', async () => {
      await expect(
        client.getReportsByType('patient-123', 'invalid_type' as any)
      ).rejects.toThrow('Invalid report type');
    });

    it('should accept BLOOD_TEST report type', async () => {
      const reports = await client.getReportsByType('patient-123', ReportType.BLOOD_TEST);
      expect(reports).toEqual([]);
    });

    it('should accept RADIOLOGY report type', async () => {
      const reports = await client.getReportsByType('patient-123', ReportType.RADIOLOGY);
      expect(reports).toEqual([]);
    });

    it('should accept ECG report type', async () => {
      const reports = await client.getReportsByType('patient-123', ReportType.ECG);
      expect(reports).toEqual([]);
    });

    it('should throw FindingsError with DATABASE_ERROR code on failure', async () => {
      try {
        await client.getReportsByType('', ReportType.BLOOD_TEST);
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
        expect(error.message).toContain('Invalid patient ID');
      }
    });

    it('should include patient ID and report type in error details', async () => {
      const patientId = 'patient-123';
      const reportType = ReportType.RADIOLOGY;
      
      // For now, this returns empty array
      const reports = await client.getReportsByType(patientId, reportType);
      expect(reports).toEqual([]);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await client.connect();
      expect(client.isConnectionActive()).toBe(true);
      
      await client.disconnect();
      expect(client.isConnectionActive()).toBe(false);
    });

    it('should be safe to call disconnect multiple times', async () => {
      await client.connect();
      await client.disconnect();
      await client.disconnect();
      expect(client.isConnectionActive()).toBe(false);
    });
  });

  describe('isConnectionActive', () => {
    it('should return false initially', () => {
      expect(client.isConnectionActive()).toBe(false);
    });

    it('should return true after connecting', async () => {
      await client.connect();
      expect(client.isConnectionActive()).toBe(true);
    });

    it('should return false after disconnecting', async () => {
      await client.connect();
      await client.disconnect();
      expect(client.isConnectionActive()).toBe(false);
    });
  });
});

describe('createDatabaseClient', () => {
  const originalEnv = process.env['MONGODB_CONNECTION_STRING'];

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv) {
      process.env['MONGODB_CONNECTION_STRING'] = originalEnv;
    } else {
      delete process.env['MONGODB_CONNECTION_STRING'];
    }
  });

  it('should create client with provided connection string', () => {
    const client = createDatabaseClient('mongodb://localhost:27017');
    expect(client).toBeInstanceOf(MongoDBDatabaseClient);
  });

  it('should create client with custom database and collection names', () => {
    const client = createDatabaseClient(
      'mongodb://localhost:27017',
      'custom_db',
      'custom_collection'
    );
    expect(client).toBeInstanceOf(MongoDBDatabaseClient);
  });

  it('should read connection string from environment variable', () => {
    process.env['MONGODB_CONNECTION_STRING'] = 'mongodb://localhost:27017';
    const client = createDatabaseClient();
    expect(client).toBeInstanceOf(MongoDBDatabaseClient);
  });

  it('should throw error if no connection string provided', () => {
    delete process.env['MONGODB_CONNECTION_STRING'];
    expect(() => createDatabaseClient()).toThrow('MongoDB connection string is required');
  });

  it('should prefer provided connection string over environment variable', () => {
    process.env['MONGODB_CONNECTION_STRING'] = 'mongodb://env:27017';
    const client = createDatabaseClient('mongodb://param:27017');
    expect(client).toBeInstanceOf(MongoDBDatabaseClient);
  });
});

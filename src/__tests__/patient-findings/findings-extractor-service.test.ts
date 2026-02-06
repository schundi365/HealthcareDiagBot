/**
 * Unit tests for FindingsExtractorService
 * 
 * Tests the orchestration of the complete pipeline:
 * Database → LLM → JSON Validation → Structured Findings
 */

import { FindingsExtractorServiceImpl } from '../../services/patient-findings/findings-extractor-service';
import {
  DatabaseClient,
  MedGemmaClient,
  JSONValidator,
  DiagnosticReport,
  ReportType,
  Significance,
  StructuredFindings,
  ValidationResult,
  ErrorCode
} from '../../types/patient-findings';
import { FindingsError } from '../../services/patient-findings/errors';

// Mock implementations
class MockDatabaseClient implements DatabaseClient {
  private mockReports: DiagnosticReport[] = [];
  private shouldFail: boolean = false;

  setMockReports(reports: DiagnosticReport[]) {
    this.mockReports = reports;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  async getPatientReports(patientId: string): Promise<DiagnosticReport[]> {
    if (this.shouldFail) {
      throw new FindingsError(ErrorCode.DATABASE_ERROR, 'Database connection failed');
    }
    return this.mockReports.filter(r => r.patientId === patientId);
  }

  async getReportsByType(patientId: string, reportType: ReportType): Promise<DiagnosticReport[]> {
    if (this.shouldFail) {
      throw new FindingsError(ErrorCode.DATABASE_ERROR, 'Database connection failed');
    }
    return this.mockReports.filter(r => r.patientId === patientId && r.reportType === reportType);
  }
}

class MockMedGemmaClient implements MedGemmaClient {
  private mockResponse: string = '';
  private shouldFail: boolean = false;

  setMockResponse(response: string) {
    this.mockResponse = response;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  async extractFindings(_reports: DiagnosticReport[]): Promise<string> {
    if (this.shouldFail) {
      throw new FindingsError(ErrorCode.LLM_ERROR, 'LLM API call failed');
    }
    return this.mockResponse;
  }

  configure(): void {
    // Mock implementation
  }
}

class MockJSONValidator implements JSONValidator {
  private mockResult: ValidationResult = { isValid: true };
  private shouldFail: boolean = false;

  setMockResult(result: ValidationResult) {
    this.mockResult = result;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  validate(_jsonString: string): ValidationResult {
    if (this.shouldFail) {
      throw new Error('Validation error');
    }
    return this.mockResult;
  }

  getSchema(): any {
    return {};
  }
}

describe('FindingsExtractorService', () => {
  let service: FindingsExtractorServiceImpl;
  let mockDb: MockDatabaseClient;
  let mockLLM: MockMedGemmaClient;
  let mockValidator: MockJSONValidator;

  beforeEach(() => {
    mockDb = new MockDatabaseClient();
    mockLLM = new MockMedGemmaClient();
    mockValidator = new MockJSONValidator();

    service = new FindingsExtractorServiceImpl({
      databaseClient: mockDb,
      llmClient: mockLLM,
      jsonValidator: mockValidator
    });
  });

  describe('extractFindings - successful extraction', () => {
    test('should extract findings for patient with blood test report', async () => {
      // Setup
      const patientId = 'patient-123';
      const bloodReport: DiagnosticReport = {
        reportId: 'report-1',
        patientId,
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date('2024-01-15'),
        reportText: 'Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5)'
      };

      mockDb.setMockReports([bloodReport]);

      const llmResponse = JSON.stringify({
        findings: [{
          reportType: 'blood_test',
          reportDate: '2024-01-15T00:00:00.000Z',
          findingName: 'Hemoglobin',
          value: '12.5 g/dL',
          normalRange: '13.5-17.5 g/dL',
          significance: 'abnormal',
          interpretation: 'Below normal range'
        }]
      });

      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [{
          reportType: ReportType.BLOOD_TEST,
          reportDate: new Date('2024-01-15'),
          findingName: 'Hemoglobin',
          value: '12.5 g/dL',
          normalRange: '13.5-17.5 g/dL',
          significance: Significance.ABNORMAL,
          interpretation: 'Below normal range'
        }],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 250,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify
      expect(result.patientId).toBe(patientId);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.findingName).toBe('Hemoglobin');
      expect(result.findings[0]?.significance).toBe(Significance.ABNORMAL);
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty reports array', async () => {
      // Setup
      const patientId = 'patient-456';
      mockDb.setMockReports([]);

      const llmResponse = JSON.stringify({ findings: [] });
      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [],
        metadata: {
          totalReportsProcessed: 0,
          processingTimeMs: 100,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify
      expect(result.findings).toEqual([]);
      expect(result.metadata.totalReportsProcessed).toBe(0);
    });

    test('should organize findings by report type', async () => {
      // Setup
      const patientId = 'patient-789';
      const reports: DiagnosticReport[] = [
        {
          reportId: 'report-1',
          patientId,
          reportType: ReportType.ECG,
          reportDate: new Date('2024-01-15'),
          reportText: 'Normal sinus rhythm'
        },
        {
          reportId: 'report-2',
          patientId,
          reportType: ReportType.BLOOD_TEST,
          reportDate: new Date('2024-01-16'),
          reportText: 'Hemoglobin: 14.5 g/dL'
        },
        {
          reportId: 'report-3',
          patientId,
          reportType: ReportType.RADIOLOGY,
          reportDate: new Date('2024-01-17'),
          reportText: 'Chest X-ray: Clear'
        }
      ];

      mockDb.setMockReports(reports);

      const llmResponse = JSON.stringify({
        findings: [
          {
            reportType: 'ecg',
            reportDate: '2024-01-15T00:00:00.000Z',
            findingName: 'Rhythm',
            value: 'Normal sinus rhythm',
            normalRange: null,
            significance: 'normal',
            interpretation: 'Normal'
          },
          {
            reportType: 'blood_test',
            reportDate: '2024-01-16T00:00:00.000Z',
            findingName: 'Hemoglobin',
            value: '14.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: 'normal',
            interpretation: 'Within normal range'
          },
          {
            reportType: 'radiology',
            reportDate: '2024-01-17T00:00:00.000Z',
            findingName: 'Chest X-ray',
            value: 'Clear',
            normalRange: null,
            significance: 'normal',
            interpretation: 'No abnormalities'
          }
        ]
      });

      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [
          {
            reportType: ReportType.ECG,
            reportDate: new Date('2024-01-15'),
            findingName: 'Rhythm',
            value: 'Normal sinus rhythm',
            normalRange: null,
            significance: Significance.NORMAL,
            interpretation: 'Normal'
          },
          {
            reportType: ReportType.BLOOD_TEST,
            reportDate: new Date('2024-01-16'),
            findingName: 'Hemoglobin',
            value: '14.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: Significance.NORMAL,
            interpretation: 'Within normal range'
          },
          {
            reportType: ReportType.RADIOLOGY,
            reportDate: new Date('2024-01-17'),
            findingName: 'Chest X-ray',
            value: 'Clear',
            normalRange: null,
            significance: Significance.NORMAL,
            interpretation: 'No abnormalities'
          }
        ],
        metadata: {
          totalReportsProcessed: 3,
          processingTimeMs: 300,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify findings are organized by type (blood_test, radiology, ecg)
      expect(result.findings).toHaveLength(3);
      expect(result.findings[0]?.reportType).toBe(ReportType.BLOOD_TEST);
      expect(result.findings[1]?.reportType).toBe(ReportType.RADIOLOGY);
      expect(result.findings[2]?.reportType).toBe(ReportType.ECG);
    });
  });

  describe('extractFindings - error handling', () => {
    test('should throw error for invalid patient ID', async () => {
      await expect(service.extractFindings('')).rejects.toThrow('Invalid patient ID');
      await expect(service.extractFindings('   ')).rejects.toThrow('Invalid patient ID');
    });

    test('should handle database errors', async () => {
      // Setup
      mockDb.setShouldFail(true);

      // Execute & Verify
      await expect(service.extractFindings('patient-123')).rejects.toMatchObject({
        code: ErrorCode.DATABASE_ERROR
      });
    });

    test('should handle LLM errors', async () => {
      // Setup
      const patientId = 'patient-123';
      mockDb.setMockReports([{
        reportId: 'report-1',
        patientId,
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date(),
        reportText: 'Test report'
      }]);

      mockLLM.setShouldFail(true);

      // Execute & Verify
      await expect(service.extractFindings(patientId)).rejects.toMatchObject({
        code: ErrorCode.LLM_ERROR
      });
    });

    test('should handle validation errors', async () => {
      // Setup
      const patientId = 'patient-123';
      mockDb.setMockReports([{
        reportId: 'report-1',
        patientId,
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date(),
        reportText: 'Test report'
      }]);

      mockLLM.setMockResponse('{"findings": []}');

      mockValidator.setMockResult({
        isValid: false,
        errors: [{ path: '/findings/0/reportType', message: 'Missing required field' }]
      });

      // Execute & Verify
      await expect(service.extractFindings(patientId)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR
      });
    });

    test('should handle validation exception', async () => {
      // Setup
      const patientId = 'patient-123';
      mockDb.setMockReports([{
        reportId: 'report-1',
        patientId,
        reportType: ReportType.BLOOD_TEST,
        reportDate: new Date(),
        reportText: 'Test report'
      }]);

      mockLLM.setMockResponse('{"findings": []}');
      mockValidator.setShouldFail(true);

      // Execute & Verify
      await expect(service.extractFindings(patientId)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR
      });
    });
  });

  describe('extractFindings - edge cases', () => {
    test('should extract findings from radiology report', async () => {
      // Setup
      const patientId = 'patient-rad';
      const radiologyReport: DiagnosticReport = {
        reportId: 'report-rad-1',
        patientId,
        reportType: ReportType.RADIOLOGY,
        reportDate: new Date('2024-01-18'),
        reportText: 'Chest X-ray: Small opacity in right lower lobe'
      };

      mockDb.setMockReports([radiologyReport]);

      const llmResponse = JSON.stringify({
        findings: [{
          reportType: 'radiology',
          reportDate: '2024-01-18T00:00:00.000Z',
          findingName: 'Chest X-ray',
          value: 'Small opacity in right lower lobe',
          normalRange: null,
          significance: 'abnormal',
          interpretation: 'Possible infiltrate or nodule, recommend follow-up'
        }]
      });

      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [{
          reportType: ReportType.RADIOLOGY,
          reportDate: new Date('2024-01-18'),
          findingName: 'Chest X-ray',
          value: 'Small opacity in right lower lobe',
          normalRange: null,
          significance: Significance.ABNORMAL,
          interpretation: 'Possible infiltrate or nodule, recommend follow-up'
        }],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 200,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.reportType).toBe(ReportType.RADIOLOGY);
      expect(result.findings[0]?.findingName).toBe('Chest X-ray');
    });

    test('should extract findings from ECG report', async () => {
      // Setup
      const patientId = 'patient-ecg';
      const ecgReport: DiagnosticReport = {
        reportId: 'report-ecg-1',
        patientId,
        reportType: ReportType.ECG,
        reportDate: new Date('2024-01-19'),
        reportText: 'ECG: Sinus tachycardia, rate 110 bpm'
      };

      mockDb.setMockReports([ecgReport]);

      const llmResponse = JSON.stringify({
        findings: [{
          reportType: 'ecg',
          reportDate: '2024-01-19T00:00:00.000Z',
          findingName: 'Heart Rate',
          value: '110 bpm',
          normalRange: '60-100 bpm',
          significance: 'abnormal',
          interpretation: 'Sinus tachycardia'
        }]
      });

      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [{
          reportType: ReportType.ECG,
          reportDate: new Date('2024-01-19'),
          findingName: 'Heart Rate',
          value: '110 bpm',
          normalRange: '60-100 bpm',
          significance: Significance.ABNORMAL,
          interpretation: 'Sinus tachycardia'
        }],
        metadata: {
          totalReportsProcessed: 1,
          processingTimeMs: 180,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.reportType).toBe(ReportType.ECG);
      expect(result.findings[0]?.findingName).toBe('Heart Rate');
    });

    test('should handle multiple reports of same type', async () => {
      // Setup
      const patientId = 'patient-multi';
      const reports: DiagnosticReport[] = [
        {
          reportId: 'report-1',
          patientId,
          reportType: ReportType.BLOOD_TEST,
          reportDate: new Date('2024-01-15'),
          reportText: 'Hemoglobin: 12.5 g/dL'
        },
        {
          reportId: 'report-2',
          patientId,
          reportType: ReportType.BLOOD_TEST,
          reportDate: new Date('2024-01-20'),
          reportText: 'Hemoglobin: 13.0 g/dL'
        }
      ];

      mockDb.setMockReports(reports);

      const llmResponse = JSON.stringify({
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T00:00:00.000Z',
            findingName: 'Hemoglobin',
            value: '12.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: 'abnormal',
            interpretation: 'Below normal'
          },
          {
            reportType: 'blood_test',
            reportDate: '2024-01-20T00:00:00.000Z',
            findingName: 'Hemoglobin',
            value: '13.0 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: 'abnormal',
            interpretation: 'Slightly below normal'
          }
        ]
      });

      mockLLM.setMockResponse(llmResponse);

      const structuredFindings: StructuredFindings = {
        patientId,
        extractedAt: new Date(),
        findings: [
          {
            reportType: ReportType.BLOOD_TEST,
            reportDate: new Date('2024-01-15'),
            findingName: 'Hemoglobin',
            value: '12.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: Significance.ABNORMAL,
            interpretation: 'Below normal'
          },
          {
            reportType: ReportType.BLOOD_TEST,
            reportDate: new Date('2024-01-20'),
            findingName: 'Hemoglobin',
            value: '13.0 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: Significance.ABNORMAL,
            interpretation: 'Slightly below normal'
          }
        ],
        metadata: {
          totalReportsProcessed: 2,
          processingTimeMs: 300,
          llmModelVersion: 'medgemma-v1'
        }
      };

      mockValidator.setMockResult({
        isValid: true,
        data: structuredFindings
      });

      // Execute
      const result = await service.extractFindings(patientId);

      // Verify
      expect(result.findings).toHaveLength(2);
      // Should be sorted by date (newest first)
      expect(result.findings[0]?.reportDate.getTime()).toBeGreaterThan(
        result.findings[1]?.reportDate.getTime() || 0
      );
    });
  });
});

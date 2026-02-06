/**
 * Unit tests for MedGemmaClient
 * 
 * Tests the MedGemma LLM client implementation for extracting findings
 * from diagnostic reports.
 * 
 * Requirements: 2.1, 2.2, 2.4, 8.2
 */

import { MedGemmaLLMClient, createMedGemmaClient } from '../../services/patient-findings/medgemma-client';
import { DiagnosticReport, ReportType, LLMConfig } from '../../types/patient-findings';
import { isFindingsError } from '../../services/patient-findings/errors';
import * as fc from 'fast-check';
import { arbitraryDiagnosticReport } from '../../test/patient-findings-generators';

// Mock fetch globally
global.fetch = jest.fn();

describe('MedGemmaLLMClient', () => {
  let client: MedGemmaLLMClient;
  const mockConfig: LLMConfig = {
    modelVersion: 'medgemma-27b-v1',
    temperature: 0.1,
    maxTokens: 4096,
    apiEndpoint: 'https://api.example.com/medgemma',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    
    // Create client with test config
    client = new MedGemmaLLMClient(mockConfig, 5000);
  });

  describe('constructor', () => {
    it('should create client with provided config', () => {
      const config = client.getConfig();
      expect(config.modelVersion).toBe('medgemma-27b-v1');
      expect(config.temperature).toBe(0.1);
      expect(config.apiEndpoint).toBe('https://api.example.com/medgemma');
    });

    it('should throw error if API endpoint is missing', () => {
      expect(() => {
        new MedGemmaLLMClient({ ...mockConfig, apiEndpoint: '' });
      }).toThrow('MedGemma API endpoint is required');
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new MedGemmaLLMClient({ ...mockConfig, apiKey: '' });
      }).toThrow('MedGemma API key is required');
    });

    it('should use default timeout if not provided', () => {
      const defaultClient = new MedGemmaLLMClient(mockConfig);
      expect(defaultClient.getTimeout()).toBe(30000);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      const newConfig: LLMConfig = {
        ...mockConfig,
        temperature: 0.5,
        maxTokens: 2048
      };

      client.configure(newConfig);
      const config = client.getConfig();

      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(2048);
    });
  });

  describe('extractFindings', () => {
    const mockReport: DiagnosticReport = {
      reportId: 'report-123',
      patientId: 'patient-456',
      reportType: ReportType.BLOOD_TEST,
      reportDate: new Date('2024-01-15'),
      reportText: 'Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5)'
    };

    const mockAPIResponse = {
      text: JSON.stringify({
        findings: [
          {
            reportType: 'blood_test',
            reportDate: '2024-01-15T00:00:00.000Z',
            findingName: 'Hemoglobin',
            value: '12.5 g/dL',
            normalRange: '13.5-17.5 g/dL',
            significance: 'abnormal',
            interpretation: 'Below normal range'
          }
        ]
      })
    };

    it('should successfully extract findings from a single report', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAPIResponse
      });

      const result = await client.extractFindings([mockReport]);
      const parsed = JSON.parse(result);

      expect(parsed.findings).toHaveLength(1);
      expect(parsed.findings[0].findingName).toBe('Hemoglobin');
      expect(parsed.findings[0].significance).toBe('abnormal');
    });

    it('should successfully extract findings from multiple reports', async () => {
      const reports: DiagnosticReport[] = [
        mockReport,
        {
          reportId: 'report-124',
          patientId: 'patient-456',
          reportType: ReportType.ECG,
          reportDate: new Date('2024-01-16'),
          reportText: 'Normal sinus rhythm, rate 72 bpm'
        }
      ];

      const multiReportResponse = {
        text: JSON.stringify({
          findings: [
            {
              reportType: 'blood_test',
              reportDate: '2024-01-15T00:00:00.000Z',
              findingName: 'Hemoglobin',
              value: '12.5 g/dL',
              normalRange: '13.5-17.5 g/dL',
              significance: 'abnormal',
              interpretation: 'Below normal range'
            },
            {
              reportType: 'ecg',
              reportDate: '2024-01-16T00:00:00.000Z',
              findingName: 'Heart Rate',
              value: '72 bpm',
              normalRange: '60-100 bpm',
              significance: 'normal',
              interpretation: 'Normal sinus rhythm'
            }
          ]
        })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => multiReportResponse
      });

      const result = await client.extractFindings(reports);
      const parsed = JSON.parse(result);

      expect(parsed.findings).toHaveLength(2);
      expect(parsed.findings[0].reportType).toBe('blood_test');
      expect(parsed.findings[1].reportType).toBe('ecg');
    });

    it('should return empty findings for empty reports array', async () => {
      const result = await client.extractFindings([]);
      const parsed = JSON.parse(result);

      expect(parsed.findings).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error if reports is not an array', async () => {
      await expect(
        client.extractFindings(null as any)
      ).rejects.toThrow();

      await expect(
        client.extractFindings('not-an-array' as any)
      ).rejects.toThrow();
    });

    it('should handle API timeout', async () => {
      // Create client with very short timeout
      const shortTimeoutClient = new MedGemmaLLMClient(mockConfig, 100);

      // Mock a slow response that will be aborted
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          }, 150);
        })
      );

      try {
        await shortTimeoutClient.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.message).toContain('Failed to extract findings');
          expect(error.details?.originalError).toContain('timed out');
          expect(error.details?.originalError).toContain('100ms');
        }
      }
    });

    it('should provide detailed timeout error message', async () => {
      const shortTimeoutClient = new MedGemmaLLMClient(mockConfig, 50);

      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          }, 100);
        })
      );

      try {
        await shortTimeoutClient.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.details?.originalError).toContain('aborted');
          expect(error.details?.originalError).toContain('50ms');
        }
      }
    });

    it('should handle API error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(
        client.extractFindings([mockReport])
      ).rejects.toThrow();
    });

    it('should handle 400 bad request errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid request format'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('bad request');
          expect(error.details?.originalError).toContain('400');
        }
      }
    });

    it('should handle 401 authentication errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('authentication failed');
          expect(error.details?.originalError).toContain('401');
        }
      }
    });

    it('should handle 403 forbidden errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('authentication failed');
          expect(error.details?.originalError).toContain('403');
        }
      }
    });

    it('should handle 429 rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('rate limit');
          expect(error.details?.originalError).toContain('429');
        }
      }
    });

    it('should handle 500 internal server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('server error');
          expect(error.details?.originalError).toContain('500');
        }
      }
    });

    it('should handle 503 service unavailable errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('service unavailable');
          expect(error.details?.originalError).toContain('503');
        }
      }
    });

    it('should handle 504 gateway timeout errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 504,
        text: async () => 'Gateway Timeout'
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('gateway timeout');
          expect(error.details?.originalError).toContain('504');
        }
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed')
      );

      await expect(
        client.extractFindings([mockReport])
      ).rejects.toThrow();
    });

    it('should handle malformed JSON in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'This is not valid JSON' })
      });

      await expect(
        client.extractFindings([mockReport])
      ).rejects.toThrow();
    });

    it('should handle response with no JSON structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Just plain text without any JSON' })
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('No JSON found');
        }
      }
    });

    it('should handle response with incomplete JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '{ "findings": [' })
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          // The regex will match the opening brace but JSON.parse will fail
          expect(error.details?.originalError).toMatch(/No JSON found|Invalid JSON/);
        }
      }
    });

    it('should handle response with malformed JSON syntax', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '{ findings: [{ name: "test" }] }' }) // Missing quotes
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('Invalid JSON');
        }
      }
    });

    it('should handle response JSON parsing failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Failed to parse response');
        }
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.details?.originalError).toContain('malformed JSON response');
        }
      }
    });

    it('should handle empty response from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '' })
      });

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
          expect(error.message).toContain('Failed to extract findings');
        }
      }
    });

    it('should extract JSON from response with extra text', async () => {
      const responseWithExtraText = {
        text: 'Here are the findings:\n' + JSON.stringify({
          findings: [
            {
              reportType: 'blood_test',
              reportDate: '2024-01-15T00:00:00.000Z',
              findingName: 'Hemoglobin',
              value: '12.5 g/dL',
              normalRange: '13.5-17.5 g/dL',
              significance: 'abnormal',
              interpretation: 'Below normal range'
            }
          ]
        }) + '\nEnd of findings.'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithExtraText
      });

      const result = await client.extractFindings([mockReport]);
      const parsed = JSON.parse(result);

      expect(parsed.findings).toHaveLength(1);
      expect(parsed.findings[0].findingName).toBe('Hemoglobin');
    });

    it('should include proper headers in API request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAPIResponse
      });

      await client.extractFindings([mockReport]);

      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.apiEndpoint,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockConfig.apiKey}`
          })
        })
      );
    });

    it('should include model configuration in API request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAPIResponse
      });

      await client.extractFindings([mockReport]);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.model).toBe(mockConfig.modelVersion);
      expect(requestBody.temperature).toBe(mockConfig.temperature);
      expect(requestBody.max_tokens).toBe(mockConfig.maxTokens);
      expect(requestBody.prompt).toContain('Hemoglobin');
    });

    it('should wrap errors as FindingsError with LLM_ERROR code', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('API failure')
      );

      try {
        await client.extractFindings([mockReport]);
        fail('Should have thrown error');
      } catch (error) {
        expect(isFindingsError(error)).toBe(true);
        if (isFindingsError(error)) {
          expect(error.code).toBe('LLM_ERROR');
        }
      }
    });
  });

  describe('setTimeout', () => {
    it('should update timeout value', () => {
      client.setTimeout(10000);
      expect(client.getTimeout()).toBe(10000);
    });

    it('should throw error for non-positive timeout', () => {
      expect(() => client.setTimeout(0)).toThrow('Timeout must be positive');
      expect(() => client.setTimeout(-1000)).toThrow('Timeout must be positive');
    });
  });

  describe('createMedGemmaClient factory', () => {
    it('should create client with provided config', () => {
      const factoryClient = createMedGemmaClient(mockConfig, 5000);
      expect(factoryClient).toBeInstanceOf(MedGemmaLLMClient);
      expect(factoryClient.getConfig().modelVersion).toBe('medgemma-27b-v1');
    });

    it('should create client with partial config', () => {
      const partialConfig = {
        apiEndpoint: 'https://api.example.com/medgemma',
        apiKey: 'test-key'
      };
      const factoryClient = createMedGemmaClient(partialConfig);
      expect(factoryClient).toBeInstanceOf(MedGemmaLLMClient);
    });
  });

  describe('prompt building', () => {
    it('should include all report details in prompt', async () => {
      const report: DiagnosticReport = {
        reportId: 'report-789',
        patientId: 'patient-123',
        reportType: ReportType.RADIOLOGY,
        reportDate: new Date('2024-02-01'),
        reportText: 'Chest X-ray shows clear lungs'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: JSON.stringify({ findings: [] })
        })
      });

      await client.extractFindings([report]);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const prompt = requestBody.prompt;

      expect(prompt).toContain('report-789');
      expect(prompt).toContain('radiology');
      expect(prompt).toContain('Chest X-ray shows clear lungs');
      expect(prompt).toContain('JSON');
    });
  });

  /**
   * Property-Based Tests
   * 
   * These tests verify universal properties that should hold across all inputs
   */
  describe('Property-Based Tests', () => {
    /**
     * Feature: patient-findings-display
     * Property 2: LLM Extraction Produces Findings
     * 
     * For any set of diagnostic reports provided to the Medical_LLM,
     * the extraction process should return findings data (may be empty
     * if no findings detected, but should not fail).
     * 
     * Validates: Requirements 2.2
     */
    describe('Property 2: LLM Extraction Produces Findings', () => {
      it('should return findings data for any set of diagnostic reports', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(arbitraryDiagnosticReport(), { minLength: 0, maxLength: 10 }),
            async (reports) => {
              // Mock successful API response with findings or empty findings
              const mockFindings = reports.length > 0 
                ? reports.map(r => ({
                    reportType: r.reportType,
                    reportDate: r.reportDate.toISOString(),
                    findingName: 'Test Finding',
                    value: '100',
                    normalRange: '80-120',
                    significance: 'normal',
                    interpretation: 'Within normal limits'
                  }))
                : [];

              (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  text: JSON.stringify({ findings: mockFindings })
                })
              });

              // Execute: extract findings
              const result = await client.extractFindings(reports);

              // Verify: result is valid JSON string
              expect(typeof result).toBe('string');
              
              // Verify: result can be parsed as JSON
              const parsed = JSON.parse(result);

              // Verify: parsed result has findings array
              expect(parsed).toHaveProperty('findings');
              expect(Array.isArray(parsed.findings)).toBe(true);

              // Verify: if reports were provided, findings should match count
              // (or be empty if LLM found nothing, but structure should be valid)
              if (reports.length > 0) {
                // Should have called the API
                expect(global.fetch).toHaveBeenCalled();
              } else {
                // Empty reports should return empty findings without API call
                expect(parsed.findings).toEqual([]);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should not fail when processing reports with various content', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(arbitraryDiagnosticReport(), { minLength: 1, maxLength: 5 }),
            async (reports) => {
              // Mock API to always return valid structure
              (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                  text: JSON.stringify({
                    findings: reports.map(r => ({
                      reportType: r.reportType,
                      reportDate: r.reportDate.toISOString(),
                      findingName: 'Generated Finding',
                      value: null,
                      normalRange: null,
                      significance: 'normal',
                      interpretation: 'No significant findings'
                    }))
                  })
                })
              });

              // Execute and verify no exception is thrown
              await expect(client.extractFindings(reports)).resolves.toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return parseable JSON for any valid report array', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(arbitraryDiagnosticReport(), { minLength: 0, maxLength: 8 }),
            async (reports) => {
              // Mock response
              const mockResponse = {
                findings: reports.slice(0, Math.min(reports.length, 3)).map(r => ({
                  reportType: r.reportType,
                  reportDate: r.reportDate.toISOString(),
                  findingName: 'Sample Finding',
                  value: '50',
                  normalRange: '40-60',
                  significance: 'normal',
                  interpretation: 'Normal'
                }))
              };

              (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ text: JSON.stringify(mockResponse) })
              });

              // Execute
              const result = await client.extractFindings(reports);

              // Verify: result is parseable JSON
              const parsed = JSON.parse(result);
              expect(parsed).toHaveProperty('findings');
              expect(Array.isArray(parsed.findings)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});

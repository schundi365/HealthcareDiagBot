/**
 * Patient Findings Display - MedGemma LLM Client Implementation
 * 
 * This module implements the MedGemmaClient interface for processing
 * diagnostic reports using Google's MedGemma medical-specialized LLM.
 * 
 * Requirements: 2.1, 2.2
 */

import { MedGemmaClient, LLMConfig, DiagnosticReport } from '../../types/patient-findings';
import { createLLMError, logError } from './errors';

/**
 * Default configuration for MedGemma LLM
 */
const DEFAULT_CONFIG: LLMConfig = {
  modelVersion: 'medgemma-27b-v1',
  temperature: 0.1, // Low temperature for consistent medical extraction
  maxTokens: 4096,
  apiEndpoint: process.env['MEDGEMMA_API_ENDPOINT'] || '',
  apiKey: process.env['MEDGEMMA_API_KEY'] || ''
};

/**
 * Default timeout for API calls (30 seconds)
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Implementation of MedGemmaClient for extracting findings from diagnostic reports
 * 
 * This client formats diagnostic reports into prompts, calls the MedGemma API,
 * and returns extracted findings in JSON format.
 */
export class MedGemmaLLMClient implements MedGemmaClient {
  private config: LLMConfig;
  private timeoutMs: number;

  /**
   * Creates a new MedGemma LLM client
   * 
   * @param config - Optional LLM configuration (uses defaults if not provided)
   * @param timeoutMs - Optional timeout in milliseconds (default: 30000)
   */
  constructor(config?: Partial<LLMConfig>, timeoutMs?: number) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS;
    
    // Validate configuration
    if (!this.config.apiEndpoint) {
      throw new Error(
        'MedGemma API endpoint is required. ' +
        'Provide it in config or set MEDGEMMA_API_ENDPOINT environment variable.'
      );
    }
    
    if (!this.config.apiKey) {
      throw new Error(
        'MedGemma API key is required. ' +
        'Provide it in config or set MEDGEMMA_API_KEY environment variable.'
      );
    }
  }

  /**
   * Configures the LLM client with new settings
   * 
   * @param config - New configuration to apply
   */
  configure(config: LLMConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Extracts findings from diagnostic reports using MedGemma
   * 
   * @param reports - Array of diagnostic reports to process
   * @returns JSON string containing extracted findings
   * @throws FindingsError with LLM_ERROR code if processing fails
   * 
   * Requirements: 2.1, 2.2
   */
  async extractFindings(reports: DiagnosticReport[]): Promise<string> {
    // Validate input
    if (!Array.isArray(reports)) {
      const error = createLLMError('Reports must be an array');
      logError(error, { reports, operation: 'extractFindings' });
      throw error;
    }

    // Handle empty reports array
    if (reports.length === 0) {
      // Return empty findings structure
      return JSON.stringify({
        findings: []
      });
    }

    try {
      // Build the prompt with all reports
      const prompt = this.buildPrompt(reports);

      // Call MedGemma API with timeout
      const response = await this.callMedGemmaAPI(prompt);

      // Extract JSON from response
      const jsonString = this.extractJSON(response);

      return jsonString;
    } catch (error) {
      // Wrap and rethrow as LLM error
      const llmError = createLLMError(
        `Failed to extract findings from ${reports.length} report(s)`,
        error instanceof Error ? error : undefined
      );
      logError(llmError, { 
        reportCount: reports.length,
        reportTypes: reports.map(r => r.reportType),
        operation: 'extractFindings'
      });
      throw llmError;
    }
  }

  /**
   * Builds the prompt for MedGemma to extract findings
   * 
   * @param reports - Diagnostic reports to include in prompt
   * @returns Formatted prompt string
   */
  private buildPrompt(reports: DiagnosticReport[]): string {
    // Format reports into text
    const reportsText = reports.map((report, index) => {
      return `
--- Report ${index + 1} ---
Report ID: ${report.reportId}
Report Type: ${report.reportType}
Report Date: ${report.reportDate.toISOString()}
Report Text:
${report.reportText}
`;
    }).join('\n');

    // Build the complete prompt
    const prompt = `You are a medical AI assistant. Extract key findings from the following diagnostic reports.

For each finding, provide:
- Finding name
- Value (if applicable)
- Normal range (if applicable)
- Clinical significance (normal, abnormal, critical)
- Brief interpretation

Return findings in JSON format following this schema:
{
  "findings": [
    {
      "reportType": "blood_test" | "radiology" | "ecg",
      "reportDate": "ISO date string",
      "findingName": "string",
      "value": "string or null",
      "normalRange": "string or null",
      "significance": "normal" | "abnormal" | "critical",
      "interpretation": "string"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.

Reports:
${reportsText}

JSON Output:`;

    return prompt;
  }

  /**
   * Calls the MedGemma API with the given prompt
   * 
   * Handles various failure scenarios:
   * - 4xx errors (client errors like bad request, unauthorized)
   * - 5xx errors (server errors)
   * - Timeout errors
   * - Network errors
   * - Malformed responses
   * 
   * @param prompt - The prompt to send to MedGemma
   * @returns The API response text
   * @throws Error with descriptive message for different failure types
   * 
   * Requirements: 2.4, 8.2
   */
  private async callMedGemmaAPI(prompt: string): Promise<string> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Make API request
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelVersion,
          prompt: prompt,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP error responses with specific categorization
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        const status = response.status;

        // Handle 4xx client errors (don't retry these)
        if (status >= 400 && status < 500) {
          if (status === 401 || status === 403) {
            throw new Error(
              `MedGemma API authentication failed (${status}): Invalid or expired API key. ${errorText}`
            );
          } else if (status === 400) {
            throw new Error(
              `MedGemma API bad request (${status}): The request was malformed or invalid. ${errorText}`
            );
          } else if (status === 429) {
            throw new Error(
              `MedGemma API rate limit exceeded (${status}): Too many requests. Please retry later. ${errorText}`
            );
          } else {
            throw new Error(
              `MedGemma API client error (${status}): ${errorText}`
            );
          }
        }

        // Handle 5xx server errors (these may be transient)
        if (status >= 500) {
          if (status === 503) {
            throw new Error(
              `MedGemma API service unavailable (${status}): The service is temporarily unavailable. Please retry later. ${errorText}`
            );
          } else if (status === 504) {
            throw new Error(
              `MedGemma API gateway timeout (${status}): The request took too long to process. ${errorText}`
            );
          } else {
            throw new Error(
              `MedGemma API server error (${status}): An internal server error occurred. ${errorText}`
            );
          }
        }

        // Handle other unexpected status codes
        throw new Error(
          `MedGemma API returned unexpected status ${status}: ${errorText}`
        );
      }

      // Parse response JSON
      let data: { text?: string; response?: string; output?: string };
      try {
        data = await response.json() as { text?: string; response?: string; output?: string };
      } catch (parseError) {
        throw new Error(
          `MedGemma API returned malformed JSON response: ${parseError instanceof Error ? parseError.message : 'Unable to parse response'}`
        );
      }

      // Extract text from response (format may vary by API)
      // This assumes a standard format - adjust based on actual MedGemma API
      const responseText = data.text || data.response || data.output || '';

      if (!responseText) {
        throw new Error(
          'MedGemma API returned empty response: No text content found in response body'
        );
      }

      return responseText;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `MedGemma API request timed out after ${this.timeoutMs}ms. The request was aborted. Consider increasing the timeout or checking API availability.`
        );
      }

      // Handle network/fetch errors (connection failures, DNS issues, etc.)
      if (error instanceof TypeError) {
        throw new Error(
          `Network error calling MedGemma API: ${error.message}. Please check your internet connection and API endpoint configuration.`
        );
      }

      // Rethrow other errors (already have descriptive messages from above)
      throw error;
    }
  }

  /**
   * Extracts JSON from the LLM response
   * 
   * The LLM may include extra text before/after the JSON, so we need to extract it.
   * Handles various malformed response scenarios:
   * - No JSON found in response
   * - Invalid JSON syntax
   * - Nested JSON structures
   * 
   * @param response - The raw response from MedGemma
   * @returns Extracted JSON string
   * @throws Error with descriptive message if no valid JSON found
   * 
   * Requirements: 2.4, 8.2
   */
  private extractJSON(response: string): string {
    // Check if response is empty or whitespace only
    if (!response || response.trim().length === 0) {
      throw new Error(
        'Cannot extract JSON from empty response'
      );
    }

    // Try to find JSON in the response
    // Look for content between { and } (including nested braces)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Provide helpful error message with response snippet
      const snippet = response.length > 100 
        ? response.substring(0, 100) + '...' 
        : response;
      throw new Error(
        `No JSON found in MedGemma response. Response started with: "${snippet}"`
      );
    }

    const jsonString = jsonMatch[0];

    // Validate it's parseable JSON
    try {
      JSON.parse(jsonString);
    } catch (parseError) {
      // Provide detailed error about what went wrong
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      const snippet = jsonString.length > 200 
        ? jsonString.substring(0, 200) + '...' 
        : jsonString;
      
      throw new Error(
        `Invalid JSON in MedGemma response: ${errorMessage}. JSON content: "${snippet}"`
      );
    }

    return jsonString;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * Gets the current timeout setting
   */
  getTimeout(): number {
    return this.timeoutMs;
  }

  /**
   * Sets the timeout for API calls
   */
  setTimeout(timeoutMs: number): void {
    if (timeoutMs <= 0) {
      throw new Error('Timeout must be positive');
    }
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Factory function to create a configured MedGemma client
 * 
 * @param config - Optional LLM configuration
 * @param timeoutMs - Optional timeout in milliseconds
 * @returns Configured MedGemmaLLMClient instance
 */
export function createMedGemmaClient(
  config?: Partial<LLMConfig>,
  timeoutMs?: number
): MedGemmaLLMClient {
  return new MedGemmaLLMClient(config, timeoutMs);
}

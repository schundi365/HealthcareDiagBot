/**
 * Patient Findings Display - JSON Validator
 * 
 * This module provides JSON schema validation for StructuredFindings output
 * from the MedGemma LLM. It ensures that the LLM output conforms to the
 * expected schema before being passed to the display component.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  JSONValidator as IJSONValidator,
  ValidationResult,
  ValidationError,
  StructuredFindings,
  ReportType,
  Significance
} from '../../types/patient-findings';

/**
 * Internal type for JSON representation (before Date conversion)
 */
interface StructuredFindingsJSON {
  patientId: string;
  extractedAt: string;
  findings: Array<{
    reportType: ReportType;
    reportDate: string;
    findingName: string;
    value: string | null;
    normalRange: string | null;
    significance: Significance;
    interpretation: string;
  }>;
  metadata: {
    totalReportsProcessed: number;
    processingTimeMs: number;
    llmModelVersion: string;
  };
}

/**
 * JSON Schema for StructuredFindings
 * Defines the expected structure of findings extracted by the LLM
 */
const structuredFindingsSchema = {
  type: 'object',
  properties: {
    patientId: {
      type: 'string',
      minLength: 1
    },
    extractedAt: {
      type: 'string',
      format: 'date-time'
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: [ReportType.BLOOD_TEST, ReportType.RADIOLOGY, ReportType.ECG]
          },
          reportDate: {
            type: 'string',
            format: 'date-time'
          },
          findingName: {
            type: 'string',
            minLength: 1
          },
          value: {
            type: ['string', 'null']
          },
          normalRange: {
            type: ['string', 'null']
          },
          significance: {
            type: 'string',
            enum: [Significance.NORMAL, Significance.ABNORMAL, Significance.CRITICAL]
          },
          interpretation: {
            type: 'string',
            minLength: 1
          }
        },
        required: ['reportType', 'reportDate', 'findingName', 'value', 'normalRange', 'significance', 'interpretation'],
        additionalProperties: false
      }
    },
    metadata: {
      type: 'object',
      properties: {
        totalReportsProcessed: {
          type: 'number',
          minimum: 0
        },
        processingTimeMs: {
          type: 'number',
          minimum: 0
        },
        llmModelVersion: {
          type: 'string',
          minLength: 1
        }
      },
      required: ['totalReportsProcessed', 'processingTimeMs', 'llmModelVersion'],
      additionalProperties: false
    }
  },
  required: ['patientId', 'extractedAt', 'findings', 'metadata'],
  additionalProperties: false
} as const;

/**
 * Implementation of JSONValidator interface
 * Uses AJV library for schema validation
 */
export class JSONValidatorImpl implements IJSONValidator {
  private ajv: Ajv;
  private validateFunction: ValidateFunction<StructuredFindingsJSON>;

  constructor() {
    // Initialize AJV with strict mode and all errors
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      coerceTypes: false,
      removeAdditional: false
    });

    // Add format validators (date-time, etc.)
    addFormats(this.ajv);

    // Compile the schema
    this.validateFunction = this.ajv.compile(structuredFindingsSchema);
  }

  /**
   * Validates a JSON string against the StructuredFindings schema
   * 
   * @param jsonString - The JSON string to validate (typically from LLM output)
   * @returns ValidationResult with isValid flag, parsed data, or errors
   * 
   * Requirements: 3.1, 3.2, 3.4, 3.5
   */
  validate(jsonString: string): ValidationResult {
    // Step 1: Parse JSON string
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      return {
        isValid: false,
        errors: [{
          path: '$',
          message: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        }]
      };
    }

    // Step 2: Validate against schema
    const isValid = this.validateFunction(parsedData);

    if (!isValid) {
      // Convert AJV errors to ValidationError format
      const errors: ValidationError[] = (this.validateFunction.errors || []).map(error => ({
        path: error.instancePath || error.schemaPath,
        message: `${error.instancePath || 'root'} ${error.message || 'validation failed'}`
      }));

      return {
        isValid: false,
        errors
      };
    }

    // Step 3: Convert date strings to Date objects
    const structuredFindings: StructuredFindings = {
      ...parsedData,
      extractedAt: new Date(parsedData.extractedAt),
      findings: parsedData.findings.map((finding: any) => ({
        ...finding,
        reportDate: new Date(finding.reportDate)
      }))
    };

    return {
      isValid: true,
      data: structuredFindings
    };
  }

  /**
   * Returns the JSON schema used for validation
   * Useful for debugging and documentation
   * 
   * @returns The JSON schema object
   */
  getSchema(): any {
    return structuredFindingsSchema;
  }
}

/**
 * Factory function to create a JSONValidator instance
 * Provides a clean API for creating validators
 */
export function createJSONValidator(): IJSONValidator {
  return new JSONValidatorImpl();
}


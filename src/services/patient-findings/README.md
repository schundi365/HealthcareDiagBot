# Patient Findings Display - Service Layer

This directory contains the service layer implementation for the Patient Findings Display system.

## Overview

The Patient Findings Display system is a lightweight component that extracts and displays key findings from text-based patient diagnostic reports using MedGemma (a medical-specialized LLM).

## Architecture

The system follows a simple, direct pipeline:

```
Database → MedGemma LLM → JSON Validation → Display Component
```

## Directory Structure

```
src/services/patient-findings/
├── README.md                    # This file
├── errors.ts                    # Error handling utilities
├── database-client.ts           # Database operations (Task 2)
├── medgemma-client.ts          # LLM integration (Task 3)
├── json-validator.ts           # JSON schema validation (Task 5)
└── findings-extractor.ts       # Main service orchestration (Task 6)
```

## Core Components

### Error Handling (`errors.ts`)

Provides custom error classes and utilities for handling errors throughout the pipeline:

- `FindingsError`: Custom error class with error codes and context
- Error factory functions for each error type
- Error logging and wrapping utilities

### Database Client (`database-client.ts`)

Handles retrieval of diagnostic reports from MongoDB:

- Query reports by patient ID
- Filter reports by type (blood test, radiology, ECG)
- Handle connection errors gracefully
- Validate input parameters

**Status**: ✅ Implemented (Task 2.1)

### MedGemma Client (`medgemma-client.ts`)

Integrates with the MedGemma LLM for findings extraction:

- Format reports for LLM processing
- Call MedGemma API with extraction prompts
- Handle API errors and timeouts
- Parse LLM responses
- Extract JSON from responses with extra text

**Status**: ✅ Implemented (Task 3.1)

**Key Features**:
- Configurable timeout (default: 30 seconds)
- Automatic JSON extraction from LLM responses
- Comprehensive error handling for API failures
- Support for multiple report types in single request
- Proper authentication headers and request formatting

### JSON Validator (To be implemented)

Validates LLM output against the expected schema:

- Define JSON schema for StructuredFindings
- Validate JSON structure and types
- Return detailed validation errors

### Findings Extractor (To be implemented)

Orchestrates the entire extraction pipeline:

- Coordinate database queries
- Process reports through LLM
- Validate results
- Handle errors at each step
- Return structured findings

## Type Definitions

All type definitions are located in `src/types/patient-findings.ts`:

- `DiagnosticReport`: Raw report from database
- `Finding`: Extracted medical finding
- `StructuredFindings`: Complete extraction result
- `ReportType`: Enum for report types
- `Significance`: Enum for clinical significance
- `ErrorCode`: Enum for error types

## Testing

### Unit Tests

Located in `src/__tests__/patient-findings/`:

- `types.test.ts`: Tests for type definitions and error handling
- `generators.test.ts`: Tests for property-based test generators
- `database-client.test.ts`: Tests for database client implementation
- `medgemma-client.test.ts`: Tests for MedGemma LLM client implementation

### Property-Based Tests

Test generators are located in `src/test/patient-findings-generators.ts`:

- Generate random but valid test data
- Enable comprehensive property-based testing
- Use fast-check library for randomized testing

### Running Tests

```bash
# Run all patient findings tests
npm test -- src/__tests__/patient-findings

# Run with coverage
npm test -- --coverage src/__tests__/patient-findings

# Run in watch mode
npm test -- --watch src/__tests__/patient-findings
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 1.1**: Database query and report retrieval
- **Requirement 2.1**: Medical LLM integration
- **Requirement 3.1**: Structured data output
- **Requirement 5.1**: Component reusability
- **Requirement 8.1-8.5**: Error handling and reliability

## Next Steps

1. ✅ Implement Database Client (Task 2.1) - COMPLETED
2. ✅ Implement MedGemma Client (Task 3.1) - COMPLETED
3. Implement error handling for MedGemma Client (Task 3.2)
4. Implement JSON Validator (Task 5)
5. Implement Findings Extractor Service (Task 6)
6. Create React Display Component (Task 8)
7. Add API endpoint (Task 10)

## Configuration

Configuration is managed through environment variables:

- `MONGODB_CONNECTION_STRING`: MongoDB connection string (for database client)
- `MEDGEMMA_API_ENDPOINT`: MedGemma API endpoint URL
- `MEDGEMMA_API_KEY`: API authentication key
- `MEDGEMMA_MODEL_VERSION`: Model version to use (default: medgemma-27b-v1)
- `MEDGEMMA_TIMEOUT`: Request timeout in milliseconds (default: 30000)

### Example Configuration

```typescript
// Database Client
const dbClient = createDatabaseClient(
  process.env.MONGODB_CONNECTION_STRING,
  'medical_records',
  'diagnostic_reports'
);

// MedGemma Client
const llmClient = createMedGemmaClient({
  apiEndpoint: process.env.MEDGEMMA_API_ENDPOINT,
  apiKey: process.env.MEDGEMMA_API_KEY,
  modelVersion: 'medgemma-27b-v1',
  temperature: 0.1,
  maxTokens: 4096
}, 30000);
```

## Error Codes

The system uses the following error codes:

- `DATABASE_ERROR`: Database connection or query failures
- `LLM_ERROR`: MedGemma API failures or timeouts
- `VALIDATION_ERROR`: JSON schema validation failures
- `NO_REPORTS_FOUND`: No reports exist for patient
- `INVALID_PATIENT_ID`: Invalid patient ID format

## Logging

All errors are logged with context for debugging:

- Timestamp
- Error code
- Error message
- Additional details
- Stack trace

In production, logs should be sent to a centralized logging service (e.g., Cloud Logging, Sentry).

# Implementation Plan: Patient Findings Display

## Overview

This implementation plan breaks down the Patient Findings Display feature into discrete, incremental coding tasks. The system follows a simple pipeline: Database → MedGemma LLM → JSON Validation → Display Component. Each task builds on previous work, with checkpoints to ensure quality.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for services and components
  - Define TypeScript interfaces for all data models (DiagnosticReport, StructuredFindings, Finding, etc.)
  - Define error types and ErrorCode enum
  - Set up testing framework (Jest + fast-check for property-based testing)
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [x] 2. Implement Database Client
  - [x] 2.1 Create DatabaseClient interface and implementation
    - Implement `getPatientReports(patientId: string)` method
    - Implement `getReportsByType(patientId: string, reportType: ReportType)` method
    - Add connection error handling
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 2.2 Write property test for complete report retrieval
    - **Property 1: Complete Report Retrieval**
    - **Validates: Requirements 1.1, 1.2, 1.4**
  
  - [ ]* 2.3 Write unit tests for DatabaseClient
    - Test empty result set when no reports exist
    - Test connection failure handling
    - Test report type filtering
    - _Requirements: 1.3, 8.1_

- [ ] 3. Implement MedGemma LLM Client
  - [x] 3.1 Create MedGemmaClient interface and implementation
    - Implement `extractFindings(reports: DiagnosticReport[])` method
    - Implement `configure(config: LLMConfig)` method
    - Build prompt template for findings extraction
    - Add API call logic with timeout handling
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Add error handling for LLM failures
    - Handle API failures (4xx, 5xx errors)
    - Handle timeout errors
    - Handle malformed JSON responses
    - _Requirements: 2.4, 8.2_
  
  - [x] 3.3 Write property test for LLM extraction
    - **Property 2: LLM Extraction Produces Findings**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.4 Write property test for error messages
    - **Property 3: Error Messages on Failure**
    - **Validates: Requirements 2.4**
  
  - [ ]* 3.5 Write unit tests for MedGemmaClient
    - Test successful extraction with mock API
    - Test API timeout handling
    - Test malformed response handling
    - _Requirements: 2.4, 8.2_

- [x] 4. Checkpoint - Ensure database and LLM clients work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement JSON Validator
  - [x] 5.1 Create JSONValidator interface and implementation
    - Implement `validate(jsonString: string)` method
    - Define JSON schema for StructuredFindings
    - Add schema validation logic using a library (e.g., ajv)
    - Return validation errors with field paths
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [x] 5.2 Write property test for valid JSON output
    - **Property 4: Valid JSON Output**
    - **Validates: Requirements 3.1**
  
  - [ ]* 5.3 Write property test for required fields
    - **Property 5: Required Fields Present**
    - **Validates: Requirements 3.2, 3.4**
  
  - [ ]* 5.4 Write property test for schema validation rejection
    - **Property 7: Schema Validation Rejection**
    - **Validates: Requirements 3.5**
  
  - [ ]* 5.5 Write unit tests for JSONValidator
    - Test valid JSON passes validation
    - Test invalid JSON is rejected
    - Test missing required fields are caught
    - Test type mismatches are caught
    - _Requirements: 3.5, 8.3_

- [x] 6. Implement Findings Extractor Service
  - [x] 6.1 Create FindingsExtractorService class
    - Implement `extractFindings(patientId: string)` method
    - Orchestrate database query → LLM processing → JSON validation
    - Add error handling for each step
    - Organize findings by report type
    - _Requirements: 1.1, 2.2, 3.1, 3.3_
  
  - [x] 6.2 Add comprehensive error handling
    - Catch and wrap database errors
    - Catch and wrap LLM errors
    - Catch and wrap validation errors
    - Log all errors with context
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 6.3 Write property test for findings organization
    - **Property 6: Findings Organization**
    - **Validates: Requirements 3.3**
  
  - [x] 6.4 Write property test for report type indication
    - **Property 11: Report Type Indication**
    - **Validates: Requirements 7.5**
  
  - [x] 6.5 Write property test for error handling
    - **Property 12: Database Error Handling**
    - **Property 13: LLM Error Handling**
    - **Property 14: Invalid JSON Handling**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [x] 6.6 Write property test for error logging
    - **Property 16: Error Logging**
    - **Validates: Requirements 8.5**
  
  - [x] 6.7 Write unit tests for FindingsExtractorService
    - Test successful end-to-end extraction
    - Test with blood test reports
    - Test with radiology reports
    - Test with ECG reports
    - Test empty reports handling
    - Test database failure propagation
    - Test LLM failure propagation
    - Test validation failure propagation
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

- [x] 7. Checkpoint - Ensure service layer works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Findings Display Component (React)
  - [x] 8.1 Create FindingsDisplay component structure
    - Define component props interface (FindingsDisplayProps)
    - Set up component state (findings, loading, error)
    - Implement useEffect hook for data fetching on mount
    - _Requirements: 5.2, 5.3_
  
  - [x] 8.2 Implement data fetching logic
    - Call Findings Extractor Service API on component mount
    - Handle loading state
    - Handle success state
    - Handle error state
    - _Requirements: 5.3, 8.4_
  
  - [x] 8.3 Implement findings rendering
    - Format StructuredFindings as readable text
    - Group findings by report type
    - Highlight abnormal/critical findings with CSS classes
    - Display empty state message when no findings
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.4 Add error boundary and error handling
    - Wrap component in React Error Boundary
    - Display error state UI
    - Add retry button for network errors
    - Prevent parent component crashes
    - _Requirements: 8.4_
  
  - [ ]* 8.5 Write property test for text rendering
    - **Property 8: Text Rendering from Structured Data**
    - **Validates: Requirements 4.1**
  
  - [x] 8.6 Write property test for abnormal highlighting
    - **Property 9: Abnormal Value Highlighting**
    - **Validates: Requirements 4.2**
  
  - [ ]* 8.7 Write property test for display organization
    - **Property 10: Display Organization by Type**
    - **Validates: Requirements 4.3**
  
  - [ ]* 8.8 Write property test for component data fetching
    - **Property 17: Component Data Fetching**
    - **Validates: Requirements 5.3**
  
  - [ ]* 8.9 Write property test for component error state
    - **Property 15: Component Error State**
    - **Validates: Requirements 8.4**
  
  - [ ]* 8.10 Write unit tests for FindingsDisplay component
    - Test loading state display
    - Test successful findings display
    - Test error state display
    - Test empty findings message
    - Test retry button functionality
    - Test abnormal finding highlighting
    - Test findings grouped by type
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.4_

- [x] 9. Add component styling
  - [x] 9.1 Create CSS styles for FindingsDisplay
    - Style text field container
    - Style loading indicator
    - Style error message and retry button
    - Add highlighting styles for abnormal/critical findings
    - Ensure responsive design
    - _Requirements: 4.2_
  
  - [x] 9.2 Ensure accessibility compliance
    - Add ARIA labels for loading/error states
    - Ensure keyboard navigation works
    - Verify color contrast ratios (WCAG AA)
    - Add proper focus indicators
    - Test with screen readers
    - _Requirements: 4.1_

- [x] 10. Create API endpoint for findings
  - [x] 10.1 Create REST API endpoint
    - Define route: `GET /api/patients/:patientId/findings`
    - Wire up FindingsExtractorService
    - Add request validation (patient ID format)
    - Add authentication middleware
    - _Requirements: 5.2_
  
  - [x] 10.2 Add API error handling
    - Return 400 for invalid patient ID
    - Return 401 for missing authentication
    - Return 404 for patient not found
    - Return 500 for unexpected errors
    - Return 503 for database unavailable
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 10.3 Write integration tests for API endpoint
    - Test successful findings retrieval
    - Test invalid patient ID returns 400
    - Test missing auth returns 401
    - Test database error returns 503
    - Test LLM error returns 500
    - _Requirements: 8.1, 8.2_

- [ ] 11. Create test data generators
  - [ ] 11.1 Implement fast-check arbitraries
    - Create `arbitraryPatientId()`
    - Create `arbitraryReportType()`
    - Create `arbitraryDiagnosticReport()`
    - Create `arbitrarySignificance()`
    - Create `arbitraryFinding()`
    - Create `arbitraryStructuredFindings()`
    - _Requirements: All (for testing)_

- [ ] 12. Integration and wiring
  - [ ] 12.1 Wire all components together
    - Connect DatabaseClient to actual database
    - Connect MedGemmaClient to actual API
    - Connect FindingsDisplay to API endpoint
    - Add environment configuration
    - _Requirements: 5.1, 6.2_
  
  - [ ] 12.2 Add configuration management
    - Create config file for database connection
    - Create config file for MedGemma API credentials
    - Add environment variable support
    - _Requirements: 2.1_
  
  - [ ]* 12.3 Write end-to-end integration tests
    - Test complete flow: database → LLM → validation → display
    - Test with real database (test container)
    - Test with mocked MedGemma API
    - Verify error propagation through layers
    - _Requirements: All_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All code examples use TypeScript
- MedGemma integration requires API credentials and endpoint configuration

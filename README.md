# Diagnostic Risk Analyzer

A comprehensive medical AI system that integrates with existing Hospital Management Systems (HMS) to provide automated analysis of medical imaging and reports.

## Project Structure

```
src/
├── types/                 # Core type definitions
│   ├── medical.ts        # Medical data types (images, reports, patient data)
│   ├── analysis.ts       # Analysis result types
│   ├── system.ts         # System-level types (users, auth, errors)
│   └── index.ts          # Type exports
├── interfaces/           # Service interface definitions
│   ├── api-gateway.ts    # API Gateway interface
│   ├── ai-processing.ts  # AI Processing Engine interface
│   ├── data-processing.ts # Data Processing Service interface
│   ├── hms-connector.ts  # HMS Connector interface
│   ├── patient-screen.ts # Patient Screen Interface
│   └── security.ts       # Security & Compliance Layer interface
├── test/                 # Test utilities and setup
│   ├── setup.ts          # Jest test configuration
│   ├── generators.ts     # Fast-check property generators
│   └── types.d.ts        # Test type definitions
├── __tests__/            # Test files
│   └── types.test.ts     # Type definition tests
└── index.ts              # Main entry point
```

## Features

- **Medical Imaging Analysis**: Support for X-ray, CT scan, ECG, and MRI analysis
- **Report Processing**: NLP-based medical report parsing and data extraction
- **Risk Assessment**: AI-powered risk categorization and clinical suggestions
- **HMS Integration**: Seamless integration with existing hospital systems
- **Real-time Updates**: WebSocket-based real-time patient screen updates
- **Security & Compliance**: HIPAA-compliant data handling and audit logging
- **Property-Based Testing**: Comprehensive testing with fast-check generators

## Getting Started

### Prerequisites

- Node.js 18+ 
- TypeScript 5.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Development mode
npm run dev
```

### Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases using Jest
- **Property-Based Tests**: Universal properties using fast-check

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Architecture

The system follows a microservices pattern with clear separation between:

1. **API Gateway**: Central entry point for all system interactions
2. **AI Processing Engine**: Core AI analysis and model inference
3. **Data Processing Service**: Medical imaging and report preprocessing
4. **HMS Connector**: Bidirectional integration with hospital systems
5. **Patient Screen Interface**: Real-time UI for displaying AI insights
6. **Security & Compliance Layer**: Authentication, authorization, and audit logging

## Type System

The project uses a comprehensive TypeScript type system with:

- **Medical Types**: Patient data, medical images, reports, findings
- **Analysis Types**: AI analysis results, risk assessments, clinical suggestions
- **System Types**: Users, authentication, errors, audit logs

## Development Guidelines

- All code must pass TypeScript compilation with strict mode
- Maintain 100% test coverage for core functionality
- Follow ESLint rules for code consistency
- Use property-based testing for universal correctness properties
- Document all public interfaces and types

## License

MIT License - see LICENSE file for details.
# FindingsDisplay Component Structure

## Component Hierarchy

```
FindingsDisplay (default export)
└── FindingsDisplayErrorBoundary
    └── FindingsDisplayInternal
        ├── Loading State
        │   └── Spinner + "Loading findings..."
        ├── Error State
        │   ├── Error Icon
        │   ├── Error Message
        │   └── Retry Button
        └── Findings Content
            ├── Metadata Header
            │   ├── Extraction Date
            │   └── Reports Processed Count
            └── Findings Groups (by Report Type)
                ├── Blood Test Results
                │   └── Finding Items
                ├── Radiology Reports
                │   └── Finding Items
                └── ECG Interpretation
                    └── Finding Items
```

## Finding Item Structure

Each finding item displays:

```
┌─────────────────────────────────────────────┐
│ Finding Name                    Value       │ ← Bold name, colored value
│ Normal range: X-Y                           │ ← Gray text
│ Interpretation text explaining the finding  │ ← Regular text
│ Jan 15, 2024                                │ ← Small gray date
└─────────────────────────────────────────────┘
```

## Color Coding

- **Normal**: White background, gray border, gray text
- **Abnormal**: Yellow background, yellow border, yellow text
- **Critical**: Red background, red border, red text

## State Flow

```
Component Mount
    ↓
Check patientId valid?
    ↓ Yes
Set loading = true
    ↓
Fetch from API
    ↓
    ├─→ Success
    │   ├─→ Parse dates
    │   ├─→ Set findings
    │   ├─→ Call onLoad
    │   └─→ Render findings
    │
    └─→ Error
        ├─→ Set error
        ├─→ Call onError
        └─→ Show error UI with retry
```

## Data Flow

```
API Response
    ↓
Parse JSON
    ↓
Convert date strings to Date objects
    ↓
Store in state
    ↓
Group by report type
    ↓
Render each group
    ↓
Apply significance styling
    ↓
Display to user
```

## File Organization

```
frontend/src/
├── components/
│   ├── FindingsDisplay.tsx              # Main component
│   ├── FindingsDisplayErrorBoundary.tsx # Error boundary
│   └── FindingsDisplay.README.md        # Documentation
└── pages/
    └── patients/
        └── [id]/
            └── findings.tsx             # Example usage page
```

## Key Functions

### Component Functions
- `FindingsDisplay()` - Main export with error boundary
- `FindingsDisplayInternal()` - Core component logic
- `fetchFindings()` - API call and state management
- `handleRetry()` - Retry after error

### Helper Functions
- `renderFindings()` - Main rendering logic
- `groupFindingsByType()` - Groups findings by report type
- `getSignificanceClasses()` - Returns CSS classes for highlighting
- `getSignificanceTextColor()` - Returns text color for significance
- `formatReportType()` - Formats report type for display
- `formatDate()` - Formats dates for display

## CSS Classes

### Component Classes
- `.findings-display` - Root container
- `.findings-loading` - Loading state
- `.findings-error` - Error state
- `.findings-content` - Main content
- `.findings-empty` - Empty state
- `.findings-list` - List container
- `.findings-group` - Report type group
- `.findings-metadata` - Metadata header

### Finding Item Classes
- `.finding-item` - Individual finding
- `.finding-normal` - Normal significance
- `.finding-abnormal` - Abnormal significance
- `.finding-critical` - Critical significance

## Props Interface

```typescript
interface FindingsDisplayProps {
  patientId: string;                    // Required
  onError?: (error: Error) => void;     // Optional
  onLoad?: (findings: StructuredFindings) => void;  // Optional
  className?: string;                   // Optional
}
```

## State Interface

```typescript
interface FindingsDisplayState {
  findings: StructuredFindings | null;  // Findings data or null
  loading: boolean;                     // Loading indicator
  error: Error | null;                  // Error object or null
}
```

## Error Boundary

The error boundary catches:
- Rendering errors in FindingsDisplayInternal
- Errors in helper functions
- React lifecycle errors

It does NOT catch:
- Async errors (handled by fetchFindings)
- Event handler errors (handled by try-catch)
- Errors outside React tree

## Integration Points

### Required Backend Endpoint
```
GET /api/patients/:patientId/findings
Authorization: Bearer <token>
```

### Expected Response
```json
{
  "patientId": "string",
  "extractedAt": "ISO date string",
  "findings": [
    {
      "reportType": "blood_test" | "radiology" | "ecg",
      "reportDate": "ISO date string",
      "findingName": "string",
      "value": "string | null",
      "normalRange": "string | null",
      "significance": "normal" | "abnormal" | "critical",
      "interpretation": "string"
    }
  ],
  "metadata": {
    "totalReportsProcessed": number,
    "processingTimeMs": number,
    "llmModelVersion": "string"
  }
}
```

## Accessibility Features

- Loading state has descriptive text
- Error messages are clear and actionable
- Retry button is keyboard accessible
- Color coding supplemented with text
- Proper heading hierarchy
- ARIA labels where appropriate
- Focus indicators visible

## Performance Considerations

- Component re-fetches only when patientId changes
- Helper functions are pure and efficient
- No unnecessary re-renders
- Date parsing done once on data load
- Grouping done once per render

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- React 18.2+
- Next.js 14+
- Tailwind CSS 3+

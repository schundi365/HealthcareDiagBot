# FindingsDisplay Component

A reusable React component that displays extracted medical findings from diagnostic reports.

## Features

- **Automatic Data Fetching**: Fetches findings data on mount and when patient ID changes
- **Loading States**: Shows spinner and loading message during data fetch
- **Error Handling**: Displays user-friendly error messages with retry functionality
- **Error Boundary**: Prevents component crashes from affecting parent components
- **Findings Rendering**: Formats findings as readable text grouped by report type
- **Visual Highlighting**: Highlights abnormal and critical findings with color coding
- **Empty State**: Shows appropriate message when no findings are available

## Usage

### Basic Usage

```tsx
import FindingsDisplay from '../components/FindingsDisplay';

function PatientPage() {
  return (
    <FindingsDisplay patientId="patient-123" />
  );
}
```

### With Callbacks

```tsx
import FindingsDisplay from '../components/FindingsDisplay';
import type { StructuredFindings } from '../components/FindingsDisplay';

function PatientPage() {
  const handleError = (error: Error) => {
    console.error('Error loading findings:', error);
    // Handle error (e.g., show toast notification)
  };

  const handleLoad = (findings: StructuredFindings) => {
    console.log('Findings loaded:', findings);
    // Handle successful load (e.g., update analytics)
  };

  return (
    <FindingsDisplay
      patientId="patient-123"
      onError={handleError}
      onLoad={handleLoad}
      className="my-custom-class"
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `patientId` | `string` | Yes | Unique identifier for the patient |
| `onError` | `(error: Error) => void` | No | Callback called when an error occurs |
| `onLoad` | `(findings: StructuredFindings) => void` | No | Callback called when findings are successfully loaded |
| `className` | `string` | No | Additional CSS classes to apply to the root element |

## API Endpoint

The component expects a REST API endpoint at:

```
GET /api/patients/:patientId/findings
```

### Response Format

```json
{
  "patientId": "patient-123",
  "extractedAt": "2024-01-15T10:30:00Z",
  "findings": [
    {
      "reportType": "blood_test",
      "reportDate": "2024-01-15T00:00:00Z",
      "findingName": "Hemoglobin",
      "value": "12.5 g/dL",
      "normalRange": "13.5-17.5 g/dL",
      "significance": "abnormal",
      "interpretation": "Below normal range"
    }
  ],
  "metadata": {
    "totalReportsProcessed": 3,
    "processingTimeMs": 1250,
    "llmModelVersion": "medgemma-v1"
  }
}
```

## Styling

The component uses Tailwind CSS classes and includes the following CSS class names for custom styling:

- `.findings-display` - Root container
- `.findings-loading` - Loading state container
- `.findings-error` - Error state container
- `.findings-content` - Main content container
- `.findings-empty` - Empty state container
- `.findings-list` - List of findings
- `.findings-group` - Group of findings by report type
- `.finding-item` - Individual finding item
- `.finding-normal` - Normal finding (green/white)
- `.finding-abnormal` - Abnormal finding (yellow)
- `.finding-critical` - Critical finding (red)

## Error Boundary

The component is automatically wrapped with an error boundary that catches rendering errors and displays a fallback UI. This prevents crashes from propagating to parent components.

To use the unwrapped component (e.g., for testing):

```tsx
import { FindingsDisplayInternal } from '../components/FindingsDisplay';

// Use FindingsDisplayInternal for testing without error boundary
```

## Requirements Satisfied

- **Requirement 4.1**: Text field display with readable formatting
- **Requirement 4.2**: Visual highlighting of abnormal/critical findings
- **Requirement 4.3**: Findings organized by report type
- **Requirement 4.4**: Empty state message when no findings
- **Requirement 5.2**: Embeddable as standalone component
- **Requirement 5.3**: Handles data fetching internally
- **Requirement 8.4**: Error boundary prevents parent crashes

## Browser Support

- Modern browsers with ES6+ support
- React 18.2+
- Next.js 14+

## Accessibility

- Loading states include appropriate ARIA labels
- Error messages are properly associated
- Keyboard navigation supported
- Color contrast ratios meet WCAG AA standards
- Focus indicators visible

## Example Page

See `frontend/src/pages/patients/[id]/findings.tsx` for a complete example of using the component in a Next.js page.

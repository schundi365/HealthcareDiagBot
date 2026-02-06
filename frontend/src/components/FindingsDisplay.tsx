/**
 * Patient Findings Display Component
 * 
 * A reusable React component that displays extracted medical findings from diagnostic reports.
 * This component handles data fetching, loading states, error handling, and rendering of findings.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.2, 5.3, 8.4
 */

import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { FindingsDisplayErrorBoundary } from './FindingsDisplayErrorBoundary';

/**
 * Types imported from backend - these should match the backend types
 */
export enum ReportType {
  BLOOD_TEST = 'blood_test',
  RADIOLOGY = 'radiology',
  ECG = 'ecg'
}

export enum Significance {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  CRITICAL = 'critical'
}

export interface Finding {
  reportType: ReportType;
  reportDate: Date | string;
  findingName: string;
  value: string | null;
  normalRange: string | null;
  significance: Significance;
  interpretation: string;
}

export interface FindingsMetadata {
  totalReportsProcessed: number;
  processingTimeMs: number;
  llmModelVersion: string;
}

export interface StructuredFindings {
  patientId: string;
  extractedAt: Date | string;
  findings: Finding[];
  metadata: FindingsMetadata;
}

/**
 * Props for the FindingsDisplay component
 */
export interface FindingsDisplayProps {
  patientId: string;
  onError?: (error: Error) => void;
  onLoad?: (findings: StructuredFindings) => void;
  className?: string;
}

/**
 * Component state interface
 */
interface FindingsDisplayState {
  findings: StructuredFindings | null;
  loading: boolean;
  error: Error | null;
}

/**
 * FindingsDisplay Component (Internal)
 * 
 * Displays extracted medical findings for a patient in a clean, readable format.
 * Handles data fetching, loading states, and error conditions.
 * 
 * @param props - Component props including patientId and optional callbacks
 * @returns React component
 * 
 * Requirements: 5.2, 5.3
 */
function FindingsDisplayInternal({
  patientId,
  onError,
  onLoad,
  className = ''
}: FindingsDisplayProps): React.ReactElement {
  // Component state: findings, loading, error
  // Requirement: 5.3
  const [state, setState] = useState<FindingsDisplayState>({
    findings: null,
    loading: false,
    error: null
  });

  /**
   * Fetch findings data on component mount or when patientId changes
   * Requirement: 5.3
   */
  useEffect(() => {
    // Skip if no patient ID
    if (!patientId || patientId.trim().length === 0) {
      setState({
        findings: null,
        loading: false,
        error: new Error('Invalid patient ID')
      });
      return;
    }

    // Start loading
    setState({
      findings: null,
      loading: true,
      error: null
    });

    // Fetch findings data
    fetchFindings(patientId);
  }, [patientId]); // Re-fetch when patientId changes

  /**
   * Fetch findings from the API
   * 
   * Calls the Findings Extractor Service API endpoint to retrieve
   * structured findings for the patient.
   * 
   * Handles:
   * - Loading state
   * - Success state (calls onLoad callback)
   * - Error state (calls onError callback)
   * 
   * Requirements: 5.3, 8.4
   */
  const fetchFindings = async (id: string) => {
    try {
      // Call the findings API endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/patients/${id}/findings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token if available
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            : {})
        }
      });

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = 'Failed to load findings';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If error response is not JSON, use status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Parse response data
      const data = await response.json();
      
      // Convert date strings to Date objects
      const findings: StructuredFindings = {
        ...data,
        extractedAt: new Date(data.extractedAt),
        findings: data.findings.map((f: any) => ({
          ...f,
          reportDate: new Date(f.reportDate)
        }))
      };

      // Update state with successful data
      setState({
        findings,
        loading: false,
        error: null
      });

      // Call onLoad callback if provided
      if (onLoad) {
        onLoad(findings);
      }
    } catch (error) {
      // Handle errors
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
      
      setState({
        findings: null,
        loading: false,
        error: errorObj
      });

      // Call onError callback if provided
      if (onError) {
        onError(errorObj);
      }
    }
  };

  /**
   * Retry fetching findings after an error
   */
  const handleRetry = () => {
    fetchFindings(patientId);
  };

  // Render loading state
  // Requirement: 4.1 - Accessibility compliance
  if (state.loading) {
    return (
      <div 
        className={`findings-display ${className}`}
        role="region"
        aria-label="Patient findings"
        aria-busy="true"
      >
        <div className="findings-loading">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
            role="status"
            aria-label="Loading findings"
          ></div>
          <p className="mt-2 text-sm text-gray-600" aria-live="polite">
            Loading findings...
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  // Requirement: 4.1 - Accessibility compliance
  if (state.error) {
    return (
      <div 
        className={`findings-display ${className}`}
        role="region"
        aria-label="Patient findings"
        aria-busy="false"
      >
        <div 
          className="findings-error"
          role="alert"
          aria-live="assertive"
        >
          <ExclamationTriangleIcon 
            className="h-12 w-12 text-red-500" 
            aria-hidden="true"
          />
          <h3 
            className="mt-2 text-sm font-medium text-gray-900"
            id="error-title"
          >
            Error Loading Findings
          </h3>
          <p 
            className="mt-1 text-sm text-gray-500"
            id="error-message"
          >
            {state.error.message}
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            aria-label="Retry loading findings"
            aria-describedby="error-message"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render findings
  // Requirement: 4.1 - Accessibility compliance
  return (
    <div 
      className={`findings-display ${className}`}
      role="region"
      aria-label="Patient findings"
      aria-busy="false"
    >
      <div className="findings-content">
        {renderFindings(state)}
      </div>
    </div>
  );
}

// Helper functions moved outside component

/**
 * Render findings content
 * 
 * Formats StructuredFindings as readable text, groups by report type,
 * highlights abnormal/critical findings, and displays empty state.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
function renderFindings(state: FindingsDisplayState): React.ReactElement {
    // Handle empty findings
    if (!state.findings || state.findings.findings.length === 0) {
      return (
        <div 
          className="findings-empty"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-gray-500">No findings available for this patient.</p>
        </div>
      );
    }

    // Group findings by report type
    // Requirement: 4.3
    const groupedFindings = groupFindingsByType(state.findings.findings);

    return (
      <div className="findings-list space-y-6">
        {/* Metadata header */}
        <div 
          className="findings-metadata text-xs text-gray-500 pb-2 border-b border-gray-200"
          role="contentinfo"
          aria-label="Findings metadata"
        >
          <div>Extracted: {formatDate(state.findings.extractedAt)}</div>
          <div>Reports processed: {state.findings.metadata.totalReportsProcessed}</div>
        </div>

        {/* Render findings grouped by report type */}
        {Object.entries(groupedFindings).map(([reportType, findings]) => (
          <section 
            key={reportType} 
            className="findings-group"
            aria-labelledby={`${reportType}-heading`}
          >
            <h3 
              id={`${reportType}-heading`}
              className="text-sm font-semibold text-gray-900 mb-3"
            >
              {formatReportType(reportType as ReportType)}
            </h3>
            <div className="space-y-3" role="list">
              {findings.map((finding, index) => (
                <article
                  key={`${reportType}-${index}`}
                  className={`finding-item p-3 rounded-md border ${getSignificanceClasses(finding.significance)}`}
                  role="listitem"
                  aria-label={`${finding.findingName}: ${getSignificanceLabel(finding.significance)}`}
                  tabIndex={0}
                >
                  {/* Finding name and value */}
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {finding.findingName}
                    </span>
                    {finding.value && (
                      <span 
                        className={`text-sm font-semibold ${getSignificanceTextColor(finding.significance)}`}
                        aria-label={`Value: ${finding.value}`}
                      >
                        {finding.value}
                      </span>
                    )}
                  </div>

                  {/* Normal range */}
                  {finding.normalRange && (
                    <div className="text-xs text-gray-600 mb-1">
                      <span className="sr-only">Normal range: </span>
                      Normal range: {finding.normalRange}
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="text-sm text-gray-700">
                    <span className="sr-only">Interpretation: </span>
                    {finding.interpretation}
                  </div>

                  {/* Report date */}
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="sr-only">Report date: </span>
                    {formatDate(finding.reportDate)}
                  </div>

                  {/* Significance badge for screen readers */}
                  <span className="sr-only">
                    Significance: {getSignificanceLabel(finding.significance)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

/**
 * Group findings by report type
 * Requirement: 4.3
 */
function groupFindingsByType(findings: Finding[]): Record<ReportType, Finding[]> {
  const grouped: Record<string, Finding[]> = {};

  findings.forEach(finding => {
    if (!grouped[finding.reportType]) {
      grouped[finding.reportType] = [];
    }
    grouped[finding.reportType].push(finding);
  });

  return grouped as Record<ReportType, Finding[]>;
}

/**
 * Get CSS classes for significance highlighting
 * Requirement: 4.2
 */
function getSignificanceClasses(significance: Significance): string {
  switch (significance) {
    case Significance.CRITICAL:
      return 'border-red-300 bg-red-50 finding-critical';
    case Significance.ABNORMAL:
      return 'border-yellow-300 bg-yellow-50 finding-abnormal';
    case Significance.NORMAL:
    default:
      return 'border-gray-200 bg-white finding-normal';
  }
}

/**
 * Get text color for significance
 * Requirement: 4.2
 */
function getSignificanceTextColor(significance: Significance): string {
  switch (significance) {
    case Significance.CRITICAL:
      return 'text-red-700';
    case Significance.ABNORMAL:
      return 'text-yellow-700';
    case Significance.NORMAL:
    default:
      return 'text-gray-700';
  }
}

/**
 * Get human-readable label for significance (for screen readers)
 * Requirement: 4.1 - Accessibility
 */
function getSignificanceLabel(significance: Significance): string {
  switch (significance) {
    case Significance.CRITICAL:
      return 'Critical';
    case Significance.ABNORMAL:
      return 'Abnormal';
    case Significance.NORMAL:
    default:
      return 'Normal';
  }
}

/**
 * Format report type for display
 * Requirement: 4.1
 */
function formatReportType(reportType: ReportType): string {
  switch (reportType) {
    case ReportType.BLOOD_TEST:
      return 'Blood Test Results';
    case ReportType.RADIOLOGY:
      return 'Radiology Reports';
    case ReportType.ECG:
      return 'ECG Interpretation';
    default:
      return reportType;
  }
}

/**
 * Format date for display
 * Requirement: 4.1
 */
function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}


/**
 * Wrapped FindingsDisplay with Error Boundary
 * 
 * This is the default export that wraps the FindingsDisplay component
 * with an error boundary to prevent crashes from propagating to parent components.
 * 
 * Requirement: 8.4
 */
export default function FindingsDisplay(props: FindingsDisplayProps): React.ReactElement {
  return (
    <FindingsDisplayErrorBoundary onError={props.onError}>
      <FindingsDisplayInternal {...props} />
    </FindingsDisplayErrorBoundary>
  );
}

/**
 * Export the unwrapped component for testing purposes
 */
export { FindingsDisplayInternal };

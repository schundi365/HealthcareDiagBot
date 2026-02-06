/**
 * Error Boundary for FindingsDisplay Component
 * 
 * Catches rendering errors in the FindingsDisplay component and displays
 * a fallback UI to prevent parent component crashes.
 * 
 * Requirement: 8.4
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Wraps the FindingsDisplay component to catch and handle rendering errors.
 * Prevents crashes from propagating to parent components.
 * 
 * Requirement: 8.4
 */
export class FindingsDisplayErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('FindingsDisplay Error Boundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would log to an error tracking service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Reset error state to retry rendering
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <div className="findings-display-error-boundary">
          <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Component Error
            </h3>
            <p className="mt-1 text-sm text-gray-500 text-center">
              An error occurred while displaying findings.
            </p>
            {this.state.error && (
              <p className="mt-2 text-xs text-gray-400 text-center font-mono">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FindingsDisplayErrorBoundary;

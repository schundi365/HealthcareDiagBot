/**
 * Patient Findings Page
 * 
 * Displays the FindingsDisplay component for a specific patient.
 * This page demonstrates how to use the FindingsDisplay component.
 */

import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import FindingsDisplay from '../../../components/FindingsDisplay';
import type { StructuredFindings } from '../../../components/FindingsDisplay';

export default function PatientFindingsPage() {
  const router = useRouter();
  const { id } = router.query;

  const handleError = (error: Error) => {
    console.error('Error loading findings:', error);
  };

  const handleLoad = (findings: StructuredFindings) => {
    console.log('Findings loaded successfully:', findings);
  };

  return (
    <Layout title="Patient Findings">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Medical Findings
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Extracted key findings from diagnostic reports
          </p>

          {id && typeof id === 'string' ? (
            <FindingsDisplay
              patientId={id}
              onError={handleError}
              onLoad={handleLoad}
              className="mt-4"
            />
          ) : (
            <div className="text-sm text-gray-500">
              Loading patient information...
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

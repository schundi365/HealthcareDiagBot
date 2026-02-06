/**
 * Patient detail page for Phase 1
 */

import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import {
  UserIcon,
  PhotoIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function PatientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const patientId = id as string;

  const { data: patientData, isLoading: patientLoading, error } = useQuery(
    ['patient', patientId],
    () => apiClient.getPatient(patientId),
    {
      enabled: !!patientId,
    }
  );

  const { data: imagesData, isLoading: imagesLoading } = useQuery(
    ['patient-images', patientId],
    () => apiClient.getPatientImages(patientId),
    {
      enabled: !!patientId,
    }
  );

  const { data: analysesData, isLoading: analysesLoading } = useQuery(
    ['patient-analyses', patientId],
    () => apiClient.getPatientAnalyses(patientId),
    {
      enabled: !!patientId,
    }
  );

  const patient = patientData?.data?.patient;
  const images = imagesData?.data?.images || [];
  const analyses = analysesData?.data?.analyses || [];

  if (patientLoading) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      </Layout>
    );
  }

  if (error || !patient) {
    return (
      <Layout title="Patient Not Found">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Patient not found</div>
          <Link href="/patients" className="btn btn-primary">
            Back to Patients
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={patient.demographics?.name || 'Patient Details'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {patient.demographics?.name || 'Unknown Patient'}
            </h1>
            <p className="text-gray-600">Patient ID: {patient.patientId}</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/images/upload?patientId=${patient.patientId}`}
              className="btn btn-primary flex items-center"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Upload Image
            </Link>
          </div>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.age || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.gender || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.demographics?.emergencyContact || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                {patient.demographics?.address && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{patient.demographics.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium">Quick Stats</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Images</span>
                  <span className="text-lg font-semibold text-gray-900">{images.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Analyses</span>
                  <span className="text-lg font-semibold text-gray-900">{analyses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Visit</span>
                  <span className="text-sm text-gray-900">
                    {patient.created_at
                      ? new Date(patient.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        {(patient.medicalHistory?.length > 0 || patient.currentSymptoms?.length > 0 || patient.medications?.length > 0) && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Medical Information
              </h3>
            </div>
            <div className="card-body space-y-4">
              {patient.medicalHistory?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical History</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {patient.medicalHistory.map((item: string, index: number) => (
                      <p key={index}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.currentSymptoms?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Symptoms</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {patient.currentSymptoms.map((item: string, index: number) => (
                      <p key={index}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.medications?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Medications</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {patient.medications.map((item: string, index: number) => (
                      <span key={index} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medical Images */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Medical Images ({images.length})
              </h3>
              <Link
                href={`/images/upload?patientId=${patient.patientId}`}
                className="btn btn-secondary flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Image
              </Link>
            </div>
          </div>
          <div className="card-body">
            {imagesLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No images uploaded yet</p>
                <Link
                  href={`/images/upload?patientId=${patient.patientId}`}
                  className="btn btn-primary mt-4"
                >
                  Upload First Image
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image: any) => (
                  <div key={image.imageId} className="border border-gray-200 rounded-lg p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {image.imageType || 'Unknown Type'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {image.timestamp
                          ? new Date(image.timestamp).toLocaleDateString()
                          : 'No date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analysis Results ({analyses.length})
            </h3>
          </div>
          <div className="card-body">
            {analysesLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner" />
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No analyses completed yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload medical images to generate AI analysis results
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis: any) => (
                  <div key={analysis.analysisId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {analysis.analysisType || 'Analysis'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {analysis.timestamp
                            ? new Date(analysis.timestamp).toLocaleDateString()
                            : 'No date'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        analysis.status === 'completed'
                          ? 'bg-success-100 text-success-800'
                          : analysis.status === 'processing'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {analysis.status || 'Unknown'}
                      </span>
                    </div>
                    {analysis.findings && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          {JSON.stringify(analysis.findings).substring(0, 200)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
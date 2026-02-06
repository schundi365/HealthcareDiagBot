/**
 * Image upload page for Phase 1
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import {
  ArrowUpTrayIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface UploadForm {
  patientId: string;
  imageType: string;
  description: string;
}

export default function UploadImage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    patientId: '',
    imageType: 'x-ray',
    description: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get patients list for dropdown
  const { data: patientsData } = useQuery(
    'patients-list',
    () => apiClient.listPatients(100, 0)
  );

  const patients = patientsData?.data?.patients || [];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Check file size (10MB limit for Phase 1)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/dicom': ['.dcm', '.dicom'],
    },
    multiple: false,
  });

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.patientId) {
      toast.error('Please select a file and patient');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const metadata = {
        description: uploadForm.description,
        uploadedAt: new Date().toISOString(),
        fileSize: selectedFile.size,
        fileName: selectedFile.name,
      };

      const result = await apiClient.uploadImage(
        selectedFile,
        uploadForm.patientId,
        uploadForm.imageType,
        metadata
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Image uploaded successfully');
      
      // Redirect to image view or analysis
      setTimeout(() => {
        router.push(`/patients/${uploadForm.patientId}`);
      }, 1000);

    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to upload image');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout title="Upload Medical Image">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Upload Medical Image</h1>
          <p className="text-gray-600">Upload medical images for AI analysis</p>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Select Image File</h3>
            </div>
            <div className="card-body">
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop the image here' : 'Upload medical image'}
                  </p>
                  <p className="text-gray-500 mb-4">
                    Drag and drop your image file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports: JPEG, PNG, DICOM • Max size: 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uploading...</span>
                        <span className="text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Image Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                  Patient *
                </label>
                <select
                  value={uploadForm.patientId}
                  onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient: any) => (
                    <option key={patient.patientId} value={patient.patientId}>
                      {patient.demographics?.name || 'Unknown'} ({patient.patientId})
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No patients found. <a href="/patients/new" className="text-primary-600">Create a patient first</a>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="imageType" className="block text-sm font-medium text-gray-700">
                  Image Type *
                </label>
                <select
                  value={uploadForm.imageType}
                  onChange={(e) => setUploadForm({ ...uploadForm, imageType: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                >
                  <option value="x-ray">X-Ray</option>
                  <option value="ct-scan">CT Scan</option>
                  <option value="mri">MRI</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="mammography">Mammography</option>
                  <option value="ecg">ECG/EKG</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Optional description or notes about this image"
                />
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadForm.patientId || isUploading}
              className="btn btn-primary disabled:opacity-50 flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner mr-2" />
                  Uploading...
                </>
              ) : uploadProgress === 100 ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Uploaded
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Phase 1 Information */}
        <div className="mt-8 card">
          <div className="card-body">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-medical-100 rounded-lg flex items-center justify-center">
                  <span className="text-medical-600 font-bold">1</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Phase 1 - Image Processing</h3>
                <p className="text-gray-600 mt-1">
                  Images are processed using AI models from Hugging Face and OpenAI. 
                  Analysis includes basic medical image interpretation and risk assessment.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Supported Formats:</span>
                    <span className="text-gray-600 ml-1">JPEG, PNG, DICOM</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Max File Size:</span>
                    <span className="text-gray-600 ml-1">10MB</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Processing Time:</span>
                    <span className="text-gray-600 ml-1">30-60 seconds</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">AI Models:</span>
                    <span className="text-gray-600 ml-1">HuggingFace + OpenAI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
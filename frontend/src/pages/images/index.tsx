/**
 * Images list page for Phase 1
 */

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';
import {
  PhotoIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export default function Images() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: storageData, isLoading: storageLoading } = useQuery(
    'storage-stats',
    () => apiClient.getStorageStats()
  );

  const storageStats = storageData?.data || {};

  return (
    <Layout title="Medical Images">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Medical Images</h1>
            <p className="text-gray-600">Upload and manage medical images for analysis</p>
          </div>
          <Link
            href="/images/upload"
            className="btn btn-primary flex items-center"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Upload Image
          </Link>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Images</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {storageLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      storageStats.totalImages || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-success-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MB</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {storageLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      `${storageStats.storageUsed || 0} MB`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-warning-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Storage Limit</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {storageLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      `${Math.round(((storageStats.storageUsed || 0) / 25000) * 100)}%`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">25GB Free Tier</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search images by patient ID or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Images Grid */}
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No images uploaded yet
              </h3>
              <p className="text-gray-500 mb-4">
                Upload your first medical image to get started with AI analysis
              </p>
              <Link href="/images/upload" className="btn btn-primary">
                Upload First Image
              </Link>
            </div>
          </div>
        </div>

        {/* Phase 1 Storage Information */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-medical-100 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-6 w-6 text-medical-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Phase 1 - Image Storage</h3>
                <p className="text-gray-600 mt-1">
                  Images are stored using Cloudinary's free tier with 25GB storage and bandwidth.
                  Supported formats: JPEG, PNG, DICOM (converted to JPEG for display).
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Storage Limit:</span>
                    <span className="text-gray-600 ml-1">25GB</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Bandwidth:</span>
                    <span className="text-gray-600 ml-1">25GB/month</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Max File Size:</span>
                    <span className="text-gray-600 ml-1">10MB</span>
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
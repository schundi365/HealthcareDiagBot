/**
 * Analytics page for Phase 1
 */

import React from 'react';
import { useQuery } from 'react-query';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import {
  ChartBarIcon,
  UserGroupIcon,
  PhotoIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Analytics() {
  const { data: statsData, isLoading } = useQuery(
    'analytics-stats',
    () => apiClient.getAnalysisStats()
  );

  const stats = statsData?.data?.stats || {};

  return (
    <Layout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Overview of system usage and analysis results</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Patients"
            value={stats.database?.totalPatients || 0}
            icon={UserGroupIcon}
            color="medical"
            loading={isLoading}
          />
          <StatCard
            title="Images Processed"
            value={stats.database?.totalImages || 0}
            icon={PhotoIcon}
            color="primary"
            loading={isLoading}
          />
          <StatCard
            title="Analyses Completed"
            value={stats.database?.totalAnalyses || 0}
            icon={ChartBarIcon}
            color="success"
            loading={isLoading}
          />
          <StatCard
            title="Avg Processing Time"
            value={stats.performance?.averageProcessingTime ? `${stats.performance.averageProcessingTime}s` : 'N/A'}
            icon={ClockIcon}
            color="warning"
            loading={isLoading}
          />
        </div>

        {/* System Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm text-gray-900">
                    {stats.database?.storageUsed || 0} MB / 500 MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Service Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Image Storage</span>
                  <span className="text-sm text-gray-900">
                    {Math.round(((stats.database?.storageUsed || 0) / 25000) * 100)}% of 25GB
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="card-body">
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">Activity will appear here as you use the system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Analysis Results Summary</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-12 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
              <p className="text-gray-500 mb-4">
                Upload medical images to start generating analysis results
              </p>
              <a href="/images/upload" className="btn btn-primary">
                Upload First Image
              </a>
            </div>
          </div>
        </div>

        {/* Phase 1 Analytics Information */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-medical-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-medical-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Phase 1 - Basic Analytics</h3>
                <p className="text-gray-600 mt-1">
                  This analytics dashboard provides basic system metrics and usage statistics.
                  Advanced analytics features will be available in Phase 2 with enhanced AI models.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Metrics:</span>
                    <span className="text-gray-600 ml-1">Basic usage stats</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Real-time:</span>
                    <span className="text-gray-600 ml-1">System health monitoring</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Export:</span>
                    <span className="text-gray-600 ml-1">Coming in Phase 2</span>
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'medical' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, loading }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-500',
    medical: 'bg-medical-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                value
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
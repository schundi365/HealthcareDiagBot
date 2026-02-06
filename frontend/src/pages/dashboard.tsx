/**
 * Dashboard page for Phase 1
 */

import React from 'react';
import { useQuery } from 'react-query';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import {
  UserGroupIcon,
  PhotoIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalPatients: number;
  totalImages: number;
  totalAnalyses: number;
  storageUsed: number;
}

export default function Dashboard() {
  const { data: healthData, isLoading: healthLoading } = useQuery(
    'health',
    () => apiClient.healthCheck(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: statsData, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => apiClient.getAnalysisStats(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const stats: DashboardStats = statsData?.data?.stats?.database || {
    totalPatients: 0,
    totalImages: 0,
    totalAnalyses: 0,
    storageUsed: 0,
  };

  const isHealthy = healthData?.status === 'healthy';

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* System Status */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                <p className="text-sm text-gray-500">Phase 1 - Free Tier MVP</p>
              </div>
              <div className="flex items-center">
                {healthLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <div className={`flex items-center ${isHealthy ? 'text-success-600' : 'text-danger-600'}`}>
                    {isHealthy ? (
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">
                      {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {healthData && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    healthData.services?.database?.status === 'up' ? 'bg-success-500' : 'bg-danger-500'
                  }`} />
                  <span className="text-sm text-gray-600">Database (Supabase)</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    healthData.services?.storage?.status === 'up' ? 'bg-success-500' : 'bg-danger-500'
                  }`} />
                  <span className="text-sm text-gray-600">Storage (Cloudinary)</span>
                </div>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    healthData.services?.ai?.status === 'up' ? 'bg-success-500' : 'bg-danger-500'
                  }`} />
                  <span className="text-sm text-gray-600">AI Services</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={UserGroupIcon}
            color="medical"
            loading={statsLoading}
          />
          <StatCard
            title="Medical Images"
            value={stats.totalImages}
            icon={PhotoIcon}
            color="primary"
            loading={statsLoading}
          />
          <StatCard
            title="Analyses Completed"
            value={stats.totalAnalyses}
            icon={ChartBarIcon}
            color="success"
            loading={statsLoading}
          />
          <StatCard
            title="Storage Used"
            value={`${stats.storageUsed} MB`}
            icon={ClockIcon}
            color="warning"
            loading={statsLoading}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <QuickActionButton
                  href="/patients/new"
                  title="Add New Patient"
                  description="Create a new patient record"
                  icon={UserGroupIcon}
                />
                <QuickActionButton
                  href="/images/upload"
                  title="Upload Medical Image"
                  description="Upload and analyze medical images"
                  icon={PhotoIcon}
                />
                <QuickActionButton
                  href="/analytics"
                  title="View Analytics"
                  description="Review analysis results and trends"
                  icon={ChartBarIcon}
                />
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
                <p className="text-sm mt-1">Start by adding a patient or uploading an image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1 Information */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-medical-100 rounded-lg flex items-center justify-center">
                  <span className="text-medical-600 font-bold">1</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Phase 1 - MVP Deployment</h3>
                <p className="text-gray-600 mt-1">
                  You're running the free tier version of the Diagnostic Risk Analyzer. 
                  This includes basic AI analysis, patient management, and image processing capabilities.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Database:</span>
                    <span className="text-gray-600 ml-1">Supabase (500MB)</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Storage:</span>
                    <span className="text-gray-600 ml-1">Cloudinary (25GB)</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">AI:</span>
                    <span className="text-gray-600 ml-1">HuggingFace + OpenAI</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Hosting:</span>
                    <span className="text-gray-600 ml-1">Railway + Vercel</span>
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

interface QuickActionButtonProps {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuickActionButton({ href, title, description, icon: Icon }: QuickActionButtonProps) {
  return (
    <a
      href={href}
      className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
}
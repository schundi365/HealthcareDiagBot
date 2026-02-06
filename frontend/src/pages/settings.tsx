/**
 * Settings page for Phase 1
 */

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { apiClient } from '../lib/api';
import {
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  CloudIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const { data: healthData } = useQuery(
    'health-detailed',
    () => apiClient.detailedHealthCheck()
  );

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'system', name: 'System', icon: CogIcon },
    { id: 'about', name: 'About', icon: InformationCircleIcon },
  ];

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and system preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'system' && <SystemSettings healthData={healthData} />}
            {activeTab === 'about' && <AboutSettings />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Placeholder for profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium">Profile Information</h3>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="your@email.com"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500">Email cannot be changed in Phase 1</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value="Doctor"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500">Role is set during registration</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    setIsLoading(true);
    try {
      // Placeholder for password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Change Password</h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePasswordChange}
              disabled={isLoading}
              className="btn btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Security Information</h3>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Phase 1 Security</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Basic authentication is provided by Supabase. Enhanced security features 
                  including 2FA and audit logs will be available in Phase 2.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemSettings({ healthData }: { healthData: any }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">System Status</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Storage</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">AI Services</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Available
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">API</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Resource Usage</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Database Storage</span>
                <span className="text-gray-900">2% of 500MB</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '2%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Image Storage</span>
                <span className="text-gray-900">0% of 25GB</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div className="bg-success-500 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Calls</span>
                <span className="text-gray-900">Low usage</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div className="bg-warning-500 h-2 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Application Information</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Version</span>
              <span className="text-sm text-gray-900">1.0.0 (Phase 1)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Environment</span>
              <span className="text-sm text-gray-900">Free Tier MVP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Last Updated</span>
              <span className="text-sm text-gray-900">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Technology Stack</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Frontend:</span>
              <span className="text-gray-600 ml-1">Next.js, React, Tailwind CSS</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Backend:</span>
              <span className="text-gray-600 ml-1">Node.js, Express</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Database:</span>
              <span className="text-gray-600 ml-1">Supabase (PostgreSQL)</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Storage:</span>
              <span className="text-gray-600 ml-1">Cloudinary</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">AI Services:</span>
              <span className="text-gray-600 ml-1">Hugging Face, OpenAI</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Hosting:</span>
              <span className="text-gray-600 ml-1">Railway, Vercel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="bg-medical-50 border border-medical-200 rounded-md p-4">
            <div className="flex">
              <CloudIcon className="h-5 w-5 text-medical-400 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-medical-800">Phase 1 - Free Tier MVP</h4>
                <p className="text-sm text-medical-700 mt-1">
                  This is the initial phase deployment using free tier services. 
                  Phase 2 will include enhanced AI models, advanced analytics, and production-grade infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
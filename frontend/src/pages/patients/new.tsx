/**
 * New patient page for Phase 1
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Layout from '../../components/Layout';
import { apiClient } from '../../lib/api';

interface PatientForm {
  name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  currentSymptoms?: string;
  medications?: string;
}

export default function NewPatient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientForm>();

  const onSubmit = async (data: PatientForm) => {
    setIsLoading(true);
    try {
      const patientData = {
        patientId: `PAT-${Date.now()}`, // Simple ID generation for Phase 1
        demographics: {
          name: data.name,
          age: data.age,
          gender: data.gender,
          email: data.email,
          phone: data.phone,
          address: data.address,
          emergencyContact: data.emergencyContact,
        },
        medicalHistory: data.medicalHistory ? [data.medicalHistory] : [],
        currentSymptoms: data.currentSymptoms ? [data.currentSymptoms] : [],
        medications: data.medications ? data.medications.split(',').map(m => m.trim()) : [],
        imaging: [],
        reports: [],
        fhirData: {},
      };

      const result = await apiClient.createPatient(patientData);
      toast.success('Patient created successfully');
      router.push(`/patients/${result.data.patient.patientId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="New Patient">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Patient</h1>
          <p className="text-gray-600">Create a new patient record</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Basic Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter patient's full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age *
                  </label>
                  <input
                    {...register('age', {
                      required: 'Age is required',
                      min: { value: 0, message: 'Age must be positive' },
                      max: { value: 150, message: 'Age must be realistic' },
                    })}
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter age"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="patient@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter patient's address"
                />
              </div>

              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                  Emergency Contact
                </label>
                <input
                  {...register('emergencyContact')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Name and phone number"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium">Medical Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                  Medical History
                </label>
                <textarea
                  {...register('medicalHistory')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Previous conditions, surgeries, allergies, etc."
                />
              </div>

              <div>
                <label htmlFor="currentSymptoms" className="block text-sm font-medium text-gray-700">
                  Current Symptoms
                </label>
                <textarea
                  {...register('currentSymptoms')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Current symptoms or complaints"
                />
              </div>

              <div>
                <label htmlFor="medications" className="block text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <textarea
                  {...register('medications')}
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="List current medications (comma-separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate multiple medications with commas
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
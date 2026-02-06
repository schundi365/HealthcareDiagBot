/**
 * API client for Phase 1 frontend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          window.location.href = '/auth/signin';
          toast.error('Session expired. Please sign in again.');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data?.error?.message) {
          toast.error(error.response.data.error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  // Auth methods
  async signUp(email: string, password: string, role: string = 'doctor') {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      role,
    });
    
    if (response.data.data.session?.access_token) {
      this.setAuthToken(response.data.data.session.access_token);
    }
    
    return response.data;
  }

  async signIn(email: string, password: string) {
    const response = await this.client.post('/auth/signin', {
      email,
      password,
    });
    
    if (response.data.data.access_token) {
      this.setAuthToken(response.data.data.access_token);
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  }

  async signOut() {
    try {
      await this.client.post('/auth/signout');
    } finally {
      this.clearAuthToken();
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Patient methods
  async createPatient(patientData: any) {
    const response = await this.client.post('/patients', patientData);
    return response.data;
  }

  async getPatient(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}`);
    return response.data;
  }

  async updatePatient(patientId: string, updates: any) {
    const response = await this.client.put(`/patients/${patientId}`, updates);
    return response.data;
  }

  async listPatients(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/patients', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getPatientImages(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}/images`);
    return response.data;
  }

  async getPatientAnalyses(patientId: string) {
    const response = await this.client.get(`/patients/${patientId}/analyses`);
    return response.data;
  }

  // Image methods
  async uploadImage(file: File, patientId: string, imageType: string, metadata: any) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);
    formData.append('imageType', imageType);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await this.client.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    });
    return response.data;
  }

  async getImage(imageId: string) {
    const response = await this.client.get(`/images/${imageId}`);
    return response.data;
  }

  async getImageUrl(imageId: string, options?: { width?: number; height?: number; quality?: string }) {
    const response = await this.client.get(`/images/${imageId}/url`, {
      params: options,
    });
    return response.data;
  }

  async deleteImage(imageId: string) {
    const response = await this.client.delete(`/images/${imageId}`);
    return response.data;
  }

  async getStorageStats() {
    const response = await this.client.get('/images/stats/storage');
    return response.data;
  }

  // Analysis methods
  async analyzeImage(imageId: string, analysisType: string = 'imaging') {
    const response = await this.client.post('/analysis/analyze', {
      imageId,
      analysisType,
    });
    return response.data;
  }

  async getAnalysis(analysisId: string) {
    const response = await this.client.get(`/analysis/${analysisId}`);
    return response.data;
  }

  async getPatientAnalysesList(patientId: string, limit: number = 20, offset: number = 0) {
    const response = await this.client.get(`/analysis/patient/${patientId}`, {
      params: { limit, offset },
    });
    return response.data;
  }

  async getPatientAnalysisSummary(patientId: string) {
    const response = await this.client.get(`/analysis/patient/${patientId}/summary`);
    return response.data;
  }

  async rerunAnalysis(analysisId: string) {
    const response = await this.client.post(`/analysis/${analysisId}/rerun`);
    return response.data;
  }

  async getAnalysisStats() {
    const response = await this.client.get('/analysis/stats/overview');
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health', {
      baseURL: API_URL, // Use base URL without /api prefix
    });
    return response.data;
  }

  async detailedHealthCheck() {
    const response = await this.client.get('/health/detailed', {
      baseURL: API_URL,
    });
    return response.data;
  }
}

export const apiClient = new APIClient();
export default apiClient;
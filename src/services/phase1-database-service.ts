/**
 * Phase 1 Database Service - Supabase Implementation
 * Replaces Google Cloud SQL with Supabase for free tier
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { phase1Config } from '../config/phase1-config';
import { PatientData, AnalysisResult, MedicalImage } from '../types/medical';

export interface DatabaseTables {
  patients: PatientData;
  medical_images: MedicalImage & { 
    storage_url?: string; 
    cloudinary_public_id?: string;
  };
  analysis_results: AnalysisResult;
  users: {
    id: string;
    email: string;
    role: 'doctor' | 'nurse' | 'admin' | 'researcher';
    created_at: string;
    last_login?: string;
  };
}

export class Phase1DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      phase1Config.supabase.url,
      phase1Config.supabase.anonKey
    );
  }

  /**
   * Initialize database tables (run once during setup)
   */
  async initializeTables(): Promise<void> {
    try {
      // Create patients table
      await this.supabase.rpc('create_patients_table');
      
      // Create medical_images table
      await this.supabase.rpc('create_medical_images_table');
      
      // Create analysis_results table
      await this.supabase.rpc('create_analysis_results_table');
      
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      // Tables might already exist, which is fine
    }
  }

  /**
   * Patient Management
   */
  async createPatient(patient: Omit<PatientData, 'patientId'>): Promise<PatientData> {
    const patientWithId = {
      ...patient,
      patientId: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const { data, error } = await this.supabase
      .from('patients')
      .insert([patientWithId])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return data;
  }

  async getPatient(patientId: string): Promise<PatientData | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('patientId', patientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Patient not found
      }
      throw new Error(`Failed to get patient: ${error.message}`);
    }

    return data;
  }

  async updatePatient(patientId: string, updates: Partial<PatientData>): Promise<PatientData> {
    const { data, error } = await this.supabase
      .from('patients')
      .update(updates)
      .eq('patientId', patientId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    return data;
  }

  async listPatients(limit: number = 50, offset: number = 0): Promise<PatientData[]> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list patients: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Medical Image Management
   */
  async saveMedicalImage(
    image: MedicalImage, 
    storageUrl?: string, 
    cloudinaryPublicId?: string
  ): Promise<void> {
    const imageRecord = {
      ...image,
      storage_url: storageUrl,
      cloudinary_public_id: cloudinaryPublicId,
      // Convert Buffer to base64 for storage (not recommended for production)
      imageData: image.imageData.toString('base64'),
    };

    const { error } = await this.supabase
      .from('medical_images')
      .insert([imageRecord]);

    if (error) {
      throw new Error(`Failed to save medical image: ${error.message}`);
    }
  }

  async getMedicalImage(imageId: string): Promise<MedicalImage | null> {
    const { data, error } = await this.supabase
      .from('medical_images')
      .select('*')
      .eq('imageId', imageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get medical image: ${error.message}`);
    }

    // Convert base64 back to Buffer
    return {
      ...data,
      imageData: Buffer.from(data.imageData, 'base64'),
    };
  }

  async getPatientImages(patientId: string): Promise<MedicalImage[]> {
    const { data, error } = await this.supabase
      .from('medical_images')
      .select('*')
      .eq('patientId', patientId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to get patient images: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      imageData: Buffer.from(item.imageData, 'base64'),
    }));
  }

  /**
   * Analysis Results Management
   */
  async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    const { error } = await this.supabase
      .from('analysis_results')
      .insert([result]);

    if (error) {
      throw new Error(`Failed to save analysis result: ${error.message}`);
    }
  }

  async getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
    const { data, error } = await this.supabase
      .from('analysis_results')
      .select('*')
      .eq('analysisId', analysisId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get analysis result: ${error.message}`);
    }

    return data;
  }

  async getPatientAnalyses(patientId: string): Promise<AnalysisResult[]> {
    const { data, error } = await this.supabase
      .from('analysis_results')
      .select('*')
      .eq('patientId', patientId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to get patient analyses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * User Management (using Supabase Auth)
   */
  async signUp(email: string, password: string, role: string = 'doctor'): Promise<any> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) {
      throw new Error(`Failed to sign up: ${error.message}`);
    }

    return data;
  }

  async signIn(email: string, password: string): Promise<any> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to sign in: ${error.message}`);
    }

    return data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }

    return user;
  }

  /**
   * Database Statistics
   */
  async getDatabaseStats(): Promise<{
    totalPatients: number;
    totalImages: number;
    totalAnalyses: number;
    storageUsed: number; // in MB
  }> {
    try {
      const [patientsCount, imagesCount, analysesCount] = await Promise.all([
        this.supabase.from('patients').select('*', { count: 'exact', head: true }),
        this.supabase.from('medical_images').select('*', { count: 'exact', head: true }),
        this.supabase.from('analysis_results').select('*', { count: 'exact', head: true }),
      ]);

      // Estimate storage usage (rough calculation)
      const { data: images } = await this.supabase
        .from('medical_images')
        .select('imageData');

      const storageUsed = (images || []).reduce((total, img) => {
        return total + (img.imageData ? Buffer.byteLength(img.imageData, 'base64') : 0);
      }, 0) / (1024 * 1024); // Convert to MB

      return {
        totalPatients: patientsCount.count || 0,
        totalImages: imagesCount.count || 0,
        totalAnalyses: analysesCount.count || 0,
        storageUsed: Math.round(storageUsed * 100) / 100,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalPatients: 0,
        totalImages: 0,
        totalAnalyses: 0,
        storageUsed: 0,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}
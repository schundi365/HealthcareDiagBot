/**
 * Phase 1 Configuration - Free Tier Services
 * Replaces GCP services with free alternatives for MVP
 */

export interface Phase1Config {
  // Database (Supabase)
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  
  // AI Services
  ai: {
    huggingface: {
      apiKey: string;
      baseUrl: string;
      models: {
        medicalImageAnalysis: string;
        textAnalysis: string;
      };
    };
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
  };
  
  // File Storage (Cloudinary)
  storage: {
    cloudinary: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
  };
  
  // App Configuration
  app: {
    port: number;
    environment: 'development' | 'production';
    frontendUrl: string;
    maxFileSize: number; // in MB
    allowedImageTypes: string[];
  };
}

export const phase1Config: Phase1Config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  
  ai: {
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      baseUrl: 'https://api-inference.huggingface.co',
      models: {
        medicalImageAnalysis: 'microsoft/DialoGPT-medium', // Placeholder - will use medical models
        textAnalysis: 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract',
      },
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
    },
  },
  
  storage: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
  },
  
  app: {
    port: parseInt(process.env.PORT || '3001'),
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    maxFileSize: 10, // 10MB limit for free tier
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/dicom'],
  },
};

// Validation function
export function validatePhase1Config(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn about optional but recommended variables
  const recommended = [
    'HUGGINGFACE_API_KEY',
    'OPENAI_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
  ];
  
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
}
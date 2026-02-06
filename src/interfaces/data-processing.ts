/**
 * Data Processing Service interface definitions
 */

import { 
  MedicalImage, 
  MedicalReport, 
  QualityAssessment, 
  PatientData, 
  AnonymizedData 
} from '../types';

export interface DataProcessingService {
  validateImageQuality(image: MedicalImage): Promise<QualityAssessment>;
  preprocessImage(image: MedicalImage): Promise<ProcessedImage>;
  extractReportData(report: MedicalReport): Promise<StructuredData>;
  anonymizeData(patientData: PatientData): Promise<AnonymizedData>;
}

export interface ProcessedImage {
  imageId: string;
  processedData: Buffer;
  transformations: ImageTransformation[];
  qualityMetrics: QualityMetrics;
  timestamp: Date;
}

export interface ImageTransformation {
  transformationType: 'resize' | 'normalize' | 'denoise' | 'enhance';
  parameters: Record<string, any>;
  appliedAt: Date;
}

export interface QualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  noiseLevel: number;
  overallScore: number;
}

export interface StructuredData {
  reportId: string;
  extractedFields: Record<string, any>;
  confidence: number;
  extractionMethod: string;
  timestamp: Date;
}
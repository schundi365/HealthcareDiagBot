/**
 * Analysis result types and interfaces
 * Enhanced for MedGemma 1.5 and Google Cloud Platform integration
 */

import { Finding, MedGemmaFinding, SpecialtyInsight } from './medical';

export interface AnalysisResult {
  analysisId: string;
  patientId: string;
  timestamp: Date;
  analysisType: 'imaging' | 'report' | 'combined';
  findings: MedGemmaFinding[]; // Enhanced with MedGemma 1.5 insights
  riskAssessment: RiskAssessment;
  clinicalSuggestions: ClinicalSuggestion[];
  processingMetrics: ProcessingMetrics;
  status: 'pending' | 'completed' | 'failed';
  vertexAIModelUsed: string; // Vertex AI model identifier
  gcpProcessingRegion: string; // GCP region for compliance
}

// MedGemma 1.5 specific analysis interface
export interface MedGemmaAnalysis {
  findings: MedGemmaFinding[];
  confidence: number;
  anatomicalAnnotations: ImageAnnotation[];
  processingTime: number;
  modelVersion: string;
  specialtyInsights: SpecialtyInsight[];
}

export interface ImagingAnalysis {
  findings: Finding[];
  confidence: number;
  annotations: ImageAnnotation[];
  processingTime: number;
}

export interface ImageAnnotation {
  annotationId: string;
  type: 'highlight' | 'arrow' | 'circle' | 'rectangle';
  coordinates: { x: number; y: number };
  dimensions?: { width: number; height: number };
  label: string;
  confidence: number;
  medGemmaGenerated?: boolean; // Flag for MedGemma annotations
}

export interface ReportAnalysis {
  extractedData: Record<string, any>;
  findings: Finding[];
  confidence: number;
  processingTime: number;
}

export interface RiskAssessment {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskFactors: RiskFactor[];
  clinicalSuggestions: ClinicalSuggestion[];
  urgencyScore: number;
  evidenceQuality: number;
}

export interface RiskFactor {
  factorId: string;
  name: string;
  category: 'cardiovascular' | 'respiratory' | 'neurological' | 'oncological' | 'other';
  severity: number; // 1-10 scale
  evidence: Evidence[];
  interactions: string[]; // IDs of related risk factors
  medGemmaGenerated: boolean;
  clinicalValidation: ValidationStatus;
}

export interface ValidationStatus {
  isValidated: boolean;
  validatedBy?: string;
  validationDate?: Date;
  confidence: number;
}

export interface Evidence {
  evidenceId: string;
  type: 'imaging' | 'lab' | 'clinical' | 'literature';
  source: string;
  description: string;
  confidence: number;
  timestamp: Date;
}

export interface ClinicalSuggestion {
  suggestionId: string;
  type: 'diagnostic' | 'therapeutic' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  rationale: string;
  literatureReferences: Reference[];
  contraindications?: string[];
  medGemmaConfidence: number;
  specialtyRecommendation: SpecialtyInsight;
}

export interface Reference {
  referenceId: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface ProcessingMetrics {
  processingTime: number;
  modelVersion: string;
  confidenceDistribution: Record<string, number>;
  resourceUsage: GCPResourceUsage;
  vertexAIEndpoint: string;
  costEstimate: CostBreakdown;
}

export interface GCPResourceUsage {
  computeUnits: number;
  memoryUsage: number;
  storageAccessed: number;
  networkEgress: number;
  vertexAIPredictions: number;
}

export interface CostBreakdown {
  computeCost: number;
  storageCost: number;
  networkCost: number;
  vertexAICost: number;
  totalCost: number;
  currency: string;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsage: number;
  gpuTime?: number;
  diskIO: number;
}

export interface CorrelatedAnalysis {
  correlationId: string;
  patientId: string;
  inputModalities: string[];
  correlatedFindings: Finding[];
  crossModalityInsights: CrossModalityInsight[];
  confidence: number;
  timestamp: Date;
}

export interface CrossModalityInsight {
  insightId: string;
  description: string;
  supportingModalities: string[];
  confidence: number;
  clinicalSignificance: 'low' | 'medium' | 'high';
}

export interface QualityAssessment {
  isAcceptable: boolean;
  qualityScore: number;
  issues: QualityIssue[];
  requiresManualReview: boolean;
  dicomCompliance: boolean;
}

export interface QualityIssue {
  issueId: string;
  type: 'resolution' | 'contrast' | 'noise' | 'artifact' | 'positioning';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}

export interface ResourceUsage {
  cpuTime: number;
  memoryUsage: number;
  gpuTime?: number;
  diskIO: number;
}

export interface CorrelatedAnalysis {
  correlationId: string;
  patientId: string;
  inputModalities: string[];
  correlatedFindings: Finding[];
  crossModalityInsights: CrossModalityInsight[];
  confidence: number;
  timestamp: Date;
}

export interface CrossModalityInsight {
  insightId: string;
  description: string;
  supportingModalities: string[];
  confidence: number;
  clinicalSignificance: 'low' | 'medium' | 'high';
}

export interface QualityAssessment {
  isAcceptable: boolean;
  qualityScore: number;
  issues: QualityIssue[];
  requiresManualReview: boolean;
}

export interface QualityIssue {
  issueId: string;
  type: 'resolution' | 'contrast' | 'noise' | 'artifact' | 'positioning';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}
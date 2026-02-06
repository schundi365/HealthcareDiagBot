/**
 * System-level types and interfaces
 * Enhanced for Google Cloud Platform and MedGemma 1.5 integration
 */

export interface User {
  userId: string;
  username: string;
  role: 'doctor' | 'nurse' | 'admin' | 'researcher';
  permissions: Permission[];
  department: string;
  lastLogin: Date;
  gcpIAMRole: string; // Cloud IAM role mapping
  mfaEnabled: boolean;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
  gcpIAMBinding: string; // IAM policy binding
}

export interface AuthToken {
  token: string;
  userId: string;
  role: string;
  expiresAt: Date;
  permissions: string[];
}

export interface UserCredentials {
  username: string;
  password: string;
  mfaToken?: string;
}

export interface AuthResult {
  success: boolean;
  token?: AuthToken;
  user?: User;
  error?: string;
}

export interface ModelConfiguration {
  modelId: string;
  modelType: 'imaging' | 'nlp' | 'risk_assessment';
  version: string;
  parameters: Record<string, any>;
  performanceMetrics: ModelMetrics;
  deploymentStatus: 'active' | 'staging' | 'deprecated';
  vertexAIEndpoint: string; // Vertex AI model endpoint
  medGemmaVersion?: string; // MedGemma 1.5 version if applicable
  gcpRegion: string;
  costPerPrediction: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  processingTime: number;
  lastUpdated: Date;
}

// GCP Deployment Configuration
export interface GCPDeploymentConfig {
  projectId: string;
  region: string;
  zone: string;
  gkeClusterName: string;
  cloudRunServices: CloudRunService[];
  vertexAIModels: VertexAIModel[];
  healthcareDatasets: HealthcareDataset[];
  costOptimization: CostOptimizationConfig;
}

export interface CloudRunService {
  serviceName: string;
  image: string;
  minInstances: number;
  maxInstances: number;
  cpuLimit: string;
  memoryLimit: string;
  environmentVariables: Record<string, string>;
}

export interface VertexAIModel {
  displayName: string;
  modelId: string;
  endpointId: string;
  trafficSplit: Record<string, number>;
  machineType: string;
  acceleratorType?: string;
  acceleratorCount?: number;
}

export interface HealthcareDataset {
  datasetId: string;
  location: string;
  dicomStores: DICOMStore[];
  fhirStores: FHIRStore[];
  hl7V2Stores: HL7V2Store[];
}

export interface DICOMStore {
  name: string;
  labels: Record<string, string>;
}

export interface FHIRStore {
  name: string;
  version: string;
  labels: Record<string, string>;
}

export interface HL7V2Store {
  name: string;
  labels: Record<string, string>;
}

export interface CostOptimizationConfig {
  usePreemptibleInstances: boolean;
  autoScalingEnabled: boolean;
  scheduledScaling: ScheduledScaling[];
  commitmentDiscounts: CommitmentDiscount[];
  regionOptimization: RegionOptimization;
}

export interface ScheduledScaling {
  schedule: string; // Cron expression
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization: number;
}

export interface CommitmentDiscount {
  type: '1-year' | '3-year';
  resources: string[];
  discountPercentage: number;
}

export interface RegionOptimization {
  primaryRegion: string;
  secondaryRegions: string[];
  dataResidencyRequirements: string[];
}

export interface ErrorResponse {
  errorCode: string;
  errorMessage: string;
  errorCategory: 'validation' | 'processing' | 'integration' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryAction: string;
  timestamp: Date;
  correlationId: string;
}

export interface AuditAction {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  result: 'success' | 'failure';
  complianceFlags: string[];
  details?: Record<string, any>;
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  recommendations: string[];
  auditTrail: AuditEntry[];
}

export interface ComplianceViolation {
  violationId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
}

export interface AuditEntry {
  entryId: string;
  timestamp: Date;
  action: string;
  userId: string;
  resource: string;
  result: string;
}

export interface WebSocketConnection {
  connectionId: string;
  userId: string;
  patientId?: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface AnalysisUpdate {
  updateId: string;
  patientId: string;
  analysisId: string;
  updateType: 'new_analysis' | 'analysis_complete' | 'risk_alert';
  data: any;
  timestamp: Date;
}

export interface DoctorFeedback {
  feedbackId: string;
  suggestionId: string;
  userId: string;
  action: 'accept' | 'reject' | 'modify';
  modifications?: string;
  reasoning?: string;
  timestamp: Date;
}

export interface SyncResult {
  syncId: string;
  itemsSynced: number;
  errors: string[];
  timestamp: Date;
  duration: number;
}

export interface PatientDataUpdate {
  updateId: string;
  patientId: string;
  updateType: 'new_imaging' | 'new_report' | 'demographics_change';
  data: any;
  timestamp: Date;
}

export interface EncryptedData {
  encryptedContent: string;
  algorithm: string;
  keyId: string;
  iv: string;
  timestamp: Date;
}

export interface AnonymizedData {
  anonymizedId: string;
  originalDataHash: string;
  anonymizationMethod: string;
  retainedFields: string[];
  timestamp: Date;
}
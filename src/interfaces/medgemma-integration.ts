/**
 * MedGemma 1.5 integration interfaces for Google Cloud Platform
 */

import { MedicalImage, MedicalReport, PatientData } from '../types/medical';
import { MedGemmaAnalysis, AnalysisResult } from '../types/analysis';

// Vertex AI Integration for MedGemma 1.5
export interface VertexAIService {
  // MedGemma 1.5 Integration
  analyzeMedicalImaging(imageData: MedicalImage): Promise<MedGemmaAnalysis>;
  processHistopathology(slideData: HistopathologyImage): Promise<PathologyAnalysis>;
  analyzeCTScan(ctData: CTScanData): Promise<CTAnalysis>;
  processMRI(mriData: MRIData): Promise<MRIAnalysis>;
  
  // Vertex AI Model Garden
  deployCustomModel(modelConfig: ModelConfiguration): Promise<ModelEndpoint>;
  generateRiskAssessment(analysisData: AnalysisData): Promise<RiskAssessment>;
  correlateFindings(multiModalData: MedicalData[]): Promise<CorrelatedAnalysis>;
}

// Google Healthcare API Integration
export interface HealthcareAPIService {
  // DICOM Store Operations
  processDICOMData(dicomData: DICOMImage): Promise<ProcessedDICOMImage>;
  validateFHIRData(fhirData: FHIRResource): Promise<ValidationResult>;
  
  // Image Processing
  validateImageQuality(image: MedicalImage): Promise<QualityAssessment>;
  preprocessImage(image: MedicalImage): Promise<ProcessedImage>;
  convertDICOMToStandard(dicomImage: DICOMImage): Promise<StandardImage>;
  
  // Report Processing
  extractReportData(report: MedicalReport): Promise<StructuredData>;
  anonymizeData(patientData: PatientData): Promise<AnonymizedData>;
}

// Cloud Storage Integration
export interface CloudStorageService {
  uploadMedicalImage(image: MedicalImage): Promise<string>; // Returns GCS path
  downloadMedicalImage(gcpPath: string): Promise<MedicalImage>;
  storeDICOMData(dicomData: DICOMImage): Promise<string>;
  retrieveDICOMData(path: string): Promise<DICOMImage>;
  
  // Lifecycle management
  archiveOldData(retentionPolicy: RetentionPolicy): Promise<void>;
  purgeExpiredData(expirationDate: Date): Promise<void>;
}

// Pub/Sub Integration for Real-time Processing
export interface PubSubService {
  publishAnalysisRequest(request: AnalysisRequest): Promise<void>;
  subscribeToAnalysisResults(callback: (result: AnalysisResult) => void): Promise<void>;
  publishRiskAlert(alert: RiskAlert): Promise<void>;
  subscribeToPatientUpdates(patientId: string, callback: (update: PatientUpdate) => void): Promise<void>;
}

// Cloud IAM Integration
export interface IAMService {
  authenticateUser(credentials: UserCredentials): Promise<AuthResult>;
  authorizeAccess(user: User, resource: string, action: string): Promise<boolean>;
  validateServiceAccount(serviceAccount: string): Promise<boolean>;
  checkResourcePermissions(userId: string, resourcePath: string): Promise<Permission[]>;
}

// Cloud KMS Integration
export interface KMSService {
  encryptData(data: any, keyId: string): Promise<EncryptedData>;
  decryptData(encryptedData: EncryptedData, keyId: string): Promise<any>;
  rotateEncryptionKeys(keyId: string): Promise<void>;
  createEncryptionKey(keyName: string, location: string): Promise<string>;
}

// Supporting Types
export interface HistopathologyImage extends MedicalImage {
  magnification: '5x' | '10x' | '20x' | '40x';
  stainType: 'H&E' | 'IHC' | 'special';
  tissueType: string;
}

export interface CTScanData extends MedicalImage {
  sliceThickness: number;
  contrastUsed: boolean;
  reconstructionAlgorithm: string;
  windowSettings: WindowSettings[];
}

export interface MRIData extends MedicalImage {
  sequence: 'T1' | 'T2' | 'FLAIR' | 'DWI' | 'T1C';
  fieldStrength: '1.5T' | '3T' | '7T';
  contrastAgent?: string;
}

export interface WindowSettings {
  name: string;
  windowWidth: number;
  windowLevel: number;
}

export interface PathologyAnalysis {
  tissueClassification: string;
  gradingResults: GradingResult[];
  cellularFeatures: CellularFeature[];
  diagnosticSuggestions: string[];
  confidence: number;
}

export interface CTAnalysis {
  anatomicalStructures: AnatomicalStructure[];
  abnormalFindings: AbnormalFinding[];
  volumetricMeasurements: VolumetricMeasurement[];
  contrastEnhancement?: ContrastEnhancement[];
  confidence: number;
}

export interface MRIAnalysis {
  sequenceAnalysis: SequenceAnalysis[];
  lesionDetection: LesionDetection[];
  tissueCharacterization: TissueCharacterization[];
  functionalAssessment?: FunctionalAssessment;
  confidence: number;
}

export interface GradingResult {
  gradingSystem: string;
  grade: string;
  confidence: number;
  criteria: string[];
}

export interface CellularFeature {
  featureType: string;
  description: string;
  quantification?: number;
  significance: 'low' | 'moderate' | 'high';
}

export interface AnatomicalStructure {
  name: string;
  location: Coordinates3D;
  volume?: number;
  normalVariant: boolean;
}

export interface AbnormalFinding {
  type: string;
  location: Coordinates3D;
  size: Dimensions3D;
  characteristics: string[];
  suspicionLevel: 'low' | 'moderate' | 'high';
}

export interface VolumetricMeasurement {
  structure: string;
  volume: number;
  unit: string;
  referenceRange?: { min: number; max: number };
}

export interface ContrastEnhancement {
  location: Coordinates3D;
  enhancementPattern: 'homogeneous' | 'heterogeneous' | 'rim' | 'nodular';
  intensity: 'mild' | 'moderate' | 'marked';
}

export interface SequenceAnalysis {
  sequenceType: string;
  signalIntensity: 'hypointense' | 'isointense' | 'hyperintense';
  artifacts: string[];
  quality: 'poor' | 'adequate' | 'good' | 'excellent';
}

export interface LesionDetection {
  lesionId: string;
  location: Coordinates3D;
  size: Dimensions3D;
  signalCharacteristics: Record<string, string>;
  differentialDiagnosis: string[];
}

export interface TissueCharacterization {
  tissueType: string;
  location: Coordinates3D;
  characteristics: Record<string, any>;
  pathologyLikelihood: number;
}

export interface FunctionalAssessment {
  perfusion?: PerfusionMetrics;
  diffusion?: DiffusionMetrics;
  spectroscopy?: SpectroscopyResults;
}

export interface PerfusionMetrics {
  cerebralBloodFlow: number;
  cerebralBloodVolume: number;
  meanTransitTime: number;
}

export interface DiffusionMetrics {
  adcValue: number;
  faValue?: number;
  restrictedDiffusion: boolean;
}

export interface SpectroscopyResults {
  metabolites: Record<string, number>;
  ratios: Record<string, number>;
  interpretation: string;
}

export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions3D {
  width: number;
  height: number;
  depth: number;
}

export interface ProcessedDICOMImage {
  imageData: Buffer;
  metadata: DICOMMetadata;
  qualityScore: number;
  preprocessingApplied: string[];
  complianceFlags: ComplianceFlag[];
}

export interface ComplianceFlag {
  type: 'HIPAA' | 'GDPR' | 'FDA' | 'DICOM';
  status: 'compliant' | 'warning' | 'violation';
  description: string;
  remediation?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  complianceStatus: ComplianceStatus;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface ComplianceStatus {
  hipaaCompliant: boolean;
  gdprCompliant: boolean;
  dicomCompliant: boolean;
  issues: string[];
}

export interface ProcessedImage {
  imageData: Buffer;
  format: string;
  dimensions: { width: number; height: number };
  preprocessing: PreprocessingStep[];
  qualityMetrics: QualityMetrics;
}

export interface PreprocessingStep {
  operation: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface QualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  noise: number;
  overallScore: number;
}

export interface StandardImage {
  imageData: Buffer;
  format: 'PNG' | 'JPEG' | 'TIFF';
  colorSpace: 'RGB' | 'GRAYSCALE' | 'CMYK';
  bitDepth: 8 | 16 | 32;
  metadata: StandardImageMetadata;
}

export interface StandardImageMetadata {
  width: number;
  height: number;
  dpi: number;
  colorProfile?: string;
  compressionType?: string;
  createdAt: Date;
}

export interface StructuredData {
  extractedFields: Record<string, any>;
  confidence: Record<string, number>;
  entities: MedicalEntity[];
  relationships: EntityRelationship[];
}

export interface MedicalEntity {
  entityId: string;
  type: 'condition' | 'medication' | 'procedure' | 'anatomy' | 'measurement';
  text: string;
  normalizedForm: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface EntityRelationship {
  relationshipId: string;
  sourceEntity: string;
  targetEntity: string;
  relationshipType: string;
  confidence: number;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  archiveAfter: number; // in days
  deleteAfter: number; // in days
  complianceRequirements: string[];
}

export interface AnalysisRequest {
  requestId: string;
  patientId: string;
  dataType: 'imaging' | 'report' | 'combined';
  data: MedicalImage | MedicalReport | PatientData;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestedBy: string;
  timestamp: Date;
}

export interface RiskAlert {
  alertId: string;
  patientId: string;
  riskLevel: 'High' | 'Critical';
  findings: string[];
  recommendedActions: string[];
  urgency: 'immediate' | 'within_hour' | 'within_day';
  generatedBy: string;
  timestamp: Date;
}

export interface PatientUpdate {
  updateId: string;
  patientId: string;
  updateType: 'new_data' | 'analysis_complete' | 'risk_change';
  data: any;
  timestamp: Date;
}
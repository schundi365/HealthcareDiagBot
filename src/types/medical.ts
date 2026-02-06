/**
 * Core medical data types and interfaces for the Diagnostic Risk Analyzer
 * Enhanced for MedGemma 1.5 and Google Cloud Healthcare API integration
 */

// Core medical data types for MedGemma 1.5 integration
export interface MedicalImage {
  imageId: string;
  patientId: string;
  imageType: 'xray' | 'ct' | 'ecg' | 'mri' | 'histopathology';
  imageData: Buffer;
  metadata: ImageMetadata;
  timestamp: Date;
  qualityScore?: number;
  gcpStoragePath?: string; // Cloud Storage path for MedGemma processing
  dicomCompliant: boolean;
  medGemmaCompatible: boolean; // MedGemma 1.5 compatibility flag
}

export interface ImageMetadata {
  resolution: { width: number; height: number };
  bitDepth: number;
  compressionType: string;
  acquisitionParameters: Record<string, any>;
  bodyPart: string;
  viewPosition: string;
  dicomMetadata?: DICOMMetadata; // Enhanced DICOM support for MedGemma
}

// Enhanced DICOM support for Google Healthcare API integration
export interface DICOMMetadata {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  patientName: string;
  patientID: string;
  studyDate: string;
  modality: string;
  bodyPartExamined: string;
  viewPosition: string;
  institutionName: string;
  manufacturerModelName: string;
  pixelSpacing: number[];
  sliceThickness?: number;
  transferSyntax: string;
  complianceLevel: 'strict' | 'relaxed';
}

export interface MedicalReport {
  reportId: string;
  patientId: string;
  reportType: 'lab' | 'pathology' | 'radiology' | 'clinical';
  content: string;
  structuredData?: Record<string, any>;
  fhirResource?: FHIRResource; // Healthcare API integration
  authorId: string;
  timestamp: Date;
  status: 'draft' | 'final' | 'amended';
  complianceFlags: string[];
}

// FHIR Integration for Healthcare API
export interface FHIRResource {
  resourceType: string;
  id: string;
  meta: FHIRMeta;
  identifier: FHIRIdentifier[];
  subject: FHIRReference;
  effectiveDateTime: string;
  valueQuantity?: FHIRQuantity;
  component?: FHIRComponent[];
}

export interface FHIRMeta {
  versionId: string;
  lastUpdated: string;
  profile: string[];
  security: FHIRCoding[];
}

export interface FHIRIdentifier {
  use?: string;
  type?: FHIRCodeableConcept;
  system?: string;
  value?: string;
}

export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

export interface FHIRQuantity {
  value?: number;
  comparator?: string;
  unit?: string;
  system?: string;
  code?: string;
}

export interface FHIRComponent {
  code: FHIRCodeableConcept;
  valueQuantity?: FHIRQuantity;
  valueCodeableConcept?: FHIRCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: FHIRRange;
  valueRatio?: FHIRRatio;
  valueSampledData?: FHIRSampledData;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: FHIRPeriod;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRRange {
  low?: FHIRQuantity;
  high?: FHIRQuantity;
}

export interface FHIRRatio {
  numerator?: FHIRQuantity;
  denominator?: FHIRQuantity;
}

export interface FHIRSampledData {
  origin: FHIRQuantity;
  period: number;
  factor?: number;
  lowerLimit?: number;
  upperLimit?: number;
  dimensions: number;
  data?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

// MedGemma 1.5 Specific Models
export interface MedGemmaFinding extends Finding {
  medGemmaConfidence: number;
  specialtyInsight: SpecialtyInsight;
  anatomicalRegion: AnatomicalRegion;
  clinicalSignificance: ClinicalSignificance;
}

export interface SpecialtyInsight {
  specialty: 'radiology' | 'pathology' | 'cardiology' | 'oncology';
  findings: string[];
  recommendations: string[];
  urgencyLevel: number;
  literatureReferences: Reference[];
}

export interface AnatomicalRegion {
  name: string;
  code: string;
  system: string; // SNOMED CT, ICD-10, etc.
}

export interface ClinicalSignificance {
  level: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  actionRequired: boolean;
}

export interface Reference {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  url?: string;
}

export interface Finding {
  findingId: string;
  description: string;
  location: AnatomicalLocation;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  evidenceReferences: string[];
  medGemmaGenerated: boolean; // Flag for MedGemma 1.5 generated findings
}

export interface AnatomicalLocation {
  organ: string;
  region: string;
  coordinates?: { x: number; y: number; z?: number };
  boundingBox?: BoundingBox;
  dicomCoordinates?: DICOMCoordinates; // DICOM-specific coordinate system
}

export interface DICOMCoordinates {
  imagePositionPatient: number[];
  imageOrientationPatient: number[];
  pixelSpacing: number[];
  sliceLocation?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  z?: number;
  depth?: number;
}

export interface Demographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  ethnicity?: string;
  weight?: number;
  height?: number;
}

export interface MedicalHistory {
  conditions: MedicalCondition[];
  surgeries: Surgery[];
  allergies: Allergy[];
  familyHistory: FamilyHistory[];
}

export interface MedicalCondition {
  conditionId: string;
  name: string;
  diagnosisDate: Date;
  status: 'active' | 'resolved' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Surgery {
  surgeryId: string;
  procedure: string;
  date: Date;
  outcome: string;
  complications?: string[];
}

export interface Allergy {
  allergyId: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
}

export interface FamilyHistory {
  relation: string;
  condition: string;
  ageOfOnset?: number;
}

export interface Symptom {
  symptomId: string;
  name: string;
  description: string;
  onset: Date;
  severity: number; // 1-10 scale
  duration: string;
}

export interface Medication {
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  indication: string;
}

export interface PatientData {
  patientId: string;
  demographics: Demographics;
  medicalHistory: MedicalHistory;
  currentSymptoms: Symptom[];
  medications: Medication[];
  imaging: MedicalImage[];
  reports: MedicalReport[];
  fhirData?: FHIRResource[]; // Healthcare API integration
}

// Quality Assessment interfaces for medical image processing
export interface QualityAssessment {
  isAcceptable: boolean;
  qualityScore: number;
  issues: QualityIssue[];
  requiresManualReview: boolean;
  dicomCompliant: boolean;
}

export interface QualityIssue {
  issueId: string;
  type: 'resolution' | 'contrast' | 'noise' | 'artifact' | 'format';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
}
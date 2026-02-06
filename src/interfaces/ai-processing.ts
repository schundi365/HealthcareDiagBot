/**
 * AI Processing Engine interface definitions
 */

import { 
  MedicalImage, 
  MedicalReport, 
  ImagingAnalysis, 
  ReportAnalysis, 
  RiskAssessment, 
  CorrelatedAnalysis,
  PatientData 
} from '../types';

export interface AIProcessingEngine {
  analyzeImaging(imageData: MedicalImage): Promise<ImagingAnalysis>;
  processReport(reportData: MedicalReport): Promise<ReportAnalysis>;
  generateRiskAssessment(analysisData: AnalysisData): Promise<RiskAssessment>;
  correlateFindings(multiModalData: PatientData[]): Promise<CorrelatedAnalysis>;
}

export interface AnalysisData {
  patientId: string;
  imagingAnalysis?: ImagingAnalysis[];
  reportAnalysis?: ReportAnalysis[];
  patientData: PatientData;
}
/**
 * Patient Screen Interface definitions
 */

import { 
  AnalysisUpdate, 
  DoctorFeedback, 
  ImagingAnalysis 
} from '../types';

export interface PatientScreenInterface {
  displayAnalysisResults(patientId: string): Promise<void>;
  updateRealTime(analysisUpdate: AnalysisUpdate): void;
  handleDoctorFeedback(feedback: DoctorFeedback): Promise<void>;
  showAnnotatedImages(imageAnalysis: ImagingAnalysis): void;
}
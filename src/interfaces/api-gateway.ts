/**
 * API Gateway interface definitions
 */

import { 
  AnalysisResult, 
  PatientData, 
  WebSocketConnection, 
  AuthToken, 
  UserCredentials 
} from '../types';

export interface APIGateway {
  // HMS Integration
  processPatientData(patientId: string, medicalData: PatientData): Promise<AnalysisResult>;
  retrieveAnalysisResults(patientId: string): Promise<AnalysisResult[]>;
  
  // Real-time Updates
  subscribeToPatientUpdates(patientId: string): Promise<WebSocketConnection>;
  
  // Authentication
  authenticateUser(credentials: UserCredentials): Promise<AuthToken>;
  validateAccess(token: AuthToken, resource: string): Promise<boolean>;
}
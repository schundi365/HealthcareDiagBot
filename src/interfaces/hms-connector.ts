/**
 * HMS Connector interface definitions
 */

import { 
  PatientData, 
  AnalysisResult, 
  PatientDataUpdate, 
  SyncResult 
} from '../types';

export interface HMSConnector {
  retrievePatientData(patientId: string): Promise<PatientData>;
  submitAnalysisResults(patientId: string, results: AnalysisResult): Promise<void>;
  subscribeToDataUpdates(): Promise<EventStream<PatientDataUpdate>>;
  syncQueuedResults(): Promise<SyncResult>;
}

export interface EventStream<T> {
  subscribe(callback: (event: T) => void): void;
  unsubscribe(): void;
  close(): void;
}
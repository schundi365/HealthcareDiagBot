/**
 * Security & Compliance Layer interface definitions
 */

import { 
  User, 
  UserCredentials, 
  AuthResult, 
  EncryptedData, 
  AuditAction, 
  PatientData, 
  AnonymizedData 
} from '../types';

export interface SecurityLayer {
  authenticateUser(credentials: UserCredentials): Promise<AuthResult>;
  authorizeAccess(user: User, resource: string, action: string): Promise<boolean>;
  encryptData(data: any): Promise<EncryptedData>;
  decryptData(encryptedData: EncryptedData): Promise<any>;
  auditLog(action: AuditAction): Promise<void>;
  anonymizeForResearch(patientData: PatientData): Promise<AnonymizedData>;
}
/**
 * Main entry point for the Diagnostic Risk Analyzer
 */

export * from './types';
export * from './interfaces/api-gateway';
export * from './interfaces/ai-processing';
export * from './interfaces/data-processing';
export * from './interfaces/hms-connector';
export * from './interfaces/patient-screen';
export * from './interfaces/security';

// Version information
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

console.info(`Diagnostic Risk Analyzer v${VERSION} initialized at ${BUILD_DATE}`);
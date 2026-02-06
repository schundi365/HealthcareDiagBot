/**
 * Type definitions for test utilities
 */

declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    createMockPatientData: () => any;
    createMockMedicalImage: () => any;
  };
}
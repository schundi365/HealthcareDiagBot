/**
 * Fast-check generators for property-based testing
 * Enhanced for MedGemma 1.5 and Google Cloud Platform integration
 */

import * as fc from 'fast-check';
import { 
  MedicalImage, 
  PatientData, 
  MedicalReport, 
  Demographics,
  ImageMetadata,
  DICOMMetadata,
  FHIRResource,
  MedGemmaFinding,
  SpecialtyInsight,
  Reference
} from '../types';

// Generator for DICOM metadata
export const dicomMetadataArbitrary = (): fc.Arbitrary<DICOMMetadata> =>
  fc.record({
    studyInstanceUID: fc.string({ minLength: 10, maxLength: 64 }),
    seriesInstanceUID: fc.string({ minLength: 10, maxLength: 64 }),
    sopInstanceUID: fc.string({ minLength: 10, maxLength: 64 }),
    patientName: fc.string({ minLength: 1, maxLength: 64 }),
    patientID: fc.string({ minLength: 1, maxLength: 64 }),
    studyDate: fc.date().map(d => d.toISOString().split('T')[0].replace(/-/g, '')),
    modality: fc.constantFrom('CR', 'CT', 'MR', 'US', 'XA', 'RF', 'DX'),
    bodyPartExamined: fc.constantFrom('CHEST', 'ABDOMEN', 'HEAD', 'EXTREMITY'),
    viewPosition: fc.constantFrom('PA', 'AP', 'LAT', 'OBL'),
    institutionName: fc.string({ minLength: 1, maxLength: 64 }),
    manufacturerModelName: fc.string({ minLength: 1, maxLength: 64 }),
    pixelSpacing: fc.array(fc.float({ min: 0.1, max: 2.0, noNaN: true }), { minLength: 2, maxLength: 2 }),
    sliceThickness: fc.option(fc.float({ min: 0.5, max: 10.0, noNaN: true })),
    transferSyntax: fc.constantFrom('1.2.840.10008.1.2', '1.2.840.10008.1.2.1', '1.2.840.10008.1.2.4.50'),
    complianceLevel: fc.constantFrom('strict', 'relaxed'),
  });

// Generator for medical image metadata (enhanced)
export const imageMetadataArbitrary = (): fc.Arbitrary<ImageMetadata> =>
  fc.record({
    resolution: fc.record({
      width: fc.integer({ min: 256, max: 2048 }),
      height: fc.integer({ min: 256, max: 2048 }),
    }),
    bitDepth: fc.constantFrom(8, 16, 32),
    compressionType: fc.constantFrom('lossless', 'lossy', 'none'),
    acquisitionParameters: fc.dictionary(fc.string(), fc.anything()),
    bodyPart: fc.constantFrom('chest', 'abdomen', 'head', 'extremity'),
    viewPosition: fc.constantFrom('PA', 'AP', 'lateral', 'oblique'),
    dicomMetadata: fc.option(dicomMetadataArbitrary()),
  });

// Generator for medical images (enhanced for MedGemma)
export const medicalImageArbitrary = (): fc.Arbitrary<MedicalImage> =>
  fc.record({
    imageId: fc.uuid(),
    patientId: fc.uuid(),
    imageType: fc.constantFrom('xray', 'ct', 'ecg', 'mri', 'histopathology'),
    imageData: fc.uint8Array({ minLength: 1024, maxLength: 10240 }).map(arr => Buffer.from(arr)),
    metadata: imageMetadataArbitrary(),
    timestamp: fc.date(),
    qualityScore: fc.option(fc.float({ min: 0, max: 100, noNaN: true })),
    gcpStoragePath: fc.option(fc.string().map(s => `gs://medical-images/${s}`)),
    dicomCompliant: fc.boolean(),
    medGemmaCompatible: fc.boolean(),
  });

// Generator for FHIR resources
export const fhirResourceArbitrary = (): fc.Arbitrary<FHIRResource> =>
  fc.record({
    resourceType: fc.constantFrom('Patient', 'Observation', 'DiagnosticReport', 'Condition'),
    id: fc.uuid(),
    meta: fc.record({
      versionId: fc.string(),
      lastUpdated: fc.date().map(d => d.toISOString()),
      profile: fc.array(fc.string()),
      security: fc.array(fc.record({
        system: fc.option(fc.string()),
        version: fc.option(fc.string()),
        code: fc.option(fc.string()),
        display: fc.option(fc.string()),
        userSelected: fc.option(fc.boolean()),
      })),
    }),
    identifier: fc.array(fc.record({
      use: fc.option(fc.string()),
      system: fc.option(fc.string()),
      value: fc.option(fc.string()),
    })),
    subject: fc.record({
      reference: fc.option(fc.string()),
      type: fc.option(fc.string()),
      display: fc.option(fc.string()),
    }),
    effectiveDateTime: fc.date().map(d => d.toISOString()),
    valueQuantity: fc.option(fc.record({
      value: fc.option(fc.float({ noNaN: true })),
      unit: fc.option(fc.string()),
      system: fc.option(fc.string()),
      code: fc.option(fc.string()),
    })),
  });

// Generator for references
export const referenceArbitrary = (): fc.Arbitrary<Reference> =>
  fc.record({
    title: fc.string({ minLength: 10, maxLength: 200 }),
    authors: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
    journal: fc.string({ minLength: 5, maxLength: 100 }),
    year: fc.integer({ min: 1990, max: 2024 }),
    doi: fc.option(fc.string()),
    pmid: fc.option(fc.string()),
    url: fc.option(fc.webUrl()),
  });

// Generator for specialty insights
export const specialtyInsightArbitrary = (): fc.Arbitrary<SpecialtyInsight> =>
  fc.record({
    specialty: fc.constantFrom('radiology', 'pathology', 'cardiology', 'oncology'),
    findings: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
    recommendations: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
    urgencyLevel: fc.integer({ min: 1, max: 10 }),
    literatureReferences: fc.array(referenceArbitrary(), { maxLength: 3 }),
  });

// Generator for MedGemma findings
export const medGemmaFindingArbitrary = (): fc.Arbitrary<MedGemmaFinding> =>
  fc.record({
    findingId: fc.uuid(),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    location: fc.record({
      organ: fc.string(),
      region: fc.string(),
      coordinates: fc.option(fc.record({
        x: fc.float({ noNaN: true }),
        y: fc.float({ noNaN: true }),
        z: fc.option(fc.float({ noNaN: true })),
      })),
      boundingBox: fc.option(fc.record({
        x: fc.float({ noNaN: true }),
        y: fc.float({ noNaN: true }),
        width: fc.float({ min: 1, noNaN: true }),
        height: fc.float({ min: 1, noNaN: true }),
        z: fc.option(fc.float({ noNaN: true })),
        depth: fc.option(fc.float({ min: 1, noNaN: true })),
      })),
    }),
    severity: fc.constantFrom('mild', 'moderate', 'severe'),
    confidence: fc.float({ min: 0, max: 100, noNaN: true }),
    evidenceReferences: fc.array(fc.string()),
    medGemmaGenerated: fc.boolean(),
    medGemmaConfidence: fc.float({ min: 0, max: 100, noNaN: true }),
    specialtyInsight: specialtyInsightArbitrary(),
    anatomicalRegion: fc.record({
      name: fc.string(),
      code: fc.string(),
      system: fc.constantFrom('SNOMED-CT', 'ICD-10', 'LOINC'),
    }),
    clinicalSignificance: fc.record({
      level: fc.constantFrom('low', 'moderate', 'high', 'critical'),
      description: fc.string({ minLength: 10, maxLength: 100 }),
      actionRequired: fc.boolean(),
    }),
  });

// Generator for demographics (simplified)
export const demographicsArbitrary = (): fc.Arbitrary<Demographics> =>
  fc.record({
    age: fc.integer({ min: 0, max: 120 }),
    gender: fc.constantFrom('male', 'female', 'other'),
    ethnicity: fc.option(fc.string()),
    weight: fc.option(fc.float({ min: 1, max: 300, noNaN: true })),
    height: fc.option(fc.float({ min: 30, max: 250, noNaN: true })),
  });

// Generator for medical reports (enhanced)
export const medicalReportArbitrary = (): fc.Arbitrary<MedicalReport> =>
  fc.record({
    reportId: fc.uuid(),
    patientId: fc.uuid(),
    reportType: fc.constantFrom('lab', 'pathology', 'radiology', 'clinical'),
    content: fc.lorem({ maxCount: 100 }),
    structuredData: fc.option(fc.dictionary(fc.string(), fc.anything())),
    fhirResource: fc.option(fhirResourceArbitrary()),
    authorId: fc.uuid(),
    timestamp: fc.date(),
    status: fc.constantFrom('draft', 'final', 'amended'),
    complianceFlags: fc.array(fc.string()),
  });

// Generator for patient data (enhanced)
export const patientDataArbitrary = (): fc.Arbitrary<PatientData> =>
  fc.record({
    patientId: fc.uuid(),
    demographics: demographicsArbitrary(),
    medicalHistory: fc.record({
      conditions: fc.array(fc.record({
        conditionId: fc.uuid(),
        name: fc.string(),
        diagnosisDate: fc.date(),
        status: fc.constantFrom('active', 'resolved', 'chronic'),
        severity: fc.constantFrom('mild', 'moderate', 'severe'),
      })),
      surgeries: fc.array(fc.record({
        surgeryId: fc.uuid(),
        procedure: fc.string(),
        date: fc.date(),
        outcome: fc.string(),
        complications: fc.option(fc.array(fc.string())),
      })),
      allergies: fc.array(fc.record({
        allergyId: fc.uuid(),
        allergen: fc.string(),
        reaction: fc.string(),
        severity: fc.constantFrom('mild', 'moderate', 'severe', 'life-threatening'),
      })),
      familyHistory: fc.array(fc.record({
        relation: fc.string(),
        condition: fc.string(),
        ageOfOnset: fc.option(fc.integer({ min: 0, max: 120 })),
      })),
    }),
    currentSymptoms: fc.array(fc.record({
      symptomId: fc.uuid(),
      name: fc.string(),
      description: fc.string(),
      onset: fc.date(),
      severity: fc.integer({ min: 1, max: 10 }),
      duration: fc.string(),
    })),
    medications: fc.array(fc.record({
      medicationId: fc.uuid(),
      name: fc.string(),
      dosage: fc.string(),
      frequency: fc.string(),
      startDate: fc.date(),
      endDate: fc.option(fc.date()),
      prescribedBy: fc.string(),
      indication: fc.string(),
    })),
    imaging: fc.array(medicalImageArbitrary(), { maxLength: 5 }),
    reports: fc.array(medicalReportArbitrary(), { maxLength: 5 }),
    fhirData: fc.option(fc.array(fhirResourceArbitrary(), { maxLength: 10 })),
  });

// Generator for confidence scores (0-100 range)
export const confidenceScoreArbitrary = (): fc.Arbitrary<number> =>
  fc.float({ min: 0, max: 100, noNaN: true });

// Generator for processing times (in milliseconds, max 30 seconds)
export const processingTimeArbitrary = (): fc.Arbitrary<number> =>
  fc.integer({ min: 100, max: 30000 });

// Generator for risk levels
export const riskLevelArbitrary = (): fc.Arbitrary<'Low' | 'Medium' | 'High' | 'Critical'> =>
  fc.constantFrom('Low', 'Medium', 'High', 'Critical');

// Generator for valid medical image types for MedGemma
export const medGemmaImageTypeArbitrary = (): fc.Arbitrary<'xray' | 'ct' | 'ecg' | 'mri' | 'histopathology'> =>
  fc.constantFrom('xray', 'ct', 'ecg', 'mri', 'histopathology');

// Generator for quality scores (0-100 range)
export const qualityScoreArbitrary = (): fc.Arbitrary<number> =>
  fc.float({ min: 0, max: 100, noNaN: true });

// Generator for medication lists
export const medicationListArbitrary = (): fc.Arbitrary<string[]> =>
  fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 20 });

// Generator for valid report formats
export const reportFormatArbitrary = (): fc.Arbitrary<'structured' | 'unstructured'> =>
  fc.constantFrom('structured', 'unstructured');
/**
 * Google Cloud Platform configuration for MedGemma 1.5 integration
 */

import { GCPDeploymentConfig } from '../types/system';

export const gcpConfig: GCPDeploymentConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'diagnostic-risk-analyzer',
  region: process.env.GCP_REGION || 'us-central1',
  zone: process.env.GCP_ZONE || 'us-central1-a',
  gkeClusterName: process.env.GKE_CLUSTER_NAME || 'diagnostic-analyzer-cluster',
  
  cloudRunServices: [
    {
      serviceName: 'api-gateway',
      image: 'gcr.io/diagnostic-risk-analyzer/api-gateway:latest',
      minInstances: 1,
      maxInstances: 10,
      cpuLimit: '2',
      memoryLimit: '4Gi',
      environmentVariables: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      }
    },
    {
      serviceName: 'hms-connector',
      image: 'gcr.io/diagnostic-risk-analyzer/hms-connector:latest',
      minInstances: 1,
      maxInstances: 5,
      cpuLimit: '1',
      memoryLimit: '2Gi',
      environmentVariables: {
        NODE_ENV: 'production',
        HMS_ENDPOINT: process.env.HMS_ENDPOINT || ''
      }
    },
    {
      serviceName: 'patient-screen-ui',
      image: 'gcr.io/diagnostic-risk-analyzer/patient-ui:latest',
      minInstances: 2,
      maxInstances: 20,
      cpuLimit: '1',
      memoryLimit: '1Gi',
      environmentVariables: {
        NODE_ENV: 'production',
        API_ENDPOINT: process.env.API_ENDPOINT || ''
      }
    }
  ],
  
  vertexAIModels: [
    {
      displayName: 'MedGemma-4B-Multimodal',
      modelId: 'medgemma-4b-multimodal',
      endpointId: process.env.MEDGEMMA_4B_ENDPOINT_ID || '',
      trafficSplit: { 'medgemma-4b-v1': 100 },
      machineType: 'n1-standard-4',
      acceleratorType: 'NVIDIA_TESLA_T4',
      acceleratorCount: 1
    },
    {
      displayName: 'MedGemma-27B-Text',
      modelId: 'medgemma-27b-text',
      endpointId: process.env.MEDGEMMA_27B_ENDPOINT_ID || '',
      trafficSplit: { 'medgemma-27b-v1': 100 },
      machineType: 'n1-highmem-8',
      acceleratorType: 'NVIDIA_TESLA_V100',
      acceleratorCount: 2
    }
  ],
  
  healthcareDatasets: [
    {
      datasetId: 'diagnostic-analyzer-dataset',
      location: 'us-central1',
      dicomStores: [
        {
          name: 'medical-imaging-store',
          labels: { 'env': 'production', 'type': 'medical-imaging' }
        }
      ],
      fhirStores: [
        {
          name: 'patient-data-store',
          version: 'R4',
          labels: { 'env': 'production', 'type': 'patient-data' }
        }
      ],
      hl7V2Stores: [
        {
          name: 'hl7-message-store',
          labels: { 'env': 'production', 'type': 'hl7-messages' }
        }
      ]
    }
  ],
  
  costOptimization: {
    usePreemptibleInstances: true,
    autoScalingEnabled: true,
    scheduledScaling: [
      {
        schedule: '0 8 * * 1-5', // 8 AM weekdays
        minReplicas: 3,
        maxReplicas: 10,
        targetCPUUtilization: 70
      },
      {
        schedule: '0 18 * * 1-5', // 6 PM weekdays
        minReplicas: 1,
        maxReplicas: 5,
        targetCPUUtilization: 80
      },
      {
        schedule: '0 0 * * 0,6', // Weekends
        minReplicas: 1,
        maxReplicas: 3,
        targetCPUUtilization: 90
      }
    ],
    commitmentDiscounts: [
      {
        type: '1-year',
        resources: ['compute', 'vertex-ai'],
        discountPercentage: 25
      }
    ],
    regionOptimization: {
      primaryRegion: 'us-central1',
      secondaryRegions: ['us-east4', 'us-west2'],
      dataResidencyRequirements: ['US', 'HIPAA-compliant']
    }
  }
};

// Vertex AI Model Endpoints
export const vertexAIEndpoints = {
  medgemma4B: {
    projectId: gcpConfig.projectId,
    location: gcpConfig.region,
    endpointId: process.env.MEDGEMMA_4B_ENDPOINT_ID || '',
    modelName: 'medgemma-4b-multimodal'
  },
  medgemma27B: {
    projectId: gcpConfig.projectId,
    location: gcpConfig.region,
    endpointId: process.env.MEDGEMMA_27B_ENDPOINT_ID || '',
    modelName: 'medgemma-27b-text'
  }
};

// Healthcare API Configuration
export const healthcareAPIConfig = {
  projectId: gcpConfig.projectId,
  location: gcpConfig.region,
  datasetId: 'diagnostic-analyzer-dataset',
  dicomStoreId: 'medical-imaging-store',
  fhirStoreId: 'patient-data-store',
  hl7V2StoreId: 'hl7-message-store'
};

// Cloud Storage Configuration
export const cloudStorageConfig = {
  bucketName: process.env.GCS_BUCKET_NAME || 'diagnostic-analyzer-storage',
  region: gcpConfig.region,
  storageClass: 'STANDARD',
  lifecycleRules: [
    {
      condition: { age: 30 },
      action: { type: 'SetStorageClass', storageClass: 'NEARLINE' }
    },
    {
      condition: { age: 90 },
      action: { type: 'SetStorageClass', storageClass: 'COLDLINE' }
    },
    {
      condition: { age: 365 },
      action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' }
    },
    {
      condition: { age: 2555 }, // 7 years for HIPAA compliance
      action: { type: 'Delete' }
    }
  ]
};

// Pub/Sub Configuration
export const pubSubConfig = {
  topics: {
    analysisRequests: 'analysis-requests',
    analysisResults: 'analysis-results',
    riskAlerts: 'risk-alerts',
    patientUpdates: 'patient-updates',
    auditLogs: 'audit-logs'
  },
  subscriptions: {
    analysisProcessor: 'analysis-processor-sub',
    riskMonitor: 'risk-monitor-sub',
    auditLogger: 'audit-logger-sub',
    uiUpdater: 'ui-updater-sub'
  }
};

// Cloud IAM Configuration
export const iamConfig = {
  serviceAccounts: {
    apiGateway: `api-gateway@${gcpConfig.projectId}.iam.gserviceaccount.com`,
    aiProcessor: `ai-processor@${gcpConfig.projectId}.iam.gserviceaccount.com`,
    dataProcessor: `data-processor@${gcpConfig.projectId}.iam.gserviceaccount.com`,
    hmsConnector: `hms-connector@${gcpConfig.projectId}.iam.gserviceaccount.com`
  },
  roles: {
    doctor: 'roles/healthcare.dicomViewer',
    nurse: 'roles/healthcare.fhirResourceReader',
    admin: 'roles/healthcare.datasetAdmin',
    researcher: 'roles/healthcare.fhirResourceReader'
  }
};

// Cloud KMS Configuration
export const kmsConfig = {
  keyRingId: 'diagnostic-analyzer-keyring',
  location: 'global',
  keys: {
    patientData: 'patient-data-key',
    medicalImages: 'medical-images-key',
    auditLogs: 'audit-logs-key',
    backups: 'backup-key'
  }
};

// Monitoring and Logging Configuration
export const monitoringConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  metricsEnabled: true,
  tracingEnabled: true,
  alerting: {
    errorRate: {
      threshold: 0.05, // 5% error rate
      duration: '5m'
    },
    latency: {
      threshold: 30000, // 30 seconds
      duration: '5m'
    },
    availability: {
      threshold: 0.999, // 99.9% uptime
      duration: '5m'
    }
  }
};

// Environment-specific overrides
export const getEnvironmentConfig = (environment: string) => {
  const baseConfig = gcpConfig;
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        costOptimization: {
          ...baseConfig.costOptimization,
          usePreemptibleInstances: true,
          autoScalingEnabled: false
        }
      };
    
    case 'staging':
      return {
        ...baseConfig,
        region: 'us-east4',
        costOptimization: {
          ...baseConfig.costOptimization,
          usePreemptibleInstances: true
        }
      };
    
    case 'production':
      return {
        ...baseConfig,
        costOptimization: {
          ...baseConfig.costOptimization,
          usePreemptibleInstances: false // Use regular instances for production
        }
      };
    
    default:
      return baseConfig;
  }
};
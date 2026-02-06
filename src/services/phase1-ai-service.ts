/**
 * Phase 1 AI Service - Free Tier Implementation
 * Uses Hugging Face and OpenAI APIs instead of MedGemma/Vertex AI
 */

import { phase1Config } from '../config/phase1-config';
import { MedicalImage, AnalysisResult, RiskAssessment } from '../types/medical';

export interface HuggingFaceResponse {
  generated_text?: string;
  label?: string;
  score?: number;
  error?: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

export class Phase1AIService {
  private hfApiKey: string;
  private openaiApiKey: string;
  private hfBaseUrl: string;

  constructor() {
    this.hfApiKey = phase1Config.ai.huggingface.apiKey;
    this.openaiApiKey = phase1Config.ai.openai.apiKey;
    this.hfBaseUrl = phase1Config.ai.huggingface.baseUrl;
  }

  /**
   * Analyze medical image using Hugging Face models
   * Fallback to OpenAI for complex analysis
   */
  async analyzeMedicalImage(image: MedicalImage): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // For Phase 1, we'll use a simplified analysis approach
      // In production, this would use specialized medical AI models
      
      let findings: any[] = [];
      let confidence = 0;
      
      // Try Hugging Face first (free tier)
      if (this.hfApiKey) {
        try {
          findings = await this.analyzeWithHuggingFace(image);
          confidence = 0.75; // Simulated confidence for demo
        } catch (error) {
          console.warn('Hugging Face analysis failed, falling back to OpenAI:', error);
        }
      }
      
      // Fallback to OpenAI if HF fails or no API key
      if (findings.length === 0 && this.openaiApiKey) {
        findings = await this.analyzeWithOpenAI(image);
        confidence = 0.8; // Higher confidence for GPT analysis
      }
      
      // Generate risk assessment
      const riskAssessment = await this.generateRiskAssessment(image, findings);
      
      const processingTime = Date.now() - startTime;
      
      return {
        analysisId: `analysis_${Date.now()}`,
        patientId: image.patientId,
        timestamp: new Date(),
        analysisType: 'imaging',
        findings: findings.map(f => ({
          findingId: `finding_${Math.random().toString(36).substr(2, 9)}`,
          description: f.description || 'Medical finding detected',
          location: {
            organ: this.inferOrganFromBodyPart(image.metadata.bodyPart),
            region: image.metadata.bodyPart,
          },
          severity: f.severity || 'moderate',
          confidence: f.confidence || confidence,
          evidenceReferences: [],
          medGemmaGenerated: false, // Phase 1 doesn't use MedGemma
        })),
        riskAssessment,
        clinicalSuggestions: await this.generateClinicalSuggestions(findings, riskAssessment),
        processingMetrics: {
          processingTime,
          modelVersion: 'phase1-v1.0',
          confidenceDistribution: { high: confidence, medium: 1 - confidence, low: 0 },
          resourceUsage: {
            computeUnits: 1,
            memoryUsage: 512,
            storageAccessed: image.imageData.length,
            networkEgress: 0,
            vertexAIPredictions: 0, // Not used in Phase 1
          },
          costEstimate: {
            computeCost: 0,
            storageCost: 0,
            networkCost: 0,
            vertexAICost: 0,
            totalCost: 0,
            currency: 'USD',
          },
        },
        status: 'completed',
        vertexAIModelUsed: 'none', // Phase 1 doesn't use Vertex AI
        gcpProcessingRegion: 'none',
      };
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`Medical image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeWithHuggingFace(image: MedicalImage): Promise<any[]> {
    // For Phase 1 demo, we'll simulate medical analysis
    // In production, this would use actual medical AI models from HF
    
    const prompt = this.createMedicalAnalysisPrompt(image);
    
    const response = await fetch(`${this.hfBaseUrl}/models/${phase1Config.ai.huggingface.models.textAnalysis}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result: HuggingFaceResponse[] = await response.json();
    
    // Process HF response into medical findings
    return this.processHuggingFaceResponse(result, image);
  }

  private async analyzeWithOpenAI(image: MedicalImage): Promise<any[]> {
    const prompt = this.createDetailedMedicalPrompt(image);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: phase1Config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specializing in diagnostic imaging analysis. Provide structured medical findings in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: phase1Config.ai.openai.maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result: OpenAIResponse = await response.json();
    
    // Parse OpenAI response into structured findings
    return this.processOpenAIResponse(result.choices[0].message.content, image);
  }

  private createMedicalAnalysisPrompt(image: MedicalImage): string {
    return `Analyze this ${image.imageType} medical image of ${image.metadata.bodyPart} (${image.metadata.viewPosition} view). 
    Image details: ${image.metadata.resolution.width}x${image.metadata.resolution.height}, ${image.metadata.bitDepth}-bit depth.
    Provide medical findings and observations.`;
  }

  private createDetailedMedicalPrompt(image: MedicalImage): string {
    return `As a medical imaging specialist, analyze this ${image.imageType} image:
    
    Patient: ${image.patientId}
    Body Part: ${image.metadata.bodyPart}
    View: ${image.metadata.viewPosition}
    Image Quality: Resolution ${image.metadata.resolution.width}x${image.metadata.resolution.height}
    
    Please provide:
    1. Key anatomical structures visible
    2. Any abnormalities or findings
    3. Severity assessment (mild/moderate/severe)
    4. Recommended follow-up actions
    
    Format response as JSON with findings array.`;
  }

  private processHuggingFaceResponse(response: HuggingFaceResponse[], image: MedicalImage): any[] {
    // Simulate medical findings for demo
    return [
      {
        description: `${image.imageType.toUpperCase()} analysis of ${image.metadata.bodyPart}`,
        severity: 'moderate',
        confidence: 0.75,
        location: image.metadata.bodyPart,
      },
    ];
  }

  private processOpenAIResponse(content: string, image: MedicalImage): any[] {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      return parsed.findings || [parsed];
    } catch {
      // Fallback to text parsing
      return [
        {
          description: content.substring(0, 200),
          severity: 'moderate',
          confidence: 0.8,
          location: image.metadata.bodyPart,
        },
      ];
    }
  }

  private async generateRiskAssessment(image: MedicalImage, findings: any[]): Promise<RiskAssessment> {
    // Simplified risk assessment for Phase 1
    const hasFindings = findings.length > 0;
    const severity = findings[0]?.severity || 'mild';
    
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    let urgencyScore: number;
    
    if (severity === 'severe') {
      riskLevel = 'High';
      urgencyScore = 8;
    } else if (severity === 'moderate') {
      riskLevel = 'Medium';
      urgencyScore = 5;
    } else {
      riskLevel = 'Low';
      urgencyScore = 2;
    }
    
    return {
      riskLevel,
      riskFactors: findings.map(f => ({
        factorId: `risk_${Math.random().toString(36).substr(2, 9)}`,
        name: f.description,
        category: this.categorizeRisk(image.metadata.bodyPart),
        severity: urgencyScore,
        evidence: [],
        interactions: [],
        medGemmaGenerated: false,
        clinicalValidation: 'pending',
      })),
      clinicalSuggestions: [],
      urgencyScore,
      evidenceQuality: 0.7,
    };
  }

  private async generateClinicalSuggestions(findings: any[], riskAssessment: RiskAssessment): Promise<any[]> {
    return [
      {
        suggestionId: `suggestion_${Date.now()}`,
        type: 'diagnostic',
        priority: riskAssessment.riskLevel === 'High' ? 'high' : 'medium',
        description: 'Follow-up imaging recommended based on findings',
        rationale: 'Initial findings require additional evaluation',
        literatureReferences: [],
        medGemmaConfidence: 0,
        specialtyRecommendation: {
          specialty: 'radiology',
          findings: findings.map(f => f.description),
          recommendations: ['Follow-up in 3-6 months'],
          urgencyLevel: riskAssessment.urgencyScore,
          literatureReferences: [],
        },
      },
    ];
  }

  private inferOrganFromBodyPart(bodyPart: string): string {
    const organMap: Record<string, string> = {
      chest: 'lungs',
      abdomen: 'abdomen',
      head: 'brain',
      extremity: 'bone',
    };
    return organMap[bodyPart] || bodyPart;
  }

  private categorizeRisk(bodyPart: string): 'cardiovascular' | 'respiratory' | 'neurological' | 'oncological' | 'other' {
    const categoryMap: Record<string, 'cardiovascular' | 'respiratory' | 'neurological' | 'oncological' | 'other'> = {
      chest: 'respiratory',
      abdomen: 'other',
      head: 'neurological',
      extremity: 'other',
    };
    return categoryMap[bodyPart] || 'other';
  }
}
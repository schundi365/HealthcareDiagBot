/**
 * Phase 1 Storage Service - Cloudinary Implementation
 * Replaces Google Cloud Storage with Cloudinary for free tier
 */

import { v2 as cloudinary } from 'cloudinary';
import { phase1Config } from '../config/phase1-config';
import { MedicalImage } from '../types/medical';

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

export class Phase1StorageService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: phase1Config.storage.cloudinary.cloudName,
      api_key: phase1Config.storage.cloudinary.apiKey,
      api_secret: phase1Config.storage.cloudinary.apiSecret,
    });
  }

  /**
   * Upload medical image to Cloudinary
   */
  async uploadMedicalImage(image: MedicalImage): Promise<UploadResult> {
    try {
      // Convert buffer to base64 for Cloudinary upload
      const base64Image = `data:image/png;base64,${image.imageData.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: 'medical-images',
        public_id: `${image.patientId}_${image.imageId}`,
        resource_type: 'image',
        format: 'png',
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' }, // Limit size for free tier
          { quality: 'auto:good' }, // Optimize quality
        ],
        tags: [
          image.imageType,
          image.metadata.bodyPart,
          image.metadata.viewPosition,
        ],
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download medical image from Cloudinary
   */
  async downloadMedicalImage(publicId: string): Promise<Buffer> {
    try {
      const url = cloudinary.url(publicId, {
        resource_type: 'image',
        format: 'png',
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Image download failed:', error);
      throw new Error(`Image download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete medical image from Cloudinary
   */
  async deleteMedicalImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw new Error(`Image deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image URL for display
   */
  getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}): string {
    return cloudinary.url(publicId, {
      resource_type: 'image',
      width: options.width || 512,
      height: options.height || 512,
      crop: 'limit',
      quality: options.quality || 'auto:good',
      format: options.format || 'webp',
      fetch_format: 'auto',
    });
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'image',
      width: 150,
      height: 150,
      crop: 'fill',
      quality: 'auto:low',
      format: 'webp',
    });
  }

  /**
   * List images for a patient (using tags)
   */
  async listPatientImages(patientId: string): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(`folder:medical-images AND public_id:${patientId}_*`)
        .sort_by([['created_at', 'desc']])
        .max_results(50)
        .execute();

      return result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        secureUrl: resource.secure_url,
        format: resource.format,
        bytes: resource.bytes,
        width: resource.width,
        height: resource.height,
        createdAt: resource.created_at,
        tags: resource.tags,
      }));
    } catch (error) {
      console.error('Failed to list patient images:', error);
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalImages: number;
    totalBytes: number;
    remainingQuota: number;
  }> {
    try {
      const result = await cloudinary.search
        .expression('folder:medical-images')
        .aggregate('bytes')
        .execute();

      const totalBytes = result.aggregations?.bytes?.sum || 0;
      const totalImages = result.total_count || 0;
      const quotaLimit = 25 * 1024 * 1024 * 1024; // 25GB in bytes
      const remainingQuota = Math.max(0, quotaLimit - totalBytes);

      return {
        totalImages,
        totalBytes,
        remainingQuota,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalImages: 0,
        totalBytes: 0,
        remainingQuota: 25 * 1024 * 1024 * 1024,
      };
    }
  }

  /**
   * Validate file size and type for free tier limits
   */
  validateUpload(file: Buffer, mimeType: string): void {
    const maxSize = phase1Config.app.maxFileSize * 1024 * 1024; // Convert MB to bytes
    
    if (file.length > maxSize) {
      throw new Error(`File size exceeds limit of ${phase1Config.app.maxFileSize}MB`);
    }

    if (!phase1Config.app.allowedImageTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} not allowed. Supported types: ${phase1Config.app.allowedImageTypes.join(', ')}`);
    }
  }
}
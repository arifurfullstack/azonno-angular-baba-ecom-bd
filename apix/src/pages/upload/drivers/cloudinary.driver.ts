import {
  IStorageDriver,
  StorageUploadOptions,
  StorageUploadResult,
} from '../interfaces/storage-driver.interface';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync, unlinkSync } from 'fs';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

export class CloudinaryDriver implements IStorageDriver {
  private client: typeof cloudinary;

  constructor(private config: CloudinaryConfig) {
    this.client = cloudinary;
    this.client.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult> {
    try {
      const folderName = [
        this.config.folder || 'azonnox',
        options.shop || '',
        options.folder || '',
      ]
        .filter(Boolean)
        .join('/');

      const uploadOptions: any = {
        folder: folderName,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      };

      if (options.convertWebp) {
        uploadOptions.format = 'webp';
      }

      if (options.width || options.height) {
        uploadOptions.transformation = [
          {
            width: options.width,
            height: options.height,
            crop: 'limit',
          },
        ];
      }

      const result = await this.client.uploader.upload(
        file.path,
        uploadOptions,
      );

      // Clean up temporary local upload file
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }

      const resolutionQuery =
        result.width && result.height
          ? `?resolution=${result.width}_${result.height}`
          : '';

      return {
        originalname: file.originalname,
        filename: `${result.public_id}.${result.format}`,
        format: result.format,
        width: result.width,
        height: result.height,
        size: `${(result.bytes / 1024).toFixed(2)} KB`,
        url: `${result.secure_url}${resolutionQuery}`,
        provider: 'cloudinary',
        rawResponse: result,
      };
    } catch (error: any) {
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extract public_id from Cloudinary URL
      // Example URL: https://res.cloudinary.com/cloudname/image/upload/v1234567/folder/image_id.webp
      const cleanUrl = fileUrl.replace(/\?.*/, '');
      const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        const publicId = match[1];
        const res = await this.client.uploader.destroy(publicId);
        return res.result === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.cloudName || !this.config.apiKey || !this.config.apiSecret) {
        return {
          success: false,
          message: 'Cloudinary Cloud Name, API Key, and API Secret are required.',
        };
      }
      const pingResult = await this.client.api.ping();
      if (pingResult && pingResult.status === 'ok') {
        return {
          success: true,
          message: `Successfully connected to Cloudinary account (${this.config.cloudName}).`,
        };
      }
      return {
        success: false,
        message: 'Could not establish connection to Cloudinary.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloudinary connection failed: ${err.message}`,
      };
    }
  }
}

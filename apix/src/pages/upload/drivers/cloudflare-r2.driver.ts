import {
  IStorageDriver,
  StorageUploadOptions,
  StorageUploadResult,
} from '../interfaces/storage-driver.interface';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { parse } from 'path';
import * as sharp from 'sharp';
import { imageSize } from 'image-size';

export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string; // e.g. https://cdn.yourdomain.com or https://pub-xxx.r2.dev
}

export class CloudflareR2Driver implements IStorageDriver {
  private s3Client: S3Client;

  constructor(private config: CloudflareR2Config) {
    const endpoint = config.accountId
      ? `https://${config.accountId}.r2.cloudflarestorage.com`
      : undefined;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult> {
    try {
      const folder = [options.shop, options.folder]
        .filter(Boolean)
        .join('/');

      let fileBuffer: Buffer;
      let contentType: string;
      let extension: string;
      let width: number | undefined;
      let height: number | undefined;

      const filename = parse(file.filename).name;

      if (options.convertWebp) {
        extension = 'webp';
        contentType = 'image/webp';
        const sharpInstance = sharp(file.path);
        if (options.width || options.height) {
          sharpInstance.resize(options.width, options.height);
        }
        const webpBuffer = await sharpInstance
          .webp({ effort: 4, quality: options.quality || 85 })
          .toBuffer({ resolveWithObject: true });

        fileBuffer = webpBuffer.data;
        width = webpBuffer.info.width;
        height = webpBuffer.info.height;
      } else {
        extension = parse(file.filename).ext.replace('.', '') || 'jpg';
        contentType = file.mimetype || 'application/octet-stream';
        fileBuffer = readFileSync(file.path);
        const metaData = imageSize(file.path);
        width = metaData.width;
        height = metaData.height;
      }

      const key = folder
        ? `${folder}/${filename}.${extension}`
        : `${filename}.${extension}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );

      // Clean up temporary local file
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }

      const publicDomain = (this.config.publicDomain || '').replace(/\/$/, '');
      const resolutionQuery =
        width && height ? `?resolution=${width}_${height}` : '';
      const url = `${publicDomain}/${key}${resolutionQuery}`;

      return {
        originalname: file.originalname,
        filename: `${filename}.${extension}`,
        format: extension,
        width,
        height,
        size: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        url,
        provider: 'cloudflare_r2',
      };
    } catch (error: any) {
      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }
      throw new Error(`Cloudflare R2 upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const cleanUrl = fileUrl.replace(/\?.*/, '');
      const publicDomain = (this.config.publicDomain || '').replace(/\/$/, '');
      let key = cleanUrl;
      if (publicDomain && cleanUrl.startsWith(publicDomain)) {
        key = cleanUrl.replace(`${publicDomain}/`, '');
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (
        !this.config.accountId ||
        !this.config.accessKeyId ||
        !this.config.secretAccessKey ||
        !this.config.bucketName
      ) {
        return {
          success: false,
          message:
            'Cloudflare R2 Account ID, Access Key ID, Secret Key, and Bucket Name are required.',
        };
      }

      await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: this.config.bucketName,
        }),
      );

      return {
        success: true,
        message: `Successfully connected to Cloudflare R2 bucket "${this.config.bucketName}".`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloudflare R2 connection failed: ${err.message}`,
      };
    }
  }
}

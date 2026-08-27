import {
  IStorageDriver,
  StorageUploadOptions,
  StorageUploadResult,
} from '../interfaces/storage-driver.interface';
import { join, parse } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import * as sharp from 'sharp';
import { imageSize } from 'image-size';

export class LocalDriver implements IStorageDriver {
  constructor(private config?: { folderPath?: string }) {}

  async uploadFile(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult> {
    const shop = options.shop || '';
    const dir = shop ? `upload/images/${shop}` : `upload/images`;

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const quality = options.quality || 85;
    const width = options.width || null;
    const height = options.height || null;

    if (options.convertWebp) {
      const filename = parse(file.filename).name;
      const newFilename = `${filename}.webp`;
      const newPath = `${dir}/${newFilename}`;

      const metaData = await sharp(file.path)
        .resize(width, height)
        .webp({ effort: 4, quality })
        .withMetadata()
        .toFile(join(dir, newFilename));

      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }

      const baseurl = options.baseUrl || '';
      const url = `${baseurl}/${newPath}?resolution=${metaData.width}_${metaData.height}`;

      return {
        originalname: file.originalname,
        filename: newFilename,
        format: metaData.format,
        width: metaData.width,
        height: metaData.height,
        size: `${(metaData.size / 1024).toFixed(2)} KB`,
        url,
        provider: 'local',
      };
    } else {
      const metaData = imageSize(file.path);
      const baseurl = options.baseUrl || '';
      const url = `${baseurl}/${file.path}?resolution=${metaData.width}_${metaData.height}`;

      return {
        originalname: file.originalname,
        filename: file.filename,
        format: metaData.type || 'unknown',
        width: metaData.width,
        height: metaData.height,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        url,
        provider: 'local',
      };
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const cleanUrl = fileUrl.replace(/\?.*/, '');
      const pathIndex = cleanUrl.indexOf('upload/images');
      if (pathIndex !== -1) {
        const relativePath = cleanUrl.substring(pathIndex);
        if (existsSync(relativePath)) {
          unlinkSync(relativePath);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testDir = 'upload/images';
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      return {
        success: true,
        message: 'Local storage directory is accessible and writable.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Local storage error: ${err.message}`,
      };
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join, normalize, relative, sep } from 'path';
import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'fs';
import * as fs from 'fs-extra';
import * as fastCsv from 'fast-csv';
import * as sharp from 'sharp';
import {
  ImageUploadResponse,
  ResponsePayload,
} from '../../interfaces/response-payload.interface';
import {
  IStorageDriver,
  StorageUploadOptions,
  StorageUploadResult,
} from './interfaces/storage-driver.interface';
import { LocalDriver } from './drivers/local.driver';
import { CloudinaryDriver } from './drivers/cloudinary.driver';
import { CloudflareR2Driver } from './drivers/cloudflare-r2.driver';

@Injectable()
export class UploadService {
  private logger = new Logger(UploadService.name);

  constructor(
    @InjectModel('Setting') private readonly settingModel: Model<any>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolve active storage driver for a given shop
   */
  async getStorageDriver(shopId?: string): Promise<IStorageDriver> {
    try {
      if (shopId) {
        const setting: any = await this.settingModel
          .findOne({ shop: shopId })
          .select('storageSetting')
          .lean();

        const storageSetting = setting?.storageSetting;
        if (storageSetting) {
          const provider = storageSetting.activeProvider;

          if (provider === 'cloudinary' && storageSetting.cloudinary?.cloudName) {
            return new CloudinaryDriver({
              cloudName: storageSetting.cloudinary.cloudName,
              apiKey: storageSetting.cloudinary.apiKey,
              apiSecret: storageSetting.cloudinary.apiSecret,
              folder: storageSetting.cloudinary.folder,
            });
          }

          if (provider === 'cloudflare_r2' && storageSetting.cloudflareR2?.bucketName) {
            return new CloudflareR2Driver({
              accountId: storageSetting.cloudflareR2.accountId,
              accessKeyId: storageSetting.cloudflareR2.accessKeyId,
              secretAccessKey: storageSetting.cloudflareR2.secretAccessKey,
              bucketName: storageSetting.cloudflareR2.bucketName,
              publicDomain: storageSetting.cloudflareR2.publicDomain,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to resolve dynamic storage driver for shop ${shopId}: ${err.message}. Falling back to local storage.`);
    }

    return new LocalDriver();
  }

  /**
   * Upload single image using active driver
   */
  async uploadSingleImageByDriver(
    file: Express.Multer.File,
    shop: string,
    body: any,
    req: any,
  ): Promise<ImageUploadResponse> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseUrl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');

    const convertWebp =
      body &&
      body['convert'] &&
      body['convert'].toString().toLowerCase() === 'yes';

    const quality = body?.['quality'] ? Number(body['quality']) : 85;
    const width = body?.['width'] ? Number(body['width']) : undefined;
    const height = body?.['height'] ? Number(body['height']) : undefined;

    const driver = await this.getStorageDriver(shop);

    const uploadOptions: StorageUploadOptions = {
      shop,
      convertWebp,
      quality,
      width,
      height,
      baseUrl,
      prefix,
    };

    const result = await driver.uploadFile(file, uploadOptions);

    return {
      originalname: result.originalname,
      filename: result.filename,
      name: result.filename.split('.')[0],
      format: result.format,
      width: result.width,
      height: result.height,
      size: parseFloat(result.size) || this.bytesToKb(file.size),
      url: result.url,
    } as ImageUploadResponse;
  }

  /**
   * Upload multiple images using active driver
   */
  async uploadMultipleImagesByDriver(
    files: Express.Multer.File[],
    shop: string,
    body: any,
    req: any,
  ): Promise<ImageUploadResponse[]> {
    const isProduction = this.configService.get<boolean>('productionBuild');
    const prefix = this.configService.get<string>('prefix');
    const baseUrl =
      req.protocol +
      `${isProduction ? 's' : ''}://` +
      req.get('host') +
      (prefix ? `/${prefix}` : '');

    const convertWebp =
      body &&
      body['convert'] &&
      body['convert'].toString().toLowerCase() === 'yes';

    const quality = body?.['quality'] ? Number(body['quality']) : 85;
    const width = body?.['width'] ? Number(body['width']) : undefined;
    const height = body?.['height'] ? Number(body['height']) : undefined;

    const driver = await this.getStorageDriver(shop);

    const uploadOptions: StorageUploadOptions = {
      shop,
      convertWebp,
      quality,
      width,
      height,
      baseUrl,
      prefix,
    };

    const results: ImageUploadResponse[] = [];
    for (const file of files) {
      try {
        const res = await driver.uploadFile(file, uploadOptions);
        results.push({
          originalname: res.originalname,
          filename: res.filename,
          name: res.filename.split('.')[0],
          format: res.format,
          width: res.width,
          height: res.height,
          size: parseFloat(res.size) || this.bytesToKb(file.size),
          url: res.url,
        } as ImageUploadResponse);
      } catch (err: any) {
        this.logger.error(`Error uploading file ${file.originalname}: ${err.message}`);
      }
    }

    return results;
  }

  /**
   * Test storage provider credentials
   */
  async testStorageConnection(
    provider: string,
    config: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (provider === 'cloudinary') {
        const driver = new CloudinaryDriver({
          cloudName: config?.cloudName,
          apiKey: config?.apiKey,
          apiSecret: config?.apiSecret,
          folder: config?.folder,
        });
        return await driver.testConnection();
      }

      if (provider === 'cloudflare_r2') {
        const driver = new CloudflareR2Driver({
          accountId: config?.accountId,
          accessKeyId: config?.accessKeyId,
          secretAccessKey: config?.secretAccessKey,
          bucketName: config?.bucketName,
          publicDomain: config?.publicDomain,
        });
        return await driver.testConnection();
      }

      if (provider === 'local') {
        const driver = new LocalDriver();
        return await driver.testConnection();
      }

      return {
        success: false,
        message: `Unknown storage provider: ${provider}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection test error: ${err.message}`,
      };
    }
  }

  async deleteSingleFile(filePath: string): Promise<ResponsePayload> {
    try {
      const baseDir = './upload/images';

      if (filePath) {
        if (filePath.includes('res.cloudinary.com')) {
          // Cloudinary deletion handled by driver
          return {
            success: true,
            message: 'Success! Image Removed.',
          } as ResponsePayload;
        }

        const splitPath = filePath.split('/');
        const file = splitPath[splitPath.length - 1];
        const [fileName, fileType] = file.split('.');

        // Check Folder
        const normalizedFilePath = normalize(filePath);
        const normalizedBaseDir = normalize(baseDir);
        const relativePath = relative(normalizedBaseDir, normalizedFilePath);
        const pathSegments = relativePath.split(sep);
        let folder = '';
        if (pathSegments.length > 1) {
          folder = pathSegments[0];
        }

        const dir = folder ? `./upload/images/${folder}` : `./upload/images`;

        const wFiles: string[] = [
          `${dir}/${fileName}_16.${fileType}`,
          `${dir}/${fileName}_48.${fileType}`,
          `${dir}/${fileName}_96.${fileType}`,
          `${dir}/${fileName}_128.${fileType}`,
          `${dir}/${fileName}_384.${fileType}`,
          `${dir}/${fileName}_640.${fileType}`,
          `${dir}/${fileName}_750.${fileType}`,
          `${dir}/${fileName}_828.${fileType}`,
          `${dir}/${fileName}_1080.${fileType}`,
          `${dir}/${fileName}_1200.${fileType}`,
          `${dir}/${fileName}_1342.${fileType}`,
          `${dir}/${fileName}_1920.${fileType}`,
          `${dir}/${fileName}_2048.${fileType}`,
        ];
        for (const f of wFiles) {
          if (existsSync(f)) {
            unlinkSync(f);
          }
        }

        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }

        return {
          success: true,
          message: 'Success! Image Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleImage(
    baseurl: string,
    url: string[],
  ): Promise<ResponsePayload> {
    try {
      const baseDir = './upload/images';
      if (url && url.length) {
        url.forEach((u) => {
          if (u.includes('res.cloudinary.com') || u.includes('r2.cloudflarestorage.com')) {
            return;
          }
          const onlyUrl = u.replace(/\?.*/, '');
          const filePath = `.${onlyUrl.replace(baseurl, '')}`;

          const splitPath = filePath.split('/');
          const file = splitPath[splitPath.length - 1];
          const [fileName, fileType] = file.split('.');

          const normalizedFilePath = normalize(filePath);
          const normalizedBaseDir = normalize(baseDir);
          const relativePath = relative(normalizedBaseDir, normalizedFilePath);
          const pathSegments = relativePath.split(sep);
          let folder = '';
          if (pathSegments.length > 1) {
            folder = pathSegments[0];
          }

          const dir = folder ? `./upload/images/${folder}` : `./upload/images`;

          const wFiles: string[] = [
            `${dir}/${fileName}_16.${fileType}`,
            `${dir}/${fileName}_48.${fileType}`,
            `${dir}/${fileName}_96.${fileType}`,
            `${dir}/${fileName}_128.${fileType}`,
            `${dir}/${fileName}_384.${fileType}`,
            `${dir}/${fileName}_640.${fileType}`,
            `${dir}/${fileName}_750.${fileType}`,
            `${dir}/${fileName}_828.${fileType}`,
            `${dir}/${fileName}_1080.${fileType}`,
            `${dir}/${fileName}_1200.${fileType}`,
            `${dir}/${fileName}_1342.${fileType}`,
            `${dir}/${fileName}_1920.${fileType}`,
            `${dir}/${fileName}_2048.${fileType}`,
          ];
          for (const f of wFiles) {
            if (existsSync(f)) {
              unlinkSync(f);
            }
          }

          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        });

        return {
          success: true,
          message: 'Success! Image Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteMultipleFile(
    baseurl: string,
    url: string[],
  ): Promise<ResponsePayload> {
    try {
      if (url && url.length) {
        url.forEach((u) => {
          const path = `.${u.replace(baseurl, '')}`;
          if (existsSync(path)) {
            unlinkSync(path);
          }
        });

        return {
          success: true,
          message: 'Success! Files Successfully Removed.',
        } as ResponsePayload;
      } else {
        return {
          success: false,
          message: 'Error! No Path found',
        } as ResponsePayload;
      }
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async imageGenerator(
    image: string,
    width: string,
    folder: string,
    auto?: string,
  ): Promise<string> {
    try {
      const dir = folder ? `upload/images/${folder}` : `upload/images`;
      const originalFilePath = folder
        ? `./upload/images/${folder}/${image}`
        : `./upload/images/${image}`;
      const placeholderFilePath = `placeholder.png`;

      if (!existsSync(originalFilePath)) {
        return placeholderFilePath;
      }

      if (!width) {
        return image;
      }
      const [fileName, fileType] = image.split('.');
      const requestFilePath = `./upload/images/${fileName}_${width}.${fileType}`;
      let newFilename = `${fileName}_${width}.${fileType}`;

      if (!existsSync(requestFilePath)) {
        const nWidth = +width;
        if (
          nWidth === 16 ||
          nWidth === 48 ||
          nWidth === 96 ||
          nWidth === 128 ||
          nWidth === 384 ||
          nWidth === 640 ||
          nWidth === 750 ||
          nWidth === 828 ||
          nWidth === 1080 ||
          nWidth === 1200 ||
          nWidth === 1342 ||
          nWidth === 1920 ||
          nWidth === 2048
        ) {
          await sharp(originalFilePath)
            .resize(+width)
            .toFile(`${dir}/${newFilename}`);
        } else {
          newFilename = image;
        }
      }
      return newFilename;
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }

  bytesToKb(bytes: number): number {
    const res = bytes * 0.001;
    return Number(res.toFixed(2));
  }

  async deleteFolder(shop: string): Promise<ResponsePayload> {
    const baseDir = './upload/images';
    const dirPath = join(baseDir, shop);

    if (existsSync(dirPath)) {
      readdirSync(dirPath).forEach((file) => {
        const filePath = join(dirPath, file);
        if (lstatSync(filePath).isDirectory()) {
          this.deleteFolder(filePath);
        } else {
          unlinkSync(filePath);
        }
      });
      rmdirSync(dirPath);
    }

    return {
      success: true,
      message: 'Success',
    } as ResponsePayload;
  }

  async updateCsv(shop: string, products: any[]) {
    const uploadPath = join('upload', 'csv', shop);

    return new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(uploadPath + '.csv');
      fastCsv
        .write(products, { headers: true })
        .pipe(ws)
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  async getCsvFile(shop: string): Promise<string> {
    const filePath = join('upload', 'csv', shop);
    return filePath + '.csv';
  }
}

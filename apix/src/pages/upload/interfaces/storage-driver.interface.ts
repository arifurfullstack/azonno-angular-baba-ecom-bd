export interface StorageUploadOptions {
  shop?: string;
  folder?: string;
  convertWebp?: boolean;
  quality?: number;
  width?: number;
  height?: number;
  prefix?: string;
  baseUrl?: string;
}

export interface StorageUploadResult {
  originalname: string;
  filename: string;
  format: string;
  width?: number;
  height?: number;
  size: string;
  url: string;
  provider: 'local' | 'cloudinary' | 'cloudflare_r2';
  rawResponse?: any;
}

export interface IStorageDriver {
  uploadFile(
    file: Express.Multer.File,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult>;

  deleteFile(fileUrl: string): Promise<boolean>;

  testConnection(): Promise<{ success: boolean; message: string }>;
}

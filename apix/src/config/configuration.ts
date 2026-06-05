import * as process from 'node:process';

export default () => ({
  productionBuild: process.env.PRODUCTION_BUILD === 'true',
  prefix: process.env.PREFIX ?? null,
  hostname:
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`,
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoCluster:
    process.env.MONGODB_URI ||
      `mongodb://127.0.0.1:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'azonnox_db'}`,
  // JWT Token
  userJwtSecret: process.env.JWT_PRIVATE_KEY_USER,
  adminJwtSecret: process.env.JWT_PRIVATE_KEY_ADMIN,
  vendorJwtSecret: process.env.JWT_PRIVATE_KEY_VENDOR,
  affiliateJwtSecret: process.env.JWT_PRIVATE_KEY_AFFILIATE,
  userTokenExpiredTime: '7d',
  adminTokenExpiredDays: '7d',
  vendorTokenExpiredTime: '7d',
  affiliateTokenExpiredTime: '7d',
  adminTokenExpiredTime: '1d',

  // CDN Api
  cdnUrlBase:
    `${process.env.API_BASE_URL || 'http://localhost:3000'}/api`,

  // Build Script
  themeTargetPath: process.env.THEME_TARGET_PATH || 'c:/rif/azonnox/themex',
  apiBaseUrl:
    process.env.API_BASE_URL ||
    'http://localhost:3000',

  // Gmail Api
  gmail: process.env.GMAIL_SMTP_USER || 'saleecom.server@gmail.com',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleClientRedirectUrl: 'https://developers.google.com/oauthplayground',
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',

  vendorSecretKey: process.env.JWT_PRIVATE_KEY_VENDOR_SECRET,
});

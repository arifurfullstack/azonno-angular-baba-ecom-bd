import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import * as dns from 'dns';
import * as dotenv from 'dotenv';

// Load local environment variables
dotenv.config();

// Force Google DNS for SRV record resolution if supported
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore in environments where DNS modification is restricted
}

/**
 * Create and configure the NestJS application.
 * Can be called with an existing Express instance (for unified server embedding)
 * or without one (for standalone mode).
 */
export async function createNestApp(existingExpressApp?: express.Express): Promise<NestExpressApplication> {
  const logger = new Logger('NestAPI');

  let app: NestExpressApplication;
  if (existingExpressApp) {
    // Embedded mode: mount NestJS onto existing Express app
    const adapter = new ExpressAdapter(existingExpressApp);
    app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
      logger: ['error', 'warn', 'log'],
    });
  } else {
    // Standalone mode
    app = await NestFactory.create<NestExpressApplication>(AppModule);
  }

  // Enable CORS securely
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: true,
  });

  // Enable security headers
  // app.use(helmet());

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Limit payload size
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.use(
    '/upload/static',
    express.static(join(__dirname, '..', 'upload/static')),
  );

  // Global prefix for API routes (default to 'api')
  const prefix = process.env.PREFIX || 'api';
  app.setGlobalPrefix(prefix);

  // Log all requests
  app.use((req, res, next) => {
    logger.log(
      `Request: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`,
    );
    next();
  });

  return app;
}

/**
 * Standalone bootstrap — used when running `npm run start:dev` in apix/ directly.
 * Skipped when imported by the unified server.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await createNestApp();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Standalone API is running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during NestJS bootstrap:', err);
  process.exit(1);
});

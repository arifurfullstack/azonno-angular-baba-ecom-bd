import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import * as dns from 'dns';
import * as dotenv from 'dotenv';

// Load local environment variables
dotenv.config();

// Force Google DNS for SRV record resolution (fixes ISP DNS that doesn't support SRV)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

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

  // Global prefix for API routes
  if (process.env.PREFIX) {
    app.setGlobalPrefix(process.env.PREFIX);
  }

  // Log all requests
  // Log all requests
  app.use((req, res, next) => {
    logger.log(
      `Request: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`,
    );
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();

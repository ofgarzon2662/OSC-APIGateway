import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as express from 'express';

// Normalize origins to avoid subtle mismatches (trailing slashes, invisible chars, case)
function normalizeOrigin(origin?: string): string {
  if (!origin) return '';
  const cleaned = origin
    // remove zero-width and BOM characters that can sneak in from copy/paste
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
  return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Add Vary header to help caches handle per-origin responses
  app.use((req, res, next) => {
    res.setHeader('Vary', 'Origin');
    next();
  });

  // Configure CORS using env-driven allowlist
  app.enableCors({
    origin: (origin, cb) => {
      const normalized = normalizeOrigin(origin);
      if (!origin || ALLOWED_ORIGINS.includes(normalized)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept',
    credentials: true,
    optionsSuccessStatus: 204,
    exposedHeaders: 'Content-Disposition',
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

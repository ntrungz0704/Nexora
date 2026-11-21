import { NEXORA_API_V1_PREFIX } from '@nexora/config';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { getEnv, type AppEnv } from './config/env.js';
import { buildOpenApiSpec } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import {
  createRateLimiters,
  type RateLimitPolicyConfig,
  type RateLimitTierConfig,
} from './middleware/rateLimit.js';
import type { SystemRepository } from './modules/system/system.repository.js';
import { createV1Router } from './routes/index.js';

// Global BigInt JSON serialization support
if (!('toJSON' in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function () {
      return Number(this);
    },
    writable: true,
    configurable: true,
  });
}

export interface CreateAppOptions {
  env?: AppEnv;
  systemRepository?: SystemRepository;
  rateLimitOverrides?: Partial<{
    [K in keyof RateLimitPolicyConfig]: Partial<RateLimitTierConfig>;
  }>;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const env = options.env ?? getEnv();
  const app = express();

  app.disable('x-powered-by');
  // Safe proxy trust: false by default so arbitrary X-Forwarded-For headers are NEVER trusted.
  // Behind a single Nginx reverse proxy, set TRUST_PROXY=1.
  app.set('trust proxy', env.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const openApiSpec = buildOpenApiSpec(env.SERVER_URL);
  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  const rateLimiters = createRateLimiters(options.rateLimitOverrides);
  app.use(
    NEXORA_API_V1_PREFIX,
    rateLimiters.globalApi,
    createV1Router(options.systemRepository, rateLimiters),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

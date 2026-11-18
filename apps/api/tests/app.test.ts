import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { parseEnv, type AppEnv } from '../src/config/env.js';
import type { SystemRepository } from '../src/modules/system/system.repository.js';

const testEnv: AppEnv = {
  NODE_ENV: 'test',
  APP_NAME: 'Nexora',
  API_PORT: 3000,
  DATABASE_URL: 'mysql://nexora:testpass@127.0.0.1:3306/nexora_test',
  AUTH_SECRET: '0123456789abcdef0123456789abcdef',
  CLIENT_URL: 'http://localhost:5173',
  SERVER_URL: 'http://localhost:3000',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  corsOrigins: ['http://localhost:5173'],
};

function makeFakeRepo(up: boolean): SystemRepository {
  return {
    async ping() {
      return up;
    },
    async getFoundationCounts() {
      if (!up) throw new Error('DB down');
      return { storeSettingsCount: 3, usersCount: 3 };
    },
  };
}

describe('Nexora API Foundation (Unit & Express Middleware)', () => {
  it('fails fast when required env variables or valid AUTH_SECRET are missing', () => {
    expect(() => parseEnv({})).toThrow(/Invalid environment configuration/);
    expect(() =>
      parseEnv({
        DATABASE_URL: 'mongodb://localhost/bad',
        AUTH_SECRET: '0123456789abcdef0123456789abcdef',
      }),
    ).toThrow(/mysql:\/\//);
    expect(() =>
      parseEnv({
        DATABASE_URL: 'mysql://nexora:pass@127.0.0.1:3306/nexora',
        AUTH_SECRET: 'REPLACE_WITH_SECURE_RANDOM_HEX_SECRET_MIN_32_CHARS',
      }),
    ).toThrow(/placeholder/);
  });

  it('returns 200 healthy envelope when repository ping succeeds and 503 when degraded', async () => {
    const healthyApp = createApp({ env: testEnv, systemRepository: makeFakeRepo(true) });
    const resUp = await request(healthyApp).get('/api/v1/health');
    expect(resUp.status).toBe(200);
    expect(resUp.body.success).toBe(true);
    expect(resUp.body.data.database).toBe('up');

    const degradedApp = createApp({ env: testEnv, systemRepository: makeFakeRepo(false) });
    const resDown = await request(degradedApp).get('/api/v1/health');
    expect(resDown.status).toBe(503);
    expect(resDown.body.data.database).toBe('down');
  });

  it('enforces Zod validation and standardized 422 / 404 JSON envelopes', async () => {
    const app = createApp({ env: testEnv, systemRepository: makeFakeRepo(true) });

    const ok = await request(app).post('/api/v1/system/echo-check').send({ message: 'Nexora OK' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.valid).toBe(true);

    const invalid = await request(app).post('/api/v1/system/echo-check').send({ message: 'x' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.success).toBe(false);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await request(app).get('/api/v1/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('serves OpenAPI JSON specification at /api/docs.json', async () => {
    const app = createApp({ env: testEnv, systemRepository: makeFakeRepo(true) });
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/api/v1/health']).toBeDefined();
  });
});

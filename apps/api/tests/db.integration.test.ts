import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { disconnectPrisma } from '../src/common/prisma.js';
import { getEnv } from '../src/config/env.js';

describe('Nexora API + MySQL 8.4 + Prisma Integration', () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  it('connects to live MySQL 8.4 via Prisma and returns seeded Single-Vendor metadata', async () => {
    const env = getEnv();
    const app = createApp({ env });

    const healthRes = await request(app).get('/api/v1/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.data.status).toBe('ok');
    expect(healthRes.body.data.database).toBe('up');

    const metaRes = await request(app).get('/api/v1/system/meta');
    expect(metaRes.status).toBe(200);
    expect(metaRes.body.data.name).toBe('Nexora');
    expect(metaRes.body.data.businessModel).toBe('single-vendor');
    expect(metaRes.body.data.storeSettingsCount).toBeGreaterThanOrEqual(3);
    expect(metaRes.body.data.usersCount).toBeGreaterThanOrEqual(3);
  });
});

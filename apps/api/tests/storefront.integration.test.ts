import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import type { CategoryDto, BannerDto, ProductDto } from '@nexora/shared';

describe('Nexora Storefront & Catalog API (Live MySQL 8.4 Integration)', () => {
  const env = getEnv();
  const app = createApp({ env });

  it('GET /api/v1/catalog/categories returns 16 active categories', async () => {
    const res = await request(app).get('/api/v1/catalog/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(14);

    const laptopCat = (res.body.data as CategoryDto[]).find((c) => c.slug === 'laptop');
    expect(laptopCat).toBeDefined();
    expect(laptopCat?.icon).toMatch(/^fa-solid fa-laptop/);
  });

  it('GET /api/v1/catalog/banners returns active hero and sidebar banners', async () => {
    const res = await request(app).get('/api/v1/catalog/banners');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);

    const rtxBanner = (res.body.data as BannerDto[]).find((b) => b.title.includes('RTX 50'));
    expect(rtxBanner).toBeDefined();
    expect(rtxBanner?.placement).toBe('hero');
  });

  it('GET /api/v1/catalog/products returns list of tech products with formatted decimal prices', async () => {
    const res = await request(app).get('/api/v1/catalog/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThanOrEqual(10);
    expect(res.body.data.total).toBeGreaterThanOrEqual(10);

    const first = res.body.data.products[0];
    expect(typeof first.price).toBe('string');
    expect(first.sku).toBeDefined();
    expect(first.category).toBeDefined();
  });

  it('GET /api/v1/catalog/products/flash-sale returns discounted items', async () => {
    const res = await request(app).get('/api/v1/catalog/products/flash-sale');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    (res.body.data as ProductDto[]).forEach((p) => {
      expect(p.salePrice).not.toBeNull();
    });
  });

  it('POST /api/v1/auth/login authenticates with seeded customer credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('customer@nexora.local');
    expect(res.body.data.user.role).toBe('CUSTOMER');
  });

  it('POST /api/v1/auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/cart retrieves customer cart summary', async () => {
    // Login to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    const token = loginRes.body.data.token;

    const res = await request(app).get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.totalItems).toBeGreaterThanOrEqual(1);
  });
});

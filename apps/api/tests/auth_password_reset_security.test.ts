import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { getEnv } from '../src/config/env.js';
import type { Express } from 'express';

describe('Auth Password Reset Security Test Suite', () => {
  let app: Express;
  let authService: AuthService;

  beforeAll(() => {
    app = createApp();
    authService = new AuthService();
  });

  it('SEC-RESET-1: POST /api/v1/auth/forgot-password with EXISTING email NEVER returns token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('message');
    // Security assertion: resetToken must be undefined
    expect(res.body.data.resetToken).toBeUndefined();
    expect(res.body.data.token).toBeUndefined();
  });

  it('SEC-RESET-2: POST /api/v1/auth/forgot-password with NON-EXISTENT email returns IDENTICAL message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent-account-xyz@nexora.local' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('message');
    // Prevents user enumeration
    expect(res.body.data.message).toBe('Nếu email tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.');
    expect(res.body.data.resetToken).toBeUndefined();
  });

  it('SEC-RESET-3: Rejects standard access token with INVALID_TOKEN_PURPOSE', async () => {
    const env = getEnv();
    // Generate standard access token without purpose: password_reset
    const accessToken = jwt.sign(
      { sub: 1, email: 'customer@nexora.local', role: 'CUSTOMER' },
      env.AUTH_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: accessToken, newPassword: 'Password12345!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN_PURPOSE');
  });

  it('SEC-RESET-4: Rejects token with invalid/tampered purpose', async () => {
    const env = getEnv();
    const badPurposeToken = jwt.sign(
      { sub: 1, email: 'customer@nexora.local', purpose: 'email_verification' },
      env.AUTH_SECRET,
      { expiresIn: '15m' },
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: badPurposeToken, newPassword: 'Password12345!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN_PURPOSE');
  });

  it('SEC-RESET-5: Rejects expired reset token', async () => {
    const env = getEnv();
    const expiredToken = jwt.sign(
      { sub: 1, email: 'customer@nexora.local', purpose: 'password_reset' },
      env.AUTH_SECRET,
      { expiresIn: '-1s' }, // Expired 1 second ago
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: expiredToken, newPassword: 'Password12345!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EXPIRED_OR_INVALID_TOKEN');
  });

  it('SEC-RESET-6: Enforces one-time use of password reset token', async () => {
    // 1. Generate valid reset token
    const token = await authService.generatePasswordResetTokenForTest('customer@nexora.local');

    // 2. First use -> MUST succeed
    const firstUse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPasswordSecure1!' });

    expect(firstUse.status).toBe(200);
    expect(firstUse.body.success).toBe(true);

    // 3. Second use with the EXACT same token -> MUST BE REJECTED with TOKEN_ALREADY_USED
    const secondUse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword2!' });

    expect(secondUse.status).toBe(400);
    expect(secondUse.body.success).toBe(false);
    expect(secondUse.body.error.code).toBe('TOKEN_ALREADY_USED');

    // Clean up: reset back to default password123
    const cleanupToken = await authService.generatePasswordResetTokenForTest('customer@nexora.local');
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: cleanupToken, newPassword: 'password123' });
  });
});

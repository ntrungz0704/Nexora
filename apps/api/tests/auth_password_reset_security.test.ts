import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { EmailService } from '../src/modules/email/email.service.js';
import { getEnv } from '../src/config/env.js';
import type { Express } from 'express';

describe('Auth Password Reset Security & Email Delivery Test Suite', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    EmailService.clearSentEmails();
    EmailService.setMockFailure(false);
  });

  it('SEC-RESET-1: POST /forgot-password sends real email via provider and NEVER leaks token in response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe(
      'Nếu email tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
    );

    // Security assertion: token must NEVER appear in HTTP response
    expect(res.body.data.resetToken).toBeUndefined();
    expect(res.body.data.token).toBeUndefined();

    // Provider assertion: actual email was dispatched out-of-band
    const sentEmails = EmailService.getSentEmails();
    expect(sentEmails.length).toBe(1);

    const email = sentEmails[0];
    expect(email.to).toBe('customer@nexora.local');
    expect(email.subject).toContain('[Nexora]');
    expect(email.html).toContain('/auth/reset-password?token=');

    // Extract resetToken from actual email content
    const match = email.html.match(/token=([A-Za-z0-9-_.]+)/);
    expect(match).not.toBeNull();
    const token = match![1];

    // Verify token claims
    const env = getEnv();
    const decoded = jwt.verify(token, env.AUTH_SECRET) as jwt.JwtPayload;
    expect(decoded.purpose).toBe('password_reset');
    expect(decoded.email).toBe('customer@nexora.local');
    expect((decoded.exp ?? 0) - (decoded.iat ?? 0)).toBe(15 * 60); // Strictly 15 minutes
  });

  it('SEC-RESET-2: POST /forgot-password with non-existent email returns IDENTICAL message without dispatching email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent-account-xyz@nexora.local' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe(
      'Nếu email tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
    );
    expect(res.body.data.resetToken).toBeUndefined();

    // Anti-enumeration: No email should be dispatched
    const sentEmails = EmailService.getSentEmails();
    expect(sentEmails.length).toBe(0);
  });

  it('SEC-RESET-2B: Email provider failure does NOT falsely report success (returns 500 EMAIL_DELIVERY_FAILED)', async () => {
    EmailService.setMockFailure(true);

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_DELIVERY_FAILED');
  });

  it('SEC-RESET-3: Rejects standard access token with INVALID_TOKEN_PURPOSE', async () => {
    const env = getEnv();
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

  it('SEC-RESET-4: Rejects token with invalid or tampered purpose claim', async () => {
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
      { expiresIn: '-1s' },
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: expiredToken, newPassword: 'Password12345!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EXPIRED_OR_INVALID_TOKEN');
  });

  it('SEC-RESET-6: End-to-end reset via email token, validates login with new password and rejects sequential replay', async () => {
    // 1. Request reset link
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    const sentEmail = EmailService.getLastEmail();
    expect(sentEmail).toBeDefined();
    const match = sentEmail!.html.match(/token=([A-Za-z0-9-_.]+)/);
    expect(match).not.toBeNull();
    const token = match![1];

    // 2. First use of token -> Succeeded
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'BrandNewSecurePass2026!' });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 3. Login with new password -> Succeeded
    const loginNewRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'BrandNewSecurePass2026!' });
    expect(loginNewRes.status).toBe(200);

    // 4. Login with old password -> Rejected
    const loginOldRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@nexora.local', password: 'password123' });
    expect(loginOldRes.status).toBe(401);

    // 5. Sequential replay of same token -> Rejected with TOKEN_ALREADY_USED
    const replayRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword999!' });

    expect(replayRes.status).toBe(400);
    expect(replayRes.body.error.code).toBe('TOKEN_ALREADY_USED');

    // 6. Restore password to password123 for other tests
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });
    const restoreEmail = EmailService.getLastEmail();
    const restoreToken = restoreEmail!.html.match(/token=([A-Za-z0-9-_.]+)/)![1];
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: restoreToken, newPassword: 'password123' });
  });

  it('SEC-RESET-7: CONCURRENCY REGRESSION — Two simultaneous requests with same token: exactly ONE succeeds', async () => {
    // 1. Request fresh reset token via forgot-password
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });

    const sentEmail = EmailService.getLastEmail();
    expect(sentEmail).toBeDefined();
    const match = sentEmail!.html.match(/token=([A-Za-z0-9-_.]+)/);
    expect(match).not.toBeNull();
    const token = match![1];

    // 2. Fire TWO concurrent reset-password requests with the EXACT SAME token
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'ConcurrentPasswordAlpha1!' }),
      request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'ConcurrentPasswordBeta2!' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must be 200 (SUCCESS) and exactly one must be 400 (TOKEN_ALREADY_USED)
    expect(statuses).toEqual([200, 400]);

    const failedRes = res1.status === 400 ? res1 : res2;
    expect(failedRes.body.error.code).toBe('TOKEN_ALREADY_USED');

    const successRes = res1.status === 200 ? res1 : res2;
    expect(successRes.body.success).toBe(true);

    // 3. Restore password back to password123
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'customer@nexora.local' });
    const cleanupEmail = EmailService.getLastEmail();
    const cleanupToken = cleanupEmail!.html.match(/token=([A-Za-z0-9-_.]+)/)![1];
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: cleanupToken, newPassword: 'password123' });
  });
});

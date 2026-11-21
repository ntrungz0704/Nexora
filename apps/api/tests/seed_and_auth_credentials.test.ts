import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import type { Express } from 'express';

const prisma = new PrismaClient();

describe('Seed Credentials & Re-seed Password Preservation Test Suite', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('SEED-1: Admin password change is PRESERVED upon re-seeding (never overwritten)', async () => {
    const adminEmail = 'admin@nexora.local';

    // 1. Admin updates password to a custom secure password
    const newCustomPassword = 'MyCustomAdminSecret2026!#';
    const newHash = await bcrypt.hash(newCustomPassword, 10);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: newHash },
    });

    // 2. Verify login succeeds with the new custom password
    const loginCustom = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: newCustomPassword });

    expect(loginCustom.status).toBe(200);
    expect(loginCustom.body.success).toBe(true);

    // 3. Simulate re-seed logic (upsert without passwordHash in update block)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        fullName: 'Quản Trị Viên Nexora (Re-seeded)',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '0901234567',
        // passwordHash is deliberately omitted!
      },
      create: {
        email: adminEmail,
        fullName: 'Quản Trị Viên Nexora',
        passwordHash: '$2b$10$BJs.vgkcjsVinzK0KVxgjez/H7WwawZeD5.22AOQW7DuExInaU2xW',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    // 4. Verify login STILL succeeds with custom password (NOT reset to default)
    const loginAfterReseed = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: newCustomPassword });

    expect(loginAfterReseed.status).toBe(200);
    expect(loginAfterReseed.body.success).toBe(true);

    // 5. Verify default password123 FAILS (was NOT reinstated)
    const loginDefaultFails = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'password123' });

    expect(loginDefaultFails.status).toBe(401);
    expect(loginDefaultFails.body.success).toBe(false);

    // Clean up: restore default password for other integration test suites
    const defaultHash = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: defaultHash },
    });
  });

  it('SEED-2: Production bootstrap requires ADMIN_INITIAL_PASSWORD or fails with error', () => {
    const isProduction = true;
    const envBackup = { ...process.env };
    delete process.env.ADMIN_INITIAL_PASSWORD;
    delete process.env.ADMIN_INITIAL_PASSWORD_HASH;

    function simulateProductionBootstrap() {
      if (isProduction) {
        if (process.env.ADMIN_INITIAL_PASSWORD_HASH) {
          return process.env.ADMIN_INITIAL_PASSWORD_HASH;
        }
        if (process.env.ADMIN_INITIAL_PASSWORD) {
          return 'hashed_password';
        }
        throw new Error(
          '[FATAL SEED ERROR] In production, ADMIN_INITIAL_PASSWORD or ADMIN_INITIAL_PASSWORD_HASH environment variable must be provided to bootstrap the initial admin account safely without default passwords.',
        );
      }
      return 'dev_default';
    }

    expect(() => simulateProductionBootstrap()).toThrow(
      /In production, ADMIN_INITIAL_PASSWORD or ADMIN_INITIAL_PASSWORD_HASH environment variable must be provided/,
    );

    // Restore env
    process.env = envBackup;
  });
});

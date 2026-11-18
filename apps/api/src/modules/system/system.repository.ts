import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../common/prisma.js';

export interface SystemRepository {
  ping(): Promise<boolean>;
  getFoundationCounts(): Promise<{ storeSettingsCount: number; usersCount: number }>;
}

export class PrismaSystemRepository implements SystemRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient = getPrismaClient()) {
    this.prisma = prisma;
  }

  async ping(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getFoundationCounts(): Promise<{ storeSettingsCount: number; usersCount: number }> {
    const [storeSettingsCount, usersCount] = await Promise.all([
      this.prisma.storeSetting.count(),
      this.prisma.user.count(),
    ]);
    return { storeSettingsCount, usersCount };
  }
}

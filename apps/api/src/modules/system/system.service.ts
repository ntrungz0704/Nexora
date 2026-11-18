import { NEXORA_APP_NAME, NEXORA_BUSINESS_MODEL, NEXORA_ROLES } from '@nexora/config';
import type { EchoCheckResult, HealthStatus, SystemMeta } from '@nexora/shared';
import { AppError } from '../../common/errors.js';
import type { SystemRepository } from './system.repository.js';

export class SystemService {
  private readonly repository: SystemRepository;

  constructor(repository: SystemRepository) {
    this.repository = repository;
  }

  async getHealth(): Promise<HealthStatus> {
    const dbUp = await this.repository.ping();
    return {
      status: dbUp ? 'ok' : 'degraded',
      service: 'nexora-api',
      database: dbUp ? 'up' : 'down',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getMeta(): Promise<SystemMeta> {
    try {
      const counts = await this.repository.getFoundationCounts();
      return {
        name: NEXORA_APP_NAME,
        businessModel: NEXORA_BUSINESS_MODEL,
        roles: [...NEXORA_ROLES],
        storeSettingsCount: counts.storeSettingsCount,
        usersCount: counts.usersCount,
      };
    } catch {
      throw new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'Unable to read platform metadata from MySQL database.',
      );
    }
  }

  performEchoCheck(message: string): EchoCheckResult {
    return {
      valid: true,
      message,
      receivedAt: new Date().toISOString(),
    };
  }
}

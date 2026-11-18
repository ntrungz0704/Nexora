import {
  NEXORA_APP_NAME,
  NEXORA_BUSINESS_MODEL,
  NEXORA_ROLES,
  NEXORA_SLOGAN,
  type NexoraRole,
} from '@nexora/config';
import { z } from 'zod';

export { NEXORA_APP_NAME, NEXORA_BUSINESS_MODEL, NEXORA_ROLES, NEXORA_SLOGAN, type NexoraRole };

export const UserRoleSchema = z.enum(NEXORA_ROLES);

export const HealthStatusSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.string(),
  database: z.enum(['up', 'down']),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const SystemMetaSchema = z.object({
  name: z.string(),
  businessModel: z.literal(NEXORA_BUSINESS_MODEL),
  roles: z.array(z.enum(NEXORA_ROLES)),
  storeSettingsCount: z.number().int().nonnegative(),
  usersCount: z.number().int().nonnegative(),
});

export type SystemMeta = z.infer<typeof SystemMetaSchema>;

export const EchoCheckInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, 'Message must be at least 2 characters.')
    .max(120, 'Message must not exceed 120 characters.'),
});

export type EchoCheckInput = z.infer<typeof EchoCheckInputSchema>;

export const EchoCheckResultSchema = z.object({
  valid: z.literal(true),
  message: z.string(),
  receivedAt: z.string(),
});

export type EchoCheckResult = z.infer<typeof EchoCheckResultSchema>;

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

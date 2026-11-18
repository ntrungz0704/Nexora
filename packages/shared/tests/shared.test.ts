import { describe, expect, it } from 'vitest';
import {
  EchoCheckInputSchema,
  NEXORA_APP_NAME,
  NEXORA_BUSINESS_MODEL,
  NEXORA_ROLES,
  NEXORA_SLOGAN,
  UserRoleSchema,
} from '../src/index.js';

describe('@nexora/shared baseline contracts', () => {
  it('enforces single-vendor Nexora business model and 3 official roles (CUSTOMER, STAFF, ADMIN)', () => {
    expect(NEXORA_APP_NAME).toBe('Nexora');
    expect(NEXORA_SLOGAN).toBe('Smart Tech. Better Life.');
    expect(NEXORA_BUSINESS_MODEL).toBe('single-vendor');
    expect(NEXORA_ROLES).toEqual(['CUSTOMER', 'STAFF', 'ADMIN']);

    expect(UserRoleSchema.safeParse('CUSTOMER').success).toBe(true);
    expect(UserRoleSchema.safeParse('STAFF').success).toBe(true);
    expect(UserRoleSchema.safeParse('ADMIN').success).toBe(true);
    expect(UserRoleSchema.safeParse('SELLER').success).toBe(false);
    expect(UserRoleSchema.safeParse('GUEST').success).toBe(false);
  });

  it('validates and trims EchoCheckInputSchema safely', () => {
    const parsed = EchoCheckInputSchema.parse({ message: '  Foundation Ready  ' });
    expect(parsed.message).toBe('Foundation Ready');

    const bad = EchoCheckInputSchema.safeParse({ message: 'a' });
    expect(bad.success).toBe(false);
  });
});

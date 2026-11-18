import { describe, expect, it } from 'vitest';
import {
  EchoCheckInputSchema,
  NEXORA_APP_NAME,
  NEXORA_BUSINESS_MODEL,
  NEXORA_ROLES,
} from '../src/index.js';

describe('@nexora/shared baseline contracts', () => {
  it('enforces single-vendor Nexora business model and 4 standard roles', () => {
    expect(NEXORA_APP_NAME).toBe('Nexora');
    expect(NEXORA_BUSINESS_MODEL).toBe('single-vendor');
    expect(NEXORA_ROLES).toEqual(['GUEST', 'CUSTOMER', 'SELLER', 'ADMIN']);
  });

  it('validates and trims EchoCheckInputSchema safely', () => {
    const parsed = EchoCheckInputSchema.parse({ message: '  Foundation Ready  ' });
    expect(parsed.message).toBe('Foundation Ready');

    const bad = EchoCheckInputSchema.safeParse({ message: 'a' });
    expect(bad.success).toBe(false);
  });
});

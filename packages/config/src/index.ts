export const NEXORA_APP_NAME = 'Nexora' as const;

export const NEXORA_SLOGAN = 'Smart Tech. Better Life.' as const;

export const NEXORA_BUSINESS_MODEL = 'single-vendor' as const;

export const NEXORA_API_V1_PREFIX = '/api/v1' as const;

export const NEXORA_ROLES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const;

export type NexoraRole = (typeof NEXORA_ROLES)[number];

export const NEXORA_OFFICIAL_BRANCHES = ['main', 'trung', 'hieu', 'kim', 'dinh', 'phuc'] as const;

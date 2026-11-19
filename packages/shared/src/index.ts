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

// --- Auth Schemas ---
export const LoginInputSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên tối thiểu 2 ký tự.')
    .max(100, 'Họ tên tối đa 100 ký tự.'),
  email: z.string().trim().email('Email không đúng định dạng.'),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const AuthUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(NEXORA_ROLES),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

// --- Catalog Schemas ---
export const CategorySchema = z.object({
  id: z.number().int().positive(),
  parentId: z.number().int().positive().nullable().optional(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  children: z.array(z.any()).optional(),
});
export type CategoryDto = z.infer<typeof CategorySchema>;

export const BrandSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type BrandDto = z.infer<typeof BrandSchema>;

export const ProductSchema = z.object({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().optional(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  price: z.string(), // Stringified Decimal for precise client handling
  salePrice: z.string().nullable().optional(),
  stockQuantity: z.number().int(),
  thumbnailUrl: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  specs: z.record(z.string(), z.any()).nullable().optional(),
  isFeatured: z.boolean(),
  isHot: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']),
  category: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    })
    .optional(),
  brand: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
});
export type ProductDto = z.infer<typeof ProductSchema>;

export const BannerSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  imageUrl: z.string(),
  linkUrl: z.string().nullable().optional(),
  placement: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type BannerDto = z.infer<typeof BannerSchema>;

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  product: ProductSchema,
});
export type CartItemDto = z.infer<typeof CartItemSchema>;

export const CartSummarySchema = z.object({
  items: z.array(CartItemSchema),
  totalItems: z.number().int().nonnegative(),
  subtotal: z.string(),
});
export type CartSummaryDto = z.infer<typeof CartSummarySchema>;

// --- API Envelopes ---
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

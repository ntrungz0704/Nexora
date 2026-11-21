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

// --- Order & Checkout Schemas ---
export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const PaymentMethodEnum = z.enum(['COD', 'VNPAY', 'VIETQR', 'BANK_TRANSFER']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const CreateOrderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const CreateOrderInputSchema = z.object({
  customerName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự.'),
  customerEmail: z.string().trim().email('Email không đúng định dạng.'),
  customerPhone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, 'Số điện thoại gồm 10 chữ số.'),
  shippingAddress: z.string().trim().min(5, 'Địa chỉ giao hàng tối thiểu 5 ký tự.'),
  province: z.string().optional(),
  district: z.string().optional(),
  ward: z.string().optional(),
  customerNotes: z.string().optional(),
  paymentMethod: PaymentMethodEnum.default('COD'),
  couponCode: z.string().trim().optional(),
  items: z.array(CreateOrderItemInputSchema).optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const TrackOrderInputSchema = z.object({
  orderCode: z.string().trim().min(3, 'Mã đơn hàng không hợp lệ.'),
  phone: z.string().trim().min(9, 'Số điện thoại không hợp lệ.'),
});
export type TrackOrderInput = z.infer<typeof TrackOrderInputSchema>;

export const OrderItemDtoSchema = z.object({
  id: z.string(),
  productId: z.number().nullable().optional(),
  productName: z.string(),
  productSku: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  unitPrice: z.string(),
  quantity: z.number().int(),
  discountAmount: z.string(),
  subtotal: z.string(),
});
export type OrderItemDto = z.infer<typeof OrderItemDtoSchema>;

export const OrderDtoSchema = z.object({
  id: z.string(),
  orderCode: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  shippingAddress: z.string(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  ward: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  subtotal: z.string(),
  shippingFee: z.string(),
  discountAmount: z.string(),
  totalAmount: z.string(),
  paymentMethod: PaymentMethodEnum,
  paymentStatus: PaymentStatusEnum,
  orderStatus: OrderStatusEnum,
  couponCode: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  carrierName: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  createdAt: z.string(),
  items: z.array(OrderItemDtoSchema).optional(),
});
export type OrderDto = z.infer<typeof OrderDtoSchema>;

// --- Marketing Schemas ---
export const CouponDtoSchema = z.object({
  id: z.number(),
  code: z.string(),
  description: z.string().nullable().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.string(),
  minOrderValue: z.string(),
  maxDiscount: z.string().nullable().optional(),
  isActive: z.boolean(),
  expiresAt: z.string().nullable().optional(),
});
export type CouponDto = z.infer<typeof CouponDtoSchema>;

export const PostDtoSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  content: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  category: z.string(),
  views: z.number(),
  publishedAt: z.string().nullable().optional(),
});
export type PostDto = z.infer<typeof PostDtoSchema>;

export const FlashSaleItemDtoSchema = z.object({
  id: z.number(),
  productId: z.number(),
  flashSalePrice: z.string(),
  quantityLimit: z.number(),
  quantitySold: z.number(),
  product: ProductSchema,
});
export type FlashSaleItemDto = z.infer<typeof FlashSaleItemDtoSchema>;

export const FlashSaleDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean(),
  items: z.array(FlashSaleItemDtoSchema),
});
export type FlashSaleDto = z.infer<typeof FlashSaleDtoSchema>;

// --- AI Systems Schemas ---
export const AiChatbotQueryInputSchema = z.object({
  message: z.string().trim().min(1, 'Vui lòng nhập tin nhắn.'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional(),
});
export type AiChatbotQueryInput = z.infer<typeof AiChatbotQueryInputSchema>;

export const AiSurveyInputSchema = z.object({
  persona: z.string(), // 'gaming' | 'office' | 'creator' | 'developer' | 'business'
  budgetRange: z.string(), // 'under-15m' | '15m-25m' | '25m-40m' | 'above-40m'
  categoryPreference: z.string().optional(), // 'laptop' | 'laptop-gaming' | 'pc' | 'parts'
  priority: z.string().optional(), // 'performance' | 'durability' | 'screen' | 'battery'
  brandPreference: z.string().optional(),
});
export type AiSurveyInput = z.infer<typeof AiSurveyInputSchema>;

export const AiRecommendationRoleSchema = z.object({
  role: z.enum(['BEST_MATCH', 'BEST_VALUE', 'TOP_PERFORMANCE']),
  roleTitle: z.string(),
  score: z.number(),
  product: ProductSchema,
  reasons: z.array(z.string()),
  tradeOffs: z.string().optional(),
});
export type AiRecommendationRole = z.infer<typeof AiRecommendationRoleSchema>;

export const AiCompareInputSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(2).max(4),
  userPersona: z.string().optional(),
});
export type AiCompareInput = z.infer<typeof AiCompareInputSchema>;

export const AiProductChatInputSchema = z.object({
  productId: z.number().int().positive(),
  question: z.string().trim().min(2, 'Vui lòng nhập câu hỏi.'),
  sessionId: z.string().optional(),
});
export type AiProductChatInput = z.infer<typeof AiProductChatInputSchema>;

// --- Admin Schemas ---
export const AdminRevenueDaySchema = z.object({
  date: z.string(),
  isoDate: z.string(),
  revenue: z.number(),
  orders: z.number(),
});
export type AdminRevenueDayDto = z.infer<typeof AdminRevenueDaySchema>;

export const AdminOrderStatusBreakdownSchema = z.object({
  pending: z.number(),
  shipping: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  total: z.number(),
});
export type AdminOrderStatusBreakdownDto = z.infer<typeof AdminOrderStatusBreakdownSchema>;

export const AdminDashboardSummarySchema = z.object({
  totalRevenue: z.string(),
  ordersCount: z.number(),
  customersCount: z.number(),
  productsCount: z.number(),
  activeProductsCount: z.number().optional(),
  lowStockCount: z.number(),
  outOfStockCount: z.number().optional(),
  totalUnitsInStock: z.number().optional(),
  totalUnitsSold: z.number().optional(),
  pendingOrdersCount: z.number().optional(),
  revenueLast7Days: z.array(AdminRevenueDaySchema).optional(),
  orderStatusBreakdown: AdminOrderStatusBreakdownSchema.optional(),
  lowStockProducts: z.array(ProductSchema).optional(),
  recentOrders: z.array(OrderDtoSchema),
});
export type AdminDashboardSummaryDto = z.infer<typeof AdminDashboardSummarySchema>;

export * from './personaScoring.js';

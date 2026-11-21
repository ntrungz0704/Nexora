import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

export interface RateLimitTierConfig {
  windowMs: number;
  limit: number;
  message: string;
}

export interface RateLimitPolicyConfig {
  authLoginRegister: RateLimitTierConfig;
  passwordResetRequest: RateLimitTierConfig;
  passwordResetConfirm: RateLimitTierConfig;
  orderLookup: RateLimitTierConfig;
  commerceWrite: RateLimitTierConfig;
  ai: RateLimitTierConfig;
  globalApi: RateLimitTierConfig;
}

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicyConfig = {
  authLoginRegister: {
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Quá nhiều lần đăng nhập hoặc đăng ký. Vui lòng thử lại sau 15 phút.',
  },
  passwordResetRequest: {
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Quá nhiều yêu cầu khôi phục mật khẩu. Vui lòng thử lại sau 15 phút.',
  },
  passwordResetConfirm: {
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 15 phút.',
  },
  orderLookup: {
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: 'Quá nhiều yêu cầu tra cứu đơn hàng. Vui lòng thử lại sau 15 phút.',
  },
  commerceWrite: {
    windowMs: 15 * 60 * 1000,
    limit: 30,
    message: 'Quá nhiều yêu cầu đặt hàng hoặc thanh toán. Vui lòng thử lại sau ít phút.',
  },
  ai: {
    windowMs: 15 * 60 * 1000,
    limit: 30,
    message: 'Bạn đã gửi quá nhiều yêu cầu tới trợ lý AI. Vui lòng thử lại sau ít phút.',
  },
  globalApi: {
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: 'Quá nhiều yêu cầu tới hệ thống. Vui lòng thử lại sau ít phút.',
  },
};

export interface AppRateLimiters {
  authLoginRegister: RequestHandler;
  passwordResetRequest: RequestHandler;
  passwordResetConfirm: RequestHandler;
  orderLookup: RequestHandler;
  commerceWrite: RequestHandler;
  ai: RequestHandler;
  globalApi: RequestHandler;
}

function buildLimiter(config: RateLimitTierConfig): RequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Intentionally ignore untrusted X-Forwarded-For headers when trust proxy is false
    validate: { xForwardedForHeader: false },
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
        },
      });
    },
  });
}

export function createRateLimiters(
  overrides: Partial<{ [K in keyof RateLimitPolicyConfig]: Partial<RateLimitTierConfig> }> = {},
): AppRateLimiters {
  const merge = <K extends keyof RateLimitPolicyConfig>(key: K): RateLimitTierConfig => ({
    ...DEFAULT_RATE_LIMIT_POLICY[key],
    ...(overrides[key] ?? {}),
  });

  return {
    authLoginRegister: buildLimiter(merge('authLoginRegister')),
    passwordResetRequest: buildLimiter(merge('passwordResetRequest')),
    passwordResetConfirm: buildLimiter(merge('passwordResetConfirm')),
    orderLookup: buildLimiter(merge('orderLookup')),
    commerceWrite: buildLimiter(merge('commerceWrite')),
    ai: buildLimiter(merge('ai')),
    globalApi: buildLimiter(merge('globalApi')),
  };
}

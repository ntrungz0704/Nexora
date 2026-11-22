import { apiClient } from '../lib/apiClient';
import { cartService } from './cartService';
import {
  type ApiSuccessEnvelope,
  type LoginInput,
  type RegisterInput,
  type AuthUser,
  type MergeCartResultDto,
  MergeCartResultDtoSchema,
} from '@nexora/shared';

export interface AuthSession {
  user: AuthUser;
  token: string;
  cartMerge?: MergeCartResultDto;
}

/**
 * Xác thực dữ liệu trả về của Cart Merge theo đúng MergeCartResultDtoSchema.
 * Trả về MergeCartResultDto hợp lệ, hoặc null nếu dữ liệu bị lỗi/không đúng cấu trúc.
 */
function validateMergeResult(data: unknown): MergeCartResultDto | null {
  if (!data || typeof data !== 'object') return null;
  const parsed = MergeCartResultDtoSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const existingGuestSessionId = cartService.getExistingGuestSessionId();
    const guestSessionId = input.guestSessionId ?? (existingGuestSessionId || undefined);

    const payload: LoginInput = {
      email: input.email,
      password: input.password,
      ...(guestSessionId ? { guestSessionId } : {}),
    };

    const res = await apiClient.post<ApiSuccessEnvelope<AuthSession>>('/auth/login', payload);
    const session = res.data.data;

    // 1. Lưu JWT token và thông tin user vào localStorage
    localStorage.setItem('nexora_token', session.token);
    localStorage.setItem('nexora_user', JSON.stringify(session.user));

    // 2. Xử lý Failure-Safety cho Cart Merge nếu client có gửi guestSessionId
    if (guestSessionId) {
      const validMergeResult = validateMergeResult(session.cartMerge);

      if (validMergeResult) {
        // Backend Auto-Merge thành công với DTO hợp lệ -> xóa guest session an toàn
        cartService.clearGuestSession();
        session.cartMerge = validMergeResult;
      } else {
        // Backend Auto-Merge thất bại hoặc DTO không hợp lệ -> Kích hoạt đúng 1 lần Immediate Retry
        try {
          const retryRaw = await cartService.mergeCart(guestSessionId);
          const validRetryResult = validateMergeResult(retryRaw);
          if (validRetryResult) {
            cartService.clearGuestSession();
            session.cartMerge = validRetryResult;
          }
        } catch {
          // Immediate retry thất bại -> Bảo toàn nexora_guest_session trong localStorage cho Passive Retry
        }
      }
    }

    return session;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    const existingGuestSessionId = cartService.getExistingGuestSessionId();
    const guestSessionId = input.guestSessionId ?? (existingGuestSessionId || undefined);

    const payload: RegisterInput = {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      password: input.password,
      ...(guestSessionId ? { guestSessionId } : {}),
    };

    const res = await apiClient.post<ApiSuccessEnvelope<AuthSession>>('/auth/register', payload);
    const session = res.data.data;

    localStorage.setItem('nexora_token', session.token);
    localStorage.setItem('nexora_user', JSON.stringify(session.user));

    if (guestSessionId) {
      const validMergeResult = validateMergeResult(session.cartMerge);

      if (validMergeResult) {
        cartService.clearGuestSession();
        session.cartMerge = validMergeResult;
      } else {
        try {
          const retryRaw = await cartService.mergeCart(guestSessionId);
          const validRetryResult = validateMergeResult(retryRaw);
          if (validRetryResult) {
            cartService.clearGuestSession();
            session.cartMerge = validRetryResult;
          }
        } catch {
          // Immediate retry thất bại -> Bảo toàn nexora_guest_session cho Passive Retry
        }
      }
    }

    return session;
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<ApiSuccessEnvelope<{ user: AuthUser }>>('/auth/me');
    return res.data.data.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccessEnvelope<{ message: string }>>(
      '/auth/forgot-password',
      { email },
    );
    return res.data.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccessEnvelope<{ message: string }>>(
      '/auth/reset-password',
      {
        token,
        newPassword: password,
        password,
      },
    );
    return res.data.data;
  },

  logout(): void {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
  },

  getToken(): string | null {
    return localStorage.getItem('nexora_token');
  },

  getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem('nexora_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
};

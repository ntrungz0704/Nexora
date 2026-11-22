import { apiClient } from '../lib/apiClient';
import { cartService } from './cartService';
import type {
  ApiSuccessEnvelope,
  LoginInput,
  RegisterInput,
  AuthUser,
  MergeCartResultDto,
} from '@nexora/shared';

export interface AuthSession {
  user: AuthUser;
  token: string;
  cartMerge?: MergeCartResultDto;
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
      const isValidMergeResult =
        session.cartMerge &&
        typeof session.cartMerge.mergedItemsCount === 'number' &&
        session.cartMerge.cart !== undefined;

      if (isValidMergeResult) {
        // Backend Auto-Merge thành công -> xóa guest session an toàn
        cartService.clearGuestSession();
      } else {
        // Backend Auto-Merge thất bại hoặc thiếu cartMerge -> Kích hoạt đúng 1 lần Immediate Retry
        try {
          const retryResult = await cartService.mergeCart(guestSessionId);
          if (
            retryResult &&
            typeof retryResult.mergedItemsCount === 'number' &&
            retryResult.cart !== undefined
          ) {
            cartService.clearGuestSession();
            session.cartMerge = retryResult;
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
      const isValidMergeResult =
        session.cartMerge &&
        typeof session.cartMerge.mergedItemsCount === 'number' &&
        session.cartMerge.cart !== undefined;

      if (isValidMergeResult) {
        cartService.clearGuestSession();
      } else {
        try {
          const retryResult = await cartService.mergeCart(guestSessionId);
          if (
            retryResult &&
            typeof retryResult.mergedItemsCount === 'number' &&
            retryResult.cart !== undefined
          ) {
            cartService.clearGuestSession();
            session.cartMerge = retryResult;
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

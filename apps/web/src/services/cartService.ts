import { apiClient } from '../lib/apiClient';
import {
  type ApiSuccessEnvelope,
  type CartSummaryDto,
  type MergeCartResultDto,
  MergeCartResultDtoSchema,
} from '@nexora/shared';

export const GUEST_SESSION_KEY = 'nexora_guest_session';

/**
 * Lấy guestSessionId hiện có trong localStorage (nếu có).
 * TUYỆT ĐỐI không tự ý sinh mới nếu chưa có, nhằm tránh gửi guest session rác khi login/register.
 */
export function getExistingGuestSessionId(): string | null {
  try {
    return localStorage.getItem(GUEST_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Lấy hoặc sinh mới guestSessionId khi khách thực sự tương tác với giỏ hàng.
 */
export function getGuestSessionId(): string {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

/**
 * Xóa guestSessionId khỏi localStorage khi merge đã được xác nhận thành công.
 */
export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Kiểm tra xem client hiện tại có lưu guest session hay không.
 */
export function hasGuestSession(): boolean {
  return Boolean(getExistingGuestSessionId());
}

// In-flight guard & Deduplication state cho Passive Retry
let isMergingInFlight = false;
let lastAttemptedSessionId: string | null = null;
let lastAttemptFailed = false;

/**
 * Thử thực hiện Passive Retry khi người dùng đã đăng nhập mở CartPage.
 * Đảm bảo:
 * 1. In-flight guard: chống gọi đồng thời.
 * 2. Deduplication: không gọi lại vô hạn trên mỗi lần component re-render nếu lần trước đã thất bại.
 * 3. DTO Schema Validation: Xác thực toàn diện qua MergeCartResultDtoSchema.safeParse().
 * 4. Chỉ xóa session khi nhận kết quả thành công và DTO hoàn toàn hợp lệ.
 */
export async function attemptPassiveCartMerge(
  token: string | null,
): Promise<MergeCartResultDto | null> {
  if (!token) return null;
  const guestSessionId = getExistingGuestSessionId();
  if (!guestSessionId) return null;

  // In-flight guard: ngăn chặn thực thi song song
  if (isMergingInFlight) return null;

  // Deduplication: nếu session này vừa thử thất bại trong phiên mount hiện tại, không gọi lặp
  if (lastAttemptedSessionId === guestSessionId && lastAttemptFailed) {
    return null;
  }

  isMergingInFlight = true;
  lastAttemptedSessionId = guestSessionId;

  try {
    const rawResult = await cartService.mergeCart(guestSessionId);
    const parsed = MergeCartResultDtoSchema.safeParse(rawResult);

    if (parsed.success) {
      clearGuestSession();
      lastAttemptFailed = false;
      return parsed.data;
    }

    // DTO trả về không hợp lệ (ví dụ: cart null, thiếu items, sai kiểu dữ liệu)
    lastAttemptFailed = true;
    return null;
  } catch {
    lastAttemptFailed = true;
    // Tuyệt đối không xóa session khi thất bại
    return null;
  } finally {
    isMergingInFlight = false;
  }
}

/**
 * Reset guard khi cần (khi CartPage unmount/mount mới, khi user thao tác giỏ hàng, hoặc khi login tài khoản khác).
 */
export function resetPassiveMergeGuard(): void {
  lastAttemptedSessionId = null;
  lastAttemptFailed = false;
}

export const cartService = {
  getExistingGuestSessionId,
  getGuestSessionId,
  clearGuestSession,
  hasGuestSession,
  attemptPassiveCartMerge,
  resetPassiveMergeGuard,

  async getCart(): Promise<CartSummaryDto> {
    const guestSessionId = getExistingGuestSessionId() || getGuestSessionId();
    const res = await apiClient.get<ApiSuccessEnvelope<CartSummaryDto>>('/cart', {
      headers: { 'x-guest-session-id': guestSessionId },
    });
    return res.data.data;
  },

  async addItem(productId: number, quantity = 1): Promise<CartSummaryDto> {
    resetPassiveMergeGuard();
    const guestSessionId = getGuestSessionId();
    const res = await apiClient.post<ApiSuccessEnvelope<CartSummaryDto>>(
      '/cart/items',
      { productId, quantity },
      { headers: { 'x-guest-session-id': guestSessionId } },
    );
    return res.data.data;
  },

  async addToCart(productId: number, quantity = 1): Promise<CartSummaryDto> {
    return this.addItem(productId, quantity);
  },

  async updateItem(cartItemId: string, quantity: number): Promise<CartSummaryDto> {
    resetPassiveMergeGuard();
    const guestSessionId = getExistingGuestSessionId() || getGuestSessionId();
    const res = await apiClient.patch<ApiSuccessEnvelope<CartSummaryDto>>(
      `/cart/items/${cartItemId}`,
      { quantity },
      { headers: { 'x-guest-session-id': guestSessionId } },
    );
    return res.data.data;
  },

  async removeItem(cartItemId: string): Promise<CartSummaryDto> {
    resetPassiveMergeGuard();
    const guestSessionId = getExistingGuestSessionId() || getGuestSessionId();
    const res = await apiClient.delete<ApiSuccessEnvelope<CartSummaryDto>>(
      `/cart/items/${cartItemId}`,
      { headers: { 'x-guest-session-id': guestSessionId } },
    );
    return res.data.data;
  },

  async mergeCart(guestSessionId: string): Promise<MergeCartResultDto> {
    const res = await apiClient.post<ApiSuccessEnvelope<MergeCartResultDto>>('/cart/merge', {
      guestSessionId,
    });
    return res.data.data;
  },
};

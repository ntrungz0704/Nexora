import { apiClient } from '../lib/apiClient';
import type { ApiSuccessEnvelope, CartSummaryDto } from '@nexora/shared';

function getGuestSessionId(): string {
  let id = localStorage.getItem('nexora_guest_session');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('nexora_guest_session', id);
  }
  return id;
}

export const cartService = {
  async getCart(): Promise<CartSummaryDto> {
    const guestSessionId = getGuestSessionId();
    const res = await apiClient.get<ApiSuccessEnvelope<CartSummaryDto>>('/cart', {
      headers: { 'x-guest-session-id': guestSessionId },
    });
    return res.data.data;
  },

  async addItem(productId: number, quantity = 1): Promise<CartSummaryDto> {
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
    const guestSessionId = getGuestSessionId();
    const res = await apiClient.patch<ApiSuccessEnvelope<CartSummaryDto>>(
      `/cart/items/${cartItemId}`,
      { quantity },
      { headers: { 'x-guest-session-id': guestSessionId } },
    );
    return res.data.data;
  },

  async removeItem(cartItemId: string): Promise<CartSummaryDto> {
    const guestSessionId = getGuestSessionId();
    const res = await apiClient.delete<ApiSuccessEnvelope<CartSummaryDto>>(
      `/cart/items/${cartItemId}`,
      { headers: { 'x-guest-session-id': guestSessionId } },
    );
    return res.data.data;
  },
};

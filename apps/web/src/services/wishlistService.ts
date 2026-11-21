import { authService } from './authService';
import type { ProductDto } from '@nexora/shared';

export interface WishlistItemDto {
  id: number;
  productId: number;
  createdAt: string;
  product: ProductDto;
}

const getApiBase = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const wishlistService = {
  async getWishlist(): Promise<WishlistItemDto[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('UNAUTHORIZED');
    }

    const res = await fetch(`${getApiBase()}/wishlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch wishlist');
    }

    const json = await res.json();
    return json.data || [];
  },

  async toggleWishlist(
    productId: number | string,
  ): Promise<{ inWishlist: boolean; count: number; message: string }> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('UNAUTHORIZED');
    }

    const res = await fetch(`${getApiBase()}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: Number(productId) }),
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to toggle wishlist');
    }

    const json = await res.json();
    return json.data;
  },

  async removeFromWishlist(productId: number | string): Promise<void> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('UNAUTHORIZED');
    }

    const res = await fetch(`${getApiBase()}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to remove from wishlist');
    }
  },

  async getWishlistCount(): Promise<number> {
    const token = authService.getToken();
    if (!token) return 0;

    try {
      const res = await fetch(`${getApiBase()}/wishlist/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return 0;
      const json = await res.json();
      return json.data?.count || 0;
    } catch {
      return 0;
    }
  },
};

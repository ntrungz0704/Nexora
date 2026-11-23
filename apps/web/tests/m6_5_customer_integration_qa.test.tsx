// @vitest-environment jsdom
/**
 * M6.5 Cross-Module Customer Integration QA Suite (Frontend Component-Service Layer)
 *
 * Scope Notice:
 * - 100% DB-free (jsdom + mocked apiClient/fetch HTTP boundaries).
 * - Verifies cross-module Frontend journeys across M6.1–M6.4, TanStack Query cache behavior,
 *   and empirical reproduction of R-02 (Logout Cache Fragmentation) and R-03 (Checkout -> my-orders).
 * - Does NOT prove live MySQL/Backend behavior (covered separately by Tier 2 on nexora_test).
 */
import '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import {
  PRIVATE_QUERY_KEY_PREFIXES,
  bindQueryClientToAuthEvents,
  getAuthSessionListenerCount,
  handleCrossTabAuthStorageEvent,
} from '../src/lib/authQueryCache';
import { authService } from '../src/services/authService';
import { GUEST_SESSION_KEY } from '../src/services/cartService';
import { AppProviders } from '../src/app/providers';
import { ProductDetailPage } from '../src/features/catalog/ProductDetailPage';
import { LoginPage } from '../src/features/auth/LoginPage';
import { CartPage } from '../src/features/cart/CartPage';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import { WishlistPage } from '../src/features/wishlist/WishlistPage';
import { CheckoutPage } from '../src/features/checkout/CheckoutPage';
import type {
  AuthUser,
  CustomerAddressDto,
  OrderDto,
  ProductDto,
  ReturnRequestDto,
  ReviewDto,
} from '@nexora/shared';

const userA: AuthUser = {
  id: 101,
  email: 'usera@nexora.local',
  fullName: 'Khách Hàng A',
  phone: '0901111111',
  avatarUrl: null,
  role: 'CUSTOMER',
};

const userB: AuthUser = {
  id: 202,
  email: 'userb@nexora.local',
  fullName: 'Khách Hàng B',
  phone: '0902222222',
  avatarUrl: null,
  role: 'CUSTOMER',
};

const sampleProduct: ProductDto & { images: unknown[]; reviews: unknown[] } = {
  id: 512,
  sku: 'GPU-RTX-5080',
  name: 'Card Đồ Họa NVIDIA RTX 5080',
  slug: 'nvidia-rtx-5080',
  categoryId: 3,
  brandId: 2,
  price: 34990000,
  salePrice: 32990000,
  stockQuantity: 5,
  status: 'ACTIVE',
  category: { id: 3, name: 'VGA', slug: 'vga' },
  brand: { id: 2, name: 'NVIDIA', slug: 'nvidia' },
  images: [],
  reviews: [],
};

const recentDeliveredOrder: OrderDto = {
  id: '8801',
  orderCode: 'NX-2026-8801',
  customerName: userA.fullName,
  customerEmail: userA.email,
  customerPhone: userA.phone!,
  shippingAddress: '123 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  subtotal: '32990000',
  shippingFee: '0',
  discountAmount: '0',
  totalAmount: '32990000',
  paymentMethod: 'COD',
  paymentStatus: 'PAID',
  orderStatus: 'DELIVERED',
  deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: '9001',
      productId: 512,
      productName: 'Card Đồ Họa NVIDIA RTX 5080',
      productSku: 'GPU-RTX-5080',
      thumbnailUrl: null,
      unitPrice: '32990000',
      quantity: 2,
      discountAmount: '0',
      subtotal: '65980000',
    },
  ],
};

function createProductionLikeQueryClient() {
  // Mirrors apps/web/src/app/providers.tsx (staleTime: 30_000, refetchOnWindowFocus: false)
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderAppAt(initialEntries: string[], queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<div>Trang Chủ Nexora</div>} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<div>Đặt Hàng Thành Công</div>} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/orders" element={<ProfilePage />} />
          <Route path="/profile/addresses" element={<ProfilePage />} />
          <Route path="/profile/return" element={<ProfilePage />} />
          <Route path="/profile/return/:id" element={<ProfilePage />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setSession(user: AuthUser, token = 'jwt-token-user') {
  localStorage.setItem('nexora_token', token);
  localStorage.setItem('nexora_user', JSON.stringify(user));
}

describe('M6.5 Cross-Module Customer Integration QA (DB-Free Frontend Layer)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('Flow 1: Guest browse -> Product Detail (/product/:slug) -> Add to Cart creates guest session & invalidates cart', async () => {
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/catalog/categories') return { data: { success: true, data: [] } };
      if (url === '/catalog/products') return { data: { success: true, data: [sampleProduct] } };
      if (url === `/catalog/products/${sampleProduct.slug}`) {
        return { data: { success: true, data: sampleProduct } };
      }
      if (url === `/catalog/products/${sampleProduct.id}/reviews`) {
        return {
          data: {
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            stats: {
              averageRating: 0,
              totalReviews: 0,
              ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            },
          },
        };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: { items: [{ id: 1, product: sampleProduct, quantity: 1 }], totalItems: 1 },
      },
    });

    renderAppAt([`/product/${sampleProduct.slug}`], queryClient);
    expect(await screen.findByRole('heading', { name: sampleProduct.name })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/cart/items',
        { productId: sampleProduct.id, quantity: 1 },
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-guest-session-id': expect.stringMatching(/^guest_/),
          }),
        }),
      );
    });

    expect(localStorage.getItem(GUEST_SESSION_KEY)).toMatch(/^guest_/);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
  });

  it('Flow 2: Guest Cart -> Login (/login) -> Auto-Merge clears guest session and invalidates cart', async () => {
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    localStorage.setItem(GUEST_SESSION_KEY, 'guest_flow2_session_abc');

    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { success: true, data: [] } });
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: userA,
          token: 'jwt-user-a',
          cartMerge: {
            cart: {
              id: 10,
              items: [],
              totalItems: 1,
              subtotal: '32990000',
            },
            mergedItemsCount: 1,
            adjustedItemsCount: 0,
            warnings: [],
          },
        },
      },
    });

    renderAppAt(['/login?redirect=/cart'], queryClient);

    fireEvent.change(screen.getByLabelText(/Email hoặc số điện thoại/i), {
      target: { value: userA.email },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/auth/login', {
        email: userA.email,
        password: 'password123',
        guestSessionId: 'guest_flow2_session_abc',
      });
    });

    expect(localStorage.getItem('nexora_token')).toBe('jwt-user-a');
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
  });

  it('Flow 3: Authenticated Customer -> Profile -> Address CRUD invalidates customer-addresses cache', async () => {
    setSession(userA, 'jwt-user-a');
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const createdAddr: CustomerAddressDto = {
      id: 401,
      userId: userA.id,
      recipientName: userA.fullName,
      phone: userA.phone!,
      streetAddress: '456 Hai Bà Trưng',
      ward: 'Phường Tân Định',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/profile') return { data: { success: true, data: userA } };
      if (url === '/profile/addresses') return { data: { success: true, data: [] } };
      if (url === '/profile/notifications') {
        return { data: { success: true, data: { unreadCount: 0, notifications: [] } } };
      }
      if (url === '/orders/my-orders') return { data: { success: true, data: [] } };
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: createdAddr },
    });

    renderAppAt(['/profile/addresses'], queryClient);
    fireEvent.click(await screen.findByRole('button', { name: /Thêm địa chỉ mới/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.change(dialog.querySelector('input[name="province"]')!, {
      target: { value: 'TP. Hồ Chí Minh' },
    });
    fireEvent.change(dialog.querySelector('input[name="district"]')!, {
      target: { value: 'Quận 1' },
    });
    fireEvent.change(dialog.querySelector('input[name="ward"]')!, {
      target: { value: 'Phường Tân Định' },
    });
    fireEvent.change(dialog.querySelector('input[name="streetAddress"]')!, {
      target: { value: '456 Hai Bà Trưng' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /Lưu Địa Chỉ|Thêm Địa Chỉ/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/profile/addresses',
        expect.objectContaining({
          province: 'TP. Hồ Chí Minh',
          streetAddress: '456 Hai Bà Trưng',
        }),
      );
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer-addresses'] });
  });

  it('Flows 4 & 5: Delivered Order -> Product Detail Review Eligibility -> Create (POST) -> Edit (PUT) -> Delete (DELETE)', async () => {
    setSession(userA, 'jwt-user-a');
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    let currentOwnReview: ReviewDto | null = null;
    const savedReview: ReviewDto = {
      id: 777,
      productId: sampleProduct.id,
      userId: userA.id,
      userName: userA.fullName,
      userAvatar: null,
      rating: 5,
      comment: 'Card chạy rất mát và mạnh.',
      isVerifiedPurchase: true,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === `/catalog/products/${sampleProduct.slug}`) {
        return { data: { success: true, data: sampleProduct } };
      }
      if (url === `/catalog/products/${sampleProduct.id}/reviews`) {
        const list = currentOwnReview ? [currentOwnReview] : [];
        return {
          data: {
            success: true,
            data: list,
            pagination: { page: 1, limit: 10, total: list.length, totalPages: 1 },
            stats: {
              averageRating: list.length ? currentOwnReview!.rating : 0,
              totalReviews: list.length,
              ratingBreakdown: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: list.length ? 1 : 0,
              },
            },
          },
        };
      }
      if (url === `/catalog/products/${sampleProduct.id}/reviews/eligibility`) {
        return {
          data: {
            success: true,
            data: { canReview: true, existingReview: currentOwnReview },
          },
        };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async () => {
      currentOwnReview = savedReview;
      return { data: { success: true, data: savedReview } };
    });
    const putSpy = vi.spyOn(apiClient, 'put').mockImplementation(async () => {
      currentOwnReview = { ...savedReview, rating: 4, comment: 'Cập nhật đánh giá sau 1 tuần.' };
      return { data: { success: true, data: currentOwnReview } };
    });
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockImplementation(async () => {
      currentOwnReview = null;
      return { data: { success: true, message: 'Đã xóa đánh giá thành công.' } };
    });

    renderAppAt([`/product/${sampleProduct.slug}`], queryClient);
    fireEvent.click(await screen.findByRole('button', { name: /Đánh giá & Nhận xét/i }));

    // 1. Create via POST with numeric productId
    fireEvent.click(await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' }));
    const createDialog = screen.getByRole('dialog');
    fireEvent.change(within(createDialog).getByLabelText(/Nhận xét chi tiết/i), {
      target: { value: 'Card chạy rất mát và mạnh.' },
    });
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/catalog/products/512/reviews', {
        rating: 5,
        comment: 'Card chạy rất mát và mạnh.',
      });
    });

    // 2. After refetch, Edit via PUT (never POST)
    fireEvent.click(await screen.findByRole('button', { name: 'Chỉnh sửa đánh giá' }));
    const editDialog = screen.getByRole('dialog');
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Chọn 4 sao' }));
    fireEvent.change(within(editDialog).getByLabelText(/Nhận xét chi tiết/i), {
      target: { value: 'Cập nhật đánh giá sau 1 tuần.' },
    });
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/catalog/reviews/777', {
        rating: 4,
        comment: 'Cập nhật đánh giá sau 1 tuần.',
      });
    });

    // 3. Delete via DELETE confirmation modal
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa đánh giá' }));
    const delDialog = screen.getByRole('dialog');
    fireEvent.click(within(delDialog).getByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/catalog/reviews/777');
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product-reviews', 512] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['review-eligibility', 512] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'home'] });
  });

  it('Flow 6 & 8: Orders Tab shortcut -> /profile/return -> Create Return -> List & Detail -> Invalidates returns & notifications', async () => {
    setSession(userA, 'jwt-user-a');
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const createdReturn: ReturnRequestDto = {
      id: 601,
      returnCode: 'RET-20261123-Q601',
      orderId: recentDeliveredOrder.id,
      orderCode: recentDeliveredOrder.orderCode,
      userId: userA.id,
      reason: 'Quạt card đồ họa kêu to bất thường',
      rejectionReason: null,
      handledBy: null,
      handlerName: null,
      status: 'PENDING',
      notes: null,
      images: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 911,
          returnRequestId: 601,
          orderItemId: '9001',
          productId: 512,
          productName: 'Card Đồ Họa NVIDIA RTX 5080',
          productSku: 'GPU-RTX-5080',
          thumbnailUrl: null,
          quantity: 1,
          resolution: 'REPLACE',
          isResellable: false,
          createdAt: new Date().toISOString(),
        },
      ],
      auditLogs: [
        {
          id: 921,
          returnRequestId: 601,
          fromStatus: 'PENDING',
          toStatus: 'PENDING',
          actorId: userA.id,
          actorRole: 'CUSTOMER',
          actorName: userA.fullName,
          notes: 'Khách hàng tạo yêu cầu đổi/trả mới.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const returnsStore: ReturnRequestDto[] = [];

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/profile') return { data: { success: true, data: userA } };
      if (url === '/profile/addresses') return { data: { success: true, data: [] } };
      if (url === '/profile/notifications') {
        return { data: { success: true, data: { unreadCount: 0, notifications: [] } } };
      }
      if (url === '/orders/my-orders') {
        return { data: { success: true, data: [recentDeliveredOrder] } };
      }
      if (url === '/profile/returns') {
        return {
          data: {
            success: true,
            returns: [...returnsStore],
            total: returnsStore.length,
            page: 1,
            limit: 10,
          },
        };
      }
      if (url === '/profile/returns/601') {
        return { data: { success: true, data: createdReturn } };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(async () => {
      returnsStore.push(createdReturn);
      return {
        data: {
          success: true,
          message: 'Gửi yêu cầu đổi/trả thành công.',
          data: createdReturn,
        },
      };
    });

    // Start at /profile/orders and use the eligible-order shortcut button
    renderAppAt(['/profile/orders'], queryClient);
    expect(await screen.findByText('NX-2026-8801')).toBeInTheDocument();

    const orderReturnButtons = screen.getAllByRole('button', { name: 'Yêu cầu đổi trả' });
    // Click the order card's shortcut button (the last matching button, inside Orders tab)
    fireEvent.click(orderReturnButtons[orderReturnButtons.length - 1]!);

    // Modal should auto-open with order 8801 preselected
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i)).toHaveValue('8801');

    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Card Đồ Họa NVIDIA RTX 5080/i));
    fireEvent.change(
      within(dialog).getByLabelText(/Hình thức xử lý cho Card Đồ Họa NVIDIA RTX 5080/i),
      { target: { value: 'REPLACE' } },
    );
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: 'Quạt card đồ họa kêu to bất thường' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/profile/returns', {
        orderId: '8801',
        orderCode: 'NX-2026-8801',
        reason: 'Quạt card đồ họa kêu to bất thường',
        items: [{ orderItemId: '9001', productId: 512, quantity: 1, resolution: 'REPLACE' }],
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer-returns'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] });

    // Created return appears in list and opens detail modal
    expect(await screen.findByText('RET-20261123-Q601')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết' }));
    const detailDialog = await screen.findByRole('dialog');
    expect(within(detailDialog).getByText(/Chi Tiết Yêu Cầu Đổi \/ Trả #601/i)).toBeInTheDocument();
  });

  it('Flow 7 + CR-M6.5-01 (R-02 Fixed): Account A wishlist -> logout -> Account B login never sees A wishlist and uses identity-scoped cache', async () => {
    const queryClient = createProductionLikeQueryClient();

    const userAWishlistItem = {
      id: 1,
      productId: 512,
      createdAt: new Date().toISOString(),
      product: { ...sampleProduct, name: 'Wishlist Riêng Tư Của User A' },
    };
    const userBWishlistItem = {
      id: 2,
      productId: 513,
      createdAt: new Date().toISOString(),
      product: {
        ...sampleProduct,
        id: 513,
        slug: 'laptop-user-b',
        name: 'Wishlist Riêng Tư Của User B',
      },
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/cart') {
        const token = localStorage.getItem('nexora_token');
        if (token === 'jwt-user-a') {
          return {
            data: {
              success: true,
              data: {
                items: [{ id: 'cart-a', productId: 512, quantity: 1, product: sampleProduct }],
                totalItems: 1,
                subtotal: '32990000',
              },
            },
          };
        }
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/wishlist')) {
        const current = localStorage.getItem('nexora_token');
        const list =
          current === 'jwt-user-a'
            ? [userAWishlistItem]
            : current === 'jwt-user-b'
              ? [userBWishlistItem]
              : [];
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: list }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    // 1. Account A visits /wishlist -> populates identity-scoped ['wishlist', 101] cache
    setSession(userA, 'jwt-user-a');
    sessionStorage.setItem('lastOrder', JSON.stringify({ orderCode: 'NX-USER-A-LAST' }));
    const viewA = renderAppAt(['/wishlist'], queryClient);
    expect(await screen.findByText('Wishlist Riêng Tư Của User A')).toBeInTheDocument();
    expect(queryClient.getQueryData(['wishlist', userA.id])).toHaveLength(1);
    expect(queryClient.getQueryData(['wishlist'])).toBeUndefined();

    // 2. Account A logs out directly from WishlistPage via StorefrontHeader user dropdown
    const headerLogoutBtn =
      screen.queryByRole('button', { name: /Đăng xuất/i }) ?? screen.queryByTitle(/Đăng xuất/i);
    if (headerLogoutBtn) {
      fireEvent.click(headerLogoutBtn);
    } else {
      fireEvent.click(screen.getByText(userA.fullName));
      fireEvent.click(await screen.findByRole('button', { name: /Đăng xuất/i }));
    }
    await waitFor(() => {
      expect(localStorage.getItem('nexora_token')).toBeNull();
    });
    viewA.unmount();

    // Private cache & sensitive sessionStorage MUST be completely purged after logout
    // (Note: active ['cart'] observer immediately refetches guest cart without token -> empty guest cart, never User A's items)
    expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
    expect(queryClient.getQueryData(['wishlist'])).toBeUndefined();
    const cartAfterLogout = queryClient.getQueryData<{ totalItems: number; items: unknown[] }>([
      'cart',
    ]);
    expect(cartAfterLogout === undefined || cartAfterLogout.totalItems === 0).toBe(true);
    expect(sessionStorage.getItem('lastOrder')).toBeNull();

    // 3. Account B logs in within staleTime (30s) in the SAME SPA session and visits /wishlist
    const wishlistCallsBeforeB = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).endsWith('/wishlist'),
    ).length;
    setSession(userB, 'jwt-user-b');
    renderAppAt(['/wishlist'], queryClient);

    // Account B MUST trigger a fresh fetch for identity B, see ONLY B's wishlist, NEVER A's!
    expect(await screen.findByText('Wishlist Riêng Tư Của User B')).toBeInTheDocument();
    expect(screen.queryByText('Wishlist Riêng Tư Của User A')).not.toBeInTheDocument();

    const wishlistCallsAfterB = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).endsWith('/wishlist'),
    ).length;
    expect(wishlistCallsAfterB).toBe(wishlistCallsBeforeB + 1);
    expect(queryClient.getQueryData(['wishlist', userB.id])).toHaveLength(1);
    expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
  });

  it('Flow 7 + CR-M6.5-01: Even with no new network response (pending/offline), Account B never sees Account A cached wishlist', async () => {
    const queryClient = createProductionLikeQueryClient();

    const userAWishlistItem = {
      id: 1,
      productId: 512,
      createdAt: new Date().toISOString(),
      product: { ...sampleProduct, name: 'Wishlist Bí Mật Của User A' },
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/cart') {
        const token = localStorage.getItem('nexora_token');
        if (token === 'jwt-user-a') {
          return {
            data: {
              success: true,
              data: {
                items: [{ id: 'cart-a', productId: 512, quantity: 1, product: sampleProduct }],
                totalItems: 1,
                subtotal: '32990000',
              },
            },
          };
        }
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/wishlist')) {
        if (localStorage.getItem('nexora_token') === 'jwt-user-a') {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [userAWishlistItem] }),
          } as unknown as Response;
        }
        // Account B's request never resolves (simulating offline / no new response yet)
        return new Promise<Response>(() => {});
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    // Account A warms ['wishlist', 101]
    setSession(userA, 'jwt-user-a');
    const viewA = renderAppAt(['/wishlist'], queryClient);
    expect(await screen.findByText('Wishlist Bí Mật Của User A')).toBeInTheDocument();
    viewA.unmount();

    // Even if session switches without a resolved response for B (defense-in-depth Layer 2)
    setSession(userB, 'jwt-user-b');
    renderAppAt(['/wishlist'], queryClient);

    // UI must NEVER display Account A's private wishlist item
    expect(screen.queryByText('Wishlist Bí Mật Của User A')).not.toBeInTheDocument();
    expect(queryClient.getQueryData(['wishlist', userB.id])).toBeUndefined();
  });

  it('Flow 7 + CR-M6.5-01: ProfilePage logout purges ALL private cache (including profile & addresses) consistently', async () => {
    const queryClient = createProductionLikeQueryClient();

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      const token = localStorage.getItem('nexora_token');
      const activeUser = token === 'jwt-user-a' ? userA : userB;
      if (url === '/profile') return { data: { success: true, data: activeUser } };
      if (url === '/profile/addresses') return { data: { success: true, data: [] } };
      if (url === '/profile/notifications') {
        return { data: { success: true, data: { unreadCount: 0, notifications: [] } } };
      }
      if (url === '/orders/my-orders') return { data: { success: true, data: [] } };
      if (url === '/profile/returns') {
        return { data: { success: true, returns: [], total: 0, page: 1, limit: 10 } };
      }
      if (url === '/cart') {
        if (token === 'jwt-user-a') {
          return {
            data: {
              success: true,
              data: {
                items: [{ id: 'cart-profile-a', productId: 512, quantity: 1 }],
                totalItems: 1,
                subtotal: '32990000',
              },
            },
          };
        }
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    setSession(userA, 'jwt-user-a');
    const viewA = renderAppAt(['/profile/return'], queryClient);
    expect(await screen.findByText('Bạn chưa có yêu cầu đổi/trả nào.')).toBeInTheDocument();
    expect(queryClient.getQueryData(['profile', userA.id])).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));
    await waitFor(() => {
      expect(localStorage.getItem('nexora_token')).toBeNull();
    });
    viewA.unmount();

    // ALL Account A private entries — including ['profile', 101] & ['customer-addresses', 101] — MUST be purged!
    expect(queryClient.getQueryData(['customer-returns', userA.id, 1, 10])).toBeUndefined();
    expect(queryClient.getQueryData(['my-orders', userA.id])).toBeUndefined();
    expect(queryClient.getQueryData(['profile', userA.id])).toBeUndefined();
    expect(queryClient.getQueryData(['customer-addresses', userA.id])).toBeUndefined();
    expect(queryClient.getQueryData(['notifications', userA.id])).toBeUndefined();
    const profileCartAfterLogout = queryClient.getQueryData<{ totalItems: number }>(['cart']);
    expect(profileCartAfterLogout === undefined || profileCartAfterLogout.totalItems === 0).toBe(
      true,
    );

    setSession(userB, 'jwt-user-b');
    renderAppAt(['/profile'], queryClient);
    expect(await screen.findByDisplayValue(userB.fullName)).toBeInTheDocument();
  });

  it('CR-M6.5-01: Direct login-over-session (without clicking logout) isolates & purges previous account cache', async () => {
    const queryClient = createProductionLikeQueryClient();
    const unbind = bindQueryClientToAuthEvents(queryClient);

    try {
      setSession(userA, 'jwt-user-a');
      sessionStorage.setItem('lastOrder', JSON.stringify({ orderCode: 'NX-OLD-SESSION-A' }));
      queryClient.setQueryData(['wishlist', userA.id], [{ id: 1, product: sampleProduct }]);
      queryClient.setQueryData(['wishlist-count'], 3);
      queryClient.setQueryData(['cart'], { items: [{ id: 1 }], totalItems: 1, subtotal: '100' });
      queryClient.setQueryData(['profile', userA.id], userA);
      queryClient.setQueryData(['categories'], [{ id: 3, name: 'VGA', slug: 'vga' }]);

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: { user: userB, token: 'jwt-user-b' },
        },
      });

      // Account B logs in directly over Account A's active session without calling logout()
      await authService.login({ email: userB.email, password: 'Password@123' });

      expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
      expect(queryClient.getQueryData(['wishlist-count'])).toBeUndefined();
      expect(queryClient.getQueryData(['cart'])).toBeUndefined();
      expect(queryClient.getQueryData(['profile', userA.id])).toBeUndefined();
      expect(sessionStorage.getItem('lastOrder')).toBeNull();

      // Public cache MUST remain intact
      expect(queryClient.getQueryData(['categories'])).toEqual([
        { id: 3, name: 'VGA', slug: 'vga' },
      ]);
    } finally {
      unbind();
    }
  });

  it('CR-M6.5-01: All 18 private query prefixes are purged on logout while public catalog/content caches remain preserved', () => {
    const queryClient = createProductionLikeQueryClient();
    const unbind = bindQueryClientToAuthEvents(queryClient);

    try {
      setSession(userA, 'jwt-user-a');

      // Seed every single one of the 18 canonical private prefixes (both plain and identity-scoped keys)
      for (const prefix of PRIVATE_QUERY_KEY_PREFIXES) {
        queryClient.setQueryData([prefix, userA.id], { owner: userA.id, prefix });
      }
      queryClient.setQueryData(['cart'], { items: [{ id: 1 }], totalItems: 1, subtotal: '100' });
      queryClient.setQueryData(['wishlist-count'], 5);
      queryClient.setQueryData(['admin-users'], [{ id: 101, email: userA.email }]);

      // Seed public caches that MUST survive logout
      const publicEntries: Array<[readonly unknown[], unknown]> = [
        [['categories'], [{ id: 1, name: 'Laptop' }]],
        [['products'], { products: [sampleProduct] }],
        [['product-detail', 'nvidia-rtx-5080'], sampleProduct],
        [['product-reviews', 512, 1, 10], { reviews: [], total: 0 }],
        [['reviews', 'home'], []],
        [['banners', 'hero'], [{ id: 1 }]],
        [['brands'], [{ id: 2, name: 'NVIDIA' }]],
        [['active-flash-sale'], null],
        [['system', 'health'], { status: 'ok' }],
      ];
      for (const [key, val] of publicEntries) {
        queryClient.setQueryData(key, val);
      }

      authService.logout();

      // Every private prefix MUST be completely cleared
      for (const prefix of PRIVATE_QUERY_KEY_PREFIXES) {
        expect(queryClient.getQueryData([prefix, userA.id])).toBeUndefined();
      }
      expect(queryClient.getQueryData(['cart'])).toBeUndefined();
      expect(queryClient.getQueryData(['wishlist-count'])).toBeUndefined();
      expect(queryClient.getQueryData(['admin-users'])).toBeUndefined();

      // Every public cache entry MUST remain completely preserved
      for (const [key, val] of publicEntries) {
        expect(queryClient.getQueryData(key)).toEqual(val);
      }
    } finally {
      unbind();
    }
  });

  it('CR-M6.5-01: Post-logout guest cart does not inherit Account A private cart data', async () => {
    const queryClient = createProductionLikeQueryClient();

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/cart') {
        const token = localStorage.getItem('nexora_token');
        if (token === 'jwt-user-a') {
          return {
            data: {
              success: true,
              data: {
                items: [
                  {
                    id: 'cart-item-a',
                    productId: 512,
                    quantity: 1,
                    unitPrice: '32990000',
                    subtotal: '32990000',
                    product: { ...sampleProduct, name: 'Giỏ Hàng Riêng Tư Của User A' },
                  },
                ],
                totalItems: 1,
                subtotal: '32990000',
              },
            },
          };
        }
        return {
          data: {
            success: true,
            data: { items: [], totalItems: 0, subtotal: '0' },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    setSession(userA, 'jwt-user-a');
    renderAppAt(['/cart'], queryClient);
    expect(await screen.findByText('Giỏ Hàng Riêng Tư Của User A')).toBeInTheDocument();

    // Logout from CartPage
    const logoutBtn =
      screen.queryByRole('button', { name: /Đăng xuất/i }) ?? screen.queryByTitle(/Đăng xuất/i);
    if (logoutBtn) {
      fireEvent.click(logoutBtn);
    } else {
      fireEvent.click(screen.getByText(userA.fullName));
      fireEvent.click(await screen.findByRole('button', { name: /Đăng xuất/i }));
    }

    // Guest MUST NOT see Account A's cart item; guest cart refetches cleanly as empty
    await waitFor(() => {
      expect(screen.queryByText('Giỏ Hàng Riêng Tư Của User A')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem('nexora_token')).toBeNull();
  });

  it('CR-M6.5-01: Cross-tab storage logout event clears Tab B private cache without wiping public cache or reacting to unrelated keys', async () => {
    const queryClient = createProductionLikeQueryClient();

    queryClient.setQueryData(['wishlist', userA.id], [{ id: 1, product: sampleProduct }]);
    queryClient.setQueryData(['cart'], { items: [{ id: 1 }], totalItems: 1, subtotal: '100' });
    queryClient.setQueryData(['categories'], [{ id: 3, name: 'VGA' }]);

    // 1. Unrelated storage key (theme) must NOT trigger cleanup
    const reactedTheme = handleCrossTabAuthStorageEvent(
      { key: 'nexora-theme', oldValue: 'light', newValue: 'dark' },
      queryClient,
    );
    expect(reactedTheme).toBe(false);
    expect(queryClient.getQueryData(['wishlist', userA.id])).toHaveLength(1);

    // 2. No-op auth write (oldValue === newValue) must NOT trigger cleanup
    const reactedNoop = handleCrossTabAuthStorageEvent(
      { key: 'nexora_token', oldValue: 'jwt-user-a', newValue: 'jwt-user-a' },
      queryClient,
    );
    expect(reactedNoop).toBe(false);
    expect(queryClient.getQueryData(['wishlist', userA.id])).toHaveLength(1);

    // 3. Real cross-tab logout (nexora_token removed in Tab A) MUST purge Tab B private cache
    const reactedLogout = handleCrossTabAuthStorageEvent(
      { key: 'nexora_token', oldValue: 'jwt-user-a', newValue: null },
      queryClient,
    );
    expect(reactedLogout).toBe(true);
    expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
    expect(queryClient.getQueryData(['cart'])).toBeUndefined();
    expect(queryClient.getQueryData(['categories'])).toEqual([{ id: 3, name: 'VGA' }]);

    // 4. End-to-end window `storage` listener wired in AppProviders
    const providerView = render(
      <AppProviders>
        <div>Tab B Active</div>
      </AppProviders>,
    );
    expect(screen.getByText('Tab B Active')).toBeInTheDocument();
    const listenersBeforeUnmount = getAuthSessionListenerCount();
    expect(listenersBeforeUnmount).toBeGreaterThanOrEqual(1);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'nexora_token',
        oldValue: 'jwt-user-a',
        newValue: null,
      }),
    );
    providerView.unmount();
    expect(getAuthSessionListenerCount()).toBe(listenersBeforeUnmount - 1);
  });

  it('CR-M6.5-01 Cross-Tab UI: Tab A logout immediately redirects Tab B WishlistPage to login, clears Header & private cache, and preserves public cache', async () => {
    let capturedClient: QueryClient | null = null;
    const QueryClientProbe = () => {
      capturedClient = useQueryClient();
      return null;
    };

    const userAWishlistItem = {
      id: 1,
      productId: 512,
      createdAt: new Date().toISOString(),
      product: { ...sampleProduct, name: 'Wishlist Tab A Riêng Tư' },
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/catalog/categories') {
        return { data: { success: true, data: [{ id: 3, name: 'VGA', slug: 'vga' }] } };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/wishlist')) {
        const list =
          localStorage.getItem('nexora_token') === 'jwt-user-a' ? [userAWishlistItem] : [];
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: list }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    setSession(userA, 'jwt-user-a');
    window.history.pushState({}, '', '/wishlist');

    try {
      render(
        <AppProviders>
          <QueryClientProbe />
          <Routes>
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
          </Routes>
        </AppProviders>,
      );

      // Tab B initially shows Account A in StorefrontHeader and WishlistPage
      expect(await screen.findByText('Wishlist Tab A Riêng Tư')).toBeInTheDocument();
      expect(screen.getByText(userA.fullName)).toBeInTheDocument();
      await waitFor(() => {
        expect(capturedClient?.getQueryData(['categories'])).toEqual([
          { id: 3, name: 'VGA', slug: 'vga' },
        ]);
      });
      expect(capturedClient?.getQueryData(['wishlist', userA.id])).toHaveLength(1);

      // Simulate Tab A logging out (removes localStorage keys and fires storage event in Tab B)
      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_user');
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: null,
          }),
        );
      });

      // Tab B MUST immediately redirect WishlistPage to /auth/login, clear Header identity & private cache
      expect(await screen.findByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/auth/login');
      expect(screen.queryByText(userA.fullName)).not.toBeInTheDocument();
      expect(screen.queryByText('Wishlist Tab A Riêng Tư')).not.toBeInTheDocument();
      expect(capturedClient?.getQueryData(['wishlist', userA.id])).toBeUndefined();

      // Public cache inside the SAME QueryClient instance MUST remain preserved!
      expect(capturedClient?.getQueryData(['categories'])).toEqual([
        { id: 3, name: 'VGA', slug: 'vga' },
      ]);
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('CR-M6.5-01 Cross-Tab UI: Tab A logout immediately clears Account A PII from Tab B ProfilePage and CheckoutPage', async () => {
    let capturedClient: QueryClient | null = null;
    const QueryClientProbe = () => {
      capturedClient = useQueryClient();
      return null;
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/profile') {
        if (localStorage.getItem('nexora_token') === 'jwt-user-a') {
          return { data: { success: true, data: userA } };
        }
        throw new Error('401 Unauthorized');
      }
      if (url === '/profile/addresses') return { data: { success: true, data: [] } };
      if (url === '/profile/notifications') {
        return { data: { success: true, data: { unreadCount: 0, notifications: [] } } };
      }
      if (url === '/orders/my-orders') return { data: { success: true, data: [] } };
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    try {
      // Part A: ProfilePage PII wipe on cross-tab logout
      setSession(userA, 'jwt-user-a');
      window.history.pushState({}, '', '/profile');
      const profileView = render(
        <AppProviders>
          <QueryClientProbe />
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </AppProviders>,
      );

      expect(await screen.findByDisplayValue(userA.fullName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(userA.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(userA.phone!)).toBeInTheDocument();
      expect(capturedClient?.getQueryData(['profile', userA.id])).toEqual(userA);

      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_user');
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: null,
          }),
        );
      });

      await waitFor(() => {
        expect(screen.queryByDisplayValue(userA.fullName)).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue(userA.email)).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue(userA.phone!)).not.toBeInTheDocument();
        expect(screen.queryByText(userA.fullName)).not.toBeInTheDocument();
      });
      expect(capturedClient?.getQueryData(['profile', userA.id])).toBeUndefined();
      profileView.unmount();

      // Part B: CheckoutPage pre-filled PII form reset on cross-tab logout
      setSession(userA, 'jwt-user-a');
      window.history.pushState({}, '', '/checkout');
      const checkoutView = render(
        <AppProviders>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </AppProviders>,
      );

      expect(await screen.findByDisplayValue(userA.fullName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(userA.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(userA.phone!)).toBeInTheDocument();

      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_user');
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: null,
          }),
        );
      });

      await waitFor(() => {
        expect(screen.queryByDisplayValue(userA.fullName)).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue(userA.email)).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue(userA.phone!)).not.toBeInTheDocument();
        expect(screen.queryByText(userA.fullName)).not.toBeInTheDocument();
      });
      checkoutView.unmount();
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('CR-M6.5-01 Cross-Tab Account Switch: Tab A switching to Account B syncs Tab B UI identity & prevents cross-identity cache poisoning', async () => {
    let capturedClient: QueryClient | null = null;
    const QueryClientProbe = () => {
      capturedClient = useQueryClient();
      return null;
    };

    const userAWishlistItem = {
      id: 1,
      productId: 512,
      createdAt: new Date().toISOString(),
      product: { ...sampleProduct, name: 'Wishlist Của User A (Tab Switch)' },
    };
    const userBWishlistItem = {
      id: 2,
      productId: 513,
      createdAt: new Date().toISOString(),
      product: {
        ...sampleProduct,
        id: 513,
        slug: 'laptop-b-switch',
        name: 'Wishlist Của User B (Tab Switch)',
      },
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/catalog/categories') {
        return { data: { success: true, data: [{ id: 3, name: 'VGA', slug: 'vga' }] } };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      return { data: { success: true, data: [] } };
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/wishlist')) {
        const token = localStorage.getItem('nexora_token');
        const list =
          token === 'jwt-user-a'
            ? [userAWishlistItem]
            : token === 'jwt-user-b'
              ? [userBWishlistItem]
              : [];
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: list }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    setSession(userA, 'jwt-user-a');
    window.history.pushState({}, '', '/wishlist');

    try {
      render(
        <AppProviders>
          <QueryClientProbe />
          <Routes>
            <Route path="/wishlist" element={<WishlistPage />} />
          </Routes>
        </AppProviders>,
      );

      expect(await screen.findByText('Wishlist Của User A (Tab Switch)')).toBeInTheDocument();
      expect(screen.getByText(userA.fullName)).toBeInTheDocument();
      expect(capturedClient?.getQueryData(['wishlist', userA.id])).toHaveLength(1);

      // Tab A switches session directly to Account B
      setSession(userB, 'jwt-user-b');
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: 'jwt-user-b',
          }),
        );
      });

      // Tab B MUST immediately render Account B's Header & Wishlist, NEVER poison ['wishlist', userA.id]!
      expect(await screen.findByText('Wishlist Của User B (Tab Switch)')).toBeInTheDocument();
      expect(screen.queryByText('Wishlist Của User A (Tab Switch)')).not.toBeInTheDocument();
      expect(screen.getByText(userB.fullName)).toBeInTheDocument();
      expect(screen.queryByText(userA.fullName)).not.toBeInTheDocument();

      // Zero cross-identity cache poisoning
      expect(capturedClient?.getQueryData(['wishlist', userA.id])).toBeUndefined();
      expect(capturedClient?.getQueryData(['wishlist', userB.id])).toHaveLength(1);
      expect(capturedClient?.getQueryData(['categories'])).toEqual([
        { id: 3, name: 'VGA', slug: 'vga' },
      ]);
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('CR-M6.5-01 Cross-Tab Remount Discipline: Unrelated storage keys do NOT remount route tree, and listener deduplication/cleanup hold across remounts', async () => {
    let mountCount = 0;
    let capturedClient: QueryClient | null = null;
    const baselineListeners = getAuthSessionListenerCount();

    const RemountProbe = () => {
      capturedClient = useQueryClient();
      useEffect(() => {
        mountCount += 1;
      }, []);
      return <div data-testid="remount-probe">Mounted</div>;
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } },
    });

    setSession(userA, 'jwt-user-a');
    window.history.pushState({}, '', '/checkout');

    try {
      const view = render(
        <AppProviders>
          <RemountProbe />
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </AppProviders>,
      );

      expect(screen.getByTestId('remount-probe')).toBeInTheDocument();
      expect(mountCount).toBe(1);
      // AppProviders + StorefrontHeader nested inside CheckoutPage MUST share exactly 1 deduplicated listener
      expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);

      capturedClient?.setQueryData(['categories'], [{ id: 1, name: 'Laptop' }]);

      // 1. Unrelated storage key MUST NOT remount or wipe cache
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora-theme',
            oldValue: 'light',
            newValue: 'dark',
          }),
        );
      });
      expect(mountCount).toBe(1);
      expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);

      // 2. No-op auth storage event (oldValue === newValue) MUST NOT remount
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: 'jwt-user-a',
          }),
        );
      });
      expect(mountCount).toBe(1);

      // 3. Real cross-tab logout MUST increment sessionEpoch exactly once, preserve public cache, and keep 1 listener
      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_user');
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'nexora_token',
            oldValue: 'jwt-user-a',
            newValue: null,
          }),
        );
      });
      expect(mountCount).toBe(2);
      expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);
      expect(capturedClient?.getQueryData(['categories'])).toEqual([{ id: 1, name: 'Laptop' }]);

      // 4. Unmounting AppProviders releases all references cleanly (0 memory leak)
      view.unmount();
      expect(getAuthSessionListenerCount()).toBe(baselineListeners);
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('CR-M6.5-01: In-flight private requests from Account A never re-populate cache when resolving after logout', async () => {
    const queryClient = createProductionLikeQueryClient();
    const unbind = bindQueryClientToAuthEvents(queryClient);

    try {
      setSession(userA, 'jwt-user-a');

      let resolveSlowWishlist!: (value: unknown) => void;
      const slowWishlistPromise = new Promise((resolve) => {
        resolveSlowWishlist = resolve;
      });

      // Start an in-flight private query for Account A (no AbortSignal used by queryFn)
      const inFlightFetch = queryClient
        .fetchQuery({
          queryKey: ['wishlist', userA.id],
          queryFn: () => slowWishlistPromise,
        })
        .catch(() => undefined);

      // Verify query is currently fetching
      expect(queryClient.isFetching({ queryKey: ['wishlist', userA.id] })).toBe(1);

      // Account A logs out WHILE the private request is still in-flight!
      authService.logout();

      // Now Account A's slow response arrives AFTER logout
      resolveSlowWishlist([{ id: 99, product: { ...sampleProduct, name: 'Late Stale A Data' } }]);
      await inFlightFetch;
      await Promise.resolve();

      // Cache MUST remain empty — late in-flight response MUST NOT write Account A data back!
      expect(queryClient.getQueryData(['wishlist', userA.id])).toBeUndefined();
      expect(queryClient.getQueryCache().findAll({ queryKey: ['wishlist'] })).toHaveLength(0);
    } finally {
      unbind();
    }
  });

  it('CR-M6.5-01: WeakMap reference-counted binding prevents duplicate listeners and safely handles nested mount/unmount', () => {
    const queryClient = createProductionLikeQueryClient();
    const baselineListeners = getAuthSessionListenerCount();

    // Simulate AppProviders (outer) + StorefrontHeader (inner) binding the SAME QueryClient
    const releaseOuter = bindQueryClientToAuthEvents(queryClient);
    expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);

    const releaseInner = bindQueryClientToAuthEvents(queryClient);
    // MUST NOT register a duplicate listener
    expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);

    // Calling inner release twice must be idempotent and keep outer binding alive
    releaseInner();
    releaseInner();
    expect(getAuthSessionListenerCount()).toBe(baselineListeners + 1);

    // Outer binding still purges cache on logout
    queryClient.setQueryData(['cart'], { items: [{ id: 1 }], totalItems: 1, subtotal: '100' });
    authService.logout();
    expect(queryClient.getQueryData(['cart'])).toBeUndefined();

    // Releasing outer binding decrements refCount to 0 and unsubscribes cleanly
    releaseOuter();
    expect(getAuthSessionListenerCount()).toBe(baselineListeners);
  });

  it('Flow 8 + CR-M6.5-02 (R-03 Fixed): CheckoutPage invalidates ["my-orders"], ensuring new order immediately appears in order history', async () => {
    setSession(userA, 'jwt-user-a');
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const newOrderFromCheckout: OrderDto = {
      ...recentDeliveredOrder,
      id: '9999',
      orderCode: 'NX-2026-NEW99',
      orderStatus: 'PENDING',
      deliveredAt: null,
    };

    const orderStore: OrderDto[] = [recentDeliveredOrder];

    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/profile') return { data: { success: true, data: userA } };
      if (url === '/profile/addresses') return { data: { success: true, data: [] } };
      if (url === '/profile/notifications') {
        return { data: { success: true, data: { unreadCount: 0, notifications: [] } } };
      }
      if (url === '/orders/my-orders') {
        return { data: { success: true, data: [...orderStore] } };
      }
      if (url === '/cart') {
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 1, product: sampleProduct, quantity: 1 }],
              totalItems: 1,
              subtotal: '32990000',
            },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/orders')) {
        orderStore.unshift(newOrderFromCheckout);
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: newOrderFromCheckout }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    // 1. User visits /profile/orders first -> warms ['my-orders', 101] cache (fresh for 30s)
    const ordersView1 = renderAppAt(['/profile/orders'], queryClient);
    expect(await screen.findByText('NX-2026-8801')).toBeInTheDocument();
    const myOrdersCallsBeforeCheckout = getSpy.mock.calls.filter(
      (c) => c[0] === '/orders/my-orders',
    ).length;
    expect(myOrdersCallsBeforeCheckout).toBe(1);
    ordersView1.unmount();

    // 2. User completes Checkout -> POST /orders returns 201 with NX-2026-NEW99
    const checkoutView = renderAppAt(['/checkout'], queryClient);
    const addressInput = await screen.findByPlaceholderText(
      /Số 123 Đường Nguyễn Trãi, Phường Bến Thành/i,
    );
    fireEvent.change(addressInput, { target: { value: '123 Lê Lợi' } });
    fireEvent.click(screen.getByRole('button', { name: /HOÀN TẤT ĐẶT HÀNG|ĐẶT HÀNG NGAY/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\/orders$/),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    // Assert ALL invalidations including ['my-orders']
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['admin-data'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-orders'] });
    checkoutView.unmount();

    // 3. User navigates back to /profile/orders within staleTime (30s)
    renderAppAt(['/profile/orders'], queryClient);
    expect(await screen.findByText('NX-2026-8801')).toBeInTheDocument();

    // EMPIRICAL VERIFICATION OF R-03 FIX: New order NX-2026-NEW99 appears immediately because ['my-orders'] was invalidated!
    expect(await screen.findByText('NX-2026-NEW99')).toBeInTheDocument();
    const myOrdersCallsAfterCheckout = getSpy.mock.calls.filter(
      (c) => c[0] === '/orders/my-orders',
    ).length;
    expect(myOrdersCallsAfterCheckout).toBe(2);
  });

  it('CR-M6.5-02: Failed checkout does NOT invalidate ["my-orders"] or other caches', async () => {
    setSession(userA, 'jwt-user-a');
    const queryClient = createProductionLikeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/cart') {
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 1, product: sampleProduct, quantity: 1 }],
              totalItems: 1,
              subtotal: '32990000',
            },
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/orders')) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: { message: 'Sản phẩm đã hết hàng trong kho.' } }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as unknown as Response;
    });

    const checkoutView = renderAppAt(['/checkout'], queryClient);
    const addressInput = await screen.findByPlaceholderText(
      /Số 123 Đường Nguyễn Trãi, Phường Bến Thành/i,
    );
    fireEvent.change(addressInput, { target: { value: '123 Lê Lợi' } });
    fireEvent.click(screen.getByRole('button', { name: /HOÀN TẤT ĐẶT HÀNG|ĐẶT HÀNG NGAY/i }));

    // Verify error message is rendered
    expect(await screen.findByText(/Sản phẩm đã hết hàng trong kho/i)).toBeInTheDocument();

    // Verify ZERO invalidations occurred
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['my-orders'] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['cart'] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['products'] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['admin-data'] });
    checkoutView.unmount();
  });
});

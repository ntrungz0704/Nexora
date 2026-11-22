// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { authService } from '../src/services/authService';
import {
  cartService,
  GUEST_SESSION_KEY,
  resetPassiveMergeGuard,
} from '../src/services/cartService';
import { LoginPage } from '../src/features/auth/LoginPage';
import { RegisterPage } from '../src/features/auth/RegisterPage';
import { AuthModal } from '../src/features/storefront/AuthModal';
import { CartPage } from '../src/features/cart/CartPage';
import type { CartSummaryDto, MergeCartResultDto, AuthUser } from '@nexora/shared';

const mockUser: AuthUser = {
  id: 101,
  email: 'customer@nexora.local',
  fullName: 'Khách Hàng Test',
  phone: '0912345678',
  avatarUrl: null,
  role: 'CUSTOMER',
};

const mockProduct = {
  id: 1,
  categoryId: 1,
  name: 'CPU AMD Ryzen 7',
  slug: 'cpu-amd-ryzen-7',
  sku: 'CPU-RYZEN-7',
  price: '8500000',
  salePrice: null,
  stockQuantity: 10,
  thumbnailUrl: null,
  shortDescription: null,
  specs: null,
  isFeatured: true,
  isHot: true,
  status: 'ACTIVE' as const,
};

const mockCart: CartSummaryDto = {
  items: [
    {
      id: '1',
      productId: 1,
      quantity: 1,
      product: mockProduct,
    },
  ],
  totalItems: 1,
  subtotal: '8500000',
};

const mockMergeResult: MergeCartResultDto = {
  cart: mockCart,
  mergedItemsCount: 1,
  adjustedItemsCount: 0,
  warnings: [],
};

describe('M6.1: Guest Cart Merge & Failure-Safety Test Suite (TC-1 to TC-9)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPassiveMergeGuard();
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    resetPassiveMergeGuard();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TC-1: Login thành công và Auto-Merge thành công
  // =========================================================================
  it('TC-1: Login thành công và Auto-Merge thành công -> Lưu JWT/User, xóa guest session, trả về cartMerge', async () => {
    const testGuestId = 'guest_tc1_success_session';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: mockUser,
          token: 'jwt-token-tc1',
          cartMerge: mockMergeResult,
        },
      },
    });

    const session = await authService.login({
      email: 'customer@nexora.local',
      password: 'SecurePassword123!',
    });

    // 1. Phải gửi kèm guestSessionId trong payload
    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'customer@nexora.local',
      password: 'SecurePassword123!',
      guestSessionId: testGuestId,
    });

    // 2. Token và User phải được lưu
    expect(localStorage.getItem('nexora_token')).toBe('jwt-token-tc1');
    expect(JSON.parse(localStorage.getItem('nexora_user') || '{}')).toEqual(mockUser);

    // 3. Guest session phải được xóa an toàn khỏi localStorage
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();

    // 4. Trả về đúng session kèm cartMerge
    expect(session.cartMerge).toEqual(mockMergeResult);
    expect(session.cartMerge?.mergedItemsCount).toBe(1);
  });

  // =========================================================================
  // TC-2: Login sai mật khẩu hoặc authentication thất bại
  // =========================================================================
  it('TC-2: Login sai mật khẩu -> Báo lỗi, TUYỆT ĐỐI không xóa guest session, không gọi merge retry', async () => {
    const testGuestId = 'guest_tc2_preserve_session';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    const postSpy = vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không chính xác.' },
        },
      },
    });

    await expect(
      authService.login({
        email: 'customer@nexora.local',
        password: 'WrongPassword!',
      }),
    ).rejects.toBeDefined();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith('/auth/login', expect.any(Object));

    // Invariant: Guest session PHẢI được bảo toàn nguyên vẹn trong localStorage
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);
    expect(localStorage.getItem('nexora_token')).toBeNull();
  });

  // =========================================================================
  // TC-3: Authentication thành công nhưng Auto-Merge thất bại (thiếu cartMerge)
  // =========================================================================
  it('TC-3: Auth thành công nhưng thiếu cartMerge -> Giữ session và kích hoạt đúng 1 lần Immediate Retry', async () => {
    const testGuestId = 'guest_tc3_retry_session';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    // Lần 1: Login thành công nhưng Backend nuốt lỗi merge, trả về không có cartMerge
    const loginMock = vi.spyOn(apiClient, 'post').mockImplementation((url) => {
      if (url === '/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              user: mockUser,
              token: 'jwt-token-tc3',
              // Không có cartMerge
            },
          },
        });
      }
      if (url === '/cart/merge') {
        // Lần 2: Immediate Retry thành công
        return Promise.resolve({
          data: {
            success: true,
            data: mockMergeResult,
          },
        });
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    const session = await authService.login({
      email: 'customer@nexora.local',
      password: 'SecurePassword123!',
    });

    // Login thành công và đã gọi retry
    expect(loginMock).toHaveBeenCalledTimes(2);
    expect(loginMock).toHaveBeenNthCalledWith(
      1,
      '/auth/login',
      expect.objectContaining({ guestSessionId: testGuestId }),
    );
    expect(loginMock).toHaveBeenNthCalledWith(2, '/cart/merge', { guestSessionId: testGuestId });

    // Sau khi retry thành công -> guest session được xóa
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
    expect(session.cartMerge).toEqual(mockMergeResult);
  });

  // =========================================================================
  // TC-4: Immediate retry thành công
  // =========================================================================
  it('TC-4: Immediate retry thành công -> Cập nhật session.cartMerge và xóa guest session an toàn', async () => {
    const testGuestId = 'guest_tc4_retry_ok';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    vi.spyOn(apiClient, 'post').mockImplementation((url) => {
      if (url === '/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            data: { user: mockUser, token: 'jwt-token-tc4' }, // thiếu cartMerge
          },
        });
      }
      if (url === '/cart/merge') {
        return Promise.resolve({
          data: { success: true, data: mockMergeResult },
        });
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    const session = await authService.login({
      email: 'customer@nexora.local',
      password: 'Password123!',
    });

    expect(session.token).toBe('jwt-token-tc4');
    expect(session.cartMerge).toBeDefined();
    expect(session.cartMerge?.mergedItemsCount).toBe(1);
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
  });

  // =========================================================================
  // TC-5: Immediate retry thất bại
  // =========================================================================
  it('TC-5: Immediate retry thất bại -> VẪN GIỮ guest session trong localStorage, không làm hỏng login', async () => {
    const testGuestId = 'guest_tc5_retry_failed';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    vi.spyOn(apiClient, 'post').mockImplementation((url) => {
      if (url === '/auth/login') {
        return Promise.resolve({
          data: {
            success: true,
            data: { user: mockUser, token: 'jwt-token-tc5' }, // không có cartMerge
          },
        });
      }
      if (url === '/cart/merge') {
        // Immediate retry bị lỗi mạng / DB timeout
        return Promise.reject(new Error('Network error on retry'));
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    const session = await authService.login({
      email: 'customer@nexora.local',
      password: 'Password123!',
    });

    // Login vẫn thành công (không bị rollback auth)
    expect(session.token).toBe('jwt-token-tc5');
    expect(session.user).toEqual(mockUser);

    // Invariant cốt lõi: Khi cả auto-merge và immediate retry đều thất bại,
    // guest session PHẢI ĐƯỢC GIỮ NGUYÊN để không mất giỏ hàng của khách!
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);
  });

  // =========================================================================
  // TC-6: Không có guest session
  // =========================================================================
  it('TC-6: Không có guest session -> Authentication bình thường, không gửi ID khách, không gọi merge/retry', async () => {
    // localStorage trống
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: mockUser, token: 'jwt-token-tc6' },
      },
    });

    const session = await authService.login({
      email: 'customer@nexora.local',
      password: 'Password123!',
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'customer@nexora.local',
      password: 'Password123!',
    });
    // Không có guestSessionId trong payload
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('guestSessionId');

    expect(session.token).toBe('jwt-token-tc6');
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
  });

  // =========================================================================
  // TC-7: Passive retry tại CartPage & Deduplication
  // =========================================================================
  it('TC-7: Passive retry tại CartPage -> Kích hoạt khi có session và user đã đăng nhập, deduplicate không gọi lặp', async () => {
    const testGuestId = 'guest_tc7_passive_retry';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);
    localStorage.setItem('nexora_token', 'mock-jwt-token');
    localStorage.setItem('nexora_user', JSON.stringify(mockUser));

    const mergeSpy = vi.spyOn(cartService, 'mergeCart').mockResolvedValueOnce(mockMergeResult);

    // Lần gọi 1: Passive retry chạy thành công
    const result1 = await cartService.attemptPassiveCartMerge('mock-jwt-token');
    expect(result1).toEqual(mockMergeResult);
    expect(mergeSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();

    // Lần gọi 2 (mô phỏng re-render ngay sau đó):
    // Session đã bị xóa -> không gọi lại merge
    const result2 = await cartService.attemptPassiveCartMerge('mock-jwt-token');
    expect(result2).toBeNull();
    expect(mergeSpy).toHaveBeenCalledTimes(1); // Vẫn chỉ gọi 1 lần!
  });

  it('TC-7b: Deduplication guard ngăn chặn retry lặp vô hạn khi passive retry thất bại', async () => {
    const testGuestId = 'guest_tc7_fail_guard';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    const mergeSpy = vi
      .spyOn(cartService, 'mergeCart')
      .mockRejectedValue(new Error('Server unavailable'));

    // Lần 1: Gọi thất bại
    const result1 = await cartService.attemptPassiveCartMerge('mock-token');
    expect(result1).toBeNull();
    expect(mergeSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId); // Bảo toàn session

    // Lần 2 (mô phỏng re-render liên tiếp của component):
    // Deduplication guard phát hiện session này vừa fail -> KHÔNG gọi request thứ hai
    const result2 = await cartService.attemptPassiveCartMerge('mock-token');
    expect(result2).toBeNull();
    expect(mergeSpy).toHaveBeenCalledTimes(1); // Vẫn giữ nguyên 1 lần gọi, không spam API
  });

  // =========================================================================
  // TC-8: Reload sau khi merge thất bại
  // =========================================================================
  it('TC-8: Reload sau khi merge thất bại -> Khôi phục được guestSessionId và có thể tiếp tục recovery', async () => {
    const testGuestId = 'guest_tc8_reload_recovery';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);
    localStorage.setItem('nexora_token', 'jwt-token-tc8');

    // Sau khi tải lại trang, hàm getExistingGuestSessionId đọc chính xác session đã lưu
    expect(cartService.getExistingGuestSessionId()).toBe(testGuestId);
    expect(cartService.hasGuestSession()).toBe(true);

    // Thử lại merge thành công trong phiên mới
    vi.spyOn(cartService, 'mergeCart').mockResolvedValueOnce(mockMergeResult);
    const recoveredResult = await cartService.attemptPassiveCartMerge('jwt-token-tc8');

    expect(recoveredResult).toEqual(mockMergeResult);
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
  });

  // =========================================================================
  // TC-9: Duplicate merge request (Idempotency)
  // =========================================================================
  it('TC-9: Duplicate merge request -> Tuân thủ Idempotency, không nhân đôi sản phẩm (Backend trả về no-op)', async () => {
    const testGuestId = 'guest_tc9_idempotency';

    const noopResult: MergeCartResultDto = {
      cart: mockCart,
      mergedItemsCount: 0,
      adjustedItemsCount: 0,
      warnings: [],
    };

    const postSpy = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValueOnce({
        data: { success: true, data: mockMergeResult },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: noopResult },
      });

    // Lần 1: Merge bình thường
    const res1 = await cartService.mergeCart(testGuestId);
    expect(res1.mergedItemsCount).toBe(1);

    // Lần 2: Request trùng lặp gửi lại
    const res2 = await cartService.mergeCart(testGuestId);
    expect(res2.mergedItemsCount).toBe(0); // Không cộng dồn thêm sản phẩm

    expect(postSpy).toHaveBeenCalledTimes(2);
  });

  // =========================================================================
  // Bổ sung: Kiểm thử luồng Đăng ký (Register Flow w/ Cart Merge)
  // =========================================================================
  it('REGISTER-FLOW: Đăng ký tài khoản mới đính kèm guestSessionId và xử lý auto-merge', async () => {
    const testGuestId = 'guest_reg_test_session';
    localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: mockUser,
          token: 'jwt-token-reg',
          cartMerge: mockMergeResult,
        },
      },
    });

    const session = await authService.register({
      fullName: 'Khách Hàng Mới',
      email: 'newuser@nexora.local',
      phone: '0987654321',
      password: 'SecurePassword123!',
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/register', {
      fullName: 'Khách Hàng Mới',
      email: 'newuser@nexora.local',
      phone: '0987654321',
      password: 'SecurePassword123!',
      guestSessionId: testGuestId,
    });

    expect(session.token).toBe('jwt-token-reg');
    expect(localStorage.getItem('nexora_token')).toBe('jwt-token-reg');
    expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
  });

  // =========================================================================
  // Bổ sung: Component Flow & Cache Invalidation (LoginPage & TanStack Query)
  // =========================================================================
  it('UI-QUERY-SYNC: LoginPage gọi authService.login và invalidate query [cart]', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      user: mockUser,
      token: 'jwt-token-login-page',
      cartMerge: mockMergeResult,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Điền form đăng nhập
    const emailInput = screen.getByPlaceholderText(/nguyenvana@gmail.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen
      .getAllByRole('button', { name: /Đăng nhập/i })
      .find((el) => el.getAttribute('type') === 'submit')!;

    fireEvent.change(emailInput, { target: { value: 'customer@nexora.local' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'customer@nexora.local',
        password: 'SecurePassword123!',
      });
      // Invariant: Query cache ['cart'] BẮT BUỘC phải được invalidate để đồng bộ Header badge và CartPage
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    });
  });

  // =========================================================================
  // Bổ sung: AuthModal component flow
  // =========================================================================
  it('UI-AUTH-MODAL: AuthModal xử lý đăng nhập và invalidate query [cart]', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      user: mockUser,
      token: 'jwt-modal-token',
      cartMerge: mockMergeResult,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const emailInput = screen.getByPlaceholderText(/nguyenvana@gmail.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen
      .getAllByRole('button', { name: /Đăng nhập/i })
      .find((el) => el.getAttribute('type') === 'submit')!;

    fireEvent.change(emailInput, { target: { value: 'customer@nexora.local' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
      expect(onClose).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    });
  });

  // =========================================================================
  // Bổ sung: RegisterPage UI & Query Cache Invalidation
  // =========================================================================
  it('UI-REGISTER-SYNC: RegisterPage gọi authService.register và invalidate query [cart]', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    vi.spyOn(authService, 'register').mockResolvedValueOnce({
      user: mockUser,
      token: 'jwt-reg-token',
      cartMerge: mockMergeResult,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const fullNameInput = screen.getByPlaceholderText(/Nhập họ và tên của bạn/i);
    const emailInput = screen.getByPlaceholderText(/Nhập địa chỉ email của bạn/i);
    const passwordInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Nhập lại mật khẩu vừa tạo/i);
    const submitBtn = screen.getByRole('button', { name: /Tạo tài khoản/i });

    fireEvent.change(fullNameInput, { target: { value: 'Khách Hàng Mới' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@nexora.local' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        fullName: 'Khách Hàng Mới',
        email: 'newuser@nexora.local',
        phone: '',
        password: 'SecurePassword123!',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    });
  });

  // =========================================================================
  // Bổ sung: CartPage Passive Retry On Mount
  // =========================================================================
  it('UI-CART-PAGE-MOUNT: CartPage kích hoạt passive retry khi user đã đăng nhập và có session khách', async () => {
    const queryClient = new QueryClient();
    localStorage.setItem(GUEST_SESSION_KEY, 'guest_cart_page_mount');
    localStorage.setItem('nexora_token', 'jwt-token-cart-page');
    localStorage.setItem('nexora_user', JSON.stringify(mockUser));

    const passiveSpy = vi
      .spyOn(cartService, 'attemptPassiveCartMerge')
      .mockResolvedValueOnce(mockMergeResult);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(passiveSpy).toHaveBeenCalledWith('jwt-token-cart-page');
    });
  });

  // =========================================================================
  // TARGETED ACCEPTANCE FIX TESTS: DTO VALIDATION & PASSIVE RETRY LIFECYCLE
  // =========================================================================

  describe('Targeted Acceptance Fix: Merge Result DTO Full Schema Validation', () => {
    it('DTO-1: Reject malformed cartMerge ({ mergedItemsCount: 0, cart: null }) -> Kích hoạt retry, nếu retry cũng lỗi thì bảo toàn guestSessionId', async () => {
      const testGuestId = 'guest_dto1_malformed';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

      const postSpy = vi.spyOn(apiClient, 'post').mockImplementation((url) => {
        if (url === '/auth/login') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                user: mockUser,
                token: 'jwt-token-dto1',
                // Dữ liệu lỗi: cart là null mặc dù mergedItemsCount là số
                cartMerge: { mergedItemsCount: 0, cart: null },
              },
            },
          });
        }
        if (url === '/cart/merge') {
          // Immediate retry cũng trả về dữ liệu sai cấu trúc
          return Promise.resolve({
            data: {
              success: true,
              data: { mergedItemsCount: 2, cart: 'invalid_string' },
            },
          });
        }
        return Promise.reject(new Error(`Unexpected url: ${url}`));
      });

      const session = await authService.login({
        email: 'customer@nexora.local',
        password: 'Password123!',
      });

      // Login vẫn thành công
      expect(session.token).toBe('jwt-token-dto1');
      // Đã gọi cả login và immediate retry
      expect(postSpy).toHaveBeenCalledTimes(2);

      // Invariant: Vì cả hai DTO đều không vượt qua safeParse, session khách PHẢI ĐƯỢC BẢO TOÀN
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);
    });

    it('DTO-2: Chấp nhận DTO hợp lệ ngay cả khi mergedItemsCount = 0 (giỏ trống hoặc đã đồng bộ từ trước) -> Xóa guest session an toàn', async () => {
      const testGuestId = 'guest_dto2_zero_items';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

      const zeroMergeResult: MergeCartResultDto = {
        cart: {
          items: [],
          totalItems: 0,
          subtotal: '0',
        },
        mergedItemsCount: 0,
        adjustedItemsCount: 0,
        warnings: [],
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            user: mockUser,
            token: 'jwt-token-dto2',
            cartMerge: zeroMergeResult,
          },
        },
      });

      const session = await authService.login({
        email: 'customer@nexora.local',
        password: 'Password123!',
      });

      expect(session.token).toBe('jwt-token-dto2');
      // DTO hợp lệ -> guest session phải được xóa
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
      expect(session.cartMerge).toEqual(zeroMergeResult);
    });

    it('DTO-3: Passive retry kiểm tra DTO schema bằng safeParse -> Từ chối kết quả malformed và bảo toàn session', async () => {
      const testGuestId = 'guest_dto3_passive_malformed';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

      // Trả về đối tượng thiếu các trường bắt buộc của CartSummary
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            mergedItemsCount: 1,
            cart: { invalid: true }, // Thiếu items, totalItems, subtotal
          },
        },
      });

      const result = await cartService.attemptPassiveCartMerge('valid-token');

      // Kết quả phải là null do safeParse thất bại
      expect(result).toBeNull();
      // Session khách BẮT BUỘC phải được bảo toàn
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);
    });
  });

  describe('Targeted Acceptance Fix: Passive Retry Lifecycle & StrictMode', () => {
    it('LIFECYCLE-1: Chặn duplicate call khi CartPage re-render trong cùng một lần mount', async () => {
      const queryClient = new QueryClient();
      localStorage.setItem(GUEST_SESSION_KEY, 'guest_lifecycle_rerender');
      localStorage.setItem('nexora_token', 'jwt-token-rerender');
      localStorage.setItem('nexora_user', JSON.stringify(mockUser));

      const passiveSpy = vi
        .spyOn(cartService, 'attemptPassiveCartMerge')
        .mockResolvedValue(mockMergeResult);

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(passiveSpy).toHaveBeenCalledTimes(1);
      });

      // Kích hoạt re-render của cùng một component mount
      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Re-render KHÔNG ĐƯỢC PHÉP gọi lại attemptPassiveCartMerge
      expect(passiveSpy).toHaveBeenCalledTimes(1);
    });

    it('LIFECYCLE-2: Cho phép thử lại khi người dùng rời khỏi CartPage (unmount) và quay lại (mount mới) mà không cần F5', async () => {
      const queryClient = new QueryClient();
      const testGuestId = 'guest_lifecycle_remount';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);
      localStorage.setItem('nexora_token', 'jwt-token-remount');
      localStorage.setItem('nexora_user', JSON.stringify(mockUser));

      // Lần mount 1: Thất bại do lỗi mạng
      const mergeSpy = vi
        .spyOn(cartService, 'mergeCart')
        .mockRejectedValueOnce(new Error('Network temporary failure'))
        .mockResolvedValueOnce(mockMergeResult);

      // 1. User truy cập /cart lần đầu
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(mergeSpy).toHaveBeenCalledTimes(1);
      });
      // Session khách vẫn được bảo toàn
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBe(testGuestId);

      // 2. User rời khỏi CartPage (ví dụ: chuyển sang trang sản phẩm /products)
      unmount();

      // 3. User quay lại /cart trong cùng một phiên SPA (không reload F5)
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Lần mount mới BẮT BUỘC phải được phép kích hoạt retry mới!
      await waitFor(() => {
        expect(mergeSpy).toHaveBeenCalledTimes(2);
      });

      // Lần thử thứ 2 thành công -> session khách được xóa an toàn
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
    });

    it('LIFECYCLE-3: In-flight guard ngăn chặn gọi đồng thời khi một request merge đang diễn ra', async () => {
      const testGuestId = 'guest_inflight_test';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

      let resolvePromise: (value: MergeCartResultDto) => void;
      const delayedPromise = new Promise<MergeCartResultDto>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(cartService, 'mergeCart').mockReturnValueOnce(delayedPromise);

      // Gọi lần 1: bắt đầu request (đang in-flight)
      const call1 = cartService.attemptPassiveCartMerge('valid-token');

      // Gọi lần 2: khi lần 1 chưa kết thúc
      const call2 = cartService.attemptPassiveCartMerge('valid-token');

      // Call 2 phải bị từ chối ngay lập tức do in-flight guard
      const result2 = await call2;
      expect(result2).toBeNull();

      // Cho call 1 hoàn thành
      resolvePromise!(mockMergeResult);
      const result1 = await call1;
      expect(result1).toEqual(mockMergeResult);
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
    });

    it('LIFECYCLE-4: Thao tác giỏ hàng (addItem, updateItem, removeItem) tự động reset guard để sẵn sàng đồng bộ', async () => {
      const testGuestId = 'guest_mutation_reset';
      localStorage.setItem(GUEST_SESSION_KEY, testGuestId);

      // Giả lập lần thử trước đã fail
      vi.spyOn(cartService, 'mergeCart').mockRejectedValueOnce(new Error('Backend busy'));
      await cartService.attemptPassiveCartMerge('valid-token');

      // Deduplication guard đang chặn: gọi lại ngay sẽ trả về null
      const blockedCall = await cartService.attemptPassiveCartMerge('valid-token');
      expect(blockedCall).toBeNull();

      // Giả lập API cho cart mutations
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockCart },
      });

      // User thao tác giỏ hàng: thêm sản phẩm mới
      await cartService.addItem(99, 1);

      // Sau khi thao tác giỏ hàng, guard đã được reset: cho phép thử lại
      vi.spyOn(cartService, 'mergeCart').mockResolvedValueOnce(mockMergeResult);
      const retryResult = await cartService.attemptPassiveCartMerge('valid-token');

      expect(retryResult).toEqual(mockMergeResult);
      expect(localStorage.getItem(GUEST_SESSION_KEY)).toBeNull();
    });

    it('LIFECYCLE-5: React.StrictMode không kích hoạt duplicate merge requests ngoài ý muốn', async () => {
      const queryClient = new QueryClient();
      localStorage.setItem(GUEST_SESSION_KEY, 'guest_strict_mode_session');
      localStorage.setItem('nexora_token', 'jwt-token-strict');
      localStorage.setItem('nexora_user', JSON.stringify(mockUser));

      const passiveSpy = vi
        .spyOn(cartService, 'attemptPassiveCartMerge')
        .mockResolvedValueOnce(mockMergeResult);

      render(
        <StrictMode>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>
              <CartPage />
            </MemoryRouter>
          </QueryClientProvider>
        </StrictMode>,
      );

      await waitFor(() => {
        // Trong React.StrictMode, mặc dù effect bị double-invoked trong dev mode,
        // passiveAttemptedRef ngăn chặn việc gọi attemptPassiveCartMerge 2 lần!
        expect(passiveSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { ProductDetailPage } from '../src/features/catalog/ProductDetailPage';
import type { AuthUser, ProductDto, ReviewDto } from '@nexora/shared';

const mockCustomer: AuthUser = {
  id: 21,
  email: 'customer@nexora.local',
  fullName: 'Nguyễn Minh Quân',
  phone: '0901234567',
  avatarUrl: null,
  role: 'CUSTOMER',
};

const mockStaffUser: AuthUser = {
  id: 99,
  email: 'staff@nexora.local',
  fullName: 'Nhân Viên Nội Bộ',
  phone: '0909000111',
  avatarUrl: null,
  role: 'STAFF',
};

const mockFirstCatalogProduct: ProductDto = {
  id: 1,
  sku: 'FIRST-001',
  name: 'Sản Phẩm Đầu Tiên Trong Danh Sách',
  slug: 'san-pham-dau-tien',
  categoryId: 1,
  brandId: 1,
  price: 10000000,
  salePrice: null,
  stockQuantity: 10,
  status: 'ACTIVE',
  category: { id: 1, name: 'Laptop', slug: 'laptop' },
  brand: { id: 1, name: 'ASUS', slug: 'asus' },
};

const mockTargetProduct: ProductDto & { images: unknown[]; reviews: unknown[] } = {
  id: 512,
  sku: 'GPU-RTX-5080',
  name: 'Card Đồ Họa NVIDIA RTX 5080 Founders Edition',
  slug: 'card-do-hoa-rtx-5080',
  categoryId: 3,
  brandId: 2,
  price: 34990000,
  salePrice: 32990000,
  stockQuantity: 8,
  status: 'ACTIVE',
  category: { id: 3, name: 'VGA', slug: 'vga' },
  brand: { id: 2, name: 'NVIDIA', slug: 'nvidia' },
  images: [],
  reviews: [],
};

const mockReviewsList: ReviewDto[] = [
  {
    id: 101,
    productId: 512,
    userId: 50,
    userName: 'Lê Hoàng Anh',
    userAvatar: null,
    rating: 5,
    comment: 'Hiệu năng cực kỳ mạnh mẽ, nhiệt độ mát mẻ khi chơi game 4K.',
    isVerifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2026-11-22T10:00:00.000Z',
    updatedAt: '2026-11-22T10:00:00.000Z',
  },
  {
    id: 102,
    productId: 512,
    userId: 51,
    userName: 'Phạm Thị Lan',
    userAvatar: 'https://example.com/lan.jpg',
    rating: 4,
    comment: 'Đóng gói kỹ, giao hàng đúng hẹn.',
    isVerifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2026-11-21T08:30:00.000Z',
    updatedAt: '2026-11-21T08:30:00.000Z',
  },
];

const mockOwnReview: ReviewDto = {
  id: 205,
  productId: 512,
  userId: 21,
  userName: 'Nguyễn Minh Quân',
  userAvatar: null,
  rating: 4,
  comment: 'Dùng ổn định trong tuần đầu tiên.',
  isVerifiedPurchase: true,
  status: 'APPROVED',
  createdAt: '2026-11-20T09:00:00.000Z',
  updatedAt: '2026-11-20T09:00:00.000Z',
};

const defaultReviewsEnvelope = {
  success: true as const,
  data: mockReviewsList,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
  stats: {
    averageRating: 4.5,
    totalReviews: 2,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderProductDetail(slug = 'card-do-hoa-rtx-5080', queryClient = createTestQueryClient()) {
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/product/${slug}`]}>
        <Routes>
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
          <Route path="/" element={<div>Trang Chủ</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

function setLoggedInUser(user: AuthUser) {
  localStorage.setItem('nexora_token', 'mock-jwt-token');
  localStorage.setItem('nexora_user', JSON.stringify(user));
}

function setupDefaultApiMocks(options?: {
  reviewsResponse?: unknown | (() => Promise<unknown>);
  eligibilityResponse?: { canReview: boolean; existingReview: ReviewDto | null };
  productNotFound?: boolean;
}) {
  const getSpy = vi.spyOn(apiClient, 'get').mockImplementation((url, config) => {
    if (url === '/catalog/categories') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/catalog/products') {
      return Promise.resolve({
        data: { success: true, data: [mockFirstCatalogProduct], pagination: { total: 1 } },
      });
    }
    if (url === '/cart') {
      return Promise.resolve({
        data: { success: true, data: { items: [], totalItems: 0, subtotal: 0 } },
      });
    }
    if (url === '/wishlist') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === `/catalog/products/${mockTargetProduct.slug}`) {
      return Promise.resolve({ data: { success: true, data: mockTargetProduct } });
    }
    if (url.startsWith('/catalog/products/') && !url.includes('/reviews')) {
      if (options?.productNotFound) {
        return Promise.reject({
          response: {
            status: 404,
            data: {
              success: false,
              error: { code: 'PRODUCT_NOT_FOUND', message: 'Không tìm thấy sản phẩm.' },
            },
          },
        });
      }
      return Promise.resolve({ data: { success: true, data: mockTargetProduct } });
    }
    if (url === `/catalog/products/${mockTargetProduct.id}/reviews`) {
      if (typeof options?.reviewsResponse === 'function') {
        return (options.reviewsResponse as () => Promise<unknown>)();
      }
      if (options?.reviewsResponse instanceof Error) {
        return Promise.reject(options.reviewsResponse);
      }
      const requestedPage = (config?.params as { page?: number } | undefined)?.page ?? 1;
      if (options?.reviewsResponse) {
        return Promise.resolve({ data: options.reviewsResponse });
      }
      return Promise.resolve({
        data: {
          ...defaultReviewsEnvelope,
          pagination: { ...defaultReviewsEnvelope.pagination, page: requestedPage },
        },
      });
    }
    if (url === `/catalog/products/${mockTargetProduct.id}/reviews/eligibility`) {
      return Promise.resolve({
        data: {
          success: true,
          data: options?.eligibilityResponse ?? { canReview: false, existingReview: null },
        },
      });
    }
    return Promise.resolve({ data: { success: true, data: [] } });
  });

  return { getSpy };
}

async function openReviewsTab() {
  const tabButton = await screen.findByRole('button', { name: /Đánh giá & Nhận xét/i });
  fireEvent.click(tabButton);
}

describe('M6.3 Customer Reviews — Frontend Integration Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('1-3. Public review list loads with average rating, total count, distribution, verified badge, and header sync', async () => {
    setupDefaultApiMocks();
    renderProductDetail();

    expect(
      await screen.findByRole('heading', { name: mockTargetProduct.name }),
    ).toBeInTheDocument();

    // Header rating & review count synced from actual backend stats
    await waitFor(() => {
      expect(screen.getByTestId('product-header-rating')).toHaveTextContent('4.5');
      expect(screen.getByTestId('product-header-review-count')).toHaveTextContent('(2 đánh giá)');
    });

    await openReviewsTab();

    expect(screen.getByTestId('reviews-average-rating')).toHaveTextContent('4.5');
    expect(screen.getByTestId('reviews-total-count')).toHaveTextContent('Dựa trên 2 đánh giá');
    expect(screen.getByTestId('rating-distribution-5')).toHaveTextContent('1 đánh giá');
    expect(screen.getByTestId('rating-distribution-4')).toHaveTextContent('1 đánh giá');
    expect(screen.getByTestId('rating-distribution-3')).toHaveTextContent('0 đánh giá');
    expect(screen.getByText('Lê Hoàng Anh')).toBeInTheDocument();
    expect(
      screen.getByText('Hiệu năng cực kỳ mạnh mẽ, nhiệt độ mát mẻ khi chơi game 4K.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Đã mua hàng/i).length).toBeGreaterThanOrEqual(2);
    // Static mock data from before M6.3 must be gone
    expect(screen.queryByText('Trần Văn Nam')).not.toBeInTheDocument();
  });

  it('4. Empty review state displays cleanly when 0 approved reviews exist', async () => {
    setupDefaultApiMocks({
      reviewsResponse: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      },
    });
    renderProductDetail();

    await openReviewsTab();

    expect(await screen.findByText('Chưa có đánh giá nào cho sản phẩm này.')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-average-rating')).toHaveTextContent('0.0');
    expect(screen.getByTestId('reviews-total-count')).toHaveTextContent('Dựa trên 0 đánh giá');
  });

  it('5. Loading state displays while public reviews request is pending', async () => {
    setupDefaultApiMocks({
      reviewsResponse: () => new Promise(() => {}),
    });
    renderProductDetail();

    await openReviewsTab();

    expect(await screen.findByText('Đang tải đánh giá sản phẩm...')).toBeInTheDocument();
  });

  it('6. API error state displays error alert and retry button', async () => {
    let shouldFail = true;
    setupDefaultApiMocks({
      reviewsResponse: () =>
        shouldFail
          ? Promise.reject(new Error('Network down'))
          : Promise.resolve({ data: defaultReviewsEnvelope }),
    });
    renderProductDetail();

    await openReviewsTab();

    expect(await screen.findByText(/Không thể tải danh sách đánh giá/i)).toBeInTheDocument();

    shouldFail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Lê Hoàng Anh')).toBeInTheDocument();
  });

  it('7. Guest does not call eligibility endpoint and sees login prompt', async () => {
    const { getSpy } = setupDefaultApiMocks();
    renderProductDetail();

    await openReviewsTab();

    expect(await screen.findByRole('link', { name: 'Đăng nhập để đánh giá' })).toBeInTheDocument();

    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain(
      `/catalog/products/${mockTargetProduct.id}/reviews/eligibility`,
    );
  });

  it('8. Authenticated user (and STAFF without DELIVERED order) without eligibility cannot submit', async () => {
    setLoggedInUser(mockStaffUser);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: false, existingReview: null },
    });
    renderProductDetail();

    await openReviewsTab();

    expect(
      await screen.findByText(
        'Chỉ khách hàng đã mua và nhận sản phẩm thành công mới có thể gửi đánh giá.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Viết đánh giá sản phẩm' }),
    ).not.toBeInTheDocument();
  });

  it('9-11. Eligible user submits review with numeric product.id and trimmed comment via POST', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: null },
    });
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          ...mockOwnReview,
          rating: 5,
          comment: 'Sản phẩm rất tốt, đáng mua!',
        },
      },
    });

    renderProductDetail();
    await openReviewsTab();

    const writeBtn = await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' });
    fireEvent.click(writeBtn);

    const dialog = screen.getByRole('dialog');
    const textarea = within(dialog).getByLabelText(/Nhận xét chi tiết/i);
    fireEvent.change(textarea, { target: { value: '   Sản phẩm rất tốt, đáng mua!   ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    // Strictly numeric product.id (512), NOT slug
    expect(postSpy).toHaveBeenCalledWith('/catalog/products/512/reviews', {
      rating: 5,
      comment: 'Sản phẩm rất tốt, đáng mua!',
    });
  });

  it('12. Whitespace-only comment is rejected by client validation and never sent to API', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: null },
    });
    const postSpy = vi.spyOn(apiClient, 'post');

    renderProductDetail();
    await openReviewsTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' }));

    const dialog = screen.getByRole('dialog');
    const textarea = within(dialog).getByLabelText(/Nhận xét chi tiết/i);
    fireEvent.change(textarea, { target: { value: '     ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi đánh giá' }));

    expect(
      await within(dialog).findByText('Nhận xét không được chỉ chứa khoảng trắng.'),
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('12b. Empty string comment is accepted as rating-only review without sending null', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: null },
    });
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: { ...mockOwnReview, rating: 4, comment: null },
      },
    });

    renderProductDetail();
    await openReviewsTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Chọn 4 sao' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/catalog/products/512/reviews', {
        rating: 4,
        comment: '',
      });
    });
  });

  it('13. Existing review uses PUT (never POST), hides create button, and shows hidden badge when status=HIDDEN', async () => {
    setLoggedInUser(mockCustomer);
    const hiddenReview: ReviewDto = { ...mockOwnReview, status: 'HIDDEN' };
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: hiddenReview },
    });
    const postSpy = vi.spyOn(apiClient, 'post');
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue({
      data: {
        success: true,
        data: { ...hiddenReview, rating: 5, comment: 'Cập nhật lại cảm nhận chi tiết.' },
      },
    });

    renderProductDetail();
    await openReviewsTab();

    expect(await screen.findByText('Đánh giá của bạn')).toBeInTheDocument();
    expect(screen.getByText('Đang bị ẩn bởi quản trị viên')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Viết đánh giá sản phẩm' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa đánh giá' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Chọn 5 sao' }));
    fireEvent.change(within(dialog).getByLabelText(/Nhận xét chi tiết/i), {
      target: { value: '  Cập nhật lại cảm nhận chi tiết.  ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/catalog/reviews/205', {
        rating: 5,
        comment: 'Cập nhật lại cảm nhận chi tiết.',
      });
    });
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('14. Delete opens confirmation dialog, calls DELETE with review ID, and handles top-level message response', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: mockOwnReview },
    });
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue({
      data: {
        success: true,
        message: 'Đã xóa đánh giá thành công.',
      },
    });

    renderProductDetail();
    await openReviewsTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa đánh giá' }));

    const confirmDialog = screen.getByRole('dialog');
    expect(within(confirmDialog).getByText('Xác nhận xóa đánh giá')).toBeInTheDocument();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Xác nhận xóa' }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/catalog/reviews/205');
    });
    expect(await screen.findByText('Đã xóa đánh giá thành công.')).toBeInTheDocument();
  });

  it('15. Successful mutation invalidates product-reviews, review-eligibility, and home reviews queries', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: null },
    });
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: mockOwnReview },
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderProductDetail(mockTargetProduct.slug, queryClient);
    await openReviewsTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Nhận xét chi tiết/i), {
      target: { value: 'Sản phẩm chất lượng cao rất đáng tiền.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product-reviews', 512] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['review-eligibility', 512] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'home'] });
    });
  });

  it('16. Logout clears cached review-eligibility queries and switches UI to Guest login prompt', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: mockOwnReview },
    });

    const queryClient = createTestQueryClient();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    renderProductDetail(mockTargetProduct.slug, queryClient);
    await openReviewsTab();

    expect(await screen.findByText('Đánh giá của bạn')).toBeInTheDocument();

    // Open user menu or click logout button in StorefrontHeader
    const logoutBtn =
      screen.queryByRole('button', { name: /Đăng xuất/i }) ?? screen.queryByTitle(/Đăng xuất/i);

    if (logoutBtn) {
      fireEvent.click(logoutBtn);
    } else {
      // Trigger user dropdown menu first if logout is inside dropdown
      const userMenuBtn = screen.getByText(mockCustomer.fullName);
      fireEvent.click(userMenuBtn);
      fireEvent.click(await screen.findByRole('button', { name: /Đăng xuất/i }));
    }

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['review-eligibility'] });
    });
    expect(await screen.findByRole('link', { name: 'Đăng nhập để đánh giá' })).toBeInTheDocument();
  });

  it('17. Product slug resolves to the exact product ID via GET /catalog/products/:slug', async () => {
    const { getSpy } = setupDefaultApiMocks();
    renderProductDetail(mockTargetProduct.slug);

    expect(
      await screen.findByRole('heading', { name: mockTargetProduct.name }),
    ).toBeInTheDocument();

    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).toContain(`/catalog/products/${mockTargetProduct.slug}`);
    expect(calledUrls).toContain(`/catalog/products/${mockTargetProduct.id}/reviews`);
    expect(calledUrls).not.toContain(`/catalog/products/${mockFirstCatalogProduct.id}/reviews`);
  });

  it('18. Unresolved slug shows Not Found state and does NOT fall back to first catalog product', async () => {
    setupDefaultApiMocks({ productNotFound: true });
    renderProductDetail('san-pham-khong-ton-tai-999');

    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy sản phẩm' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(mockFirstCatalogProduct.name)).not.toBeInTheDocument();
  });

  it('19. Pagination requests next page when totalPages > 1', async () => {
    const { getSpy } = setupDefaultApiMocks({
      reviewsResponse: {
        success: true,
        data: mockReviewsList,
        pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
        stats: {
          averageRating: 4.5,
          totalReviews: 15,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 7, 5: 8 },
        },
      },
    });
    renderProductDetail();
    await openReviewsTab();

    expect(await screen.findByText('Trang 1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/catalog/products/512/reviews', {
        params: { page: 2, limit: 10 },
      });
    });
  });

  it('20. Duplicate submission prevention blocks second POST while request is in flight', async () => {
    setLoggedInUser(mockCustomer);
    setupDefaultApiMocks({
      eligibilityResponse: { canReview: true, existingReview: null },
    });

    let resolvePost!: (val: unknown) => void;
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    renderProductDetail();
    await openReviewsTab();

    fireEvent.click(await screen.findByRole('button', { name: 'Viết đánh giá sản phẩm' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Nhận xét chi tiết/i), {
      target: { value: 'Kiểm tra chống gửi đánh giá trùng lặp.' },
    });

    const submitBtn = within(dialog).getByRole('button', { name: 'Gửi đánh giá' });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
    expect(within(dialog).getByRole('button', { name: 'Đang gửi...' })).toBeDisabled();

    resolvePost({ data: { success: true, data: mockOwnReview } });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

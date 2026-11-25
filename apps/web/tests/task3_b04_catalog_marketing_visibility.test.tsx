// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SearchPage } from '../src/features/catalog/SearchPage';
import { ProductDetailPage } from '../src/features/catalog/ProductDetailPage';
import { ProductCatalogSection } from '../src/features/storefront/ProductCatalogSection';
import { storefrontService } from '../src/services/storefrontService';
import { cartService } from '../src/services/cartService';
import { reviewService } from '../src/services/reviewService';
import { wishlistService } from '../src/services/wishlistService';
import { authService } from '../src/services/authService';
import type { ProductDto, BrandDto } from '@nexora/shared';

function renderWithQuery(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TASK 3 (B-04): Storefront Brand Sync & Product Detail Unavailable State', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);
    vi.spyOn(wishlistService, 'getWishlistCount').mockResolvedValue(0);
    vi.spyOn(cartService, 'getCart').mockResolvedValue({
      items: [],
      totalItems: 0,
      subtotal: '0',
    });
    vi.spyOn(storefrontService, 'getCategories').mockResolvedValue([
      {
        id: 1,
        parentId: null,
        name: 'Laptop',
        slug: 'laptop',
        icon: 'fa-solid fa-laptop',
        sortOrder: 1,
        isActive: true,
      },
    ]);
  });

  it('Case 12: SearchPage renders dynamic active brands from API (zero hardcoded INTEL/GIGABYTE fallback) and preserves unbranded products', async () => {
    const dbBrands: BrandDto[] = [
      { id: 10, name: 'Keychron', slug: 'keychron', logoUrl: null, description: null },
      { id: 11, name: 'Logitech', slug: 'logitech', logoUrl: null, description: null },
    ];
    const dbProducts: ProductDto[] = [
      {
        id: 101,
        categoryId: 1,
        brandId: 10,
        name: 'Keychron Q1 Pro Mechanical',
        slug: 'keychron-q1-pro',
        sku: 'KC-Q1',
        price: '4500000',
        salePrice: null,
        stockQuantity: 12,
        thumbnailUrl: null,
        isFeatured: false,
        isHot: false,
        status: 'ACTIVE',
        category: { id: 1, name: 'Laptop', slug: 'laptop', isActive: true },
        brand: { id: 10, name: 'Keychron', slug: 'keychron', isActive: true },
      },
      {
        id: 102,
        categoryId: 1,
        brandId: null,
        name: 'Phụ kiện NoBrand Hợp lệ',
        slug: 'phu-kien-nobrand',
        sku: 'PK-NB',
        price: '350000',
        salePrice: null,
        stockQuantity: 15,
        thumbnailUrl: null,
        isFeatured: false,
        isHot: false,
        status: 'ACTIVE',
        category: { id: 1, name: 'Laptop', slug: 'laptop', isActive: true },
        brand: null,
      },
    ];

    vi.spyOn(storefrontService, 'getBrands').mockResolvedValue(dbBrands);
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({
      products: dbProducts,
      total: 2,
    });

    renderWithQuery(<SearchPage />, ['/search']);

    await waitFor(() => {
      expect(screen.getByText('Keychron Q1 Pro Mechanical')).toBeTruthy();
      expect(screen.getByText('Phụ kiện NoBrand Hợp lệ')).toBeTruthy();
    });

    // Open brand filter dropdown and verify ONLY active API brands appear (not hardcoded INTEL/AMD/GIGABYTE)
    const brandChip = screen.getByText('Thương hiệu');
    fireEvent.click(brandChip);

    await waitFor(() => {
      expect(screen.getByText('Keychron')).toBeTruthy();
      expect(screen.getByText('Logitech')).toBeTruthy();
    });
    expect(screen.queryByText('GIGABYTE')).toBeNull();
    expect(screen.queryByText('INTEL')).toBeNull();

    // Selecting Keychron filters down to Keychron product only
    fireEvent.click(screen.getByText('Keychron'));
    await waitFor(() => {
      expect(screen.getByText('Keychron Q1 Pro Mechanical')).toBeTruthy();
      expect(screen.queryByText('Phụ kiện NoBrand Hợp lệ')).toBeNull();
    });
  });

  it('Case 11-12b: ProductCatalogSection hides Partner Brand slider when DB has zero active brands (no BRAND_LOGOS leak)', () => {
    renderWithQuery(<ProductCatalogSection products={[]} brands={[]} onAddToCart={vi.fn()} />);

    expect(screen.queryByText('ĐỐI TÁC CHIẾN LƯỢC')).toBeNull();
    expect(screen.queryByAltText('GIGABYTE')).toBeNull();
  });

  it('Cases 13, 14, 15, 16: Discontinued product shows "Sản phẩm đã ngừng kinh doanh" banner, does not fake in-stock status, and disables Add to Cart / Buy Now', async () => {
    const addSpy = vi.spyOn(cartService, 'addItem');
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({ products: [], total: 0 });
    vi.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
    vi.spyOn(storefrontService, 'getProductBySlug').mockResolvedValue({
      id: 501,
      categoryId: 1,
      brandId: 1,
      name: 'Chuột Logitech Legacy 2024',
      slug: 'chuot-legacy-2024',
      sku: 'LEG-2024',
      price: '1990000',
      salePrice: null,
      stockQuantity: 50,
      thumbnailUrl: null,
      shortDescription: 'Ngừng sản xuất',
      specs: null,
      isFeatured: false,
      isHot: false,
      status: 'INACTIVE',
      isPurchasable: false,
      unavailableReason: 'DISCONTINUED',
      category: { id: 1, name: 'Laptop', slug: 'laptop', isActive: true },
      brand: { id: 1, name: 'Logitech', slug: 'logitech', isActive: true },
      images: [],
      reviews: [],
    });

    renderWithQuery(
      <Routes>
        <Route path="/product/:slug" element={<ProductDetailPage />} />
      </Routes>,
      ['/product/chuot-legacy-2024'],
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Chuột Logitech Legacy 2024' })).toBeTruthy();
      expect(screen.getByTestId('product-unavailable-banner')).toBeTruthy();
    });

    expect(screen.getByTestId('product-unavailable-banner').textContent).toContain(
      'Sản phẩm đã ngừng kinh doanh',
    );
    expect(screen.getByTestId('product-status-badge').textContent).toContain('Ngừng kinh doanh');
    expect(screen.queryByText(/Còn hàng/i)).toBeNull();

    const qtyInput = screen.getByLabelText('Số lượng sản phẩm') as HTMLInputElement;
    expect(qtyInput.disabled).toBe(true);

    const buttons = screen.getAllByRole('button', {
      name: /Ngừng kinh doanh/i,
    }) as HTMLButtonElement[];
    expect(buttons.length).toBe(2);
    for (const btn of buttons) {
      expect(btn.disabled).toBe(true);
      fireEvent.click(btn);
    }
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('Case 17: Hidden category or hidden brand product locks Add to Cart / Buy Now on ProductDetailPage while keeping historical detail reachable', async () => {
    const addSpy = vi.spyOn(cartService, 'addItem');
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({ products: [], total: 0 });
    vi.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
    vi.spyOn(storefrontService, 'getProductBySlug').mockResolvedValue({
      id: 502,
      categoryId: 2,
      brandId: 3,
      name: 'Màn hình Danh mục Ẩn',
      slug: 'man-hinh-danh-muc-an',
      sku: 'CAT-HID-01',
      price: '8990000',
      salePrice: null,
      stockQuantity: 25,
      thumbnailUrl: null,
      shortDescription: null,
      specs: null,
      isFeatured: false,
      isHot: false,
      status: 'ACTIVE',
      isPurchasable: false,
      unavailableReason: 'CATEGORY_INACTIVE',
      category: { id: 2, name: 'Hidden Monitor', slug: 'hidden-mon', isActive: false },
      brand: { id: 3, name: 'Dell', slug: 'dell', isActive: true },
      images: [],
      reviews: [],
    });

    renderWithQuery(
      <Routes>
        <Route path="/product/:slug" element={<ProductDetailPage />} />
      </Routes>,
      ['/product/man-hinh-danh-muc-an'],
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-unavailable-banner')).toBeTruthy();
    });

    expect(screen.getByTestId('product-unavailable-banner').textContent).toContain(
      'Danh mục sản phẩm hiện đang tạm ẩn',
    );
    expect(screen.queryByText(/Còn hàng/i)).toBeNull();
    const disabledBtns = screen.getAllByRole('button', {
      name: /Ngừng kinh doanh/i,
    }) as HTMLButtonElement[];
    expect(disabledBtns).toHaveLength(2);
    disabledBtns.forEach((btn) => {
      expect(btn.disabled).toBe(true);
      fireEvent.click(btn);
    });
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('Case 17b: Hidden Brand product locks Add to Cart / Buy Now on ProductDetailPage', async () => {
    const addSpy = vi.spyOn(cartService, 'addItem');
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({ products: [], total: 0 });
    vi.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
    vi.spyOn(storefrontService, 'getProductBySlug').mockResolvedValue({
      id: 503,
      categoryId: 1,
      brandId: 9,
      name: 'Tai nghe Thương hiệu Ẩn',
      slug: 'tai-nghe-thuong-hieu-an',
      sku: 'BRD-HID-01',
      price: '2590000',
      salePrice: null,
      stockQuantity: 18,
      thumbnailUrl: null,
      shortDescription: null,
      specs: null,
      isFeatured: false,
      isHot: false,
      status: 'ACTIVE',
      isPurchasable: false,
      unavailableReason: 'BRAND_INACTIVE',
      category: { id: 1, name: 'Laptop', slug: 'laptop', isActive: true },
      brand: { id: 9, name: 'HiddenBrandX', slug: 'hidden-brand-x', isActive: false },
      images: [],
      reviews: [],
    });

    renderWithQuery(
      <Routes>
        <Route path="/product/:slug" element={<ProductDetailPage />} />
      </Routes>,
      ['/product/tai-nghe-thuong-hieu-an'],
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-unavailable-banner')).toBeTruthy();
    });

    expect(screen.getByTestId('product-unavailable-banner').textContent).toContain(
      'Thương hiệu sản phẩm hiện đang tạm ẩn',
    );
    expect(screen.queryByText(/Còn hàng/i)).toBeNull();
    const disabledBtns = screen.getAllByRole('button', {
      name: /Ngừng kinh doanh/i,
    }) as HTMLButtonElement[];
    expect(disabledBtns).toHaveLength(2);
    disabledBtns.forEach((btn) => {
      expect(btn.disabled).toBe(true);
      fireEvent.click(btn);
    });
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('Case 18: Non-existent slug continues showing 404 Not Found view', async () => {
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({ products: [], total: 0 });
    vi.spyOn(storefrontService, 'getProductBySlug').mockRejectedValue(
      new Error('Không tìm thấy sản phẩm'),
    );

    renderWithQuery(
      <Routes>
        <Route path="/product/:slug" element={<ProductDetailPage />} />
      </Routes>,
      ['/product/does-not-exist-999'],
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeTruthy();
    });
  });
});

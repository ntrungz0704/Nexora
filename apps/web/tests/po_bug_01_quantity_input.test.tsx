// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { clampQuantity, resolveCommittedQuantity } from '../src/lib/quantity';
import { ProductDetailPage } from '../src/features/catalog/ProductDetailPage';
import { CartPage } from '../src/features/cart/CartPage';
import type { CartItemDto, CartSummaryDto, ProductDto } from '@nexora/shared';

function buildProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 101,
    sku: 'KB-LOG-G913TKL',
    name: 'Bàn phím cơ không dây Logitech G913 TKL Lightspeed RGB',
    slug: 'ban-phim-logitech-g913-tkl',
    categoryId: 5,
    brandId: 4,
    price: '4990000',
    salePrice: '3890000',
    stockQuantity: 40,
    thumbnailUrl: '/assets/images/placeholder.webp',
    shortDescription: 'Tenkeyless mechanical keyboard',
    specs: { layout: 'Tenkeyless (TKL) 87 phím' },
    isFeatured: true,
    isHot: false,
    status: 'ACTIVE',
    category: { id: 5, name: 'Bàn phím', slug: 'keyboard' },
    brand: { id: 4, name: 'Logitech', slug: 'logitech' },
    ...overrides,
  };
}

const prodPrimary = buildProduct({
  id: 101,
  slug: 'prod-primary',
  name: 'Chuột Logitech G Pro X Superlight 2',
  stockQuantity: 50,
});

const prodMidStock = buildProduct({
  id: 102,
  slug: 'prod-40',
  name: 'Bàn phím Logitech G913 TKL Lightspeed RGB',
  stockQuantity: 40,
});

const prodLowStock = buildProduct({
  id: 103,
  slug: 'prod-low-stock',
  name: 'Tai nghe HyperX Cloud Alpha',
  stockQuantity: 3,
});

const prodZeroStock = buildProduct({
  id: 104,
  slug: 'prod-out-of-stock',
  name: 'SSD Samsung 990 Pro 4TB',
  stockQuantity: 0,
});

const PRODUCTS_BY_SLUG: Record<string, ProductDto> = {
  [prodPrimary.slug]: prodPrimary,
  [prodMidStock.slug]: prodMidStock,
  [prodLowStock.slug]: prodLowStock,
  [prodZeroStock.slug]: prodZeroStock,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function ProductSwitcherNav({ targetSlug }: { targetSlug: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      data-testid={`switch-to-${targetSlug}`}
      onClick={() => navigate(`/product/detail/${targetSlug}`)}
    >
      Switch Product
    </button>
  );
}

function renderProductDetail(
  initialSlug = prodMidStock.slug,
  options: { switchTargets?: string[] } = {},
) {
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/product/detail/${initialSlug}`]}>
        {(options.switchTargets || []).map((target) => (
          <ProductSwitcherNav key={target} targetSlug={target} />
        ))}
        <Routes>
          <Route path="/product/detail/:slug" element={<ProductDetailPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<div>Checkout Route</div>} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/" element={<div>Home Route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

function renderCartPage() {
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<div>Checkout Route</div>} />
          <Route path="/product/detail/:slug" element={<ProductDetailPage />} />
          <Route path="/" element={<div>Home Route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

function mockCatalogAndReviews(
  initialCart: CartSummaryDto = { items: [], totalItems: 0, subtotal: '0' },
) {
  const getSpy = vi.spyOn(apiClient, 'get').mockImplementation((url) => {
    if (url === '/catalog/categories') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/catalog/products') {
      return Promise.resolve({
        data: { success: true, data: [prodPrimary, prodMidStock], pagination: { total: 2 } },
      });
    }
    if (url.startsWith('/catalog/products/')) {
      const slug = decodeURIComponent(url.replace('/catalog/products/', ''));
      const found = PRODUCTS_BY_SLUG[slug];
      if (!found) {
        return Promise.reject(new Error('Product not found'));
      }
      return Promise.resolve({ data: { success: true, data: found } });
    }
    if (url.includes('/reviews')) {
      return Promise.resolve({
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
      });
    }
    if (url === '/cart') {
      return Promise.resolve({ data: { success: true, data: initialCart } });
    }
    if (url === '/coupons/active') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    return Promise.resolve({ data: { success: true, data: [] } });
  });

  return { getSpy };
}

describe('PO-BUG-01: Direct Quantity Input, Validation, Product Switch & Cart Sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Unit helper clamps values safely and handles empty, zero, negative, and overflow drafts', () => {
    expect(clampQuantity(5, 40)).toBe(5);
    expect(clampQuantity(47, 40)).toBe(40);
    expect(clampQuantity(0, 40)).toBe(1);
    expect(clampQuantity(-3, 40)).toBe(1);
    expect(resolveCommittedQuantity('', 40, 3)).toBe(3);
    expect(resolveCommittedQuantity('47', 40, 1)).toBe(40);
    expect(resolveCommittedQuantity('0', 40, 5)).toBe(1);
    expect(resolveCommittedQuantity('-9', 40, 5)).toBe(1);
    expect(resolveCommittedQuantity('abc', 40, 4)).toBe(4);
  });

  it('Tests 1-4: ProductDetail displays default 1, accepts direct input (5), replaces value, and types multi-digit (47) cleanly', async () => {
    mockCatalogAndReviews();
    renderProductDetail(prodPrimary.slug); // stockQuantity = 50

    const qtyInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    expect(qtyInput.value).toBe('1');
    expect(qtyInput.type).toBe('number');

    // Type '5' directly
    fireEvent.focus(qtyInput);
    fireEvent.change(qtyInput, { target: { value: '5' } });
    expect(qtyInput.value).toBe('5');

    // Replace current value with '8'
    fireEvent.change(qtyInput, { target: { value: '8' } });
    expect(qtyInput.value).toBe('8');

    // Clear and type multi-digit '47' step-by-step without losing digits
    fireEvent.change(qtyInput, { target: { value: '' } });
    expect(qtyInput.value).toBe('');
    fireEvent.change(qtyInput, { target: { value: '4' } });
    expect(qtyInput.value).toBe('4');
    fireEvent.change(qtyInput, { target: { value: '47' } });
    expect(qtyInput.value).toBe('47');
    fireEvent.blur(qtyInput);
    expect(qtyInput.value).toBe('47');
  });

  it('Tests 5-10: Enforces stock ceiling, normalizes 0/negative to 1, tolerates empty draft while typing, and commits on Enter & Blur', async () => {
    mockCatalogAndReviews();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { items: [], totalItems: 40, subtotal: '155600000' } },
    });

    renderProductDetail(prodMidStock.slug); // stockQuantity = 40
    const qtyInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;

    // 5. Exact stock quantity = 40
    fireEvent.change(qtyInput, { target: { value: '40' } });
    fireEvent.keyDown(qtyInput, { key: 'Enter' });
    expect(qtyInput.value).toBe('40');

    // 6. Overflow '47' clamped to 40 on blur
    fireEvent.change(qtyInput, { target: { value: '47' } });
    fireEvent.blur(qtyInput);
    expect(qtyInput.value).toBe('40');

    // 7. Zero and negative normalized to 1 on confirm
    fireEvent.change(qtyInput, { target: { value: '0' } });
    fireEvent.keyDown(qtyInput, { key: 'Enter' });
    expect(qtyInput.value).toBe('1');

    fireEvent.change(qtyInput, { target: { value: '-5' } });
    fireEvent.blur(qtyInput);
    expect(qtyInput.value).toBe('1');

    // 8. Empty input permitted while typing without throwing errors; restored cleanly on blur
    fireEvent.change(qtyInput, { target: { value: '' } });
    expect(qtyInput.value).toBe('');
    fireEvent.blur(qtyInput);
    expect(qtyInput.value).toBe('1');

    // Enter '5' without blur then click Add to Cart => commits 5
    fireEvent.change(qtyInput, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ hàng/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/cart/items',
        { productId: prodMidStock.id, quantity: 5 },
        expect.anything(),
      );
    });
  });

  it('Tests 11-12: Plus (+) never exceeds stock and Minus (-) never drops below 1', async () => {
    mockCatalogAndReviews();
    renderProductDetail(prodLowStock.slug); // stockQuantity = 3

    const qtyInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    const minusBtn = screen.getByRole('button', { name: '-' }) as HTMLButtonElement;
    const plusBtn = screen.getByRole('button', { name: '+' }) as HTMLButtonElement;

    expect(qtyInput.value).toBe('1');
    expect(minusBtn).toBeDisabled();

    fireEvent.click(plusBtn);
    expect(qtyInput.value).toBe('2');
    expect(minusBtn).not.toBeDisabled();

    fireEvent.click(plusBtn);
    expect(qtyInput.value).toBe('3');
    expect(plusBtn).toBeDisabled();

    // Further clicks stay at 3
    fireEvent.click(plusBtn);
    expect(qtyInput.value).toBe('3');

    // Decrement back down stops at 1
    fireEvent.click(minusBtn);
    fireEvent.click(minusBtn);
    expect(qtyInput.value).toBe('1');
    expect(minusBtn).toBeDisabled();
  });

  it('Tests 13-14: Switching products resets quantity to 1, never carries overflow qty to lower-stock product, and submits correct productId', async () => {
    mockCatalogAndReviews();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { items: [], totalItems: 1, subtotal: '3890000' } },
    });

    renderProductDetail(prodPrimary.slug, {
      switchTargets: [prodLowStock.slug, prodPrimary.slug],
    });

    const firstInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    fireEvent.change(firstInput, { target: { value: '47' } });
    fireEvent.blur(firstInput);
    expect(firstInput.value).toBe('47');

    // Switch to prodLowStock (stockQuantity = 3)
    fireEvent.click(screen.getByTestId(`switch-to-${prodLowStock.slug}`));

    await screen.findByRole('heading', { name: prodLowStock.name });
    const secondInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    expect(secondInput.value).toBe('1');

    // Add to cart on second product must use prodLowStock.id and quantity 1 (never 47 or prodPrimary.id)
    fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ hàng/i }));
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/cart/items',
        { productId: prodLowStock.id, quantity: 1 },
        expect.anything(),
      );
    });

    // Switching back to prodPrimary also starts cleanly at 1
    fireEvent.click(screen.getByTestId(`switch-to-${prodPrimary.slug}`));
    await screen.findByRole('heading', { name: prodPrimary.name });
    const returnedInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    expect(returnedInput.value).toBe('1');
  });

  it('Tests 15-16: CartPage updates exact cartItem on Enter/Blur without per-keystroke calls and reverts + shows error on API failure', async () => {
    const itemA: CartItemDto = {
      id: 'item-101',
      productId: prodPrimary.id,
      quantity: 2,
      product: prodPrimary, // stockQuantity 50
    };
    const itemB: CartItemDto = {
      id: 'item-102',
      productId: prodLowStock.id,
      quantity: 1,
      product: prodLowStock, // stockQuantity 3
    };
    const initialCart: CartSummaryDto = {
      items: [itemA, itemB],
      totalItems: 3,
      subtotal: '11670000',
    };

    mockCatalogAndReviews(initialCart);

    const patchSpy = vi
      .spyOn(apiClient, 'patch')
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            items: [{ ...itemA, quantity: 47 }, itemB],
            totalItems: 48,
            subtotal: '186720000',
          },
        },
      })
      .mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: { message: 'Tồn kho thực tế trên máy chủ không đủ.' },
          },
        },
      });

    renderCartPage();

    const inputA = (await screen.findByLabelText(
      `Số lượng cho ${prodPrimary.name}`,
    )) as HTMLInputElement;
    const inputB = (await screen.findByLabelText(
      `Số lượng cho ${prodLowStock.name}`,
    )) as HTMLInputElement;

    expect(inputA.value).toBe('2');
    expect(inputB.value).toBe('1');

    // Typing multi-digit '4' then '7' in Item A MUST NOT fire API per keystroke
    fireEvent.change(inputA, { target: { value: '' } });
    fireEvent.change(inputA, { target: { value: '4' } });
    fireEvent.change(inputA, { target: { value: '47' } });
    expect(patchSpy).not.toHaveBeenCalled();

    // Confirm on Enter sends single PATCH for item-101 with quantity 47
    fireEvent.keyDown(inputA, { key: 'Enter' });
    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledTimes(1);
      expect(patchSpy).toHaveBeenCalledWith(
        '/cart/items/item-101',
        { quantity: 47 },
        expect.anything(),
      );
    });

    // Item B overflow '9' clamps to stock 3 on blur, triggers 2nd call -> mocked server rejection
    fireEvent.change(inputB, { target: { value: '9' } });
    fireEvent.blur(inputB);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        '/cart/items/item-102',
        { quantity: 3 },
        expect.anything(),
      );
    });

    // On API error: UI shows error alert & toast AND reverts Item B input back to server quantity '1'
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Tồn kho thực tế trên máy chủ không đủ.');
    await waitFor(() => {
      expect(inputB.value).toBe('1');
    });

    // Clicking '+' on Item B (stock 3, qty 1) increments to 2 then 3 and stops cleanly without exceeding stock
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    const minusButtons = screen.getAllByRole('button', { name: '-' });
    const plusB = plusButtons[1];
    const minusB = minusButtons[1];
    expect(minusB).toBeDisabled();
    fireEvent.click(plusB);
    await waitFor(() => {
      expect(patchSpy).toHaveBeenLastCalledWith(
        '/cart/items/item-102',
        { quantity: 2 },
        expect.anything(),
      );
    });
  });

  it('Test 18: Buy Now submits direct typed quantity cleanly and navigates to checkout', async () => {
    mockCatalogAndReviews();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { success: true, data: { items: [], totalItems: 6, subtotal: '23340000' } },
    });

    renderProductDetail(prodMidStock.slug); // stockQuantity = 40
    const qtyInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: '6' } });

    fireEvent.click(screen.getByRole('button', { name: /Mua ngay/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/cart/items',
        { productId: prodMidStock.id, quantity: 6 },
        expect.anything(),
      );
      expect(screen.getByText('Checkout Route')).toBeInTheDocument();
    });
  });

  it('Test 17: Out-of-stock product disables quantity input, add-to-cart, buy-now, and CartPage item editing', async () => {
    const outItem: CartItemDto = {
      id: 'item-zero',
      productId: prodZeroStock.id,
      quantity: 1,
      product: prodZeroStock,
    };
    mockCatalogAndReviews({
      items: [outItem],
      totalItems: 1,
      subtotal: '3890000',
    });
    const postSpy = vi.spyOn(apiClient, 'post');

    renderProductDetail(prodZeroStock.slug);
    const qtyInput = (await screen.findByLabelText('Số lượng sản phẩm')) as HTMLInputElement;
    expect(qtyInput).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Tạm hết hàng/i })).toHaveLength(2);
    screen.getAllByRole('button', { name: /Tạm hết hàng/i }).forEach((btn) => {
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
    });
    expect(postSpy).not.toHaveBeenCalled();

    cleanup();
    renderCartPage();
    const cartInput = (await screen.findByLabelText(
      `Số lượng cho ${prodZeroStock.name}`,
    )) as HTMLInputElement;
    expect(cartInput).toBeDisabled();
    expect(screen.getByText('Tạm hết hàng')).toBeInTheDocument();
    expect(screen.getByTitle('Xóa sản phẩm')).not.toBeDisabled();
  });
});

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductDto } from '@nexora/shared';
import { ProductDetailPage } from '../src/features/catalog/ProductDetailPage';
import {
  DEFAULT_PRODUCT_FALLBACK_IMAGE,
  getProductImage,
  resolveProductGalleryImages,
} from '../src/lib/productImage';
import { storefrontService } from '../src/services/storefrontService';
import { cartService } from '../src/services/cartService';
import { reviewService } from '../src/services/reviewService';
import fs from 'node:fs';
import path from 'node:path';

type DetailProduct = ProductDto & {
  images: Array<{ id: number; imageUrl: string }>;
  reviews: unknown[];
};

function buildDetailProduct(overrides: Partial<DetailProduct> = {}): DetailProduct {
  return {
    id: 5001,
    categoryId: 87,
    brandId: 1,
    name: 'Pin sạc dự phòng Anker Power-PB1',
    slug: 'pin-sac-du-phong-anker-pb1',
    sku: 'PB-ANK-1',
    price: '1290000',
    salePrice: null,
    stockQuantity: 25,
    thumbnailUrl: null,
    shortDescription: 'Sạc dự phòng USB-C PD',
    specs: { max_output_w: 65, capacity_mah: 10000 },
    isFeatured: false,
    isHot: false,
    status: 'ACTIVE',
    category: { id: 87, name: 'Sạc dự phòng', slug: 'power-bank', isActive: true },
    brand: { id: 1, name: 'ASUS', slug: 'asus', isActive: true },
    images: [],
    reviews: [],
    ...overrides,
  };
}

function renderDetail(slug: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/product/detail/${slug}`]}>
        <Routes>
          <Route path="/product/detail/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PO-BUG-02: Product Detail fallback image size & gallery integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(storefrontService, 'getCategories').mockResolvedValue([]);
    vi.spyOn(storefrontService, 'getProducts').mockResolvedValue({ products: [], total: 0 });
    vi.spyOn(cartService, 'getCart').mockResolvedValue({
      items: [],
      totalItems: 0,
      subtotal: '0',
    });
    vi.spyOn(reviewService, 'getProductReviews').mockResolvedValue({
      reviews: [],
      stats: { totalReviews: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1-5. all 5 fallback assets (Power Bank, Chair, Mainboard, Speaker, Accessories) are non-56px high-res images and render inside full-size contained gallery classes', async () => {
    const publicDir = path.resolve(__dirname, '../public/assets/images/categories');
    const fallbackFiles = [
      'category-power-bank.png',
      'category-chair.png',
      'category-mainboard.png',
      'category-speaker.png',
      'category-accessories.png',
    ];
    for (const file of fallbackFiles) {
      const buf = fs.readFileSync(path.join(publicDir, file));
      // PNG IHDR width/height sit at bytes 16..24 (big endian uint32)
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBeGreaterThanOrEqual(400);
      expect(height).toBeGreaterThanOrEqual(400);
    }

    const cases: Array<{ prod: DetailProduct; expectedSrc: string }> = [
      {
        prod: buildDetailProduct({
          slug: 'pb-fallback',
          category: { id: 87, name: 'Sạc dự phòng', slug: 'power-bank', isActive: true },
        }),
        expectedSrc: '/assets/images/categories/category-power-bank.png',
      },
      {
        prod: buildDetailProduct({
          slug: 'chair-fallback',
          name: 'Ghế công thái học Corsair Ergo-CH1',
          category: { id: 81, name: 'Ghế', slug: 'chair', isActive: true },
        }),
        expectedSrc: '/assets/images/categories/category-chair.png',
      },
      {
        prod: buildDetailProduct({
          slug: 'mb-fallback',
          name: 'Mainboard ASUS B650 Model-MB1 WiFi DDR5',
          category: { id: 71, name: 'Mainboard', slug: 'mainboard', isActive: true },
        }),
        expectedSrc: '/assets/images/categories/category-mainboard.png',
      },
      {
        prod: buildDetailProduct({
          slug: 'speaker-fallback',
          name: 'Loa vi tính Logitech Bass-SP1',
          category: { id: 83, name: 'Loa', slug: 'speaker', isActive: true },
        }),
        expectedSrc: '/assets/images/categories/category-speaker.png',
      },
      {
        prod: buildDetailProduct({
          slug: 'acc-fallback',
          name: 'Dây cáp Thunderbolt 4 Anker Acc-AC3',
          category: { id: 85, name: 'Phụ kiện', slug: 'accessories', isActive: true },
        }),
        expectedSrc: '/assets/images/categories/category-accessories.png',
      },
    ];

    for (const c of cases) {
      vi.spyOn(storefrontService, 'getProductBySlug').mockResolvedValueOnce(c.prod);
      const { unmount } = renderDetail(c.prod.slug);
      const mainImg = (await screen.findByTestId('product-detail-main-image')) as HTMLImageElement;
      expect(mainImg.getAttribute('src')).toBe(c.expectedSrc);
      expect(mainImg).toHaveClass('nexora-product-gallery-main-img');
      expect(screen.getByTestId('product-detail-image-stage')).toHaveClass(
        'nexora-product-gallery-stage',
      );
      unmount();
    }
  });

  it('6-10. preserves authentic photos, filters broken placeholder gallery items, handles clickable thumbnails & broken URL fallback', async () => {
    const prod = buildDetailProduct({
      slug: 'real-gallery-product',
      name: 'Laptop ASUS ROG Zephyrus G16',
      thumbnailUrl: '/assets/images/review/unlinked/rog-zephyrus.jpg',
      category: { id: 2, name: 'Laptop Gaming', slug: 'laptop-gaming', isActive: true },
      images: [
        { id: 1, imageUrl: '/assets/images/review/unlinked/rog-zephyrus.jpg' },
        { id: 2, imageUrl: '/assets/images/review/unlinked/msi-vector.jpg' },
        { id: 3, imageUrl: '/assets/images/review/unlinked/chair-warrior.jpg' },
      ],
    });

    const gallery = resolveProductGalleryImages(prod);
    expect(gallery).toEqual([
      '/assets/images/review/unlinked/rog-zephyrus.jpg',
      '/assets/images/review/unlinked/msi-vector.jpg',
    ]);

    vi.spyOn(storefrontService, 'getProductBySlug').mockResolvedValue(prod);
    renderDetail(prod.slug);

    const mainImg = (await screen.findByTestId('product-detail-main-image')) as HTMLImageElement;
    expect(mainImg.getAttribute('src')).toBe('/assets/images/review/unlinked/rog-zephyrus.jpg');

    const thumbButtons = screen
      .getByTestId('product-detail-thumbs')
      .querySelectorAll('button.nexora-product-gallery-thumb');
    expect(thumbButtons).toHaveLength(2);
    expect(thumbButtons[0]).toHaveAttribute('aria-pressed', 'true');

    // Click second thumbnail -> swaps main image cleanly
    fireEvent.click(thumbButtons[1]!);
    expect(mainImg.getAttribute('src')).toBe('/assets/images/review/unlinked/msi-vector.jpg');
    expect(thumbButtons[1]).toHaveAttribute('aria-pressed', 'true');

    // Trigger broken image error -> safely falls back to DEFAULT_PRODUCT_FALLBACK_IMAGE
    fireEvent.error(mainImg);
    await waitFor(() => expect(mainImg.getAttribute('src')).toBe(DEFAULT_PRODUCT_FALLBACK_IMAGE));
  });

  it('11-12. index.css enforces responsive containment without cropping or distortion', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');
    expect(css).toContain('.nexora-product-gallery-main-img');
    expect(css).toContain('width: 100%;');
    expect(css).toContain('height: 100%;');
    expect(css).toContain('object-fit: contain;');
    expect(css).toContain('@media (max-width: 960px)');
    expect(getProductImage(undefined)).toBe(DEFAULT_PRODUCT_FALLBACK_IMAGE);
  });
});

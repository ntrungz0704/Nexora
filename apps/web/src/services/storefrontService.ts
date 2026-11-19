import { apiClient } from '../lib/apiClient';
import type {
  ApiSuccessEnvelope,
  CategoryDto,
  BannerDto,
  ProductDto,
  BrandDto,
} from '@nexora/shared';

export interface ProductsResponse {
  products: ProductDto[];
  total: number;
}

export const storefrontService = {
  async getCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<CategoryDto[]>>('/catalog/categories');
    return res.data.data;
  },

  async getBanners(placement?: string): Promise<BannerDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<BannerDto[]>>('/catalog/banners', {
      params: placement ? { placement } : undefined,
    });
    return res.data.data;
  },

  async getBrands(): Promise<BrandDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<BrandDto[]>>('/catalog/brands');
    return res.data.data;
  },

  async getProducts(params?: {
    category?: string;
    brand?: string;
    q?: string;
    featured?: boolean;
    hot?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ProductsResponse> {
    const res = await apiClient.get<ApiSuccessEnvelope<ProductsResponse>>('/catalog/products', {
      params,
    });
    return res.data.data;
  },

  async getFlashSale(): Promise<ProductDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<ProductDto[]>>(
      '/catalog/products/flash-sale',
    );
    return res.data.data;
  },

  async getFeatured(): Promise<ProductDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<ProductDto[]>>('/catalog/products/featured');
    return res.data.data;
  },

  async getProductBySlug(
    slug: string,
  ): Promise<ProductDto & { images: unknown[]; reviews: unknown[] }> {
    const res = await apiClient.get<
      ApiSuccessEnvelope<ProductDto & { images: unknown[]; reviews: unknown[] }>
    >(`/catalog/products/${slug}`);
    return res.data.data;
  },
};

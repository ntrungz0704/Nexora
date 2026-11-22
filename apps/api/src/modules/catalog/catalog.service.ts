import type { ProductDto, CategoryDto, BannerDto, BrandDto } from '@nexora/shared';
import { CatalogRepository, type ProductFilterOptions } from './catalog.repository.js';
import { AppError } from '../../common/errors.js';
import type { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    brand: { select: { id: true; name: true; slug: true } };
    images: true;
  };
}>;

export class CatalogService {
  constructor(private readonly repository: CatalogRepository = new CatalogRepository()) {}

  async getCategoryTree(): Promise<CategoryDto[]> {
    const categories = await this.repository.getCategories();

    return categories.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    }));
  }

  async getBanners(placement?: string): Promise<BannerDto[]> {
    const banners = await this.repository.getBanners(placement);
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      placement: b.placement,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    }));
  }

  async getBrands(): Promise<BrandDto[]> {
    const brands = await this.repository.getBrands();
    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      description: b.description,
    }));
  }

  private mapProductToDto(p: ProductWithRelations): ProductDto {
    return {
      id: p.id,
      categoryId: p.categoryId,
      brandId: p.brandId,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price.toString(),
      salePrice: p.salePrice ? p.salePrice.toString() : null,
      stockQuantity: p.stockQuantity,
      thumbnailUrl: p.thumbnailUrl,
      shortDescription: p.shortDescription,
      specs: p.specs as Record<string, unknown> | null,
      isFeatured: p.isFeatured,
      isHot: p.isHot,
      status: p.status,
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
          }
        : undefined,
      brand: p.brand
        ? {
            id: p.brand.id,
            name: p.brand.name,
            slug: p.brand.slug,
          }
        : null,
    };
  }

  async getProducts(options: ProductFilterOptions = {}) {
    const { products, total } = await this.repository.getProducts(options);
    return {
      products: products.map((p) => this.mapProductToDto(p as ProductWithRelations)),
      total,
    };
  }

  async getFlashSaleProducts(limit = 8) {
    const { products } = await this.repository.getProducts({
      hasDiscount: true,
      limit,
    });
    return products.map((p) => this.mapProductToDto(p as ProductWithRelations));
  }

  async getFeaturedProducts(limit = 8) {
    const { products } = await this.repository.getProducts({
      isFeatured: true,
      limit,
    });
    return products.map((p) => this.mapProductToDto(p as ProductWithRelations));
  }

  async getProductBySlug(slug: string) {
    const product = await this.repository.getProductBySlug(slug);
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm với slug: ${slug}`);
    }
    return {
      ...this.mapProductToDto(product as ProductWithRelations),
      images: product.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText,
        sortOrder: img.sortOrder,
      })),
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    };
  }
}

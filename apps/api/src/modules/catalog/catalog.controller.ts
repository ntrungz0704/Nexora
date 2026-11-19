import type { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service.js';
import { sendSuccess } from '../../common/http.js';

export class CatalogController {
  constructor(private readonly service: CatalogService = new CatalogService()) {}

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getCategoryTree();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getBanners = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const placement = req.query.placement as string | undefined;
      const data = await this.service.getBanners(placement);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getBrands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getBrands();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categorySlug = req.query.category as string | undefined;
      const brandSlug = req.query.brand as string | undefined;
      const search = req.query.q as string | undefined;
      const isFeatured = req.query.featured === 'true' ? true : undefined;
      const isHot = req.query.hot === 'true' ? true : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 24;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

      const data = await this.service.getProducts({
        categorySlug,
        brandSlug,
        search,
        isFeatured,
        isHot,
        limit,
        offset,
        minPrice,
        maxPrice,
      });

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getFlashSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const data = await this.service.getFlashSaleProducts(limit);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const data = await this.service.getFeaturedProducts(limit);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      const data = await this.service.getProductBySlug(slug);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}

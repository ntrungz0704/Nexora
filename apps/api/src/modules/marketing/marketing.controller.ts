import type { Request, Response, NextFunction } from 'express';
import { MarketingService } from './marketing.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';

export class MarketingController {
  constructor(private readonly service: MarketingService = new MarketingService()) {}

  getCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupons = await this.service.getActiveCoupons();
      sendSuccess(res, coupons);
    } catch (error) {
      next(error);
    }
  };

  validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, subtotal } = req.body;
      if (!code) {
        throw new AppError(400, 'INVALID_COUPON', 'Vui lòng nhập mã giảm giá.');
      }
      const result = await this.service.validateCoupon(code, Number(subtotal || 0));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getActiveFlashSale = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flashSale = await this.service.getActiveFlashSale();
      sendSuccess(res, flashSale);
    } catch (error) {
      next(error);
    }
  };

  getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const posts = await this.service.getPublishedPosts(limit);
      sendSuccess(res, posts);
    } catch (error) {
      next(error);
    }
  };

  getPostBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug as string;
      if (!slug) {
        throw new AppError(400, 'INVALID_SLUG', 'Slug bài viết không được để trống.');
      }
      const post = await this.service.getPostBySlug(slug);
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  };
}

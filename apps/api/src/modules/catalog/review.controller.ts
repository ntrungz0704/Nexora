import type { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service.js';
import { CreateReviewInputSchema, UpdateReviewInputSchema } from '@nexora/shared';
import { AppError } from '../../common/errors.js';

export class ReviewController {
  constructor(private readonly service = new ReviewService()) {}

  /**
   * GET /api/v1/catalog/products/:id/reviews
   * Lấy danh sách đánh giá đã duyệt của sản phẩm kèm thống kê số sao.
   */
  getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productIdOrSlug = req.params.id as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await this.service.getProductReviews(productIdOrSlug, { page, limit });
      res.json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
        stats: result.stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/catalog/products/:id/reviews
   * Gửi hoặc cập nhật đánh giá sản phẩm. Yêu cầu xác thực đã mua hàng (DELIVERED).
   */
  createOrUpdateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập để gửi đánh giá.');
      }

      const rawId = req.params.id as string;
      const productId = parseInt(rawId, 10);
      if (isNaN(productId) || productId <= 0) {
        throw new AppError(400, 'INVALID_PRODUCT_ID', 'ID sản phẩm không hợp lệ.');
      }

      const parsed = CreateReviewInputSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstMessage = parsed.error.issues[0]?.message || 'Dữ liệu đánh giá không hợp lệ.';
        throw new AppError(400, 'VALIDATION_ERROR', firstMessage);
      }
      const result = await this.service.createOrUpdateReview(userId, productId, parsed.data);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/catalog/reviews/:id
   * Chỉnh sửa đánh giá cá nhân (chống IDOR).
   */
  updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập để chỉnh sửa đánh giá.');
      }

      const reviewId = parseInt(req.params.id as string, 10);
      if (isNaN(reviewId) || reviewId <= 0) {
        throw new AppError(400, 'INVALID_REVIEW_ID', 'ID đánh giá không hợp lệ.');
      }

      const parsed = UpdateReviewInputSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstMessage = parsed.error.issues[0]?.message || 'Dữ liệu đánh giá không hợp lệ.';
        throw new AppError(400, 'VALIDATION_ERROR', firstMessage);
      }
      const result = await this.service.updateReview(userId, userRole, reviewId, parsed.data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/catalog/reviews/:id
   * Xóa đánh giá (chống IDOR: chỉ chủ sở hữu hoặc ADMIN/STAFF).
   */
  deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập để xóa đánh giá.');
      }

      const reviewId = parseInt(req.params.id as string, 10);
      if (isNaN(reviewId) || reviewId <= 0) {
        throw new AppError(400, 'INVALID_REVIEW_ID', 'ID đánh giá không hợp lệ.');
      }

      const result = await this.service.deleteReview(userId, userRole, reviewId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/catalog/products/:id/reviews/eligibility
   * Kiểm tra điều kiện đánh giá của khách hàng cho sản phẩm.
   */
  getReviewEligibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }

      const productIdOrSlug = req.params.id as string;
      const result = await this.service.getReviewEligibility(userId, productIdOrSlug);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

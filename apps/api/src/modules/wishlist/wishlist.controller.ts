import type { Request, Response, NextFunction } from 'express';
import { wishlistService } from './wishlist.service.js';
import { AppError } from '../../common/errors.js';

export class WishlistController {
  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để xem sản phẩm yêu thích.');
      }
      const items = await wishlistService.getWishlist(userId);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async toggleWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      }
      const productId = Number(req.body.productId || req.body.product_id);
      if (!productId || isNaN(productId)) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã sản phẩm không hợp lệ.');
      }
      const result = await wishlistService.toggleWishlist(userId, productId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để thực hiện.');
      }
      const productId = Number(req.params.productId);
      if (!productId || isNaN(productId)) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã sản phẩm không hợp lệ.');
      }
      const result = await wishlistService.removeFromWishlist(userId, productId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      const count = await wishlistService.getCount(userId);
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }
}

export const wishlistController = new WishlistController();

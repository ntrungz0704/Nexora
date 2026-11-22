import type { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import { MergeCartInputSchema } from '@nexora/shared';

export class CartController {
  constructor(private readonly service: CartService = new CartService()) {}

  private getSessionIds(req: Request) {
    const userId = req.user?.sub;
    const guestSessionId =
      (req.headers['x-guest-session-id'] as string) ||
      (req.query.guestSessionId as string) ||
      undefined;
    return { userId, guestSessionId };
  }

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const data = await this.service.getCartSummary(userId, guestSessionId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const productId = parseInt(req.body.productId, 10);
      const quantity = req.body.quantity ? parseInt(req.body.quantity, 10) : 1;

      const data = await this.service.addItem({
        userId,
        guestSessionId,
        productId,
        quantity,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const cartItemId = BigInt(req.params.id as string);
      const quantity = parseInt(req.body.quantity, 10);

      const data = await this.service.updateItem({
        cartItemId,
        quantity,
        userId,
        guestSessionId,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const cartItemId = BigInt(req.params.id as string);

      const data = await this.service.removeItem({
        cartItemId,
        userId,
        guestSessionId,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  mergeCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(
          401,
          'UNAUTHORIZED',
          'Vui lòng đăng nhập để thực hiện đồng bộ giỏ hàng.',
        );
      }

      const guestSessionId =
        req.body?.guestSessionId || (req.headers['x-guest-session-id'] as string) || '';

      const parseResult = MergeCartInputSchema.safeParse({ guestSessionId });
      if (!parseResult.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          parseResult.error.issues[0]?.message || 'Mã phiên khách không hợp lệ.',
        );
      }

      const result = await this.service.mergeGuestCartToUser(
        parseResult.data.guestSessionId,
        userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

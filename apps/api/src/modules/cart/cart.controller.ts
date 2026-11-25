import type { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import { MergeCartInputSchema } from '@nexora/shared';

export class CartController {
  constructor(private readonly service: CartService = new CartService()) {}

  private getSessionIds(req: Request) {
    const userId = req.user?.sub;
    const rawGuest =
      (typeof req.headers['x-guest-session-id'] === 'string'
        ? req.headers['x-guest-session-id']
        : undefined) ||
      (typeof req.query.guestSessionId === 'string' ? req.query.guestSessionId : undefined);
    const trimmedGuest = rawGuest?.trim();
    const guestSessionId = trimmedGuest ? trimmedGuest : undefined;
    return { userId, guestSessionId };
  }

  private parsePositiveInt(
    raw: unknown,
    fieldLabel: string,
    errorCode = 'VALIDATION_ERROR',
  ): number {
    if (typeof raw === 'number') {
      if (Number.isInteger(raw) && raw > 0) return raw;
      throw new AppError(400, errorCode, `${fieldLabel} phải là số nguyên dương lớn hơn 0.`);
    }
    if (typeof raw === 'string' && /^\s*\d+\s*$/.test(raw)) {
      const parsed = Number(raw.trim());
      if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
    }
    throw new AppError(400, errorCode, `${fieldLabel} phải là số nguyên dương lớn hơn 0.`);
  }

  private parsePositiveBigInt(raw: unknown, fieldLabel: string): bigint {
    if (typeof raw === 'bigint') {
      if (raw > 0n) return raw;
    } else if (typeof raw === 'number') {
      if (Number.isSafeInteger(raw) && raw > 0) return BigInt(raw);
    } else if (typeof raw === 'string' && /^\s*\d+\s*$/.test(raw)) {
      const parsed = BigInt(raw.trim());
      if (parsed > 0n) return parsed;
    }
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldLabel} không hợp lệ.`);
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
      const productId = this.parsePositiveInt(req.body?.productId, 'Mã sản phẩm');
      const quantity =
        req.body?.quantity === undefined
          ? 1
          : this.parsePositiveInt(req.body.quantity, 'Số lượng sản phẩm', 'INVALID_QUANTITY');
      const requestedCartId =
        req.body?.cartId !== undefined
          ? this.parsePositiveBigInt(req.body.cartId, 'Mã giỏ hàng')
          : undefined;

      const data = await this.service.addItem({
        userId,
        guestSessionId,
        productId,
        quantity,
        requestedCartId,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const cartItemId = this.parsePositiveBigInt(req.params.id, 'Mã sản phẩm trong giỏ hàng');
      const quantity = this.parsePositiveInt(
        req.body?.quantity,
        'Số lượng sản phẩm',
        'INVALID_QUANTITY',
      );
      const requestedCartId =
        req.body?.cartId !== undefined
          ? this.parsePositiveBigInt(req.body.cartId, 'Mã giỏ hàng')
          : undefined;

      const data = await this.service.updateItem({
        cartItemId,
        quantity,
        userId,
        guestSessionId,
        requestedCartId,
      });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, guestSessionId } = this.getSessionIds(req);
      const cartItemId = this.parsePositiveBigInt(req.params.id, 'Mã sản phẩm trong giỏ hàng');
      const rawRequestedCartId =
        req.body?.cartId !== undefined ? req.body.cartId : req.query?.cartId;
      const requestedCartId =
        rawRequestedCartId !== undefined
          ? this.parsePositiveBigInt(rawRequestedCartId, 'Mã giỏ hàng')
          : undefined;

      const data = await this.service.removeItem({
        cartItemId,
        userId,
        guestSessionId,
        requestedCartId,
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

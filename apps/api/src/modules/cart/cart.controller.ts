import type { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';
import { sendSuccess } from '../../common/http.js';

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
}

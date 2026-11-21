import type { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { sendSuccess } from '../../common/http.js';
import { CreateOrderInputSchema, TrackOrderInputSchema } from '@nexora/shared';
import { AppError } from '../../common/errors.js';

export class OrderController {
  constructor(private readonly service: OrderService = new OrderService()) {}

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = CreateOrderInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Dữ liệu đặt hàng không hợp lệ.',
          parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        );
      }

      const userId = req.user?.sub;
      const order = await this.service.createOrder(userId, parsed.data);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  };

  getOrderByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.params.code as string;
      if (!code || !code.trim()) {
        throw new AppError(400, 'INVALID_CODE', 'Mã đơn hàng không được để trống.');
      }
      const phone = typeof req.query.phone === 'string' ? req.query.phone : undefined;
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;

      const order = await this.service.getOrderByCode(code, {
        requester: req.user,
        phone,
        email,
      });
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = TrackOrderInputSchema.safeParse({
        orderCode: req.query.code,
        phone: req.query.phone,
      });

      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Vui lòng cung cấp mã đơn và số điện thoại.');
      }

      const order = await this.service.trackOrder(
        parsed.data.orderCode,
        parsed.data.phone,
        req.user,
      );
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const orders = await this.service.getUserOrders(userId);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const code = req.params.code as string;
      const reason = (req.body.reason as string) || 'Khách hàng yêu cầu hủy đơn';
      const order = await this.service.cancelOrder(code, userId, reason);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };
}

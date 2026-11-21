import type { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';

export class PaymentController {
  constructor(private readonly service: PaymentService = new PaymentService()) {}

  createVnpayUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode, orderInfo, customerEmail, customerPhone } = req.body;
      if (!orderCode) {
        throw new AppError(400, 'INVALID_PAYMENT_DATA', 'Vui lòng cung cấp mã đơn hàng.');
      }

      // Respect Express trust proxy configuration; never trust arbitrary X-Forwarded-For headers directly
      const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const paymentUrl = await this.service.createVnpayPaymentUrl({
        orderCode,
        orderInfo,
        ipAddr,
        requester: req.user,
        customerEmail,
        customerPhone,
      });

      sendSuccess(res, { paymentUrl });
    } catch (error) {
      next(error);
    }
  };

  handleVnpayCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...(req.query as Record<string, string>) };
      const result = await this.service.verifyVnpayCallback(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  simulatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode } = req.body;
      if (!orderCode) {
        throw new AppError(400, 'INVALID_CODE', 'Vui lòng cung cấp mã đơn hàng.');
      }
      const result = await this.service.simulatePaymentSuccess(orderCode);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

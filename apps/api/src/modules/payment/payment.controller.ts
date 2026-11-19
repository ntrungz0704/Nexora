import type { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';

export class PaymentController {
  constructor(private readonly service: PaymentService = new PaymentService()) {}

  createVnpayUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderCode, amount, orderInfo } = req.body;
      if (!orderCode || !amount) {
        throw new AppError(400, 'INVALID_PAYMENT_DATA', 'Vui lòng cung cấp mã đơn hàng và số tiền.');
      }

      const ipAddr =
        (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const paymentUrl = this.service.createVnpayPaymentUrl({
        orderCode,
        amount: Number(amount),
        orderInfo,
        ipAddr,
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

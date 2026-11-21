import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { optionalAuth } from '../auth/auth.middleware.js';
import { createRateLimiters, type AppRateLimiters } from '../../middleware/rateLimit.js';

export function createPaymentRouter(rateLimiters: AppRateLimiters = createRateLimiters()): Router {
  const router = Router();
  const controller = new PaymentController();

  router.post(
    '/vnpay/create-url',
    rateLimiters.commerceWrite,
    optionalAuth(),
    controller.createVnpayUrl,
  );
  router.get('/vnpay/callback', controller.handleVnpayCallback);

  // Endpoint giả lập thanh toán chỉ cho phép trong môi trường development hoặc test
  if (process.env.NODE_ENV !== 'production') {
    router.post('/simulate', controller.simulatePayment);
  }

  return router;
}

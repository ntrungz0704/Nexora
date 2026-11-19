import { Router } from 'express';
import { PaymentController } from './payment.controller.js';

export function createPaymentRouter(): Router {
  const router = Router();
  const controller = new PaymentController();

  router.post('/vnpay/create-url', controller.createVnpayUrl);
  router.get('/vnpay/callback', controller.handleVnpayCallback);
  router.post('/simulate', controller.simulatePayment);

  return router;
}

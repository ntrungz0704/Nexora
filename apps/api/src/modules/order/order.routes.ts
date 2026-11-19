import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { optionalAuth, requireAuth } from '../auth/auth.middleware.js';

export function createOrderRouter(): Router {
  const router = Router();
  const controller = new OrderController();

  // Public / Optional Auth
  router.post('/', optionalAuth(), controller.createOrder);
  router.get('/track', controller.trackOrder);
  router.get('/detail/:code', controller.getOrderByCode);

  // Authenticated customer
  router.get('/my-orders', requireAuth(), controller.getUserOrders);
  router.post('/:code/cancel', requireAuth(), controller.cancelOrder);

  return router;
}

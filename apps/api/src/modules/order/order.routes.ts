import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { optionalAuth, requireAuth } from '../auth/auth.middleware.js';
import { createRateLimiters, type AppRateLimiters } from '../../middleware/rateLimit.js';

export function createOrderRouter(rateLimiters: AppRateLimiters = createRateLimiters()): Router {
  const router = Router();
  const controller = new OrderController();

  // Public / Optional Auth (Protected by Rate Limiting & Explicit Ownership/Guest Verification)
  router.post('/', rateLimiters.commerceWrite, optionalAuth(), controller.createOrder);
  router.get('/track', rateLimiters.orderLookup, optionalAuth(), controller.trackOrder);
  router.get('/detail/:code', rateLimiters.orderLookup, optionalAuth(), controller.getOrderByCode);

  // Authenticated customer
  router.get('/my-orders', requireAuth(), controller.getUserOrders);
  router.post('/:code/cancel', requireAuth(), controller.cancelOrder);

  return router;
}

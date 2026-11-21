import { Router } from 'express';
import { createRateLimiters, type AppRateLimiters } from '../middleware/rateLimit.js';
import type { SystemRepository } from '../modules/system/system.repository.js';
import { createSystemRouter } from '../modules/system/system.routes.js';
import { createCatalogRouter } from '../modules/catalog/catalog.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCartRouter } from '../modules/cart/cart.routes.js';
import { createOrderRouter } from '../modules/order/order.routes.js';
import { createPaymentRouter } from '../modules/payment/payment.routes.js';
import { createMarketingRouter } from '../modules/marketing/marketing.routes.js';
import { createAiRouter } from '../modules/ai/ai.routes.js';
import { createAdminRouter } from '../modules/admin/admin.routes.js';
import { createWishlistRouter } from '../modules/wishlist/wishlist.routes.js';

export function createV1Router(
  systemRepository?: SystemRepository,
  rateLimiters: AppRateLimiters = createRateLimiters(),
): Router {
  const router = Router();

  // Foundation & System routes
  router.use('/', createSystemRouter(systemRepository));

  // Storefront & Catalog routes
  router.use('/catalog', createCatalogRouter());
  router.use('/auth', createAuthRouter(rateLimiters));
  router.use('/cart', createCartRouter());
  router.use('/wishlist', createWishlistRouter());

  // Commerce & Order routes
  router.use('/orders', createOrderRouter(rateLimiters));
  router.use('/payment', createPaymentRouter(rateLimiters));

  // Marketing & Content routes (Coupons, Flash sales, Posts)
  router.use('/marketing', createMarketingRouter());

  // AI Engines (Floating Chatbot, 5-Step Assistant, AI Compare, Product Chat)
  router.use('/ai', createAiRouter(rateLimiters));

  // Admin & Store Operations (Single-Vendor Management)
  router.use('/admin', createAdminRouter());

  return router;
}

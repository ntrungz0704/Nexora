import { Router } from 'express';
import { MarketingController } from './marketing.controller.js';

export function createMarketingRouter(): Router {
  const router = Router();
  const controller = new MarketingController();

  router.get('/coupons', controller.getCoupons);
  router.post('/coupons/validate', controller.validateCoupon);
  router.get('/flash-sales/active', controller.getActiveFlashSale);
  router.get('/posts', controller.getPosts);
  router.get('/posts/:slug', controller.getPostBySlug);
  router.get('/reviews', controller.getPublicReviews);

  return router;
}

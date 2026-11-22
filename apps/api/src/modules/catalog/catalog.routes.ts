import { Router } from 'express';
import { CatalogController } from './catalog.controller.js';
import { ReviewController } from './review.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export function createCatalogRouter(): Router {
  const router = Router();
  const controller = new CatalogController();
  const reviewController = new ReviewController();

  router.get('/categories', controller.getCategories);
  router.get('/banners', controller.getBanners);
  router.get('/brands', controller.getBrands);
  router.get('/products', controller.getProducts);
  router.get('/products/flash-sale', controller.getFlashSale);
  router.get('/products/featured', controller.getFeatured);

  // Customer Reviews
  router.get(
    '/products/:id/reviews/eligibility',
    requireAuth(['CUSTOMER', 'STAFF', 'ADMIN']),
    reviewController.getReviewEligibility,
  );
  router.get('/products/:id/reviews', reviewController.getProductReviews);
  router.post(
    '/products/:id/reviews',
    requireAuth(['CUSTOMER', 'STAFF', 'ADMIN']),
    reviewController.createOrUpdateReview,
  );
  router.put(
    '/reviews/:id',
    requireAuth(['CUSTOMER', 'STAFF', 'ADMIN']),
    reviewController.updateReview,
  );
  router.delete(
    '/reviews/:id',
    requireAuth(['CUSTOMER', 'STAFF', 'ADMIN']),
    reviewController.deleteReview,
  );

  // Single Product Detail by slug
  router.get('/products/:slug', controller.getProductBySlug);

  return router;
}

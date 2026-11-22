import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

export function createAdminRouter(): Router {
  const router = Router();
  const controller = new AdminController();

  // All admin routes require ADMIN or STAFF role
  router.use(requireAuth(['ADMIN', 'STAFF']));

  // Dashboard
  router.get('/dashboard/summary', controller.getDashboardSummary);

  // Products
  router.get('/products', controller.getProducts);
  router.post('/products', controller.createProduct);
  router.put('/products/:id', controller.updateProduct);
  router.delete('/products/:id', controller.deleteProduct);
  router.post('/products/ai-generate-description', controller.generateProductDescription);

  // Categories
  router.get('/categories', controller.getCategories);
  router.post('/categories', controller.createCategory);
  router.put('/categories/:id', controller.updateCategory);
  router.post('/categories/ai-generate', controller.generateCategoryAi);

  // Orders
  router.get('/orders', controller.getOrders);
  router.get('/orders/:id', controller.getOrderDetail);
  router.patch('/orders/:id/status', controller.updateOrderStatus);

  // Inventory
  router.get('/inventory/logs', controller.getInventoryLogs);
  router.post('/inventory/adjust', controller.adjustStock);

  // Coupons
  router.get('/coupons', controller.getCoupons);
  router.post('/coupons', controller.createCoupon);
  router.put('/coupons/:id', controller.updateCoupon);
  router.delete('/coupons/:id', controller.deleteCoupon);
  router.patch('/coupons/:id/toggle', controller.toggleCouponStatus);

  // Flash Sales
  router.get('/flash-sales', controller.getFlashSales);
  router.post('/flash-sales', controller.createFlashSale);
  router.put('/flash-sales/:id', controller.updateFlashSale);
  router.delete('/flash-sales/:id', controller.deleteFlashSale);
  router.patch('/flash-sales/:id/toggle', controller.toggleFlashSaleStatus);

  // Banners
  router.get('/banners', controller.getBanners);
  router.post('/banners', controller.createBanner);
  router.put('/banners/:id', controller.updateBanner);
  router.delete('/banners/:id', controller.deleteBanner);
  router.patch('/banners/:id/toggle', controller.toggleBannerStatus);

  // Posts / News
  router.get('/posts', controller.getPosts);
  router.post('/posts', controller.createPost);
  router.put('/posts/:id', controller.updatePost);
  router.delete('/posts/:id', controller.deletePost);
  router.patch('/posts/:id/toggle', controller.togglePostStatus);

  // Brands
  router.get('/brands', controller.getBrands);
  router.post('/brands', controller.createBrand);
  router.put('/brands/:id', controller.updateBrand);
  router.delete('/brands/:id', controller.deleteBrand);

  // Users (Read allowed for ADMIN/STAFF; role & account status mutations strictly ADMIN-only)
  router.get('/users', controller.getUsers);
  router.patch('/users/:id/toggle', requireAuth(['ADMIN']), controller.toggleUserStatus);
  router.patch('/users/:id/role', requireAuth(['ADMIN']), controller.changeUserRole);

  // Reviews
  router.get('/reviews', controller.getReviews);
  router.patch('/reviews/:id/status', controller.updateReviewStatus);
  router.delete('/reviews/:id', controller.deleteReview);

  return router;
}

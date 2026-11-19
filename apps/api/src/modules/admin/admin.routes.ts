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
  router.patch('/orders/:id/status', controller.updateOrderStatus);

  // Inventory
  router.get('/inventory/logs', controller.getInventoryLogs);
  router.post('/inventory/adjust', controller.adjustStock);

  return router;
}

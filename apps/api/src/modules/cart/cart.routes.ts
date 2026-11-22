import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { optionalAuth, requireAuth } from '../auth/auth.middleware.js';

export function createCartRouter(): Router {
  const router = Router();
  const controller = new CartController();

  router.use(optionalAuth());

  router.get('/', controller.getCart);
  router.post('/items', controller.addItem);
  router.patch('/items/:id', controller.updateItem);
  router.delete('/items/:id', controller.removeItem);
  router.post('/merge', requireAuth(), controller.mergeCart);

  return router;
}

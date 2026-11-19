import { Router } from 'express';
import type { SystemRepository } from '../modules/system/system.repository.js';
import { createSystemRouter } from '../modules/system/system.routes.js';
import { createCatalogRouter } from '../modules/catalog/catalog.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCartRouter } from '../modules/cart/cart.routes.js';

export function createV1Router(systemRepository?: SystemRepository): Router {
  const router = Router();

  // Foundation & System routes
  router.use('/', createSystemRouter(systemRepository));

  // Storefront & E-commerce routes
  router.use('/catalog', createCatalogRouter());
  router.use('/auth', createAuthRouter());
  router.use('/cart', createCartRouter());

  return router;
}

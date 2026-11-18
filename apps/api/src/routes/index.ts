import { Router } from 'express';
import type { SystemRepository } from '../modules/system/system.repository.js';
import { createSystemRouter } from '../modules/system/system.routes.js';

export function createV1Router(systemRepository?: SystemRepository): Router {
  const router = Router();
  router.use('/', createSystemRouter(systemRepository));
  return router;
}

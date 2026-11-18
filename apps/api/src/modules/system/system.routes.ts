import { EchoCheckInputSchema } from '@nexora/shared';
import { Router } from 'express';
import { validateBody } from '../../middleware/validateRequest.js';
import { SystemController } from './system.controller.js';
import { PrismaSystemRepository, type SystemRepository } from './system.repository.js';
import { SystemService } from './system.service.js';

export function createSystemRouter(
  repository: SystemRepository = new PrismaSystemRepository(),
): Router {
  const router = Router();
  const service = new SystemService(repository);
  const controller = new SystemController(service);

  router.get('/health', controller.getHealth);
  router.get('/system/meta', controller.getMeta);
  router.post('/system/echo-check', validateBody(EchoCheckInputSchema), controller.postEchoCheck);

  return router;
}

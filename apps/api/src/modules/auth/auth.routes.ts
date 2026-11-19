import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

export function createAuthRouter(): Router {
  const router = Router();
  const controller = new AuthController();

  router.post('/login', controller.login);
  router.post('/register', controller.register);
  router.get('/me', requireAuth(), controller.me);

  return router;
}

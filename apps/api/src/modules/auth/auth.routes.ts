import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import { createRateLimiters, type AppRateLimiters } from '../../middleware/rateLimit.js';

export function createAuthRouter(rateLimiters: AppRateLimiters = createRateLimiters()): Router {
  const router = Router();
  const controller = new AuthController();

  router.post('/login', rateLimiters.authLoginRegister, controller.login);
  router.post('/register', rateLimiters.authLoginRegister, controller.register);
  router.post('/forgot-password', rateLimiters.passwordResetRequest, controller.forgotPassword);
  router.post('/reset-password', rateLimiters.passwordResetConfirm, controller.resetPassword);
  router.get('/me', requireAuth(), controller.me);

  return router;
}

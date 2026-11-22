import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { createRateLimiters, type AppRateLimiters } from '../../middleware/rateLimit.js';

export function createProfileRouter(rateLimiters: AppRateLimiters = createRateLimiters()): Router {
  const router = Router();

  // All profile endpoints require authentication
  router.use(requireAuth());

  // Profile Information
  router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
  router.put('/', (req, res, next) => profileController.updateProfile(req, res, next));

  // Password Management (Protected with password reset/auth rate limiters)
  router.put('/password', rateLimiters.passwordResetConfirm, (req, res, next) =>
    profileController.changePassword(req, res, next),
  );
  router.post('/change-password', rateLimiters.passwordResetConfirm, (req, res, next) =>
    profileController.changePassword(req, res, next),
  );

  // Address Book Management (customer_addresses)
  router.get('/addresses', (req, res, next) => profileController.getAddresses(req, res, next));
  router.post('/addresses', (req, res, next) => profileController.createAddress(req, res, next));
  router.put('/addresses/:id', (req, res, next) => profileController.updateAddress(req, res, next));
  router.delete('/addresses/:id', (req, res, next) =>
    profileController.deleteAddress(req, res, next),
  );
  router.patch('/addresses/:id/default', (req, res, next) =>
    profileController.setDefaultAddress(req, res, next),
  );
  router.post('/set-default-address/:id', (req, res, next) =>
    profileController.setDefaultAddress(req, res, next),
  );

  // Notifications
  router.get('/notifications', (req, res, next) =>
    profileController.getNotifications(req, res, next),
  );
  router.patch('/notifications/:id/read', (req, res, next) =>
    profileController.markNotificationAsRead(req, res, next),
  );
  router.patch('/notifications/read-all', (req, res, next) =>
    profileController.markAllNotificationsAsRead(req, res, next),
  );

  return router;
}

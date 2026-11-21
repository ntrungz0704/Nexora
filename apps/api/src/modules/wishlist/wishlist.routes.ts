import { Router } from 'express';
import { wishlistController } from './wishlist.controller.js';
import { requireAuth, optionalAuth } from '../auth/auth.middleware.js';

export function createWishlistRouter(): Router {
  const router = Router();

  router.get('/', requireAuth(), (req, res, next) =>
    wishlistController.getWishlist(req, res, next),
  );
  router.get('/count', optionalAuth(), (req, res, next) =>
    wishlistController.getCount(req, res, next),
  );
  router.post('/toggle', requireAuth(), (req, res, next) =>
    wishlistController.toggleWishlist(req, res, next),
  );
  router.delete('/:productId', requireAuth(), (req, res, next) =>
    wishlistController.removeFromWishlist(req, res, next),
  );

  return router;
}

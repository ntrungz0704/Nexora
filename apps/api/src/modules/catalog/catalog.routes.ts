import { Router } from 'express';
import { CatalogController } from './catalog.controller.js';

export function createCatalogRouter(): Router {
  const router = Router();
  const controller = new CatalogController();

  router.get('/categories', controller.getCategories);
  router.get('/banners', controller.getBanners);
  router.get('/brands', controller.getBrands);
  router.get('/products', controller.getProducts);
  router.get('/products/flash-sale', controller.getFlashSale);
  router.get('/products/featured', controller.getFeatured);
  router.get('/products/:slug', controller.getProductBySlug);

  return router;
}

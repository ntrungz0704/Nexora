import type { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { OrderService } from '../order/order.service.js';
import { returnController } from '../order/return.controller.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import type { OrderStatus } from '@prisma/client';
import { UpdateReviewStatusInputSchema } from '@nexora/shared';

export class AdminController {
  constructor(
    private readonly service: AdminService = new AdminService(),
    private readonly orderService: OrderService = new OrderService(),
  ) {}

  getDashboardSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.getDashboardSummary();
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  // Products
  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const categoryId = req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const data = await this.service.getProducts({ search, categoryId, limit, offset });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user?.sub;
      const product = await this.service.createProduct(req.body, actorId);
      sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const product = await this.service.updateProduct(id, req.body);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteProduct(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  generateProductDescription = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { name, categoryName, specs } = req.body;
      if (!name) {
        throw new AppError(400, 'INVALID_NAME', 'Tên sản phẩm không được để trống.');
      }
      const description = this.service.generateAiProductDescription(name, categoryName, specs);
      sendSuccess(res, { description });
    } catch (error) {
      next(error);
    }
  };

  // Categories
  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.createCategory(req.body);
      sendSuccess(res, category, 201);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const category = await this.service.updateCategory(id, req.body);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id) || id <= 0) {
        throw new AppError(400, 'INVALID_ID', 'ID danh mục không hợp lệ.');
      }
      const result = await this.service.deleteCategory(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  generateCategoryAi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.body;
      if (!name) {
        throw new AppError(400, 'INVALID_NAME', 'Tên danh mục không được để trống.');
      }
      const result = this.service.generateAiCategory(name);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Orders
  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const data = await this.orderService.adminGetOrders({ status, search, limit, offset });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = BigInt(req.params.id as string);
      const { status, trackingNumber, carrierName, paymentStatus } = req.body;
      if (!status && !paymentStatus) {
        throw new AppError(
          400,
          'INVALID_STATUS',
          'Cần cung cấp trạng thái đơn hoặc trạng thái thanh toán.',
        );
      }
      const order = await this.orderService.adminUpdateOrderStatus(
        id,
        status ? (status as OrderStatus) : undefined,
        trackingNumber,
        carrierName,
        paymentStatus,
        req.user?.sub,
      );
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  // Inventory
  getInventoryLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = req.query.productId
        ? parseInt(req.query.productId as string, 10)
        : undefined;
      const logs = await this.service.getInventoryLogs(productId);
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorId = req.user?.sub;
      if (!actorId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const { productId, quantity, reason } = req.body;
      if (!productId || quantity === undefined || !reason) {
        throw new AppError(400, 'INVALID_ADJUSTMENT', 'Dữ liệu điều chỉnh kho không hợp lệ.');
      }
      const result = await this.service.adjustStock(
        Number(productId),
        Number(quantity),
        reason,
        actorId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Order Detail
  getOrderDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = BigInt(req.params.id as string);
      const order = await this.service.getOrderDetail(id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  // Coupons
  getCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupons = await this.service.getCoupons();
      sendSuccess(res, coupons);
    } catch (error) {
      next(error);
    }
  };

  createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coupon = await this.service.createCoupon(req.body);
      sendSuccess(res, coupon, 201);
    } catch (error) {
      next(error);
    }
  };

  updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const coupon = await this.service.updateCoupon(id, req.body);
      sendSuccess(res, coupon);
    } catch (error) {
      next(error);
    }
  };

  deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteCoupon(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  toggleCouponStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.toggleCouponStatus(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Flash Sales
  getFlashSales = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sales = await this.service.getFlashSales();
      sendSuccess(res, sales);
    } catch (error) {
      next(error);
    }
  };

  createFlashSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sale = await this.service.createFlashSale(req.body);
      sendSuccess(res, sale, 201);
    } catch (error) {
      next(error);
    }
  };

  deleteFlashSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteFlashSale(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  toggleFlashSaleStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.toggleFlashSaleStatus(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateFlashSale = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.updateFlashSale(id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Banners
  getBanners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const banners = await this.service.getBanners();
      sendSuccess(res, banners);
    } catch (error) {
      next(error);
    }
  };

  createBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const banner = await this.service.createBanner(req.body);
      sendSuccess(res, banner, 201);
    } catch (error) {
      next(error);
    }
  };

  updateBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const banner = await this.service.updateBanner(id, req.body);
      sendSuccess(res, banner);
    } catch (error) {
      next(error);
    }
  };

  deleteBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteBanner(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  toggleBannerStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.toggleBannerStatus(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Posts / News
  getPosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const posts = await this.service.getPosts();
      sendSuccess(res, posts);
    } catch (error) {
      next(error);
    }
  };

  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authorId = req.user?.sub ? Number(req.user.sub) : null;
      const post = await this.service.createPost({ ...req.body, authorId });
      sendSuccess(res, post, 201);
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const post = await this.service.updatePost(id, req.body);
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deletePost(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  togglePostStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.togglePostStatus(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Brands
  getBrands = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brands = await this.service.getBrands();
      sendSuccess(res, brands);
    } catch (error) {
      next(error);
    }
  };

  createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brand = await this.service.createBrand(req.body);
      sendSuccess(res, brand, 201);
    } catch (error) {
      next(error);
    }
  };

  updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const brand = await this.service.updateBrand(id, req.body);
      sendSuccess(res, brand);
    } catch (error) {
      next(error);
    }
  };

  deleteBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteBrand(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Users
  getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.service.getUsers();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (!Number.isFinite(id) || id <= 0) {
        throw new AppError(400, 'INVALID_USER_ID', 'ID người dùng không hợp lệ.');
      }
      const result = await this.service.toggleUserStatus(id, req.user?.sub, req.user?.role);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (!Number.isFinite(id) || id <= 0) {
        throw new AppError(400, 'INVALID_USER_ID', 'ID người dùng không hợp lệ.');
      }
      const { role } = req.body;
      if (!role || !['CUSTOMER', 'STAFF', 'ADMIN'].includes(role)) {
        throw new AppError(400, 'INVALID_ROLE', 'Vai trò không hợp lệ.');
      }
      const result = await this.service.changeUserRole(id, role, req.user?.sub, req.user?.role);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Reviews
  getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as 'APPROVED' | 'HIDDEN' | undefined;
      const reviews = await this.service.getReviews(status);
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  };

  updateReviewStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const validated = UpdateReviewStatusInputSchema.parse(req.body);
      const result = await this.service.updateReviewStatus(id, validated.status);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const result = await this.service.deleteReview(id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Returns Management
  getReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    returnController.getAdminReturns(req, res, next);
  };

  getReturnDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    returnController.getAdminReturnDetail(req, res, next);
  };

  updateReturnStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    returnController.updateReturnStatus(req, res, next);
  };
}

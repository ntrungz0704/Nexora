import type { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { OrderService } from '../order/order.service.js';
import { sendSuccess } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import type { OrderStatus } from '@prisma/client';

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
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
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
      const { status, trackingNumber, carrierName } = req.body;
      if (!status) {
        throw new AppError(400, 'INVALID_STATUS', 'Trạng thái không được để trống.');
      }
      const order = await this.orderService.adminUpdateOrderStatus(
        id,
        status as OrderStatus,
        trackingNumber,
        carrierName,
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
}

import type { Request, Response, NextFunction } from 'express';
import { returnService } from './return.service.js';
import { AppError } from '../../common/errors.js';
import type { UserRole } from '@prisma/client';

export class ReturnController {
  /**
   * Khách hàng gửi yêu cầu đổi/trả (POST /api/v1/profile/returns)
   */
  async createReturnRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để gửi yêu cầu đổi/trả.');
      }
      const result = await returnService.createReturnRequest(req.user.sub, req.body);
      res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu đổi/trả thành công. Chúng tôi sẽ xử lý sớm nhất.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khách hàng xem danh sách yêu cầu đổi/trả của chính mình (GET /api/v1/profile/returns)
   */
  async getOwnReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để xem danh sách đổi/trả.');
      }
      const result = await returnService.getOwnReturns(req.user.sub, req.query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Khách hàng xem chi tiết yêu cầu đổi/trả của chính mình (GET /api/v1/profile/returns/:id)
   */
  async getOwnReturnDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập.');
      }
      const returnId = Number(req.params.id);
      if (isNaN(returnId) || returnId <= 0) {
        throw new AppError(400, 'INVALID_ID', 'ID yêu cầu đổi/trả không hợp lệ.');
      }
      const result = await returnService.getOwnReturnDetail(req.user.sub, returnId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản trị viên lấy danh sách yêu cầu đổi/trả (GET /api/v1/admin/returns)
   */
  async getAdminReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as {
        status?: import('@prisma/client').ReturnRequestStatus;
        search?: string;
        page?: number;
        limit?: number;
      };
      const result = await returnService.getAdminReturns(query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản trị viên xem chi tiết yêu cầu đổi/trả (GET /api/v1/admin/returns/:id)
   */
  async getAdminReturnDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const returnId = Number(req.params.id);
      if (isNaN(returnId) || returnId <= 0) {
        throw new AppError(400, 'INVALID_ID', 'ID yêu cầu đổi/trả không hợp lệ.');
      }
      const result = await returnService.getAdminReturnDetail(returnId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quản trị viên cập nhật trạng thái yêu cầu đổi/trả (PATCH /api/v1/admin/returns/:id/status)
   */
  async updateReturnStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập quản trị.');
      }
      const returnId = Number(req.params.id);
      if (isNaN(returnId) || returnId <= 0) {
        throw new AppError(400, 'INVALID_ID', 'ID yêu cầu đổi/trả không hợp lệ.');
      }
      const actor = {
        id: req.user.sub,
        role: req.user.role as UserRole,
      };
      const result = await returnService.updateReturnStatus(returnId, actor, req.body);
      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái yêu cầu đổi/trả thành công.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const returnController = new ReturnController();

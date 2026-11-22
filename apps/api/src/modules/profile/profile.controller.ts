import type { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';
import { AppError } from '../../common/errors.js';

export class ProfileController {
  // --- Profile Endpoints ---
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.getProfile(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.updateProfile(userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.changePassword(userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // --- Address Book Endpoints ---
  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.getAddresses(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.createAddress(userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const addressId = Number(req.params.id);
      if (!addressId || isNaN(addressId)) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã địa chỉ không hợp lệ.');
      }
      const data = await profileService.updateAddress(userId, addressId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const addressId = Number(req.params.id);
      if (!addressId || isNaN(addressId)) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã địa chỉ không hợp lệ.');
      }
      const data = await profileService.deleteAddress(userId, addressId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const addressId = Number(req.params.id);
      if (!addressId || isNaN(addressId)) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã địa chỉ không hợp lệ.');
      }
      const data = await profileService.setDefaultAddress(userId, addressId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // --- Notification Endpoints ---
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.getNotifications(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const rawId = req.params.id;
      const notifIdStr = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
      if (!notifIdStr) {
        throw new AppError(400, 'INVALID_INPUT', 'Mã thông báo không hợp lệ.');
      }
      let notifId: bigint;
      try {
        notifId = BigInt(notifIdStr);
      } catch {
        throw new AppError(400, 'INVALID_INPUT', 'Mã thông báo không hợp lệ.');
      }
      const data = await profileService.markNotificationAsRead(userId, notifId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập.');
      }
      const data = await profileService.markAllNotificationsAsRead(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const profileController = new ProfileController();

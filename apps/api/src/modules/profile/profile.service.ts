import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import {
  UpdateProfileInputSchema,
  ChangePasswordInputSchema,
  CreateAddressInputSchema,
  UpdateAddressInputSchema,
  type AuthUser,
  type CustomerAddressDto,
  type NotificationListDto,
  type NotificationDto,
} from '@nexora/shared';

export class ProfileService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  // --- Profile Operations ---
  async getProfile(userId: number): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(404, 'USER_NOT_FOUND', 'Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  async updateProfile(userId: number, rawInput: unknown): Promise<AuthUser> {
    const parseResult = UpdateProfileInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu cập nhật không hợp lệ.', details);
    }
    const input = parseResult.data;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!existingUser || existingUser.status !== 'ACTIVE') {
      throw new AppError(404, 'USER_NOT_FOUND', 'Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        phone: input.phone || null,
        avatarUrl: input.avatarUrl || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
      role: updated.role,
    };
  }

  async changePassword(userId: number, rawInput: unknown): Promise<{ message: string }> {
    const parseResult = ChangePasswordInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu đổi mật khẩu không hợp lệ.', details);
    }
    const input = parseResult.data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(404, 'USER_NOT_FOUND', 'Tài khoản không tồn tại hoặc đã bị khóa.');
    }

    if (!user.passwordHash) {
      throw new AppError(
        400,
        'PASSWORD_NOT_CONFIGURED',
        'Tài khoản chưa được thiết lập mật khẩu truyền thống.',
      );
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Mật khẩu hiện tại không chính xác.');
    }

    const newHash = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  // --- Address Book Operations (customer_addresses) ---
  async getAddresses(userId: number): Promise<CustomerAddressDto[]> {
    const addresses = await this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((a) => ({
      id: a.id,
      userId: a.userId,
      recipientName: a.recipientName,
      phone: a.phone,
      streetAddress: a.streetAddress,
      ward: a.ward,
      district: a.district,
      province: a.province,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  async createAddress(userId: number, rawInput: unknown): Promise<CustomerAddressDto> {
    const parseResult = CreateAddressInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Thông tin địa chỉ không hợp lệ.', details);
    }
    const input = parseResult.data;

    const existingCount = await this.prisma.customerAddress.count({
      where: { userId },
    });

    // If first address, auto-set as default
    const shouldBeDefault = existingCount === 0 || input.isDefault;

    const created = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCount > 0) {
        await tx.customerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          userId,
          recipientName: input.recipientName,
          phone: input.phone,
          streetAddress: input.streetAddress,
          ward: input.ward || null,
          district: input.district || null,
          province: input.province,
          isDefault: shouldBeDefault,
        },
      });
    });

    return {
      id: created.id,
      userId: created.userId,
      recipientName: created.recipientName,
      phone: created.phone,
      streetAddress: created.streetAddress,
      ward: created.ward,
      district: created.district,
      province: created.province,
      isDefault: created.isDefault,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateAddress(
    userId: number,
    addressId: number,
    rawInput: unknown,
  ): Promise<CustomerAddressDto> {
    const parseResult = UpdateAddressInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      throw new AppError(400, 'VALIDATION_ERROR', 'Thông tin địa chỉ không hợp lệ.', details);
    }
    const input = parseResult.data;

    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại.');
    }

    if (address.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền chỉnh sửa địa chỉ này.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.customerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: addressId },
        data: {
          recipientName: input.recipientName ?? address.recipientName,
          phone: input.phone ?? address.phone,
          streetAddress: input.streetAddress ?? address.streetAddress,
          ward: input.ward !== undefined ? input.ward || null : address.ward,
          district: input.district !== undefined ? input.district || null : address.district,
          province: input.province ?? address.province,
          isDefault: input.isDefault !== undefined ? input.isDefault : address.isDefault,
        },
      });
    });

    return {
      id: updated.id,
      userId: updated.userId,
      recipientName: updated.recipientName,
      phone: updated.phone,
      streetAddress: updated.streetAddress,
      ward: updated.ward,
      district: updated.district,
      province: updated.province,
      isDefault: updated.isDefault,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAddress(userId: number, addressId: number): Promise<{ message: string }> {
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại.');
    }

    if (address.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền xóa địa chỉ này.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.delete({
        where: { id: addressId },
      });

      // If the deleted address was default, promote the newest remaining address to default
      if (address.isDefault) {
        const remaining = await tx.customerAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.customerAddress.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { message: 'Xóa địa chỉ giao hàng thành công.' };
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<CustomerAddressDto> {
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Địa chỉ giao hàng không tồn tại.');
    }

    if (address.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thay đổi địa chỉ này.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return {
      id: updated.id,
      userId: updated.userId,
      recipientName: updated.recipientName,
      phone: updated.phone,
      streetAddress: updated.streetAddress,
      ward: updated.ward,
      district: updated.district,
      province: updated.province,
      isDefault: updated.isDefault,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // --- Notification Operations (notifications) ---
  async getNotifications(userId: number): Promise<NotificationListDto> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications: notifications.map((n) => ({
        id: n.id.toString(),
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        linkUrl: n.linkUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markNotificationAsRead(userId: number, notificationId: bigint): Promise<NotificationDto> {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Thông báo không tồn tại.');
    }

    if (notif.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thao tác trên thông báo này.');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      id: updated.id.toString(),
      userId: updated.userId,
      title: updated.title,
      message: updated.message,
      type: updated.type,
      linkUrl: updated.linkUrl,
      isRead: updated.isRead,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async markAllNotificationsAsRead(userId: number): Promise<{ message: string; count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return {
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      count: result.count,
    };
  }
}

export const profileService = new ProfileService();

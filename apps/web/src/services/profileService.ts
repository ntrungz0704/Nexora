import { apiClient } from '../lib/apiClient';
import type {
  ApiSuccessEnvelope,
  AuthUser,
  UpdateProfileInput,
  ChangePasswordInput,
  CustomerAddressDto,
  CreateAddressInput,
  UpdateAddressInput,
  NotificationListDto,
} from '@nexora/shared';

export const profileService = {
  /**
   * Tải thông tin tài khoản của người dùng đã xác thực
   */
  async getProfile(): Promise<AuthUser> {
    const res = await apiClient.get<ApiSuccessEnvelope<AuthUser>>('/profile');
    return res.data.data;
  },

  /**
   * Cập nhật thông tin tài khoản (fullName, phone, avatarUrl)
   */
  async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const res = await apiClient.put<ApiSuccessEnvelope<AuthUser>>('/profile', input);
    const updated = res.data.data;
    const existing = localStorage.getItem('nexora_user');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        localStorage.setItem('nexora_user', JSON.stringify({ ...parsed, ...updated }));
      } catch {
        localStorage.setItem('nexora_user', JSON.stringify(updated));
      }
    }
    return updated;
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const res = await apiClient.put<ApiSuccessEnvelope<{ message: string }>>(
      '/profile/password',
      input,
    );
    return res.data.data;
  },

  /**
   * Lấy danh sách sổ địa chỉ nhận hàng
   */
  async getAddresses(): Promise<CustomerAddressDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<CustomerAddressDto[]>>('/profile/addresses');
    return res.data.data;
  },

  /**
   * Thêm mới địa chỉ nhận hàng
   */
  async createAddress(input: CreateAddressInput): Promise<CustomerAddressDto> {
    const res = await apiClient.post<ApiSuccessEnvelope<CustomerAddressDto>>(
      '/profile/addresses',
      input,
    );
    return res.data.data;
  },

  /**
   * Cập nhật địa chỉ nhận hàng theo ID
   */
  async updateAddress(addressId: number, input: UpdateAddressInput): Promise<CustomerAddressDto> {
    const res = await apiClient.put<ApiSuccessEnvelope<CustomerAddressDto>>(
      `/profile/addresses/${addressId}`,
      input,
    );
    return res.data.data;
  },

  /**
   * Xóa địa chỉ nhận hàng theo ID
   */
  async deleteAddress(addressId: number): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiSuccessEnvelope<{ message: string }>>(
      `/profile/addresses/${addressId}`,
    );
    return res.data.data;
  },

  /**
   * Đặt địa chỉ nhận hàng làm mặc định
   */
  async setDefaultAddress(addressId: number): Promise<CustomerAddressDto> {
    const res = await apiClient.patch<ApiSuccessEnvelope<CustomerAddressDto>>(
      `/profile/addresses/${addressId}/default`,
    );
    return res.data.data;
  },

  /**
   * Lấy danh sách thông báo hệ thống và số lượng chưa đọc
   */
  async getNotifications(): Promise<NotificationListDto> {
    const res =
      await apiClient.get<ApiSuccessEnvelope<NotificationListDto>>('/profile/notifications');
    return res.data.data;
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  async markNotificationAsRead(notificationId: string): Promise<{ message: string }> {
    const res = await apiClient.patch<ApiSuccessEnvelope<{ message: string }>>(
      `/profile/notifications/${notificationId}/read`,
    );
    return res.data.data;
  },

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc
   */
  async markAllNotificationsAsRead(): Promise<{ message: string; count: number }> {
    const res = await apiClient.patch<ApiSuccessEnvelope<{ message: string; count: number }>>(
      '/profile/notifications/read-all',
    );
    return res.data.data;
  },
};

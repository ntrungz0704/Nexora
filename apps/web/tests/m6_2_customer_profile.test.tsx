// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import type { AuthUser, CustomerAddressDto, NotificationListDto } from '@nexora/shared';

const mockUser: AuthUser = {
  id: 10,
  email: 'customer@nexora.local',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  avatarUrl: 'https://example.com/avatar.jpg',
  role: 'CUSTOMER',
};

const mockAddresses: CustomerAddressDto[] = [
  {
    id: 1,
    userId: 10,
    recipientName: 'Nguyễn Văn A',
    phone: '0901234567',
    streetAddress: 'Số 123 Đường Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
    isDefault: true,
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
  },
  {
    id: 2,
    userId: 10,
    recipientName: 'Nguyễn Văn A - Công Ty',
    phone: '0909888777',
    streetAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ',
    ward: 'Phường 22',
    district: 'Quận Bình Thạnh',
    province: 'TP. Hồ Chí Minh',
    isDefault: false,
    createdAt: '2026-11-21T10:00:00.000Z',
    updatedAt: '2026-11-21T10:00:00.000Z',
  },
];

const mockNotificationList: NotificationListDto = {
  unreadCount: 1,
  notifications: [
    {
      id: 'notif_1001',
      userId: 10,
      title: 'Đơn hàng #NEX-8821 đã được giao',
      message: 'Kiện hàng của bạn đã được giao thành công.',
      type: 'ORDER_STATUS',
      linkUrl: null,
      isRead: false,
      createdAt: '2026-11-22T14:00:00.000Z',
    },
    {
      id: 'notif_1002',
      userId: 10,
      title: 'Ưu đãi thành viên',
      message: 'Giảm 200.000đ cho đơn hàng linh kiện.',
      type: 'PROMOTION',
      linkUrl: null,
      isRead: true,
      createdAt: '2026-11-21T10:00:00.000Z',
    },
  ],
};

const renderProfilePage = (initialRoute = '/profile') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('M6.2: Customer Account & Profile Test Suite (16 Test Cases)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('nexora_token', 'valid-test-jwt-token');
    localStorage.setItem('nexora_user', JSON.stringify(mockUser));
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();

    // Default GET mocks
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/profile') {
        return { data: { success: true, data: mockUser } };
      }
      if (url === '/profile/addresses') {
        return { data: { success: true, data: mockAddresses } };
      }
      if (url === '/profile/notifications') {
        return { data: { success: true, data: mockNotificationList } };
      }
      if (url === '/categories' || url === '/catalog/categories') {
        return { data: { success: true, data: [] } };
      }
      if (url === '/cart') {
        return { data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } } };
      }
      if (url === '/wishlist/count') {
        return { data: { success: true, data: 0 } };
      }
      return { data: { success: true, data: null } };
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. PROFILE TESTS (TC-PROF-01 to TC-PROF-04)
  // =========================================================================
  describe('Group 1: Customer Profile (TC-PROF-01 -> 04)', () => {
    it('TC-PROF-01: Loads profile data from API and displays user information', async () => {
      const getSpy = vi.spyOn(apiClient, 'get');
      renderProfilePage('/profile');

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('/profile');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('customer@nexora.local')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CUSTOMER')).toBeInTheDocument();
    });

    it('TC-PROF-02: Updates permitted profile fields (fullName, phone, avatarUrl)', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockUser,
            fullName: 'Nguyễn Văn B',
            phone: '0988776655',
            avatarUrl: 'https://example.com/avatar2.jpg',
          },
        },
      });

      renderProfilePage('/profile');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
      const phoneInput = screen.getByDisplayValue('0901234567');
      const avatarInput = screen.getByPlaceholderText('https://example.com/avatar.jpg');

      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } });
      fireEvent.change(phoneInput, { target: { value: '0988776655' } });
      fireEvent.change(avatarInput, { target: { value: 'https://example.com/avatar2.jpg' } });

      const submitBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith('/profile', {
          fullName: 'Nguyễn Văn B',
          phone: '0988776655',
          avatarUrl: 'https://example.com/avatar2.jpg',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Đã cập nhật thông tin cá nhân thành công!')).toBeInTheDocument();
      });
    });

    it('TC-PROF-03: Email and role cannot be modified (disabled and excluded from payload)', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { success: true, data: mockUser },
      });

      renderProfilePage('/profile');

      await waitFor(() => {
        expect(screen.getByDisplayValue('customer@nexora.local')).toBeInTheDocument();
      });

      const emailInput = screen.getByDisplayValue('customer@nexora.local');
      const roleInput = screen.getByDisplayValue('CUSTOMER');

      expect(emailInput).toBeDisabled();
      expect(roleInput).toBeDisabled();

      const submitBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalled();
      });

      const submittedPayload = putSpy.mock.calls[0][1] as Record<string, unknown>;
      expect(submittedPayload.email).toBeUndefined();
      expect(submittedPayload.role).toBeUndefined();
    });

    it('TC-PROF-04: Handles loading, client validation and API failure states', async () => {
      const putSpy = vi.spyOn(apiClient, 'put');
      renderProfilePage('/profile');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
      const phoneInput = screen.getByDisplayValue('0901234567');

      // 1. Validation error: fullName < 2
      fireEvent.change(nameInput, { target: { value: 'A' } });
      const submitBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Họ tên tối thiểu 2 ký tự.')).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();

      // 2. Validation error: phone not 10 digits
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Hợp Lệ' } });
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText('Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).'),
      ).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();

      // 3. API failure
      fireEvent.change(phoneInput, { target: { value: '0901234567' } });
      putSpy.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi máy chủ khi cập nhật hồ sơ.' },
          },
        },
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Lỗi máy chủ khi cập nhật hồ sơ.')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 2. ADDRESS BOOK TESTS (TC-ADDR-01 to TC-ADDR-06)
  // =========================================================================
  describe('Group 2: Address Book (TC-ADDR-01 -> 06)', () => {
    it('TC-ADDR-01: Loads and displays address list and default badge', async () => {
      const getSpy = vi.spyOn(apiClient, 'get');
      renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('/profile/addresses');
      });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - 0901234567')).toBeInTheDocument();
      });

      expect(screen.getByText('Nguyễn Văn A - Công Ty - 0909888777')).toBeInTheDocument();

      // Address line with province, district, ward, streetAddress
      expect(
        screen.getByText('Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'),
      ).toBeInTheDocument();

      // Only default card has badge
      expect(screen.getByTestId('default-badge')).toBeInTheDocument();
      expect(screen.getByText('MẶC ĐỊNH')).toBeInTheDocument();
    });

    it('TC-ADDR-02: Creates an address with valid DTO (province, district, ward, streetAddress)', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 3,
            userId: 10,
            recipientName: 'Trần Văn C',
            phone: '0933221100',
            streetAddress: 'Số 45 Đường Xuân Thủy',
            ward: 'Phường Dịch Vọng',
            district: 'Quận Cầu Giấy',
            province: 'Hà Nội',
            isDefault: false,
            createdAt: '2026-11-22T15:00:00.000Z',
            updatedAt: '2026-11-22T15:00:00.000Z',
          },
        },
      });

      const { container } = renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - 0901234567')).toBeInTheDocument();
      });

      // Open Modal
      const addBtn = screen.getByRole('button', { name: /Thêm địa chỉ mới/i });
      fireEvent.click(addBtn);

      expect(screen.getByText('Thêm Địa Chỉ Nhận Hàng Mới')).toBeInTheDocument();

      const nameInput = container.querySelector('input[name="recipientName"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
      const provinceInput = container.querySelector('input[name="province"]') as HTMLInputElement;
      const districtInput = container.querySelector('input[name="district"]') as HTMLInputElement;
      const wardInput = container.querySelector('input[name="ward"]') as HTMLInputElement;
      const streetInput = container.querySelector(
        'input[name="streetAddress"]',
      ) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'Trần Văn C' } });
      fireEvent.change(phoneInput, { target: { value: '0933221100' } });
      fireEvent.change(provinceInput, { target: { value: 'Hà Nội' } });
      fireEvent.change(districtInput, { target: { value: 'Quận Cầu Giấy' } });
      fireEvent.change(wardInput, { target: { value: 'Phường Dịch Vọng' } });
      fireEvent.change(streetInput, { target: { value: 'Số 45 Đường Xuân Thủy' } });

      // Submit
      const saveBtn = screen.getByRole('button', { name: /Lưu địa chỉ/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith('/profile/addresses', {
          recipientName: 'Trần Văn C',
          phone: '0933221100',
          streetAddress: 'Số 45 Đường Xuân Thủy',
          ward: 'Phường Dịch Vọng',
          district: 'Quận Cầu Giấy',
          province: 'Hà Nội',
          isDefault: false,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Thêm địa chỉ giao hàng thành công!')).toBeInTheDocument();
      });
    });

    it('TC-ADDR-03: Rejects invalid address form values before API submission', async () => {
      const postSpy = vi.spyOn(apiClient, 'post');
      const { container } = renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - 0901234567')).toBeInTheDocument();
      });

      // Open Modal
      fireEvent.click(screen.getByRole('button', { name: /Thêm địa chỉ mới/i }));

      const nameInput = container.querySelector('input[name="recipientName"]') as HTMLInputElement;
      const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
      const provinceInput = container.querySelector('input[name="province"]') as HTMLInputElement;
      const streetInput = container.querySelector(
        'input[name="streetAddress"]',
      ) as HTMLInputElement;

      // Clear all fields and submit empty
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.change(phoneInput, { target: { value: '' } });
      fireEvent.change(provinceInput, { target: { value: '' } });
      fireEvent.change(streetInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: /Lưu địa chỉ/i }));

      expect(screen.getByText('Tên người nhận tối thiểu 2 ký tự.')).toBeInTheDocument();
      expect(
        screen.getByText('Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).'),
      ).toBeInTheDocument();
      expect(screen.getByText('Tỉnh/thành phố không được để trống.')).toBeInTheDocument();
      expect(screen.getByText('Địa chỉ đường/phố tối thiểu 5 ký tự.')).toBeInTheDocument();

      expect(postSpy).not.toHaveBeenCalled();
    });

    it('TC-ADDR-04: Updates an existing address (prefills data and sends PUT)', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockAddresses[1],
            recipientName: 'Nguyễn Văn A - Chi Nhánh Mới',
          },
        },
      });

      const { container } = renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - Công Ty - 0909888777')).toBeInTheDocument();
      });

      // Click "Chỉnh sửa" on card 2
      const editButtons = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
      fireEvent.click(editButtons[1]);

      expect(screen.getByText('Chỉnh Sửa Địa Chỉ Nhận Hàng')).toBeInTheDocument();

      const nameInput = container.querySelector('input[name="recipientName"]') as HTMLInputElement;
      expect(nameInput.value).toBe('Nguyễn Văn A - Công Ty');

      // Modify recipientName
      fireEvent.change(nameInput, {
        target: { value: 'Nguyễn Văn A - Chi Nhánh Mới' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Cập nhật/i }));

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith(
          '/profile/addresses/2',
          expect.objectContaining({
            recipientName: 'Nguyễn Văn A - Chi Nhánh Mới',
            phone: '0909888777',
            province: 'TP. Hồ Chí Minh',
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Cập nhật địa chỉ thành công!')).toBeInTheDocument();
      });
    });

    it('TC-ADDR-05: Sets an address as default and synchronizes query data', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockAddresses[1],
            isDefault: true,
          },
        },
      });

      renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - Công Ty - 0909888777')).toBeInTheDocument();
      });

      // Click "Đặt làm mặc định" for address 2
      const setDefaultBtn = screen.getByRole('button', { name: /Đặt làm mặc định/i });
      fireEvent.click(setDefaultBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/profile/addresses/2/default');
      });

      await waitFor(() => {
        expect(screen.getByText('Đã đặt làm địa chỉ mặc định!')).toBeInTheDocument();
      });
    });

    it('TC-ADDR-06: Confirms deletion and handles empty state correctly', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Xóa địa chỉ giao hàng thành công.' } },
      });

      renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A - 0901234567')).toBeInTheDocument();
      });

      // Click "Xóa" on card 1
      const deleteBtns = screen.getAllByRole('button', { name: /Xóa/i });
      fireEvent.click(deleteBtns[0]);

      // Confirm dialog appears
      expect(screen.getByText('Xác Nhận Xóa Địa Chỉ')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ nhận hàng? Hành động này không thể hoàn tác.',
        ),
      ).toBeInTheDocument();

      // Click confirm delete
      const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith('/profile/addresses/1');
      });

      await waitFor(() => {
        expect(screen.getByText('Đã xóa địa chỉ thành công!')).toBeInTheDocument();
      });

      // Verify Empty State when addresses query returns empty array
      cleanup();
      vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
        if (url === '/profile/addresses') {
          return { data: { success: true, data: [] } };
        }
        if (url === '/categories' || url === '/catalog/categories') {
          return { data: { success: true, data: [] } };
        }
        return { data: { success: true, data: null } };
      });

      renderProfilePage('/profile/addresses');

      await waitFor(() => {
        expect(screen.getByText('Chưa có địa chỉ nào trong sổ địa chỉ')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Thêm địa chỉ ngay/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. NOTIFICATIONS TESTS (TC-NOTIF-01 to TC-NOTIF-04)
  // =========================================================================
  describe('Group 3: Notifications (TC-NOTIF-01 -> 04)', () => {
    it('TC-NOTIF-01: Loads notifications and unreadCount from API', async () => {
      const getSpy = vi.spyOn(apiClient, 'get');
      renderProfilePage('/profile/notifications');

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('/profile/notifications');
      });

      await waitFor(() => {
        expect(screen.getByText('1 chưa đọc')).toBeInTheDocument();
      });

      expect(screen.getByText('Đơn hàng #NEX-8821 đã được giao')).toBeInTheDocument();
      expect(screen.getByText('Ưu đãi thành viên')).toBeInTheDocument();
    });

    it('TC-NOTIF-02: Distinguishes read and unread notifications with correct visual styling', async () => {
      renderProfilePage('/profile/notifications');

      await waitFor(() => {
        expect(screen.getByText('Đơn hàng #NEX-8821 đã được giao')).toBeInTheDocument();
      });

      const unreadCard = screen.getByTestId('notif-card-notif_1001');
      const readCard = screen.getByTestId('notif-card-notif_1002');

      // Unread: background #EFF6FF, border #BFDBFE
      expect(unreadCard).toHaveStyle({ backgroundColor: 'rgb(239, 246, 255)' });

      // Read: background #FFFFFF
      expect(readCard).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    it('TC-NOTIF-03: Marks one notification as read and preserves BigInt string ID', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Đã đánh dấu thông báo là đã đọc.' } },
      });

      renderProfilePage('/profile/notifications');

      await waitFor(() => {
        expect(screen.getByTestId('notif-card-notif_1001')).toBeInTheDocument();
      });

      const unreadCard = screen.getByTestId('notif-card-notif_1001');
      fireEvent.click(unreadCard);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/profile/notifications/notif_1001/read');
      });
    });

    it('TC-NOTIF-04: Marks all notifications as read', async () => {
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: {
          success: true,
          data: { message: 'Đã đánh dấu tất cả thông báo là đã đọc.', count: 1 },
        },
      });

      renderProfilePage('/profile/notifications');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Đánh dấu tất cả đã đọc/i })).toBeInTheDocument();
      });

      const markAllBtn = screen.getByRole('button', { name: /Đánh dấu tất cả đã đọc/i });
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(patchSpy).toHaveBeenCalledWith('/profile/notifications/read-all');
      });

      await waitFor(() => {
        expect(screen.getByText('Đã đánh dấu tất cả thông báo là đã đọc!')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 4. PASSWORD CHANGE TESTS (TC-PASS-01 to TC-PASS-04)
  // =========================================================================
  describe('Group 4: Password Change (TC-PASS-01 -> 04)', () => {
    it('TC-PASS-01: Validates password length and composition (< 8 chars, letters and digits)', async () => {
      const putSpy = vi.spyOn(apiClient, 'put');
      const { container } = renderProfilePage('/profile/password');

      const currentInput = container.querySelector(
        'input[name="currentPassword"]',
      ) as HTMLInputElement;
      const newInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement;
      const confirmInput = container.querySelector(
        'input[name="confirmPassword"]',
      ) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Cập Nhật Mật Khẩu/i });

      // 1. Length < 8
      fireEvent.change(currentInput, { target: { value: 'Current123!' } });
      fireEvent.change(newInput, { target: { value: 'short1' } });
      fireEvent.change(confirmInput, { target: { value: 'short1' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Mật khẩu mới phải có ít nhất 8 ký tự.')).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();

      // 2. Only letters (no digits)
      fireEvent.change(newInput, { target: { value: 'onlyletters' } });
      fireEvent.change(confirmInput, { target: { value: 'onlyletters' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Mật khẩu mới phải bao gồm cả chữ và số.')).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();

      // 3. Only digits (no letters)
      fireEvent.change(newInput, { target: { value: '123456789' } });
      fireEvent.change(confirmInput, { target: { value: '123456789' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Mật khẩu mới phải bao gồm cả chữ và số.')).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();
    });

    it('TC-PASS-02: Rejects mismatched confirmation before API submission', async () => {
      const putSpy = vi.spyOn(apiClient, 'put');
      const { container } = renderProfilePage('/profile/password');

      const currentInput = container.querySelector(
        'input[name="currentPassword"]',
      ) as HTMLInputElement;
      const newInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement;
      const confirmInput = container.querySelector(
        'input[name="confirmPassword"]',
      ) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Cập Nhật Mật Khẩu/i });

      fireEvent.change(currentInput, { target: { value: 'Current123!' } });
      fireEvent.change(newInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'DifferentPassword456' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
      expect(putSpy).not.toHaveBeenCalled();
    });

    it('TC-PASS-03: Displays INVALID_CURRENT_PASSWORD clearly when current password is wrong', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: 'Mật khẩu hiện tại không chính xác.',
            },
          },
        },
      });

      const { container } = renderProfilePage('/profile/password');

      const currentInput = container.querySelector(
        'input[name="currentPassword"]',
      ) as HTMLInputElement;
      const newInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement;
      const confirmInput = container.querySelector(
        'input[name="confirmPassword"]',
      ) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Cập Nhật Mật Khẩu/i });

      fireEvent.change(currentInput, { target: { value: 'WrongOldPassword123' } });
      fireEvent.change(newInput, { target: { value: 'NewPassword123' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith('/profile/password', {
          currentPassword: 'WrongOldPassword123',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.'),
        ).toBeInTheDocument();
      });
    });

    it('TC-PASS-04: Clears sensitive password inputs after success and never stores in localStorage', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { success: true, data: { message: 'Đổi mật khẩu thành công.' } },
      });

      const { container } = renderProfilePage('/profile/password');

      const currentInput = container.querySelector(
        'input[name="currentPassword"]',
      ) as HTMLInputElement;
      const newInput = container.querySelector('input[name="newPassword"]') as HTMLInputElement;
      const confirmInput = container.querySelector(
        'input[name="confirmPassword"]',
      ) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Cập Nhật Mật Khẩu/i });

      fireEvent.change(currentInput, { target: { value: 'CorrectOldPass123' } });
      fireEvent.change(newInput, { target: { value: 'BrandNewPass123' } });
      fireEvent.change(confirmInput, { target: { value: 'BrandNewPass123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(putSpy).toHaveBeenCalledWith('/profile/password', {
          currentPassword: 'CorrectOldPass123',
          newPassword: 'BrandNewPass123',
          confirmPassword: 'BrandNewPass123',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Đổi mật khẩu thành công!')).toBeInTheDocument();
      });

      // Inputs cleared
      expect(currentInput.value).toBe('');
      expect(newInput.value).toBe('');
      expect(confirmInput.value).toBe('');

      // Security check: passwords never in localStorage or sessionStorage
      expect(localStorage.getItem('currentPassword')).toBeNull();
      expect(localStorage.getItem('newPassword')).toBeNull();
      expect(sessionStorage.getItem('currentPassword')).toBeNull();
      expect(sessionStorage.getItem('newPassword')).toBeNull();
    });
  });
});

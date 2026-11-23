import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { profileService } from '../../services/profileService';
import { checkOrderReturnEligibility, returnService } from '../../services/returnService';
import { CustomerReturnsTab } from './components/CustomerReturnsTab';
import {
  type AuthUser,
  type OrderDto,
  type CustomerAddressDto,
  type CreateAddressInput,
  type UpdateAddressInput,
  type NotificationListDto,
  ChangePasswordInputSchema,
} from '@nexora/shared';

export type ProfileTab =
  'profile' | 'orders' | 'addresses' | 'notifications' | 'returns' | 'password';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeParamId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

  const getTabFromPath = (): ProfileTab => {
    if (location.pathname.includes('/notifications')) return 'notifications';
    if (location.pathname.includes('/return')) return 'returns';
    if (location.pathname.includes('/orders')) return 'orders';
    if (location.pathname.includes('/addresses')) return 'addresses';
    if (location.pathname.includes('/password')) return 'password';
    return 'profile';
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [activeTab, setActiveTab] = useState<ProfileTab>(getTabFromPath);
  const [preselectedReturnOrderId, setPreselectedReturnOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initialReturnId =
    location.pathname.includes('/return') && routeParamId && /^\d+$/.test(routeParamId)
      ? Number(routeParamId)
      : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTabChange = (tabId: ProfileTab) => {
    setActiveTab(tabId);
    if (tabId === 'profile') {
      navigate('/profile');
    } else if (tabId === 'returns') {
      navigate('/profile/return');
    } else {
      navigate(`/profile/${tabId}`);
    }
  };

  // =========================================================================
  // 1. PROFILE QUERY & FORM STATE
  // =========================================================================
  const { data: profileData, isLoading: isProfileLoading } = useQuery<AuthUser>({
    queryKey: ['profile', currentUser?.id],
    queryFn: () => profileService.getProfile(),
    enabled: !!currentUser,
  });

  const [editedFullName, setEditedFullName] = useState<string | null>(null);
  const [editedPhone, setEditedPhone] = useState<string | null>(null);
  const [editedAvatarUrl, setEditedAvatarUrl] = useState<string | null>(null);

  const fullName = editedFullName ?? profileData?.fullName ?? currentUser?.fullName ?? '';
  const phone = editedPhone ?? profileData?.phone ?? currentUser?.phone ?? '';
  const avatarUrl = editedAvatarUrl ?? profileData?.avatarUrl ?? currentUser?.avatarUrl ?? '';
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({});

  const updateProfileMutation = useMutation({
    mutationFn: (input: { fullName: string; phone?: string; avatarUrl?: string }) =>
      profileService.updateProfile(input),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setCurrentUser(updatedUser);
      setEditedFullName(null);
      setEditedPhone(null);
      setEditedAvatarUrl(null);
      showToast('Đã cập nhật thông tin cá nhân thành công!');
    },
    onError: (err: unknown) => {
      let msg = 'Cập nhật thông tin thất bại.';
      const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
      if (errObj?.response?.data?.error?.message) {
        msg = errObj.response.data.error.message;
      }
      showToast(msg);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { fullName?: string; phone?: string } = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Họ tên tối thiểu 2 ký tự.';
    }
    if (phone.trim() && !/^0\d{9}$/.test(phone.trim())) {
      errors.phone = 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).';
    }
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    updateProfileMutation.mutate({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  // =========================================================================
  // 2. ADDRESS BOOK QUERY & FORM / MODAL STATE
  // =========================================================================
  const { data: addresses = [], isLoading: isAddressesLoading } = useQuery<CustomerAddressDto[]>({
    queryKey: ['customer-addresses', currentUser?.id],
    queryFn: () => profileService.getAddresses(),
    enabled: !!currentUser,
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'create' | 'edit'>('create');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  const [addrRecipientName, setAddrRecipientName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrWard, setAddrWard] = useState('');
  const [addrStreetAddress, setAddrStreetAddress] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrFormErrors, setAddrFormErrors] = useState<Record<string, string>>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  const openCreateAddressModal = () => {
    setAddressModalMode('create');
    setEditingAddressId(null);
    setAddrRecipientName(currentUser?.fullName || '');
    setAddrPhone(currentUser?.phone || '');
    setAddrProvince('');
    setAddrDistrict('');
    setAddrWard('');
    setAddrStreetAddress('');
    setAddrIsDefault(addresses.length === 0);
    setAddrFormErrors({});
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: CustomerAddressDto) => {
    setAddressModalMode('edit');
    setEditingAddressId(addr.id);
    setAddrRecipientName(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district || '');
    setAddrWard(addr.ward || '');
    setAddrStreetAddress(addr.streetAddress);
    setAddrIsDefault(addr.isDefault);
    setAddrFormErrors({});
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddressId(null);
    setAddrFormErrors({});
  };

  const openDeleteConfirm = (id: number) => {
    setDeletingAddressId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeletingAddressId(null);
    setIsDeleteModalOpen(false);
  };

  const createAddressMutation = useMutation({
    mutationFn: (input: CreateAddressInput) => profileService.createAddress(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      closeAddressModal();
      showToast('Thêm địa chỉ giao hàng thành công!');
    },
    onError: (err: unknown) => {
      let msg = 'Thêm địa chỉ thất bại.';
      const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
      if (errObj?.response?.data?.error?.message) {
        msg = errObj.response.data.error.message;
      }
      showToast(msg);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAddressInput }) =>
      profileService.updateAddress(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      closeAddressModal();
      showToast('Cập nhật địa chỉ thành công!');
    },
    onError: (err: unknown) => {
      let msg = 'Cập nhật địa chỉ thất bại.';
      const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
      if (errObj?.response?.data?.error?.message) {
        msg = errObj.response.data.error.message;
      }
      showToast(msg);
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (id: number) => profileService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      showToast('Đã đặt làm địa chỉ mặc định!');
    },
    onError: (err: unknown) => {
      let msg = 'Đặt mặc định thất bại.';
      const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
      if (errObj?.response?.data?.error?.message) {
        msg = errObj.response.data.error.message;
      }
      showToast(msg);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => profileService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      closeDeleteConfirm();
      showToast('Đã xóa địa chỉ thành công!');
    },
    onError: (err: unknown) => {
      let msg = 'Xóa địa chỉ thất bại.';
      const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
      if (errObj?.response?.data?.error?.message) {
        msg = errObj.response.data.error.message;
      }
      showToast(msg);
    },
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addrRecipientName.trim() || addrRecipientName.trim().length < 2) {
      errors.recipientName = 'Tên người nhận tối thiểu 2 ký tự.';
    } else if (addrRecipientName.trim().length > 150) {
      errors.recipientName = 'Tên người nhận tối đa 150 ký tự.';
    }

    if (!addrPhone.trim() || !/^0\d{9}$/.test(addrPhone.trim())) {
      errors.phone = 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).';
    }

    if (!addrProvince.trim() || addrProvince.trim().length < 2) {
      errors.province = 'Tỉnh/thành phố không được để trống.';
    }

    if (!addrStreetAddress.trim() || addrStreetAddress.trim().length < 5) {
      errors.streetAddress = 'Địa chỉ đường/phố tối thiểu 5 ký tự.';
    } else if (addrStreetAddress.trim().length > 255) {
      errors.streetAddress = 'Địa chỉ tối đa 255 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
      setAddrFormErrors(errors);
      return;
    }
    setAddrFormErrors({});

    const payload: CreateAddressInput = {
      recipientName: addrRecipientName.trim(),
      phone: addrPhone.trim(),
      streetAddress: addrStreetAddress.trim(),
      ward: addrWard.trim() || undefined,
      district: addrDistrict.trim() || undefined,
      province: addrProvince.trim(),
      isDefault: addrIsDefault,
    };

    if (addressModalMode === 'create') {
      createAddressMutation.mutate(payload);
    } else if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, input: payload });
    }
  };

  const formatAddressLine = (addr: CustomerAddressDto): string => {
    const parts = [
      addr.streetAddress,
      addr.ward?.trim() || null,
      addr.district?.trim() || null,
      addr.province?.trim() || null,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // =========================================================================
  // 3. NOTIFICATIONS QUERY & MUTATIONS
  // =========================================================================
  const { data: notificationData, isLoading: isNotifLoading } = useQuery<NotificationListDto>({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => profileService.getNotifications(),
    enabled: !!currentUser,
  });
  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => profileService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      showToast('Không thể cập nhật trạng thái thông báo.');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => profileService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showToast('Đã đánh dấu tất cả thông báo là đã đọc!');
    },
    onError: () => {
      showToast('Không thể đánh dấu tất cả đã đọc.');
    },
  });

  // =========================================================================
  // 4. PASSWORD CHANGE STATE & MUTATION
  // =========================================================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [apiPasswordError, setApiPasswordError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: (input: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => profileService.changePassword(input),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      setApiPasswordError(null);
      showToast('Đổi mật khẩu thành công!');
    },
    onError: (err: unknown) => {
      let errCode: string | undefined;
      let errMsg: string | undefined;
      let status: number | undefined;
      const errObj = err as
        | {
            response?: {
              status?: number;
              data?: { error?: { code?: string; message?: string } };
            };
          }
        | undefined;
      if (errObj?.response) {
        status = errObj.response.status;
        errCode = errObj.response.data?.error?.code;
        errMsg = errObj.response.data?.error?.message;
      }
      if (
        errCode === 'INVALID_CURRENT_PASSWORD' ||
        (status === 400 && errMsg?.toLowerCase().includes('hiện tại'))
      ) {
        setApiPasswordError('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
      } else {
        setApiPasswordError(errMsg || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
      }
    },
  });

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiPasswordError(null);

    const parseResult = ChangePasswordInputSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  // =========================================================================
  // 5. OTHER STOREFRONT QUERIES
  // =========================================================================
  const { data: userOrders = [], isLoading: isOrdersLoading } = useQuery<OrderDto[]>({
    queryKey: ['my-orders', currentUser?.id],
    queryFn: () => returnService.getMyOrders(),
    enabled: !!currentUser,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setPreselectedReturnOrderId(null);
    queryClient.removeQueries({ queryKey: ['customer-returns'] });
    queryClient.removeQueries({ queryKey: ['customer-return-detail'] });
    queryClient.removeQueries({ queryKey: ['my-orders'] });
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
      {toastMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(10, 91, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          <i
            className="fa-solid fa-circle-check"
            style={{ color: '#00C8FF', fontSize: '16px' }}
          ></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories || []}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main
        className="container"
        style={{ margin: '30px auto 60px auto', maxWidth: '1100px', padding: '0 16px' }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#64748B',
            marginBottom: '24px',
          }}
        >
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Tài khoản của tôi</span>
        </div>

        {/* 2-Column Profile Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '30px',
            alignItems: 'start',
          }}
        >
          {/* Left Sidebar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {/* User Info Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                borderBottom: '1px solid #F1F5F9',
                paddingBottom: '20px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#0A5BFF',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  overflow: 'hidden',
                }}
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : currentUser?.fullName ? (
                  currentUser.fullName.charAt(0).toUpperCase()
                ) : (
                  'U'
                )}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  {currentUser?.fullName || 'Khách Hàng'}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginTop: '2px',
                  }}
                >
                  {currentUser?.role || 'CUSTOMER'}
                </span>
              </div>
            </div>

            {/* Menu List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'profile', label: 'Thông tin cá nhân', icon: 'fa-regular fa-address-card' },
                { id: 'orders', label: 'Đơn hàng của tôi', icon: 'fa-solid fa-box-open' },
                {
                  id: 'notifications',
                  label: `Thông báo hệ thống${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
                  icon: 'fa-regular fa-bell',
                },
                { id: 'returns', label: 'Yêu cầu đổi trả', icon: 'fa-solid fa-rotate-left' },
                {
                  id: 'addresses',
                  label: 'Sổ địa chỉ nhận hàng',
                  icon: 'fa-solid fa-location-dot',
                },
                { id: 'password', label: 'Đổi mật khẩu', icon: 'fa-solid fa-shield-halved' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id as typeof activeTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeTab === item.id ? '#EFF6FF' : 'transparent',
                    color: activeTab === item.id ? '#0A5BFF' : '#475569',
                    fontWeight: activeTab === item.id ? 700 : 500,
                    fontSize: '13.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className={item.icon} style={{ width: '18px', textAlign: 'center' }}></i>
                  <span>{item.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#EF4444',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '16px',
                }}
              >
                <i
                  className="fa-solid fa-right-from-bracket"
                  style={{ width: '18px', textAlign: 'center' }}
                ></i>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '32px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {/* ============================================================= */}
            {/* TAB: PROFILE                                                  */}
            {/* ============================================================= */}
            {activeTab === 'profile' && (
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 20px 0',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '12px',
                  }}
                >
                  Thông Tin Cá Nhân
                </h3>

                {isProfileLoading ? (
                  <div style={{ padding: '24px 0', color: '#64748B', fontSize: '14px' }}>
                    <i
                      className="fa-solid fa-circle-notch fa-spin"
                      style={{ marginRight: '8px' }}
                    ></i>
                    Đang tải thông tin tài khoản...
                  </div>
                ) : (
                  <form
                    onSubmit={handleUpdateProfile}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                      maxWidth: '500px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setEditedFullName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: profileErrors.fullName
                            ? '1px solid #EF4444'
                            : '1px solid #CBD5E1',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                        required
                      />
                      {profileErrors.fullName && (
                        <p style={{ margin: '4px 0 0', color: '#EF4444', fontSize: '12px' }}>
                          {profileErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Địa chỉ Email (Không thể thay đổi)
                      </label>
                      <input
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          fontSize: '14px',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Số điện thoại liên hệ
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="0901234567"
                        value={phone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: profileErrors.phone ? '1px solid #EF4444' : '1px solid #CBD5E1',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      {profileErrors.phone && (
                        <p style={{ margin: '4px 0 0', color: '#EF4444', fontSize: '12px' }}>
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Ảnh đại diện (URL)
                      </label>
                      <input
                        type="url"
                        name="avatarUrl"
                        placeholder="https://example.com/avatar.jpg"
                        value={avatarUrl}
                        onChange={(e) => setEditedAvatarUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '6px',
                        }}
                      >
                        Vai trò tài khoản
                      </label>
                      <input
                        type="text"
                        value={currentUser?.role || 'CUSTOMER'}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F1F5F9',
                          color: '#64748B',
                          fontSize: '14px',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      style={{
                        marginTop: '10px',
                        alignSelf: 'flex-start',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: updateProfileMutation.isPending ? '#94A3B8' : '#0A5BFF',
                        color: '#FFFFFF',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: updateProfileMutation.isPending ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(10, 91, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {updateProfileMutation.isPending && (
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                      )}
                      <span>
                        {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB: ORDERS (PRESERVED)                                       */}
            {/* ============================================================= */}
            {activeTab === 'orders' && (
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 20px 0',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '12px',
                  }}
                >
                  Lịch Sử Đơn Hàng Của Bạn
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {userOrders.length > 0 ? (
                    userOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '18px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '6px',
                            }}
                          >
                            <strong style={{ color: '#0A5BFF', fontSize: '14.5px' }}>
                              {order.orderCode}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                              • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 600 }}>
                            {order.items && order.items.length > 0
                              ? (order.items[0]?.productName ?? 'Đơn hàng phần cứng')
                              : 'Đơn hàng phần cứng'}
                            {order.items &&
                              order.items.length > 1 &&
                              ` (+${order.items.length - 1} sản phẩm khác)`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#F1F5F9',
                              color: order.orderStatus === 'DELIVERED' ? '#10B981' : '#0A5BFF',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              marginBottom: '4px',
                            }}
                          >
                            {order.orderStatus}
                          </span>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#EF4444' }}>
                            {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                          </div>
                          {checkOrderReturnEligibility(order).eligible && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedReturnOrderId(String(order.id));
                                handleTabChange('returns');
                              }}
                              style={{
                                marginTop: '8px',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                border: '1px solid #0A5BFF',
                                backgroundColor: '#FFFFFF',
                                color: '#0A5BFF',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Yêu cầu đổi trả
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                      <p>Bạn chưa có đơn hàng nào hoặc chưa đăng nhập.</p>
                      <Link
                        to="/auth/login"
                        style={{
                          display: 'inline-block',
                          marginTop: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#0A5BFF',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Đăng nhập tài khoản
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB: ADDRESSES (FULL CRUD)                                    */}
            {/* ============================================================= */}
            {activeTab === 'addresses' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                    }}
                  >
                    Sổ Địa Chỉ Nhận Hàng
                  </h3>
                  <button
                    type="button"
                    onClick={openCreateAddressModal}
                    style={{
                      backgroundColor: '#0A5BFF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(10, 91, 255, 0.2)',
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Thêm địa chỉ mới</span>
                  </button>
                </div>

                {isAddressesLoading ? (
                  <div style={{ padding: '24px 0', color: '#64748B', fontSize: '14px' }}>
                    <i
                      className="fa-solid fa-circle-notch fa-spin"
                      style={{ marginRight: '8px' }}
                    ></i>
                    Đang tải danh sách địa chỉ...
                  </div>
                ) : addresses.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px dashed #CBD5E1',
                    }}
                  >
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#0A5BFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        margin: '0 auto 14px auto',
                      }}
                    >
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <h4
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      Chưa có địa chỉ nào trong sổ địa chỉ
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
                      Hãy thêm địa chỉ giao hàng để thuận tiện khi đặt mua sản phẩm công nghệ.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateAddressModal}
                      style={{
                        backgroundColor: '#0A5BFF',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Thêm địa chỉ ngay
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        data-testid={`address-card-${addr.id}`}
                        style={{
                          border: addr.isDefault ? '1.5px solid #0A5BFF' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '18px 20px',
                          backgroundColor: addr.isDefault ? '#F8FAFC' : '#FFFFFF',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}
                        >
                          <strong style={{ fontSize: '14.5px', color: '#0F172A' }}>
                            {addr.recipientName} - {addr.phone}
                          </strong>
                          {addr.isDefault && (
                            <span
                              data-testid="default-badge"
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#0A5BFF',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              MẶC ĐỊNH
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: '0 0 14px 0',
                            fontSize: '13.5px',
                            color: '#475569',
                            lineHeight: '1.5',
                          }}
                        >
                          {formatAddressLine(addr)}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid #F1F5F9',
                            paddingTop: '12px',
                          }}
                        >
                          <div>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefaultAddressMutation.mutate(addr.id)}
                                disabled={setDefaultAddressMutation.isPending}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#0A5BFF',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                }}
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              type="button"
                              onClick={() => openEditAddressModal(addr)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#475569',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-regular fa-pen-to-square"></i>
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(addr.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-regular fa-trash-can"></i>
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MODAL: Thêm / Sửa Địa Chỉ */}
                {isAddressModalOpen && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.55)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '520px',
                        padding: '24px 28px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                          borderBottom: '1px solid #F1F5F9',
                          paddingBottom: '12px',
                        }}
                      >
                        <h4
                          style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}
                        >
                          {addressModalMode === 'create'
                            ? 'Thêm Địa Chỉ Nhận Hàng Mới'
                            : 'Chỉnh Sửa Địa Chỉ Nhận Hàng'}
                        </h4>
                        <button
                          type="button"
                          onClick={closeAddressModal}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      <form
                        noValidate
                        onSubmit={handleAddressSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#475569',
                              marginBottom: '4px',
                            }}
                          >
                            Tên người nhận <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            name="recipientName"
                            placeholder="Nguyễn Văn A"
                            value={addrRecipientName}
                            onChange={(e) => setAddrRecipientName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: addrFormErrors.recipientName
                                ? '1px solid #EF4444'
                                : '1px solid #CBD5E1',
                              fontSize: '13.5px',
                              outline: 'none',
                            }}
                            required
                          />
                          {addrFormErrors.recipientName && (
                            <p style={{ margin: '3px 0 0', color: '#EF4444', fontSize: '11.5px' }}>
                              {addrFormErrors.recipientName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#475569',
                              marginBottom: '4px',
                            }}
                          >
                            Số điện thoại <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="0901234567"
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: addrFormErrors.phone
                                ? '1px solid #EF4444'
                                : '1px solid #CBD5E1',
                              fontSize: '13.5px',
                              outline: 'none',
                            }}
                            required
                          />
                          {addrFormErrors.phone && (
                            <p style={{ margin: '3px 0 0', color: '#EF4444', fontSize: '11.5px' }}>
                              {addrFormErrors.phone}
                            </p>
                          )}
                        </div>

                        <div
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
                        >
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#475569',
                                marginBottom: '4px',
                              }}
                            >
                              Tỉnh / Thành phố <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                              type="text"
                              name="province"
                              placeholder="TP. Hồ Chí Minh"
                              value={addrProvince}
                              onChange={(e) => setAddrProvince(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: addrFormErrors.province
                                  ? '1px solid #EF4444'
                                  : '1px solid #CBD5E1',
                                fontSize: '13.5px',
                                outline: 'none',
                              }}
                              required
                            />
                            {addrFormErrors.province && (
                              <p
                                style={{ margin: '3px 0 0', color: '#EF4444', fontSize: '11.5px' }}
                              >
                                {addrFormErrors.province}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#475569',
                                marginBottom: '4px',
                              }}
                            >
                              Quận / Huyện
                            </label>
                            <input
                              type="text"
                              name="district"
                              placeholder="Quận 1"
                              value={addrDistrict}
                              onChange={(e) => setAddrDistrict(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13.5px',
                                outline: 'none',
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#475569',
                              marginBottom: '4px',
                            }}
                          >
                            Phường / Xã
                          </label>
                          <input
                            type="text"
                            name="ward"
                            placeholder="Phường Bến Nghé"
                            value={addrWard}
                            onChange={(e) => setAddrWard(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              fontSize: '13.5px',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#475569',
                              marginBottom: '4px',
                            }}
                          >
                            Địa chỉ đường/phố cụ thể <span style={{ color: '#EF4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            name="streetAddress"
                            placeholder="Số 123 Đường Nguyễn Huệ..."
                            value={addrStreetAddress}
                            onChange={(e) => setAddrStreetAddress(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              borderRadius: '8px',
                              border: addrFormErrors.streetAddress
                                ? '1px solid #EF4444'
                                : '1px solid #CBD5E1',
                              fontSize: '13.5px',
                              outline: 'none',
                            }}
                            required
                          />
                          {addrFormErrors.streetAddress && (
                            <p style={{ margin: '3px 0 0', color: '#EF4444', fontSize: '11.5px' }}>
                              {addrFormErrors.streetAddress}
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                          }}
                        >
                          <input
                            type="checkbox"
                            id="addr-default-checkbox"
                            checked={addrIsDefault}
                            onChange={(e) => setAddrIsDefault(e.target.checked)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#0A5BFF',
                              cursor: 'pointer',
                            }}
                          />
                          <label
                            htmlFor="addr-default-checkbox"
                            style={{ fontSize: '13px', color: '#334155', cursor: 'pointer' }}
                          >
                            Đặt làm địa chỉ nhận hàng mặc định
                          </label>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '16px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={closeAddressModal}
                            style={{
                              padding: '9px 18px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#475569',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={
                              createAddressMutation.isPending || updateAddressMutation.isPending
                            }
                            style={{
                              padding: '9px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#0A5BFF',
                              color: '#FFFFFF',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {(createAddressMutation.isPending ||
                              updateAddressMutation.isPending) && (
                              <i className="fa-solid fa-circle-notch fa-spin"></i>
                            )}
                            <span>
                              {addressModalMode === 'create' ? 'Lưu địa chỉ' : 'Cập nhật'}
                            </span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: Xác nhận Xóa Địa Chỉ */}
                {isDeleteModalOpen && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.55)',
                      zIndex: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#FEE2E2',
                          color: '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          margin: '0 auto 14px auto',
                        }}
                      >
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#0F172A',
                        }}
                      >
                        Xác Nhận Xóa Địa Chỉ
                      </h4>
                      <p
                        style={{
                          margin: '0 0 20px 0',
                          fontSize: '13px',
                          color: '#64748B',
                          lineHeight: '1.5',
                        }}
                      >
                        Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ nhận hàng? Hành động
                        này không thể hoàn tác.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={closeDeleteConfirm}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            deletingAddressId && deleteAddressMutation.mutate(deletingAddressId)
                          }
                          disabled={deleteAddressMutation.isPending}
                          style={{
                            padding: '9px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {deleteAddressMutation.isPending && (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                          )}
                          <span>Xác nhận xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB: NOTIFICATIONS                                            */}
            {/* ============================================================= */}
            {activeTab === 'notifications' && (
              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 20px 0',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Thông Báo Hệ Thống
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0A5BFF' }}>
                      {unreadCount} chưa đọc
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0A5BFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                </div>

                {isNotifLoading ? (
                  <div style={{ padding: '24px 0', color: '#64748B', fontSize: '14px' }}>
                    <i
                      className="fa-solid fa-circle-notch fa-spin"
                      style={{ marginRight: '8px' }}
                    ></i>
                    Đang tải danh sách thông báo...
                  </div>
                ) : notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '12px',
                      border: '1px dashed #CBD5E1',
                    }}
                  >
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#0A5BFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        margin: '0 auto 14px auto',
                      }}
                    >
                      <i className="fa-regular fa-bell-slash"></i>
                    </div>
                    <h4
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      Bạn chưa có thông báo nào
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      Các thông báo về trạng thái đơn hàng, ưu đãi và hoạt động tài khoản sẽ hiển
                      thị tại đây.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        data-testid={`notif-card-${n.id}`}
                        onClick={() => {
                          if (!n.isRead) {
                            markReadMutation.mutate(n.id);
                          }
                        }}
                        style={{
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: n.isRead ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                          backgroundColor: n.isRead ? '#FFFFFF' : '#EFF6FF',
                          display: 'flex',
                          gap: '14px',
                          alignItems: 'flex-start',
                          cursor: !n.isRead ? 'pointer' : 'default',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: n.isRead ? '#F1F5F9' : '#DBEAFE',
                            color: '#0A5BFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            flexShrink: 0,
                          }}
                        >
                          <i className="fa-solid fa-bell"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#0F172A',
                                margin: 0,
                              }}
                            >
                              {n.title}
                            </h4>
                            <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                              {new Date(n.createdAt).toLocaleDateString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '13px',
                              color: '#475569',
                              margin: 0,
                              lineHeight: '1.5',
                            }}
                          >
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB: RETURNS (M6.4 CUSTOMER RETURNS INTEGRATION)              */}
            {/* ============================================================= */}
            {activeTab === 'returns' && (
              <CustomerReturnsTab
                currentUser={currentUser}
                orders={userOrders}
                isLoadingOrders={isOrdersLoading}
                initialReturnId={initialReturnId}
                preselectedOrderId={preselectedReturnOrderId}
                onClearPreselectedOrder={() => setPreselectedReturnOrderId(null)}
                onNavigateReturnDetail={(returnId) => {
                  navigate(returnId ? `/profile/return/${returnId}` : '/profile/return');
                }}
                onNotify={showToast}
              />
            )}

            {/* ============================================================= */}
            {/* TAB: PASSWORD CHANGE (CONTROLLED & VALIDATED)                  */}
            {/* ============================================================= */}
            {activeTab === 'password' && (
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 20px 0',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '12px',
                  }}
                >
                  Đổi Mật Khẩu
                </h3>

                {apiPasswordError && (
                  <div
                    role="alert"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{apiPasswordError}</span>
                  </div>
                )}

                <form
                  onSubmit={handleChangePasswordSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    maxWidth: '420px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '6px',
                      }}
                    >
                      Mật khẩu hiện tại <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: passwordErrors.currentPassword
                          ? '1px solid #EF4444'
                          : '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      required
                    />
                    {passwordErrors.currentPassword && (
                      <p style={{ margin: '4px 0 0', color: '#EF4444', fontSize: '12px' }}>
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '6px',
                      }}
                    >
                      Mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: passwordErrors.newPassword
                          ? '1px solid #EF4444'
                          : '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      required
                    />
                    {passwordErrors.newPassword ? (
                      <p style={{ margin: '4px 0 0', color: '#EF4444', fontSize: '12px' }}>
                        {passwordErrors.newPassword}
                      </p>
                    ) : (
                      <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '11.5px' }}>
                        Tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '6px',
                      }}
                    >
                      Xác nhận mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: passwordErrors.confirmPassword
                          ? '1px solid #EF4444'
                          : '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      required
                    />
                    {passwordErrors.confirmPassword && (
                      <p style={{ margin: '4px 0 0', color: '#EF4444', fontSize: '12px' }}>
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    style={{
                      marginTop: '8px',
                      alignSelf: 'flex-start',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: changePasswordMutation.isPending ? '#94A3B8' : '#0A5BFF',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: changePasswordMutation.isPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(10, 91, 255, 0.25)',
                    }}
                  >
                    {changePasswordMutation.isPending && (
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                    )}
                    <span>
                      {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import type { AuthUser, OrderDto } from '@nexora/shared';

export type ProfileTab = 'profile' | 'orders' | 'addresses' | 'notifications' | 'returns' | 'password';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (): ProfileTab => {
    if (location.pathname.includes('/notifications')) return 'notifications';
    if (location.pathname.includes('/return')) return 'returns';
    if (location.pathname.includes('/orders')) return 'orders';
    if (location.pathname.includes('/addresses')) return 'addresses';
    if (location.pathname.includes('/password')) return 'password';
    return 'profile';
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ProfileTab>(getTabFromPath);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tabId: ProfileTab) => {
    setActiveTab(tabId);
    navigate(tabId === 'profile' ? '/profile' : `/profile/${tabId}`);
  };

  // Form states
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Nguyễn Văn An');
  const [phone, setPhone] = useState('0901234567');

  // Real Orders query
  const { data: userOrders = [] } = useQuery<OrderDto[]>({
    queryKey: ['my-orders', currentUser?.id],
    queryFn: async () => {
      const token = authService.getToken();
      if (!token) return [];
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
      return [];
    },
    enabled: !!currentUser,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Họ tên không được để trống.');
      return;
    }
    showToast('Đã cập nhật thông tin cá nhân thành công!');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
      {toastMessage && (
        <div
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
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF', fontSize: '16px' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1100px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Tài khoản của tôi</span>
        </div>

        {/* 2-Column Profile Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Left Sidebar */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            {/* User Info Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px', marginBottom: '16px' }}>
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
                }}
              >
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'U'}
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
                { id: 'notifications', label: 'Thông báo hệ thống', icon: 'fa-regular fa-bell' },
                { id: 'returns', label: 'Yêu cầu đổi trả', icon: 'fa-solid fa-rotate-left' },
                { id: 'addresses', label: 'Sổ địa chỉ nhận hàng', icon: 'fa-solid fa-location-dot' },
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
                <i className="fa-solid fa-right-from-bracket" style={{ width: '18px', textAlign: 'center' }}></i>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  Thông Tin Cá Nhân
                </h3>
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '500px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Địa chỉ Email (Không thay đổi)
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || 'customer@nexora.local'}
                      disabled
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '14px', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '10px',
                      alignSelf: 'flex-start',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0A5BFF',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(10, 91, 255, 0.25)',
                    }}
                  >
                    Lưu Thay Đổi
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <strong style={{ color: '#0A5BFF', fontSize: '14.5px' }}>{order.orderCode}</strong>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                              • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 600 }}>
                            {order.items && order.items.length > 0 ? (order.items[0]?.productName ?? 'Đơn hàng phần cứng') : 'Đơn hàng phần cứng'}
                            {order.items && order.items.length > 1 && ` (+${order.items.length - 1} sản phẩm khác)`}
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

            {activeTab === 'addresses' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  Sổ Địa Chỉ Nhận Hàng
                </h3>
                <div style={{ border: '1.5px solid #0A5BFF', borderRadius: '12px', padding: '18px', backgroundColor: '#F8FAFC', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#0F172A' }}>Nguyễn Văn An - 0901234567</strong>
                    <span style={{ backgroundColor: '#EFF6FF', color: '#0A5BFF', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                      MẶC ĐỊNH
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                    Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Thông Báo Hệ Thống</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0A5BFF' }}>
                    3 thông báo
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    {
                      id: 1,
                      title: 'Đơn hàng #NEX-8821 đã được giao thành công',
                      content: 'Kiện hàng của bạn đã được giao đến địa chỉ đăng ký. Vui lòng kiểm tra sản phẩm và kích hoạt bảo hành điện tử.',
                      time: '18/11/2026 14:30',
                      isRead: false,
                    },
                    {
                      id: 2,
                      title: 'Ưu đãi thành viên: Giảm 200.000đ cho đơn hàng linh kiện',
                      content: 'Mã coupon NEXORA200 đã được thêm vào ví ưu đãi của bạn. Hạn sử dụng đến hết 30/11/2026.',
                      time: '15/11/2026 09:15',
                      isRead: true,
                    },
                    {
                      id: 3,
                      title: 'Chào mừng bạn đến với hệ thống Nexora',
                      content: 'Tài khoản của bạn đã được kích hoạt thành công. Hãy khám phá hàng ngàn sản phẩm công nghệ chính hãng giá tốt.',
                      time: '10/11/2026 08:00',
                      isRead: true,
                    },
                  ].map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border: n.isRead ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                        backgroundColor: n.isRead ? '#FFFFFF' : '#EFF6FF',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            {n.title}
                          </h4>
                          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>{n.time}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                          {n.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'returns' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  Yêu Cầu Đổi Trả & Hoàn Tiền
                </h3>
                <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.6' }}>
                    Nexora hỗ trợ đổi trả sản phẩm miễn phí trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng đối với lỗi kỹ thuật phần cứng hoặc hư hại trong quá trình vận chuyển.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    showToast('Đã gửi yêu cầu đổi trả thành công! Kỹ thuật viên sẽ liên hệ trong 24h.');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '600px' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Chọn đơn hàng cần đổi trả
                    </label>
                    <select
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', backgroundColor: '#FFF' }}
                      required
                    >
                      <option value="">-- Chọn đơn hàng của bạn --</option>
                      {userOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.orderCode} - {new Date(o.createdAt).toLocaleDateString('vi-VN')} ({Number(o.totalAmount).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Hình thức mong muốn
                    </label>
                    <select
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', backgroundColor: '#FFF' }}
                      required
                    >
                      <option value="replace">Đổi sản phẩm mới (Lỗi do nhà sản xuất)</option>
                      <option value="refund">Hoàn tiền vào tài khoản ngân hàng</option>
                      <option value="repair">Gửi bảo hành sửa chữa chính hãng</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Mô tả tình trạng lỗi chi tiết
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Vui lòng mô tả cụ thể hiện tượng lỗi, ví dụ: máy không lên nguồn, sọc màn hình, quạt kêu to..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', resize: 'vertical' }}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '8px',
                      alignSelf: 'flex-start',
                      padding: '12px 28px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#0A5BFF',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(10, 91, 255, 0.25)',
                    }}
                  >
                    Gửi Yêu Cầu Đổi Trả
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  Đổi Mật Khẩu
                </h3>
                <form onSubmit={(e) => { e.preventDefault(); showToast('Đã đổi mật khẩu thành công!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginTop: '8px',
                      alignSelf: 'flex-start',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0A5BFF',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cập Nhật Mật Khẩu
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

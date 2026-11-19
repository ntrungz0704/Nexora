import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import type { AuthUser, OrderDto } from '@nexora/shared';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (): 'profile' | 'orders' | 'addresses' | 'password' => {
    if (location.pathname.includes('/orders')) return 'orders';
    if (location.pathname.includes('/addresses')) return 'addresses';
    if (location.pathname.includes('/password')) return 'password';
    return 'profile';
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'password'>(getTabFromPath);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tabId: 'profile' | 'orders' | 'addresses' | 'password') => {
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
        wishlistCount={1}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
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
                      <button
                        onClick={() => setIsAuthOpen(true)}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#0A5BFF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Đăng nhập tài khoản
                      </button>
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

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart || null}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(id, qty) => cartService.updateItem(id, qty)}
        onRemoveItem={(id) => cartService.removeItem(id)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
};

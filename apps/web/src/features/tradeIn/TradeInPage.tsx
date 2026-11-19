import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import type { AuthUser } from '@nexora/shared';

export const TradeInPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trade-in form state
  const [deviceType, setDeviceType] = useState('laptop');
  const [deviceModel, setDeviceModel] = useState('');
  const [condition, setCondition] = useState('like_new');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

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

  const handleCalculateEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceModel.trim()) {
      showToast('Vui lòng nhập tên hoặc model thiết bị bạn muốn thu cũ.');
      return;
    }
    // Simulation logic
    let base = 8000000;
    if (deviceType === 'laptop') base = 12000000;
    if (deviceType === 'vga') base = 7500000;
    if (deviceType === 'phone') base = 9000000;
    if (deviceType === 'monitor') base = 3500000;

    let multiplier = 0.85;
    if (condition === 'like_new') multiplier = 1.0;
    if (condition === 'good') multiplier = 0.75;
    if (condition === 'scratched') multiplier = 0.55;

    const finalVal = Math.round((base * multiplier) / 100000) * 100000;
    setEstimatedPrice(finalVal);
    showToast('Đã tính toán định giá thu cũ thành công!');
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
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1100px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Thu cũ đổi mới</span>
        </div>

        {/* Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
            borderRadius: '24px',
            padding: '48px 40px',
            color: '#FFFFFF',
            marginBottom: '36px',
            boxShadow: '0 15px 35px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '14px',
              }}
            >
              🔥 TECHPILOT TRADE-IN 2026
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px 0', lineHeight: '1.3' }}>
              Thu Cũ Đổi Mới — Trợ Giá Lên Tới 6.000.000đ
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '15px', lineHeight: '1.6' }}>
              Nâng cấp dàn máy, laptop, VGA thế hệ mới với mức giá tiết kiệm tối đa. Quy trình kiểm định 15 phút, giải ngân tiền mặt hoặc trừ trực tiếp vào đơn hàng mới.
            </p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#FACC15' }}>100%</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Hỗ trợ tận nhà & Cửa hàng</div>
          </div>
        </div>

        {/* Calculator Form & Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'start' }}>
          {/* Form */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 20px 0', color: '#0F172A' }}>
              Định Giá Nhanh Thiết Bị Cũ
            </h2>

            <form onSubmit={handleCalculateEstimate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Device Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  1. Chọn loại thiết bị cần thu đổi
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'laptop', label: 'Laptop', icon: 'fa-solid fa-laptop' },
                    { id: 'vga', label: 'Card VGA', icon: 'fa-solid fa-ticket' },
                    { id: 'phone', label: 'Điện thoại', icon: 'fa-solid fa-mobile-screen' },
                    { id: 'monitor', label: 'Màn hình', icon: 'fa-solid fa-desktop' },
                  ].map((dev) => (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => setDeviceType(dev.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: deviceType === dev.id ? '2px solid #0A5BFF' : '1px solid #E2E8F0',
                        backgroundColor: deviceType === dev.id ? '#EFF6FF' : '#FFFFFF',
                        color: deviceType === dev.id ? '#0A5BFF' : '#475569',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className={dev.icon} style={{ fontSize: '18px' }}></i>
                      <span>{dev.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  2. Tên thiết bị / Model cụ thể
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Asus TUF Gaming F15, RTX 3060 12GB, iPhone 13 Pro..."
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Condition */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  3. Tình trạng ngoại hình & chức năng
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'like_new', title: 'Loại 1: Đẹp 98 - 99%', desc: 'Không cấn móp, màn hình hiển thị hoàn hảo, đầy đủ củ sạc phụ kiện' },
                    { id: 'good', title: 'Loại 2: Bình thường 90 - 95%', desc: 'Trầy xước dăm nhẹ theo thời gian, mọi chức năng hoạt động bình thường' },
                    { id: 'scratched', title: 'Loại 3: Trầy xước nhiều / Cấn móp', desc: 'Có vết cấn vỏ máy, pin chai nhẹ hoặc thiếu phụ kiện gốc' },
                  ].map((cond) => (
                    <label
                      key={cond.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: condition === cond.id ? '1.5px solid #0A5BFF' : '1px solid #E2E8F0',
                        backgroundColor: condition === cond.id ? '#F8FAFC' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="condition"
                        checked={condition === cond.id}
                        onChange={() => setCondition(cond.id)}
                        style={{ accentColor: '#0A5BFF' }}
                      />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{cond.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{cond.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0A5BFF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(10, 91, 255, 0.25)',
                }}
              >
                <i className="fa-solid fa-calculator" style={{ marginRight: '8px' }}></i> Định Giá Ngay
              </button>
            </form>
          </div>

          {/* Result / Promo Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px 0', color: '#0F172A' }}>
              Kết Quả Định Giá Ước Tính
            </h3>

            {estimatedPrice !== null ? (
              <div>
                <div style={{ backgroundColor: '#EFF6FF', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Giá Thu Dự Kiến:
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: '#0A5BFF', margin: '8px 0' }}>
                    {estimatedPrice.toLocaleString('vi-VN')}đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                    + Thêm Voucher trợ giá lên đời 1.000.000đ
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link
                    to="/search"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    <i className="fa-solid fa-bag-shopping" style={{ marginRight: '6px' }}></i> Chọn Máy Mới Lên Đời
                  </Link>
                  <Link
                    to="/stores"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#F1F5F9',
                      color: '#334155',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Xem Địa Chỉ Cửa Hàng Gần Nhất
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8' }}>
                <i className="fa-solid fa-arrow-left" style={{ fontSize: '28px', marginBottom: '12px', color: '#CBD5E1' }}></i>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Điền thông tin máy cũ bên trái để xem bảng giá dự kiến và quyền lợi trợ giá độc quyền.
                </p>
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
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Chào mừng, ${user.fullName}!`);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import type { AuthUser } from '@nexora/shared';

interface TrackedOrder {
  code: string;
  createdAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKING' | 'SHIPPING' | 'DELIVERED';
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  total: number;
  carrier: string;
  trackingNumber: string;
  items: { name: string; quantity: number; price: number; image: string }[];
}

export const OrderTrackingPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<TrackedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!orderCode.trim()) {
      setErrorMessage('Vui lòng nhập mã đơn hàng của bạn.');
      return;
    }

    const codeClean = orderCode.trim().toUpperCase();
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

    try {
      let endpoint = `${apiUrl}/orders/detail/${codeClean}`;
      if (phone.trim()) {
        endpoint = `${apiUrl}/orders/track?code=${encodeURIComponent(codeClean)}&phone=${encodeURIComponent(phone.trim())}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        const o = json.data;
        setSearchedOrder({
          code: o.orderCode,
          createdAt: new Date(o.createdAt).toLocaleString('vi-VN'),
          status: o.orderStatus,
          customerName: o.customerName,
          phone: o.customerPhone,
          address: o.shippingAddress,
          paymentMethod: `${o.paymentMethod} (${o.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'})`,
          total: Number(o.totalAmount),
          carrier: o.carrierName || 'VNPost Express',
          trackingNumber: o.trackingNumber || 'VNPOST-88291039',
          items: o.items?.map((item: { productName: string; quantity: number; unitPrice: string | number; thumbnailUrl?: string | null }) => ({
            name: item.productName,
            quantity: item.quantity,
            price: Number(item.unitPrice),
            image: item.thumbnailUrl || '/assets/images/default-product.png',
          })) || [],
        });
      } else {
        const errJson = await res.json();
        setErrorMessage(errJson.error?.message || 'Không tìm thấy thông tin đơn hàng khớp với yêu cầu.');
        setSearchedOrder(null);
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi tra cứu đơn hàng.');
      setSearchedOrder(null);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
        }}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '850px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Tra cứu đơn hàng</span>
        </div>

        {/* Header Search Box */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#EFF6FF', color: '#0A5BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px auto' }}>
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
              Tra Cứu Tiến Độ Đơn Hàng
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
              Nhập mã đơn hàng hoặc số điện thoại để theo dõi lộ trình vận chuyển và trạng thái xử lý đơn.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Mã đơn hàng <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NEX-892401 hoặc 892401..."
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Số điện thoại người nhận
                </label>
                <input
                  type="tel"
                  placeholder="0901 234 567 (Tùy chọn)..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            {errorMessage && (
              <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600 }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              style={{
                marginTop: '8px',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0A5BFF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(10, 91, 255, 0.25)',
              }}
            >
              <i className="fa-solid fa-magnifying-glass"></i> Tra Cứu Đơn Hàng
            </button>
          </form>
        </div>

        {/* Result Area */}
        {searchedOrder && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Mã đơn hàng:</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A5BFF' }}>{searchedOrder.code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ backgroundColor: '#EFF6FF', color: '#2563EB', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  🚚 ĐANG VẬN CHUYỂN
                </span>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Ngày đặt: {searchedOrder.createdAt}</div>
              </div>
            </div>

            {/* Timeline Progress */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '32px' }}>
              {[
                { title: 'Đặt hàng', done: true, icon: 'fa-solid fa-file-lines' },
                { title: 'Xác nhận', done: true, icon: 'fa-solid fa-check' },
                { title: 'Đóng gói', done: true, icon: 'fa-solid fa-box' },
                { title: 'Giao hàng', done: true, active: true, icon: 'fa-solid fa-truck' },
                { title: 'Hoàn tất', done: false, icon: 'fa-solid fa-house-chimney-check' },
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: step.done ? '#0A5BFF' : '#F1F5F9',
                      color: step.done ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      boxShadow: step.active ? '0 0 0 4px rgba(10, 91, 255, 0.2)' : 'none',
                    }}
                  >
                    <i className={step.icon}></i>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: step.done ? 700 : 500, color: step.done ? '#0F172A' : '#94A3B8' }}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Logistics Info Box */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '20px', marginBottom: '28px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13.5px' }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Đơn vị vận chuyển:</div>
                  <strong style={{ color: '#0F172A' }}>{searchedOrder.carrier}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Mã vận đơn:</div>
                  <strong style={{ color: '#0A5BFF' }}>{searchedOrder.trackingNumber}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Người nhận:</div>
                  <div style={{ color: '#0F172A', fontWeight: 600 }}>{searchedOrder.customerName} - {searchedOrder.phone}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '2px' }}>Địa chỉ nhận hàng:</div>
                  <div style={{ color: '#0F172A' }}>{searchedOrder.address}</div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>
                Sản phẩm trong kiện hàng
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Số lượng: x{item.quantity}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
};

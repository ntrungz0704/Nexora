import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser } from '@nexora/shared';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  // Form states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [district, setDistrict] = useState('Quận 1');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY' | 'VIETQR'>('COD');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const items = cart?.items || [];
  const rawTotal = cart?.subtotal ? Number(cart.subtotal) : 0;
  const shippingFee = rawTotal >= 500000 || rawTotal === 0 ? 0 : 30000;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, rawTotal - discountAmount + shippingFee);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setIsCheckingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await storefrontService.validateCoupon(code, rawTotal);
      setAppliedCoupon({ code: result.coupon.code, discountAmount: result.discountAmount });
      setCouponMessage({
        type: 'ok',
        text: `Đã áp dụng mã ${result.coupon.code} (-${result.discountAmount.toLocaleString('vi-VN')}đ)`,
      });
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setAppliedCoupon(null);
      setCouponMessage({
        type: 'err',
        text: errorResponse.response?.data?.error?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
      });
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const token = authService.getToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 1. Submit Order to real API
      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: fullName,
          customerPhone: phone,
          customerEmail: email || 'khachhang@nexora.local',
          shippingAddress: `${address}, ${district}, ${city}`,
          province: city,
          district: district,
          customerNotes: notes || undefined,
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Không thể tạo đơn hàng.');
      }

      const json = await res.json();
      const order = json.data;

      // 2. Sync Cart, Catalog Stock & Admin Dashboard
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });

      // Save order info for success page
      sessionStorage.setItem(
        'lastOrder',
        JSON.stringify({
          orderCode: order.orderCode,
          fullName: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail,
          address: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          totalAmount: Number(order.totalAmount),
          itemsCount: order.items?.length || 1,
          createdAt: order.createdAt,
        }),
      );

      navigate(`/checkout/success?code=${order.orderCode}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-page-wrapper">
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={0}
        currentUser={currentUser}
        onOpenCart={() => navigate('/cart')}
        onOpenAuth={() => navigate('/auth/login')}
        onLogout={() => authService.logout()}
      />

      <main style={{ minHeight: '600px', paddingBottom: '80px' }}>
        <div className="container" style={{ padding: '16px 0' }}>
          <nav
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #6B7280)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Link to="/" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <Link to="/cart" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>
              Giỏ hàng
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #111827)' }}>Thanh toán</span>
          </nav>
        </div>

        <section className="container">
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              marginBottom: '24px',
              color: 'var(--text-primary)',
            }}
          >
            Thông tin thanh toán & Đặt hàng
          </h1>

          {errorMsg && (
            <div className="auth-alert auth-alert--error" style={{ marginBottom: '20px' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '24px',
                alignItems: 'flex-start',
              }}
            >
              {/* Left Column: Form Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Customer Shipping Info */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    borderRadius: '16px',
                    border: '1px solid var(--border, #E5E7EB)',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-location-dot" style={{ color: '#0A5BFF' }}></i>
                    1. Địa chỉ nhận hàng
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="auth-field">
                      <label className="auth-label">Họ và tên người nhận *</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Nguyễn Văn A"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Số điện thoại liên hệ *</label>
                      <input
                        type="tel"
                        className="auth-input"
                        placeholder="0901234567"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="auth-field" style={{ marginTop: '14px' }}>
                    <label className="auth-label">Địa chỉ Email (nhận hóa đơn điện tử) *</label>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '14px',
                      marginTop: '14px',
                    }}
                  >
                    <div className="auth-field">
                      <label className="auth-label">Tỉnh / Thành phố *</label>
                      <select
                        className="auth-input"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      >
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                      </select>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Quận / Huyện *</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Quận 1"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="auth-field" style={{ marginTop: '14px' }}>
                    <label className="auth-label">Số nhà, tên đường *</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Số 123 Đường Nguyễn Trãi, Phường Bến Thành"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="auth-field" style={{ marginTop: '14px' }}>
                    <label className="auth-label">Ghi chú cho shipper (tùy chọn)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Payment Method */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    borderRadius: '16px',
                    border: '1px solid var(--border, #E5E7EB)',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-credit-card" style={{ color: '#0A5BFF' }}></i>
                    2. Phương thức thanh toán
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* COD */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '10px',
                        border:
                          paymentMethod === 'COD'
                            ? '2px solid #0A5BFF'
                            : '1px solid var(--border, #E5E7EB)',
                        backgroundColor: paymentMethod === 'COD' ? 'rgba(10, 91, 255, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        style={{ accentColor: '#0A5BFF', width: '18px', height: '18px' }}
                      />
                      <i className="fa-solid fa-money-bill-wave" style={{ color: '#16A34A', fontSize: '20px' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          Thanh toán khi nhận hàng (COD)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Nhận hàng, kiểm tra tem niêm phong và thanh toán tiền mặt cho nhân viên giao hàng.
                        </div>
                      </div>
                    </label>

                    {/* VNPay */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '10px',
                        border:
                          paymentMethod === 'VNPAY'
                            ? '2px solid #0A5BFF'
                            : '1px solid var(--border, #E5E7EB)',
                        backgroundColor: paymentMethod === 'VNPAY' ? 'rgba(10, 91, 255, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'VNPAY'}
                        onChange={() => setPaymentMethod('VNPAY')}
                        style={{ accentColor: '#0A5BFF', width: '18px', height: '18px' }}
                      />
                      <i className="fa-solid fa-qrcode" style={{ color: '#0A5BFF', fontSize: '20px' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          Cổng thanh toán trực tuyến VNPAY
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Hỗ trợ quét VNPAY-QR, thẻ ATM nội địa 40+ ngân hàng hoặc thẻ quốc tế Visa/MasterCard.
                        </div>
                      </div>
                    </label>

                    {/* VietQR */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '10px',
                        border:
                          paymentMethod === 'VIETQR'
                            ? '2px solid #0A5BFF'
                            : '1px solid var(--border, #E5E7EB)',
                        backgroundColor: paymentMethod === 'VIETQR' ? 'rgba(10, 91, 255, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'VIETQR'}
                        onChange={() => setPaymentMethod('VIETQR')}
                        style={{ accentColor: '#0A5BFF', width: '18px', height: '18px' }}
                      />
                      <i className="fa-solid fa-building-columns" style={{ color: '#8B5CF6', fontSize: '20px' }}></i>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>
                          Chuyển khoản VietQR Napas 247
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Chuyển khoản nhanh qua mã VietQR tự động xác nhận trong 30 giây.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Review */}
              <div
                style={{
                  backgroundColor: 'var(--surface-card, #FFFFFF)',
                  borderRadius: '16px',
                  border: '1px solid var(--border, #E5E7EB)',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  position: 'sticky',
                  top: '90px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0' }}>
                  Đơn hàng của bạn ({cart?.totalItems || 0} món)
                </h3>

                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '16px',
                    paddingRight: '6px',
                  }}
                >
                  {items.map((item) => {
                    const img = getProductImage(item.product);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '14px',
                        }}
                      >
                        <img
                          src={img}
                          alt={item.product.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '8px',
                            objectFit: 'contain',
                            border: '1px solid var(--border)',
                            padding: '4px',
                            backgroundColor: '#F9FAFB',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.product.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            x{item.quantity} · {formatPrice(Number(item.product.salePrice || item.product.price))}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>
                          {formatPrice(Number(item.product.salePrice || item.product.price) * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Input (Live DB Sync with Admin Coupons) */}
                <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Nhập mã giảm giá..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      style={{ flex: 1, height: '40px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCheckingCoupon || !couponInput.trim()}
                      style={{
                        padding: '0 16px',
                        height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#0A5BFF',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isCheckingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponMessage && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: couponMessage.type === 'ok' ? '#16A34A' : '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{couponMessage.text}</span>
                      {appliedCoupon && (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponInput('');
                            setCouponMessage(null);
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                        >
                          Bỏ mã
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tạm tính:</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(rawTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>Giảm giá ({appliedCoupon?.code}):</span>
                    <span style={{ fontWeight: 700, color: '#16A34A' }}>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Phí vận chuyển:</span>
                  <span style={{ fontWeight: 600, color: shippingFee === 0 ? '#16A34A' : 'var(--text-primary)' }}>
                    {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: '1.5px dashed var(--border)',
                    paddingTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800 }}>Tổng tiền:</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary, #0A5BFF)' }}>
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="auth-btn-primary"
                  style={{
                    width: '100%',
                    height: '52px',
                    fontSize: '16px',
                    opacity: isSubmitting || items.length === 0 ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Đang xử lý đơn hàng...' : 'Xác nhận Đặt hàng ngay'}
                </button>

                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    marginTop: '12px',
                  }}
                >
                  Bằng cách nhấn Đặt hàng, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo hành của Nexora.
                </p>
              </div>
            </div>
          </form>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

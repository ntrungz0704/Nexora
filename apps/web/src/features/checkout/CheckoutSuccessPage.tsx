import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { authService } from '../../services/authService';

interface OrderSummary {
  orderCode: string;
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || 'NEX-20261119-8921';
  const [orderInfo] = useState<OrderSummary | null>(() => {
    try {
      const stored = sessionStorage.getItem('lastOrder');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="home-page-wrapper">
      <StorefrontHeader
        categories={categories}
        cartCount={0}
        wishlistCount={0}
        currentUser={authService.getCurrentUser()}
        onOpenCart={() => {}}
        onOpenAuth={() => {}}
        onLogout={() => authService.logout()}
      />

      <main style={{ minHeight: '600px', padding: '60px 16px 100px 16px' }}>
        <div
          className="container"
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            backgroundColor: 'var(--surface-card, #FFFFFF)',
            borderRadius: '20px',
            border: '1px solid var(--border, #E5E7EB)',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          {/* Green Check Icon */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <i className="fa-solid fa-check" style={{ color: '#16A34A', fontSize: '32px' }}></i>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Đặt hàng thành công!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            Cảm ơn bạn đã tin tưởng mua sắm tại <strong>Nexora</strong>. Đơn hàng của bạn đã được
            tiếp nhận và đang được đóng gói.
          </p>

          {/* Order Info Card */}
          <div
            style={{
              backgroundColor: 'var(--surface-muted, #F8FAFC)',
              borderRadius: '12px',
              border: '1px solid var(--border, #E2E8F0)',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Mã đơn hàng:</span>
              <strong style={{ color: '#0A5BFF', fontSize: '14px' }}>
                {orderInfo?.orderCode || codeParam}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Người nhận hàng:</span>
              <strong>
                {orderInfo?.fullName || 'Khách hàng'} - {orderInfo?.phone || '0901234567'}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Địa chỉ nhận:</span>
              <span style={{ textAlign: 'right', maxWidth: '300px', fontWeight: 600 }}>
                {orderInfo?.address || 'Quận 1, TP. Hồ Chí Minh'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Phương thức:</span>
              <strong>
                {orderInfo?.paymentMethod === 'VNPAY'
                  ? 'Cổng VNPAY (Đã thanh toán)'
                  : orderInfo?.paymentMethod === 'VIETQR'
                    ? 'Chuyển khoản VietQR Napas 247'
                    : 'Thanh toán tiền mặt khi nhận (COD)'}
              </strong>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
              }}
            >
              <span style={{ fontWeight: 700 }}>Tổng tiền thanh toán:</span>
              <strong style={{ color: '#0A5BFF', fontSize: '16px' }}>
                {formatPrice(orderInfo?.totalAmount || 34500000)}
              </strong>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: '32px' }}>
            <h4
              style={{ fontSize: '13px', fontWeight: 700, textAlign: 'left', marginBottom: '12px' }}
            >
              Trạng thái đơn hàng:
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#0A5BFF',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontSize: '12px',
                  }}
                >
                  <i className="fa-solid fa-check"></i>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700 }}>Đã tiếp nhận</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    border: '2px solid #0A5BFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontSize: '12px',
                  }}
                >
                  <i className="fa-solid fa-box"></i>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0A5BFF' }}>
                  Đang đóng gói
                </div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#F3F4F6',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontSize: '12px',
                  }}
                >
                  <i className="fa-solid fa-truck"></i>
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Đang giao hàng</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#F3F4F6',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 6px auto',
                    fontSize: '12px',
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Giao thành công</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/order-tracking"
              className="btn btn--outline"
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
              }}
            >
              Tra cứu đơn hàng
            </Link>
            <Link
              to="/"
              className="auth-btn-primary"
              style={{
                flex: 1,
                lineHeight: '48px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

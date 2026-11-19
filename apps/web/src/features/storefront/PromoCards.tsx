import React from 'react';
import { Link } from 'react-router-dom';

export const PromoCards: React.FC = () => {
  return (
    <div className="hero-section__right">
      <div
        className="promo-card promo-card--dark"
        style={{
          background:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.35) 80%), url('/assets/images/banner-build-pc.jpg') center/cover no-repeat",
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h4 style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            BUILD PC THEO YÊU CẦU
          </h4>
          <p style={{ color: '#cbd5e1', marginBottom: '12px' }}>
            Tối ưu cấu hình - Cân mọi ngân sách
          </p>
        </div>
        <Link
          to="/build-pc"
          className="btn btn--primary btn--sm"
          style={{ position: 'relative', zIndex: 2 }}
        >
          Xem ngay
        </Link>
      </div>

      <div
        className="promo-card promo-card--dark"
        style={{
          background:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.35) 80%), url('/assets/images/banner-pay-later.jpg') center/cover no-repeat",
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h4 style={{ color: '#60a5fa', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            MUA NGAY - TRẢ SAU
          </h4>
          <p style={{ color: '#cbd5e1', marginBottom: '12px' }}>
            Nhận hàng, kiểm tra rồi thanh toán (COD)
          </p>
        </div>
        <span className="promo-card__number" style={{ opacity: 0.15, color: '#ffffff' }}>
          <i className="fa-solid fa-truck-fast"></i>
        </span>
        <Link
          to="/search"
          className="btn btn--primary btn--sm"
          style={{ position: 'relative', zIndex: 2 }}
        >
          Mua ngay
        </Link>
      </div>

      <div
        className="promo-card promo-card--dark"
        style={{
          background:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.35) 80%), url('/assets/images/banner-trade-in.jpg') center/cover no-repeat",
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h4 style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
            THU CŨ ĐỔI MỚI MÁY CŨ
          </h4>
          <p style={{ color: '#cbd5e1', marginBottom: '12px' }}>Trợ giá lên tới 6 triệu đồng</p>
        </div>
        <Link
          to="/thu-cu-doi-moi"
          className="btn btn--primary btn--sm"
          style={{ position: 'relative', zIndex: 2 }}
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

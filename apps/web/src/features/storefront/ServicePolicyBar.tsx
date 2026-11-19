import React from 'react';

export const ServicePolicyBar: React.FC = () => {
  return (
    <section className="container">
      <div className="features-bar">
        <div className="feature-item">
          <img
            src="/assets/images/feature-shipping.jpg"
            alt="Miễn phí giao hàng"
            className="feature-icon-img"
          />
          <span>
            Miễn phí giao hàng
            <br />
            <small>Đơn hàng từ 500k</small>
          </span>
        </div>
        <div className="feature-item">
          <img
            src="/assets/images/feature-warranty.jpg"
            alt="Bảo hành chính hãng"
            className="feature-icon-img"
          />
          <span>
            Bảo hành chính hãng
            <br />
            <small>Cam kết 100%</small>
          </span>
        </div>
        <div className="feature-item">
          <img
            src="/assets/images/feature-return.jpg"
            alt="Đổi trả dễ dàng"
            className="feature-icon-img"
          />
          <span>
            Đổi trả dễ dàng
            <br />
            <small>Trong 7 ngày đầu</small>
          </span>
        </div>
        <div className="feature-item">
          <img
            src="/assets/images/feature-cod.jpg"
            alt="Thanh toán COD"
            className="feature-icon-img"
          />
          <span>
            Thanh toán COD
            <br />
            <small>Tiền mặt khi nhận hàng</small>
          </span>
        </div>
        <div className="feature-item">
          <img
            src="/assets/images/feature-support.jpg"
            alt="Hỗ trợ kỹ thuật 24/7"
            className="feature-icon-img"
          />
          <span>
            Hỗ trợ kỹ thuật 24/7
            <br />
            <small>Hotline: 1900 1234</small>
          </span>
        </div>
      </div>
    </section>
  );
};

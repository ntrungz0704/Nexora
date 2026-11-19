import React from 'react';

export const BottomFeatures: React.FC = () => {
  return (
    <section className="container" style={{ marginTop: '40px' }}>
      <div className="bottom-features">
        <div className="bottom-feature-item">
          <i className="fa-solid fa-map-location-dot"></i>
          <h5>Hệ thống 50+ cửa hàng</h5>
          <p>Trải nghiệm thực tế sản phẩm công nghệ cao cấp trên toàn quốc</p>
        </div>
        <div className="bottom-feature-item">
          <i className="fa-solid fa-money-bill-wave"></i>
          <h5>Thanh toán khi nhận hàng</h5>
          <p>Hỗ trợ thanh toán COD (tiền mặt) khi nhận hàng trên toàn quốc</p>
        </div>
        <div className="bottom-feature-item">
          <i className="fa-solid fa-user-shield"></i>
          <h5>Bảo mật tuyệt đối</h5>
          <p>Cam kết bảo mật thông tin khách hàng và giao dịch an toàn</p>
        </div>
        <div className="bottom-feature-item">
          <i className="fa-solid fa-gift"></i>
          <h5>Đặc quyền thành viên</h5>
          <p>Tích điểm nâng hạng Member, nhận ưu đãi giảm giá độc quyền</p>
        </div>
      </div>
    </section>
  );
};

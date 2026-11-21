import React from 'react';
import { Link } from 'react-router-dom';
import { BottomFeatures } from './BottomFeatures';

export const StorefrontFooter: React.FC<{ hideFeatures?: boolean }> = ({
  hideFeatures = false,
}) => {
  return (
    <>
      {!hideFeatures && <BottomFeatures />}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-col footer-brand">
            <Link
              to="/"
              className="logo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                marginBottom: '20px',
              }}
            >
              <img
                src="/assets/images/logo.png"
                alt="Nexora Logo"
                style={{ height: '38px', objectFit: 'contain', display: 'block' }}
              />
              <div className="logo-brand-info">
                <span
                  className="logo-brand-tagline"
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                  }}
                >
                  TECHNOLOGY FOR A BETTER TOMORROW
                </span>
              </div>
            </Link>
            <p>
              Nexora - Hệ thống bán lẻ máy tính, laptop và gaming gear chính hãng hàng đầu Việt Nam.
              Cam kết chất lượng, bảo hành vượt trội, giá tốt nhất.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-youtube"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-tiktok"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-instagram"></i>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Về chúng tôi</h4>
            <Link to="/about">Giới thiệu Nexora</Link>
            <Link to="/careers">Tuyển dụng nhân viên</Link>
            <Link to="/contact">Liên hệ hợp tác</Link>
            <Link to="/stores">Hệ thống cửa hàng</Link>
            <Link to="/privacy">Chính sách bảo mật</Link>
          </div>

          <div className="footer-col">
            <h4>Hỗ trợ khách hàng</h4>
            <Link to="/guide">Hướng dẫn mua hàng online</Link>
            <Link to="/returns">Chính sách đổi trả sản phẩm</Link>
            <Link to="/warranty">Chính sách bảo hành sửa chữa</Link>
            <Link to="/order-tracking">Tra cứu hóa đơn điện tử</Link>
            <Link to="/support">Gửi yêu cầu hỗ trợ kỹ thuật</Link>
          </div>

          <div className="footer-col">
            <h4>Đăng ký nhận ưu đãi</h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>
              Đăng ký để nhận những thông báo khuyến mãi công nghệ sớm nhất.
            </p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email của bạn..." required />
              <button type="submit">Đăng ký</button>
            </form>
            <div className="payment-icons" style={{ marginTop: '24px' }}>
              <i className="fa-solid fa-money-bill-wave" title="Tiền mặt COD"></i>
              <i className="fa-solid fa-truck-fast" title="Giao hàng tận nơi"></i>
              <i className="fa-solid fa-shield-halved" title="Bảo đảm chất lượng"></i>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom__inner">
            <span>© 2026 Nexora. Bản quyền thuộc về đội ngũ phát triển Nexora.</span>
            <span>Kết nối công nghệ – Kiến tạo tương lai</span>
          </div>
        </div>
      </footer>
    </>
  );
};

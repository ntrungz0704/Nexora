import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

export const PolicyPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const [currentUser, setCurrentUser] = React.useState(() => authService.getCurrentUser());

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

  const isWarranty = path.includes('warranty') || path.includes('bao-hanh');
  const isShipping = path.includes('shipping') || path.includes('van-chuyen');
  const isReturn = path.includes('return') || path.includes('doi-tra');
  const _isPrivacy = path.includes('privacy') || path.includes('bao-mat');

  const getPolicyContent = () => {
    if (isWarranty) {
      return {
        title: 'Chính Sách Bảo Hành & Sửa Chữa Chính Hãng',
        badge: 'Bảo Hành Cam Kết 100%',
        icon: 'fa-shield-halved',
        updatedAt: '15/11/2026',
        sections: [
          {
            heading: '1. Thời hạn và điều kiện bảo hành',
            body: 'Tất cả sản phẩm phần cứng, máy tính để bàn, laptop và linh kiện phân phối bởi Nexora đều được bảo hành chính hãng từ 12 đến 36 tháng theo đúng tiêu chuẩn nhà sản xuất (ASUS, MSI, Gigabyte, Intel, AMD, Kingston, Corsair...). Khách hàng chỉ cần cung cấp số điện thoại hoặc mã đơn hàng để tra cứu bảo hành điện tử.',
          },
          {
            heading: '2. Chính sách bảo hành 1 đổi 1 trong 30 ngày',
            body: 'Đối với các lỗi kỹ thuật phần cứng do nhà sản xuất phát sinh trong vòng 30 ngày đầu tiên kể từ ngày nhận hàng, Nexora cam kết thực hiện đổi ngay sản phẩm mới 100% cùng loại hoặc tương đương.',
          },
          {
            heading: '3. Quy trình tiếp nhận bảo hành',
            body: 'Khách hàng có thể mang sản phẩm đến trực tiếp hệ thống cửa hàng Nexora hoặc gửi chuyển phát nhanh về trung tâm bảo hành. Đội ngũ kỹ thuật viên chuyên nghiệp sẽ kiểm tra và thông báo tiến độ xử lý trong vòng 24 - 48 giờ làm việc.',
          },
          {
            heading: '4. Trường hợp từ chối bảo hành',
            body: 'Sản phẩm có dấu hiệu rơi vỡ, biến dạng vật lý, tiếp xúc chất lỏng, cháy nổ IC do nguồn điện không ổn định hoặc tem niêm phong bảo hành bị rách, tẩy xóa sẽ không thuộc diện bảo hành tiêu chuẩn miễn phí.',
          },
        ],
      };
    }

    if (isShipping) {
      return {
        title: 'Chính Sách Giao Nhận & Vận Chuyển',
        badge: 'Giao Nhanh Toàn Quốc',
        icon: 'fa-truck-fast',
        updatedAt: '15/11/2026',
        sections: [
          {
            heading: '1. Phí giao hàng & Miễn phí vận chuyển',
            body: 'Nexora miễn phí 100% cước giao hàng tiêu chuẩn trên toàn quốc cho mọi đơn hàng có giá trị thanh toán từ 300.000đ trở lên. Đơn hàng dưới 300.000đ áp dụng mức phí đồng giá 30.000đ.',
          },
          {
            heading: '2. Thời gian giao hàng dự kiến',
            body: 'Khu vực nội thành TP. Hồ Chí Minh và Hà Nội: Giao siêu tốc trong 2 giờ hoặc trong ngày. Các tỉnh thành khác: Giao tận tay từ 1 đến 3 ngày làm việc thông qua đối tác vận chuyển hỏa tốc uy tín.',
          },
          {
            heading: '3. Kiểm tra hàng trước khi thanh toán (COD)',
            body: 'Khách hàng được quyền đồng kiểm tra ngoại quan kiện hàng, tem niêm phong và phụ kiện trước khi ký nhận và thanh toán tiền mặt cho nhân viên bưu tá.',
          },
        ],
      };
    }

    if (isReturn) {
      return {
        title: 'Chính Sách Đổi Trả Sản Phẩm & Hoàn Tiền',
        badge: 'Đổi Trả Dễ Dàng Trong 7 Ngày',
        icon: 'fa-rotate-left',
        updatedAt: '15/11/2026',
        sections: [
          {
            heading: '1. Điều kiện đổi trả trong 7 ngày',
            body: 'Khách hàng được quyền yêu cầu đổi mới hoặc hoàn tiền trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm gặp sự cố kỹ thuật hoặc giao sai mẫu mã, thiếu linh kiện phụ kiện so với đơn đặt hàng.',
          },
          {
            heading: '2. Yêu cầu ngoại quan và vỏ hộp',
            body: 'Sản phẩm hoàn trả cần giữ nguyên vẹn vỏ hộp, túi chống sốc, đầy đủ phụ kiện và hóa đơn mua hàng đi kèm, không có dấu hiệu trầy xước nặng do tác động bên ngoài.',
          },
          {
            heading: '3. Thời gian hoàn tiền',
            body: 'Sau khi nhận và kiểm định kiện hàng tại kho, Nexora sẽ thực hiện hoàn tiền qua tài khoản ngân hàng hoặc ví VNPay của khách hàng trong vòng 1 - 3 ngày làm việc.',
          },
        ],
      };
    }

    return {
      title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
      badge: 'Bảo Mật Tiêu Chuẩn Cao',
      icon: 'fa-user-lock',
      updatedAt: '15/11/2026',
      sections: [
        {
          heading: '1. Thu thập và sử dụng thông tin',
          body: 'Nexora chỉ thu thập các thông tin cần thiết phục vụ quá trình xử lý đơn hàng, giao nhận, chăm sóc khách hàng và bảo hành sản phẩm. Chúng tôi cam kết không kinh doanh, cho thuê hay chuyển giao thông tin cá nhân của quý khách cho bên thứ ba vì mục đích thương mại.',
        },
        {
          heading: '2. Bảo mật thanh toán & Mật khẩu',
          body: 'Mọi thông tin thanh toán trực tuyến qua cổng VNPay đều được mã hóa bằng chuẩn an ninh SSL 256-bit cao cấp nhất. Mật khẩu người dùng được lưu trữ bằng hàm băm mật mã Argon2/bcrypt bảo vệ an toàn.',
        },
      ],
    };
  };

  const content = getPolicyContent();

  return (
    <div className="home-page-wrapper">
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

      <main style={{ minHeight: '70vh', backgroundColor: '#F8FAFC', padding: '36px 0 60px 0' }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
          {/* Breadcrumb */}
          <nav
            style={{
              fontSize: '13px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <Link to="/" style={{ color: '#0A5BFF', textDecoration: 'none', fontWeight: 600 }}>
              Trang chủ
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{content.title}</span>
          </nav>

          {/* Header Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E2E8F0',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  backgroundColor: '#EFF6FF',
                  color: '#0A5BFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                <i className={`fa-solid ${content.icon}`}></i>
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  {content.badge}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {content.title}
                </h1>
              </div>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B' }}>
              Cập nhật lần cuối: <strong>{content.updatedAt}</strong> · Áp dụng trên toàn hệ thống Nexora
            </div>
          </div>

          {/* Policy Sections */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            {content.sections.map((sec, idx) => (
              <div key={idx} style={{ borderBottom: idx < content.sections.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: idx < content.sections.length - 1 ? '24px' : '0' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                  {sec.heading}
                </h2>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
                  {sec.body}
                </p>
              </div>
            ))}

            {/* Support CTA */}
            <div
              style={{
                marginTop: '16px',
                padding: '20px 24px',
                borderRadius: '16px',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
                  Bạn cần giải đáp thêm về chính sách?
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Tổng đài hỗ trợ kỹ thuật và chăm sóc khách hàng 24/7 của Nexora luôn sẵn sàng.
                </p>
              </div>
              <a
                href="tel:18002097"
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#0A5BFF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-phone"></i>
                <span>Hotline: 1800 2097</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

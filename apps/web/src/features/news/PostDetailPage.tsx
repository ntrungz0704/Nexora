import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { ARTICLES_SEED, type ArticleItem } from './articlesData';
import type { AuthUser } from '@nexora/shared';

export const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const article = (ARTICLES_SEED.find((a) => a.slug === slug || a.id === slug) || ARTICLES_SEED[0]) as ArticleItem;

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

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

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
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '900px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <Link to="/posts" style={{ color: 'inherit', textDecoration: 'none' }}>Tin tức</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Chi tiết bài viết</span>
        </div>

        {/* Article Container */}
        <article style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '40px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)' }}>
          <span style={{ backgroundColor: '#EFF6FF', color: '#0A5BFF', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
            ⭐ {article.category} Chuyên Sâu
          </span>

          <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', margin: '16px 0 14px 0', lineHeight: '1.3' }}>
            {article.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0A5BFF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {article.author.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{article.author}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Chuyên gia phần cứng TechPilot • {article.date} • {article.readTime}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Đã sao chép liên kết bài viết!');
                }}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa-solid fa-share-nodes"></i> Chia sẻ
              </button>
            </div>
          </div>

          {/* Featured Image */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', maxHeight: '420px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={article.image}
              alt={article.title}
              style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/banner-rtx-bg.jpg';
              }}
            />
          </div>

          {/* Table of Contents */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              <i className="fa-solid fa-list-ul" style={{ color: '#0A5BFF', marginRight: '8px' }}></i> Mục lục nội dung:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>1. Tổng quan thiết kế tản nhiệt & PCB thế hệ mới</li>
              <li>2. Thông số kỹ thuật chi tiết: Số nhân CUDA và bộ nhớ GDDR7</li>
              <li>3. Điểm số Benchmark thực tế: 3DMark Time Spy & Cyberpunk 2077 Path Tracing</li>
              <li>4. Khả năng xử lý tác vụ trí tuệ nhân tạo (AI Generative)</li>
              <li>5. Đánh giá nhiệt độ, độ ồn và kết luận mức độ đáng mua</li>
            </ul>
          </div>

          {/* Body Content */}
          <div style={{ fontSize: '15.5px', lineHeight: '1.8', color: '#334155' }}>
            <p>
              Thị trường phần cứng máy tính và đồ họa tiếp tục chứng kiến sự cạnh tranh khốc liệt khi kiến trúc bán dẫn mới chính thức trình làng. Với sự gia tăng chóng mặt của các tác vụ AI tạo sinh cục bộ cũng như nhu cầu trải nghiệm các tựa game thế hệ tiếp theo ở độ phân giải 4K 144Hz - 240Hz, yêu cầu về băng thông bộ nhớ và sức mạnh tính toán chưa bao giờ lớn đến thế.
            </p>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '32px 0 16px 0' }}>
              1. Tổng quan thiết kế tản nhiệt & Hoàn thiện cao cấp
            </h2>
            <p>
              Về mặt ngoại quan, phiên bản năm nay được gia cố bằng bộ khung nhôm nguyên khối đúc áp lực cao, giúp triệt tiêu hiện tượng uốn cong card (sagging) khi gắn vào các bo mạch chủ hiện đại. Quạt tản nhiệt sử dụng vòng bi kép với cánh quạt hướng trục giúp tăng 23% lưu lượng gió nhưng vẫn giữ mức độ ồn dưới 32dB ngay cả trong điều kiện tải nặng 100%.
            </p>

            {/* Hardware Spotlight Callout */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '16px', padding: '24px', margin: '32px 0', display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#FFFFFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #BFDBFE' }}>
                <i className="fa-solid fa-microchip" style={{ fontSize: '36px', color: '#0A5BFF' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E40AF', margin: '0 0 6px 0' }}>
                  Linh Kiện Đang Sẵn Hàng Tại Kho Nexora
                </h4>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 10px 0' }}>
                  Sản phẩm đã có mặt tại hệ thống cửa hàng với chính sách bảo hành 36 tháng 1 đổi 1 và hỗ trợ trả góp 0%.
                </p>
                <Link
                  to="/search?cat=main-cpu-vga"
                  style={{ display: 'inline-block', backgroundColor: '#0A5BFF', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                >
                  Khám phá linh kiện VGA ngay →
                </Link>
              </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '32px 0 16px 0' }}>
              2. Kết luận và lời khuyên lựa chọn cấu hình
            </h2>
            <p>
              Nếu bạn là game thủ chuyên nghiệp đang sử dụng màn hình tần số quét từ 240Hz trở lên hoặc người sáng tạo nội dung 3D chuyên sâu, đây chắc chắn là khoản đầu tư xứng đáng cho 3-5 năm tiếp theo mà không lo bị lỗi thời.
            </p>
          </div>
        </article>
      </main>

      <StorefrontFooter />
    </div>
  );
};

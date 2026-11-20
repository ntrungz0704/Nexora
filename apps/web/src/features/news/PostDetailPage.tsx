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

  const article = (ARTICLES_SEED.find((a) => a.slug === slug || a.id === slug) || ARTICLES_SEED[2] || ARTICLES_SEED[0]) as ArticleItem;
  const relatedArticles = ARTICLES_SEED.filter((a) => a.id !== article.id).slice(0, 4);

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
    <div className="home-page-wrapper">
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
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

      <main style={{ minHeight: '600px', paddingBottom: '40px' }}>
        {/* Breadcrumb */}
        <section className="container breadcrumb">
          <Link to="/">Trang chủ</Link> <i className="fa-solid fa-chevron-right"></i>
          <Link to="/post">Tin tức công nghệ</Link> <i className="fa-solid fa-chevron-right"></i>
          <span>{article.title}</span>
        </section>

        {/* 2-Column Detail Layout */}
        <section className="container news-page">
          <div className="news-layout">
            {/* Left: Main Article Content */}
            <article className="news-main news-detail-card" style={{ background: '#FFFFFF', padding: '36px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <span className="news-badge" style={{ display: 'inline-block', marginBottom: '14px', textTransform: 'uppercase', fontWeight: 800 }}>
                {article.category}
              </span>

              <h1 className="news-detail-title" style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', lineHeight: '1.35', margin: '0 0 16px 0' }}>
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="news-detail-summary" style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0', fontStyle: 'italic' }}>
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              <div className="news-meta news-detail-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px', fontSize: '13px', color: '#64748B', flexWrap: 'wrap' }}>
                <span><i className="fa-solid fa-user"></i> <strong>{article.author}</strong></span>
                <span><i className="fa-regular fa-calendar"></i> {article.date}</span>
                <span><i className="fa-regular fa-hourglass-half"></i> {article.readTime}</span>
                <span><i className="fa-regular fa-eye"></i> {article.views.toLocaleString()} lượt xem</span>
              </div>

              {/* Featured Cover Image */}
              <div className="news-detail-image" style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '28px', backgroundColor: '#F8FAFC' }}>
                <img
                  src={article.image}
                  alt={article.title}
                  style={{ width: '100%', maxHeight: '450px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/posts/cpu_i9_vs_ryzen7.jpg';
                  }}
                />
              </div>

              {/* Quick Summary Callout */}
              <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '12px', padding: '18px 22px', marginBottom: '28px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-info"></i> Tóm tắt nhanh:
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#1E293B', lineHeight: '1.6' }}>
                  Nếu bạn ưu tiên hiệu năng chơi game eSports và các tựa game AAA đỉnh cao với mức tiêu thụ điện thấp, AMD Ryzen 7 7800X3D là lựa chọn tối thượng. Ngược lại, Intel Core i9-14900K áp đảo toàn diện ở các tác vụ render đồ họa 3D, dựng phim và tính toán đa nhiệm.
                </p>
              </div>

              {/* Article Sections */}
              <div className="news-detail-content" style={{ fontSize: '15px', lineHeight: '1.8', color: '#334155' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '24px 0 12px 0' }}>
                  1. Mở đầu: Cuộc đối đầu đỉnh cao giữa hai gã khổng lồ
                </h2>
                <p>
                  Trong phân khúc CPU cao cấp dành cho game thủ và chuyên gia phần cứng năm 2026, câu hỏi &quot;Nên chọn Intel Core i9 hay AMD Ryzen 7 3D V-Cache?&quot; luôn là chủ đề tranh luận nóng bỏng nhất. Đội ngũ kỹ thuật Nexora đã thực hiện bài kiểm nghiệm thực tế trên cùng một hệ thống card đồ họa RTX 4090 và RAM DDR5 6000MHz để đưa ra câu trả lời chuẩn xác.
                </p>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '28px 0 12px 0' }}>
                  2. Thông số kỹ thuật chi tiết
                </h2>

                <div style={{ overflowX: 'auto', margin: '16px 0 24px 0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700 }}>Thông số</th>
                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0A5BFF' }}>Intel Core i9-14900K</th>
                        <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#DC2626' }}>AMD Ryzen 7 7800X3D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>Số nhân / Số luồng</td>
                        <td style={{ padding: '10px 14px' }}>24 Nhân (8P + 16E) / 32 Luồng</td>
                        <td style={{ padding: '10px 14px' }}>8 Nhân / 16 Luồng</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>Xung nhịp tối đa</td>
                        <td style={{ padding: '10px 14px' }}>Lên tới 6.0 GHz</td>
                        <td style={{ padding: '10px 14px' }}>Lên tới 5.0 GHz</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>Bộ nhớ đệm (L3 Cache)</td>
                        <td style={{ padding: '10px 14px' }}>36 MB</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#DC2626' }}>96 MB (3D V-Cache)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>Tiêu thụ điện (TDP)</td>
                        <td style={{ padding: '10px 14px' }}>125W (Peak 253W)</td>
                        <td style={{ padding: '10px 14px' }}>120W (Peak ~85W khi gaming)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>Socket hỗ trợ</td>
                        <td style={{ padding: '10px 14px' }}>LGA1700</td>
                        <td style={{ padding: '10px 14px' }}>AM5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '28px 0 12px 0' }}>
                  3. Hiệu năng chơi game thực tế (Gaming Benchmark)
                </h2>
                <p>
                  Nhờ công nghệ bộ nhớ đệm 3D V-Cache dung lượng khổng lồ 96MB, Ryzen 7 7800X3D chiếm ưu thế từ 8% đến 16% trong các tựa game như Cyberpunk 2077, Shadow of the Tomb Raider và CS2 ở độ phân giải Full HD & 2K.
                </p>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '28px 0 12px 0' }}>
                  4. Hiệu năng làm việc đa nhiệm và đồ họa (Workload)
                </h2>
                <p>
                  Ở các tác vụ Cinebench R24 đa nhân, Blender và Premiere Pro render 4K, Core i9-14900K vượt trội hơn 45% nhờ sở hữu tới 24 nhân 32 luồng xử lý đồng thời.
                </p>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '28px 0 12px 0' }}>
                  5. Nhiệt độ và điện năng tiêu thụ
                </h2>
                <p>
                  Ryzen 7 7800X3D chỉ tiêu thụ trung bình 55W - 75W khi chơi game, rất mát mẻ với tản nhiệt khí thông thường. Trong khi đó, Core i9-14900K yêu cầu tản nhiệt nước AIO 360mm cao cấp để tránh hiện tượng thermal throttling khi ép tải 100%.
                </p>

                {/* Commercial Callout Banner matching Image 5 */}
                <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '16px', padding: '24px', margin: '32px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <i className="fa-solid fa-screwdriver-wrench" style={{ color: '#0A5BFF', fontSize: '18px' }}></i>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E40AF' }}>
                      Bạn đang cần build dàn PC Gaming đỉnh cao?
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#334155', lineHeight: '1.5' }}>
                    Hệ thống PC Builder thông minh tự động kiểm tra tương thích phần cứng và ước tính nguồn PSU chuẩn xác 100%.
                  </p>
                  <Link
                    to="/build-pc"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#0A5BFF',
                      color: '#FFFFFF',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    BUILD PC NGAY <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #E2E8F0', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Đã sao chép liên kết bài viết!');
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-share-nodes"></i> Chia sẻ bài viết
                  </button>

                  <Link
                    to="/post"
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Quay lại tin tức
                  </Link>
                </div>
              </div>
            </article>

            {/* Right: Sidebar (TOC & Related) */}
            <aside className="news-sidebar">
              {/* Box 1: Table of Contents */}
              <div className="news-sidebar-widget" style={{ position: 'sticky', top: '20px' }}>
                <h3 className="widget-title" style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-list-ul" style={{ color: '#0A5BFF' }}></i> Mục lục bài viết
                </h3>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <a href="#section-1" style={{ textDecoration: 'none', color: '#0A5BFF', fontWeight: 600 }}>1. Mở đầu: Cuộc đối đầu đỉnh cao</a>
                  <a href="#section-2" style={{ textDecoration: 'none', color: 'inherit' }}>2. Thông số kỹ thuật chi tiết</a>
                  <a href="#section-3" style={{ textDecoration: 'none', color: 'inherit' }}>3. Hiệu năng chơi game thực tế</a>
                  <a href="#section-4" style={{ textDecoration: 'none', color: 'inherit' }}>4. Hiệu năng làm việc đa nhiệm</a>
                  <a href="#section-5" style={{ textDecoration: 'none', color: 'inherit' }}>5. Nhiệt độ và điện năng tiêu thụ</a>
                </nav>

                <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '20px 0' }} />

                {/* Box 2: Quick links */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>Bài viết liên quan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedArticles.slice(0, 3).map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/post/${rel.slug}`}
                      style={{ display: 'flex', gap: '10px', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}
                    >
                      <img
                        src={rel.image}
                        alt={rel.title}
                        style={{ width: '56px', height: '42px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                        }}
                      />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rel.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom Section: Related Articles 4 Columns Grid */}
          <div style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-layer-group" style={{ color: '#0A5BFF' }}></i> BÀI VIẾT LIÊN QUAN
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Link to={`/post/${rel.slug}`} style={{ display: 'block', height: '140px', overflow: 'hidden' }}>
                    <img
                      src={rel.image}
                      alt={rel.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                      }}
                    />
                  </Link>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A5BFF', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {rel.category}
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', lineHeight: '1.4', flex: 1 }}>
                      <Link to={`/post/${rel.slug}`} style={{ color: '#0F172A', textDecoration: 'none' }}>
                        {rel.title}
                      </Link>
                    </h4>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{rel.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

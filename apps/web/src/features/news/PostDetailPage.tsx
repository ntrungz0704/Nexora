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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: dbPost } = useQuery({
    queryKey: ['post-detail', slug],
    queryFn: () => storefrontService.getPostBySlug(slug || ''),
    enabled: !!slug,
    retry: false,
  });

  const { data: dbPosts = [] } = useQuery({
    queryKey: ['posts', 'related'],
    queryFn: () => storefrontService.getPosts(6),
  });

  const article: ArticleItem = dbPost
    ? {
        id: String(dbPost.id),
        slug: dbPost.slug,
        title: dbPost.title,
        excerpt: dbPost.excerpt || '',
        content: dbPost.content,
        category: dbPost.category || 'Tin công nghệ',
        categoryKey: dbPost.category || 'all',
        image: dbPost.thumbnailUrl
          ? dbPost.thumbnailUrl.startsWith('/') || dbPost.thumbnailUrl.startsWith('http')
            ? dbPost.thumbnailUrl
            : `/${dbPost.thumbnailUrl}`
          : '/assets/images/posts/tin-tuc-1.jpg',
        date: dbPost.publishedAt
          ? new Date(dbPost.publishedAt).toLocaleDateString('vi-VN')
          : 'Hôm nay',
        author: 'Nexora Editorial',
        readTime: '5 phút đọc',
        views: dbPost.views || 0,
      }
    : ((ARTICLES_SEED.find((a) => a.slug === slug || a.id === slug) ||
        ARTICLES_SEED[2] ||
        ARTICLES_SEED[0]) as ArticleItem);

  const relatedArticles: ArticleItem[] =
    dbPosts.length > 0
      ? dbPosts
          .filter((p) => p.slug !== article.slug)
          .slice(0, 4)
          .map((p) => ({
            id: String(p.id),
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt || '',
            content: p.content,
            category: p.category || 'Tin công nghệ',
            categoryKey: p.category || 'all',
            image: p.thumbnailUrl
              ? p.thumbnailUrl.startsWith('/') || p.thumbnailUrl.startsWith('http')
                ? p.thumbnailUrl
                : `/${p.thumbnailUrl}`
              : '/assets/images/posts/tin-tuc-1.jpg',
            date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : 'Hôm nay',
            author: 'Nexora Editorial',
            readTime: '5 phút đọc',
            views: p.views || 0,
          }))
      : ARTICLES_SEED.filter((a) => a.id !== article.id).slice(0, 4);

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
          <i
            className="fa-solid fa-circle-check"
            style={{ color: '#00C8FF', fontSize: '16px' }}
          ></i>
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
            <article
              className="news-main news-detail-card"
              style={{
                background: '#FFFFFF',
                padding: '36px',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <span
                className="news-badge"
                style={{
                  display: 'inline-block',
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                }}
              >
                {article.category}
              </span>

              <h1
                className="news-detail-title"
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: '1.35',
                  margin: '0 0 16px 0',
                }}
              >
                {article.title}
              </h1>

              {article.excerpt && (
                <p
                  className="news-detail-summary"
                  style={{
                    fontSize: '15px',
                    color: '#475569',
                    lineHeight: '1.6',
                    margin: '0 0 20px 0',
                    fontStyle: 'italic',
                  }}
                >
                  {article.excerpt}
                </p>
              )}

              {/* Meta row */}
              <div
                className="news-meta news-detail-meta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #E2E8F0',
                  marginBottom: '24px',
                  fontSize: '13px',
                  color: '#64748B',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <i className="fa-solid fa-user"></i> <strong>{article.author}</strong>
                </span>
                <span>
                  <i className="fa-regular fa-calendar"></i> {article.date}
                </span>
                <span>
                  <i className="fa-regular fa-hourglass-half"></i> {article.readTime}
                </span>
                <span>
                  <i className="fa-regular fa-eye"></i> {article.views.toLocaleString()} lượt xem
                </span>
              </div>

              {/* Featured Cover Image */}
              <div
                className="news-detail-image"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  marginBottom: '28px',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <img
                  src={article.image}
                  alt={article.title}
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/assets/images/posts/cpu_i9_vs_ryzen7.jpg';
                  }}
                />
              </div>

              {/* Article Summary Callout */}
              {article.excerpt && (
                <div
                  style={{
                    backgroundColor: 'rgba(10, 91, 255, 0.06)',
                    borderLeft: '4px solid #0A5BFF',
                    borderRadius: '0 10px 10px 0',
                    padding: '16px 20px',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#0A5BFF',
                      fontSize: '13px',
                      marginBottom: '6px',
                    }}
                  >
                    <i className="fa-solid fa-circle-info"></i> Tóm tắt nhanh:
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13.5px',
                      color: 'var(--text-primary)',
                      lineHeight: '1.6',
                    }}
                  >
                    {article.excerpt}
                  </p>
                </div>
              )}

              {/* Article Sections — Live DB Content when available */}
              <div
                className="news-detail-content"
                style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-primary)' }}
              >
                {article.content ? (
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {article.content.split(/\n{2,}/).map((para, idx) => (
                      <p key={idx} style={{ margin: 0 }}>
                        {para.trim()}
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: '24px 0 12px 0',
                      }}
                    >
                      1. Mở đầu: Cuộc đối đầu đỉnh cao giữa hai gã khổng lồ
                    </h2>
                    <p>
                      Trong phân khúc CPU cao cấp dành cho game thủ và chuyên gia phần cứng năm
                      2026, câu hỏi &quot;Nên chọn Intel Core i9 hay AMD Ryzen 7 3D V-Cache?&quot;
                      luôn là chủ đề tranh luận nóng bỏng nhất. Đội ngũ kỹ thuật Nexora đã thực hiện
                      bài kiểm nghiệm thực tế trên cùng một hệ thống card đồ họa RTX 4090 và RAM
                      DDR5 6000MHz để đưa ra câu trả lời chuẩn xác.
                    </p>

                    <h2
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: '28px 0 12px 0',
                      }}
                    >
                      2. Hiệu năng thực tế &amp; đánh giá chi tiết
                    </h2>
                    <p>
                      Nhờ công nghệ bộ nhớ đệm 3D V-Cache dung lượng lớn, Ryzen 7 7800X3D tối ưu cho
                      trải nghiệm game eSports &amp; AAA, trong khi Intel Core i9-14900K vượt trội ở
                      các tác vụ đồ họa đa nhân và dựng phim chuyên nghiệp.
                    </p>
                  </>
                )}

                {/* Commercial Callout Banner matching Image 5 */}
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '32px 0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <i
                      className="fa-solid fa-screwdriver-wrench"
                      style={{ color: '#0A5BFF', fontSize: '18px' }}
                    ></i>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E40AF' }}>
                      Bạn đang cần build dàn PC Gaming đỉnh cao?
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '13.5px',
                      color: '#334155',
                      lineHeight: '1.5',
                    }}
                  >
                    Hệ thống PC Builder thông minh tự động kiểm tra tương thích phần cứng và ước
                    tính nguồn PSU chuẩn xác 100%.
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

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '20px',
                    borderTop: '1px solid #E2E8F0',
                    marginTop: '24px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Đã sao chép liên kết bài viết!');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-share-nodes"></i> Chia sẻ bài viết
                  </button>

                  <Link
                    to="/post"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
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
                <h3
                  className="widget-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0F172A',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-list-ul" style={{ color: '#0A5BFF' }}></i> Mục lục bài
                  viết
                </h3>
                <nav
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#475569',
                  }}
                >
                  <a
                    href="#section-1"
                    style={{ textDecoration: 'none', color: '#0A5BFF', fontWeight: 600 }}
                  >
                    1. Mở đầu: Cuộc đối đầu đỉnh cao
                  </a>
                  <a href="#section-2" style={{ textDecoration: 'none', color: 'inherit' }}>
                    2. Thông số kỹ thuật chi tiết
                  </a>
                  <a href="#section-3" style={{ textDecoration: 'none', color: 'inherit' }}>
                    3. Hiệu năng chơi game thực tế
                  </a>
                  <a href="#section-4" style={{ textDecoration: 'none', color: 'inherit' }}>
                    4. Hiệu năng làm việc đa nhiệm
                  </a>
                  <a href="#section-5" style={{ textDecoration: 'none', color: 'inherit' }}>
                    5. Nhiệt độ và điện năng tiêu thụ
                  </a>
                </nav>

                <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '20px 0' }} />

                {/* Box 2: Quick links */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>
                  Bài viết liên quan
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedArticles.slice(0, 3).map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/post/${rel.slug}`}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        textDecoration: 'none',
                        color: 'inherit',
                        alignItems: 'center',
                      }}
                    >
                      <img
                        src={rel.image}
                        alt={rel.title}
                        style={{
                          width: '56px',
                          height: '42px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                        }}
                      />
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#1E293B',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
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
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-layer-group" style={{ color: '#0A5BFF' }}></i> BÀI VIẾT LIÊN
              QUAN
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
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
                  <Link
                    to={`/post/${rel.slug}`}
                    style={{ display: 'block', height: '140px', overflow: 'hidden' }}
                  >
                    <img
                      src={rel.image}
                      alt={rel.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                      }}
                    />
                  </Link>
                  <div
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0A5BFF',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                      }}
                    >
                      {rel.category}
                    </span>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        margin: '0 0 10px 0',
                        lineHeight: '1.4',
                        flex: 1,
                      }}
                    >
                      <Link
                        to={`/post/${rel.slug}`}
                        style={{ color: '#0F172A', textDecoration: 'none' }}
                      >
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { ARTICLES_SEED, type ArticleItem } from './articlesData';
import type { AuthUser } from '@nexora/shared';

export const NewsPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const filteredArticles = selectedCategory === 'all'
    ? ARTICLES_SEED
    : ARTICLES_SEED.filter((a) => a.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const featured = ARTICLES_SEED[0] as ArticleItem;

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
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

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1200px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Tin tức công nghệ</span>
        </div>

        {/* Category Navigation Pills */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '28px' }}>
          {[
            { id: 'all', label: 'Tất cả bài viết' },
            { id: 'đánh giá', label: 'Đánh giá phần cứng' },
            { id: 'tin công nghệ', label: 'Tin tức & Xu hướng' },
            { id: 'thủ thuật', label: 'Thủ thuật & Tư vấn' },
            { id: 'khuyến mãi', label: 'Khuyến mãi sự kiện' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '30px',
                border: selectedCategory === cat.id ? 'none' : '1px solid #E2E8F0',
                backgroundColor: selectedCategory === cat.id ? '#0A5BFF' : '#FFFFFF',
                color: selectedCategory === cat.id ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(10, 91, 255, 0.25)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Banner Post */}
        {selectedCategory === 'all' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              marginBottom: '36px',
              boxShadow: '0 6px 25px rgba(0,0,0,0.05)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              alignItems: 'center',
            }}
          >
            <div style={{ padding: '40px' }}>
              <span style={{ backgroundColor: '#EFF6FF', color: '#0A5BFF', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                ⭐ {featured.category} Nổi Bật
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '14px 0', lineHeight: '1.4' }}>
                <Link to={`/post/${featured.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {featured.title}
                </Link>
              </h2>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                {featured.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#94A3B8' }}>
                <span><i className="fa-regular fa-user"></i> {featured.author}</span>
                <span><i className="fa-regular fa-calendar"></i> {featured.date}</span>
                <span><i className="fa-regular fa-eye"></i> {featured.views.toLocaleString()}</span>
                <span><i className="fa-regular fa-clock"></i> {featured.readTime}</span>
              </div>
            </div>
            <div style={{ height: '100%', minHeight: '320px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <img
                src={featured.image}
                alt={featured.title}
                style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/images/banner-rtx-bg.jpg';
                }}
              />
            </div>
          </div>
        )}

        {/* 2-Column Main & Sidebar Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
          {/* Left: Articles List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
              Bài viết mới nhất
            </h3>

            {filteredArticles.map((article) => (
              <div
                key={article.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  display: 'flex',
                  gap: '20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  alignItems: 'center',
                }}
              >
                <div style={{ width: '180px', height: '120px', flexShrink: 0, backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', border: '1px solid #E2E8F0' }}>
                  <img
                    src={article.image}
                    alt={article.title}
                    style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/assets/images/banner-build-pc.jpg';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A5BFF', textTransform: 'uppercase' }}>
                    {article.category}
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0 8px 0', lineHeight: '1.4' }}>
                    <Link to={`/post/${article.slug}`} style={{ color: '#0F172A', textDecoration: 'none' }}>
                      {article.title}
                    </Link>
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.excerpt}
                  </p>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#94A3B8' }}>
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Sidebar Hot Topics & Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Hot Topics */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-fire" style={{ color: '#EF4444' }}></i> Chủ đề được quan tâm
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'RTX 5090 ra mắt ngày nào?',
                  'Nên mua màn hình OLED hay Mini-LED?',
                  'Cấu hình tối thiểu chơi GTA 6 trên PC',
                  'Top laptop lập trình pin trâu nhất',
                ].map((topic, i) => (
                  <Link
                    key={i}
                    to="/posts"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#334155',
                      textDecoration: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: '#0A5BFF', fontWeight: 800 }}>#{i + 1}</span>
                    <span>{topic}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div style={{ background: 'linear-gradient(135deg, #0A5BFF 0%, #1E40AF 100%)', borderRadius: '16px', padding: '24px', color: '#FFFFFF' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0' }}>Bản tin công nghệ</h4>
              <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Đăng ký để không bỏ lỡ các tin khuyến mãi độc quyền và review công nghệ chuyên sâu.
              </p>
              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#FFFFFF', color: '#0A5BFF', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Đăng ký nhận tin
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

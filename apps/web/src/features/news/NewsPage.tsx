import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { ARTICLES_SEED, type ArticleItem } from './articlesData';
import type { AuthUser } from '@nexora/shared';

const FILTER_PILLS = [
  { key: 'all', title: 'Tất cả', icon: 'fa-solid fa-layer-group' },
  { key: 'ai', title: '✨ AI & Copilot+', icon: 'fa-solid fa-wand-magic-sparkles', isAi: true },
  { key: 'review', title: 'Đánh giá & Review', icon: 'fa-solid fa-star' },
  { key: 'guide', title: 'Tư vấn chọn mua', icon: 'fa-solid fa-compass' },
  { key: 'howto', title: 'Mẹo hay & Thủ thuật', icon: 'fa-solid fa-sliders' },
  { key: 'comparison', title: 'So sánh sản phẩm', icon: 'fa-solid fa-code-compare' },
];

export const NewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [searchKeyword, setSearchKeyword] = useState('');

  const activeCategory = searchParams.get('category') || 'all';
  const queryQ = searchParams.get('q') || '';

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

  const filteredArticles = ARTICLES_SEED.filter((a) => {
    if (activeCategory === 'ai' && !a.category.includes('AI') && !a.title.includes('AI')) return false;
    if (activeCategory === 'review' && !a.category.includes('Đánh giá')) return false;
    if (activeCategory === 'guide' && !a.category.includes('Tư vấn')) return false;
    if (activeCategory === 'howto' && !a.category.includes('Thủ thuật') && !a.category.includes('Mẹo')) return false;
    if (activeCategory === 'comparison' && !a.category.includes('So sánh')) return false;
    if (queryQ.trim()) {
      const q = queryQ.toLowerCase().trim();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchExcerpt = a.excerpt.toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt) return false;
    }
    return true;
  });

  const featured = ARTICLES_SEED[0] as ArticleItem;
  const heroPopular = ARTICLES_SEED.slice(1, 4);
  const mainArticles = activeCategory === 'all' && !queryQ ? ARTICLES_SEED.slice(1) : filteredArticles;
  const popularArticles = ARTICLES_SEED.slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchKeyword.trim()) {
      params.set('q', searchKeyword.trim());
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleSelectPill = (key: string) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'all') {
      params.delete('category');
    } else {
      params.set('category', key);
    }
    setSearchParams(params);
  };

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

      <main style={{ minHeight: '600px', paddingBottom: '40px' }}>
        {/* Breadcrumb */}
        <section className="container breadcrumb">
          <Link to="/">Trang chủ</Link> <i className="fa-solid fa-chevron-right"></i>
          <span>Tin tức công nghệ</span>
        </section>

        <section className="container news-page">
          {/* 1. Category Navigation & Search */}
          <div className="news-category-section news-category-section--aaa">
            <header className="news-intro-header">
              <div className="news-intro-text">
                <h1 className="news-intro-title">Tin Tức Công Nghệ</h1>
                <p className="news-intro-desc">
                  Cập nhật tin tức, đánh giá phần cứng & hướng dẫn chọn mua mới nhất
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="news-search-form">
                <div className="news-search-input-wrapper">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Tìm bài viết, thủ thuật..."
                    aria-label="Tìm kiếm bài viết"
                  />
                  <button type="submit" className="news-search-submit-btn" aria-label="Tìm kiếm">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                  {queryQ && (
                    <button
                      type="button"
                      className="news-search-clear-btn"
                      onClick={() => {
                        setSearchKeyword('');
                        const p = new URLSearchParams(searchParams);
                        p.delete('q');
                        setSearchParams(p);
                      }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
              </form>
            </header>

            {/* Filter Pills */}
            <div className="news-filter-controls">
              <nav className="news-type-pills news-type-pills--streamlined">
                {FILTER_PILLS.map((pill) => {
                  const isActive = activeCategory === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => handleSelectPill(pill.key)}
                      className={`news-type-pill ${pill.isAi ? 'news-type-pill--ai' : ''} ${isActive ? 'is-active' : ''}`}
                    >
                      <i className={pill.icon}></i>
                      <span>{pill.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 2. Nổi bật nhất (Chỉ hiển thị khi ở tab Tất cả và không search) */}
          {activeCategory === 'all' && !queryQ && (
            <>
              <h3 className="news-section-title">Nổi bật nhất</h3>
              <div className="news-hero-grid">
                {/* Big Featured Article */}
                <div className="news-featured">
                  <Link to={`/post/${featured.slug}`} className="news-featured__img">
                    <img
                      src={featured.image}
                      alt={featured.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                      }}
                    />
                  </Link>
                  <div className="news-featured__content">
                    <span className="news-badge">{featured.category}</span>
                    <h2>
                      <Link to={`/post/${featured.slug}`}>{featured.title}</Link>
                    </h2>
                    <p>{featured.excerpt}</p>
                    <div className="news-meta">
                      <span>
                        <i className="fa-solid fa-user"></i> {featured.author}
                      </span>
                      <span>
                        <i className="fa-regular fa-clock"></i> {featured.date}
                      </span>
                      <span>
                        <i className="fa-regular fa-hourglass-half"></i> {featured.readTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Hero Popular Stacked Cards */}
                <div className="news-hero-popular">
                  {heroPopular.map((pop) => (
                    <div key={pop.id} className="news-hero-popular-item">
                      <Link to={`/post/${pop.slug}`} className="news-hero-popular__img">
                        <img
                          src={pop.image}
                          alt={pop.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-2.jpg';
                          }}
                        />
                      </Link>
                      <div className="news-hero-popular__content">
                        <h4>
                          <Link to={`/post/${pop.slug}`}>{pop.title}</Link>
                        </h4>
                        <div className="news-meta">
                          <span>
                            <i className="fa-regular fa-clock"></i> {pop.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 3. Bài viết mới nhất (2 Columns Layout) */}
          <div className="news-layout">
            <div className="news-main">
              <div className="news-main-header">
                <h3 className="news-section-title">
                  {queryQ ? `Kết quả tìm kiếm cho "${queryQ}"` : 'Bài viết mới nhất'}
                </h3>
              </div>

              {mainArticles.length > 0 ? (
                <div className="news-list">
                  {mainArticles.map((article) => (
                    <div key={article.id} className="news-horizontal-card">
                      <Link to={`/post/${article.slug}`} className="news-horizontal-card__img">
                        <img
                          src={article.image}
                          alt={article.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/posts/tin-tuc-1.jpg';
                          }}
                        />
                      </Link>
                      <div className="news-horizontal-card__content">
                        <span className="news-badge">{article.category}</span>
                        <h4>
                          <Link to={`/post/${article.slug}`}>{article.title}</Link>
                        </h4>
                        <p className="news-horizontal-card__summary">{article.excerpt}</p>
                        <div className="news-meta">
                          <span>
                            <i className="fa-regular fa-clock"></i> {article.date}
                          </span>
                          <span>
                            <i className="fa-regular fa-hourglass-half"></i> {article.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="news-empty" style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: '36px', color: '#94A3B8', marginBottom: '12px' }}></i>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Chưa có bài viết nào phù hợp</h4>
                  <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 20px 0' }}>Hãy thử chọn chuyên mục khác hoặc tìm kiếm với từ khóa khác.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                      setSearchKeyword('');
                    }}
                    className="btn btn--primary"
                    style={{ padding: '8px 20px', borderRadius: '8px', background: '#0A5BFF', color: '#FFFFFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Xem lại tất cả bài viết
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="news-sidebar">
              {/* Box 1: Xem nhiều gần đây */}
              <div className="news-sidebar-widget">
                <h3 className="widget-title">Xem nhiều gần đây</h3>
                <div className="news-popular-list">
                  {popularArticles.map((pop, idx) => (
                    <div key={pop.id} className="news-popular-item">
                      <span className={`popular-rank rank-${idx + 1}`}>{idx + 1}</span>
                      <div className="popular-info">
                        <h4>
                          <Link to={`/post/${pop.slug}`}>{pop.title}</Link>
                        </h4>
                        <span className="popular-date">
                          <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                          {pop.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Xu hướng tìm kiếm */}
              <div className="news-sidebar-widget">
                <h3 className="widget-title">🔥 Xu hướng tìm kiếm</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['RTX 5090', 'Core Ultra 9', 'OLED Gaming', 'Build PC AI', 'Bàn phím cơ', 'Wi-Fi 7'].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        const p = new URLSearchParams();
                        p.set('q', tag);
                        setSearchParams(p);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Box 3: Mua theo nhu cầu */}
              <div className="news-sidebar-widget">
                <h3 className="widget-title">Mua theo nhu cầu</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    to="/search?cat=laptop-gaming"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: '#1E293B',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <i className="fa-solid fa-gamepad" style={{ color: '#0A5BFF' }}></i>
                    <span>Laptop Gaming & Đồ họa</span>
                  </Link>
                  <Link
                    to="/search?cat=pc-nexora"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: '#1E293B',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <i className="fa-solid fa-desktop" style={{ color: '#0A5BFF' }}></i>
                    <span>PC Workstation AI & DeepSeek</span>
                  </Link>
                  <Link
                    to="/search?cat=man-hinh"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: '#1E293B',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <i className="fa-solid fa-tv" style={{ color: '#0A5BFF' }}></i>
                    <span>Màn hình 4K OLED 240Hz</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

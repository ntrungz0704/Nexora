import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthUser, CategoryDto } from '@nexora/shared';

interface StorefrontHeaderProps {
  categories: CategoryDto[];
  cartCount: number;
  wishlistCount: number;
  currentUser: AuthUser | null;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleCategoryMenu?: () => void;
  isCategoryMenuOpen?: boolean;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  categories,
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onToggleCategoryMenu,
  isCategoryMenuOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark-mode') : false,
  );
  const navigate = useNavigate();

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark-mode', nextDark);
    localStorage.setItem('techpilot-theme', nextDark ? 'dark' : 'light');
    localStorage.setItem('nexora-theme', nextDark ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !selectedCat) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCat) params.set('cat', selectedCat);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      {/* 1. TechPilot Top Bar (Static marquee, outside sticky header stack) */}
      <div className="techpilot-topbar">
        <div className="container techpilot-topbar__container">
          <div className="techpilot-topbar__viewport">
            <div className="techpilot-topbar__track">
              {/* Group 1 */}
              <div className="techpilot-topbar__group">
                <Link to="/search" className="techpilot-topbar__message">
                  <i className="fa-solid fa-shield" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Sản phẩm chính hãng – Xuất VAT đầy đủ
                  </span>
                </Link>
                <Link to="/search?promo=1" className="techpilot-topbar__message">
                  <i className="fa-solid fa-truck-fast" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Giao nhanh – Miễn phí cho đơn từ 300K
                  </span>
                </Link>
                <Link to="/thu-cu-doi-moi" className="techpilot-topbar__message">
                  <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Thu cũ giá tốt – Lên đời tiết kiệm
                  </span>
                </Link>
              </div>
              {/* Group 2 (Clone for infinite marquee) */}
              <div className="techpilot-topbar__group" aria-hidden="true">
                <Link to="/search" className="techpilot-topbar__message" tabIndex={-1}>
                  <i className="fa-solid fa-shield" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Sản phẩm chính hãng – Xuất VAT đầy đủ
                  </span>
                </Link>
                <Link to="/search?promo=1" className="techpilot-topbar__message" tabIndex={-1}>
                  <i className="fa-solid fa-truck-fast" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Giao nhanh – Miễn phí cho đơn từ 300K
                  </span>
                </Link>
                <Link to="/thu-cu-doi-moi" className="techpilot-topbar__message" tabIndex={-1}>
                  <i className="fa-solid fa-rotate" aria-hidden="true"></i>
                  <span className="techpilot-topbar__text">
                    Thu cũ giá tốt – Lên đời tiết kiệm
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="techpilot-topbar__actions">
            <Link to="/stores" className="techpilot-topbar__action">
              <i className="fa-solid fa-store" aria-hidden="true"></i>
              <span className="techpilot-topbar__action-text">Cửa hàng gần bạn</span>
            </Link>
            <Link to="/order-tracking" className="techpilot-topbar__action">
              <i className="fa-solid fa-file-invoice" aria-hidden="true"></i>
              <span className="techpilot-topbar__action-text">Tra cứu đơn hàng</span>
            </Link>
            <a href="tel:18002097" className="techpilot-topbar__action techpilot-topbar__action--hotline">
              <i className="fa-solid fa-phone" aria-hidden="true"></i>
              <span>1800 2097</span>
            </a>
          </div>
        </div>
      </div>
      <div id="commerceHeaderSentinel" aria-hidden="true"></div>

      {/* 2. Commerce Sticky Header Stack */}
      <div className="commerce-header-stack" id="commerceHeaderStack">

      {/* 2. Main Header */}
      <header className="site-header">
        <div className="container site-header__inner">
          {/* Logo & Category Toggle */}
          <div className="header-left-group">
            <Link
              to="/"
              className="logo"
              style={{ display: 'flex', alignItems: 'center', gap: '1px', textDecoration: 'none' }}
            >
              <img
                src="/assets/images/logo.png"
                alt="TechPilot Logo"
                style={{ height: '40px', objectFit: 'contain', display: 'block' }}
              />
              <div className="logo-brand-info">
                <span className="logo-brand-title">
                  Tech<span>Pilot</span>
                </span>
              </div>
            </Link>

            <button
              type="button"
              className="category-toggle desktop-only-link"
              id="categoryMenuToggle"
              onClick={onToggleCategoryMenu}
              aria-expanded={isCategoryMenuOpen}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Danh mục</span>
              <i className="category-toggle__chevron fa-solid fa-chevron-down"></i>
            </button>
          </div>

          {/* Search Bar */}
          <form className="search-bar" onSubmit={handleSearch} id="headerSearchForm">
            <input
              type="text"
              name="q"
              placeholder="Bạn muốn mua gì hôm nay? Đang giảm giá 50%..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <select
              name="cat"
              className="search-bar__select"
              aria-label="Chọn danh mục tìm kiếm"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" aria-label="Tìm kiếm">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>

          {/* Actions: Wishlist, Cart, User, Theme */}
          <div className="header-actions">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="header-actions__item header-action header-action--wishlist"
              title="Danh sách sản phẩm yêu thích"
            >
              <div className="header-action__icon-wrapper" style={{ position: 'relative' }}>
                <i className="fa-regular fa-heart header-action__icon" aria-hidden="true"></i>
                <span
                  className="wishlist-badge"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: wishlistCount > 0 ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--surface-card, #FFFFFF)',
                    padding: '0 3px',
                    transform: 'translate(30%, -30%)',
                  }}
                >
                  {wishlistCount}
                </span>
              </div>
              <span className="header-actions__label header-action__label">Yêu thích</span>
            </Link>

            {/* Cart */}
            <button
              type="button"
              onClick={onOpenCart}
              className="header-actions__item header-action header-action--cart"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Giỏ hàng của bạn"
            >
              <div className="header-action__icon-wrapper" style={{ position: 'relative' }}>
                <i className="fa-solid fa-cart-shopping header-action__icon" aria-hidden="true"></i>
                <span
                  className="cart-badge"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'var(--primary, #0A5BFF)',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: cartCount > 0 ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--surface-card, #FFFFFF)',
                    padding: '0 3px',
                    transform: 'translate(30%, -30%)',
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </div>
              <span className="header-actions__label header-action__label">Giỏ hàng</span>
            </button>

            {/* Account */}
            {currentUser ? (
              <div
                className="header-actions__item header-action header-action--account dropdown"
                style={{ position: 'relative' }}
              >
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  <i className="fa-solid fa-circle-user header-action__icon" aria-hidden="true"></i>
                  <span className="header-actions__label header-action__label">
                    {currentUser.fullName}
                  </span>
                  <i
                    className="fa-solid fa-chevron-down dropdown__chevron"
                    aria-hidden="true"
                    style={{ fontSize: '10px' }}
                  ></i>
                </button>

                {isAccountDropdownOpen && (
                  <div
                    className="dropdown__menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      backgroundColor: 'var(--surface-card, #FFFFFF)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-hover)',
                      minWidth: '180px',
                      padding: '8px 0',
                      zIndex: 1000,
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Vai trò: <strong style={{ color: 'var(--primary)' }}>{currentUser.role}</strong>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                      }}
                    >
                      <i className="fa-solid fa-user"></i> Trang cá nhân
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                      }}
                    >
                      <i className="fa-solid fa-box-open"></i> Đơn hàng của tôi
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        onLogout();
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        color: '#EF4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="header-actions__item header-action header-action--account"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                title="Đăng nhập tài khoản"
              >
                <i className="fa-regular fa-circle-user header-action__icon" aria-hidden="true"></i>
                <span className="header-actions__label header-action__label">Đăng nhập</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              className="header-actions__item theme-toggle"
              id="themeToggle"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* 3. Main Navigation Bar */}
        <nav className="main-nav" id="mainNavMenu">
          <div className="container main-nav__inner">
            <ul className="main-nav__links">
              <li>
                <Link to="/" className="is-active">
                  Trang chủ
                </Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=pc-nexora">PC Gaming</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=laptop">Laptop</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=main-cpu-vga">Linh kiện PC</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=man-hinh">Màn hình</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/build-pc" style={{ color: '#FACC15', fontWeight: 700 }}>
                  <i
                    className="fa-solid fa-screwdriver-wrench"
                    style={{ marginRight: '4px' }}
                  ></i>{' '}
                  Xây dựng cấu hình
                </Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=ban-phim">Gaming Gear</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/search?cat=thiet-bi-van-phong">Thiết bị văn phòng</Link>
              </li>
              <li>
                <Link to="/search?promo=1" className="text-hot">
                  Khuyến mãi <span className="dot-hot"></span>
                </Link>
              </li>
              <li>
                <Link to="/posts">Tin công nghệ</Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/ai-assistant" style={{ color: '#8B5CF6', fontWeight: 700 }}>
                  <i
                    className="fa-solid fa-wand-magic-sparkles"
                    style={{ marginRight: '4px' }}
                  ></i>{' '}
                  AI Tư vấn
                </Link>
              </li>
              <li className="desktop-only-link">
                <Link to="/compare" style={{ color: '#10B981', fontWeight: 700 }}>
                  <i className="fa-solid fa-scale-balanced" style={{ marginRight: '4px' }}></i> So
                  sánh
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    </div>
    </>
  );
};

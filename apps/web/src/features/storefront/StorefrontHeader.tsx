import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { getProductImage } from '../../lib/productImage';
import { CategorySidebar } from './CategorySidebar';
import type { AuthUser, CategoryDto } from '@nexora/shared';

interface StorefrontHeaderProps {
  categories: CategoryDto[];
  cartCount: number;
  wishlistCount: number;
  currentUser: AuthUser | null;
  onOpenCart?: () => void;
  onOpenAuth?: () => void;
  onLogout: () => void;
  onToggleCategoryMenu?: () => void;
  isCategoryMenuOpen?: boolean;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  categories,
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart: _onOpenCart,
  onOpenAuth: _onOpenAuth,
  onLogout,
  onToggleCategoryMenu,
  isCategoryMenuOpen: controlledCategoryMenuOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [internalCategoryMenuOpen, setInternalCategoryMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark-mode') : false,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLFormElement>(null);

  const searchParams = new URLSearchParams(location.search);
  const currentPath = location.pathname;
  const currentCat = (searchParams.get('cat') || '').toLowerCase();
  const isPromo = searchParams.get('promo') === '1';

  const isHomeActive = currentPath === '/' && !currentCat && !isPromo;
  const isPcActive = currentCat === 'pc' || currentPath === '/category/pc';
  const isLaptopActive = currentCat === 'laptop' || currentPath === '/category/laptop';
  const isComponentsActive = currentCat === 'pc-linh-kien' || currentCat === 'linh-kien-pc' || currentCat === 'main-cpu-vga' || currentCat === 'case-nguon-tan' || currentPath.includes('/category/linh-kien');
  const isMonitorActive = currentCat === 'man-hinh' || currentCat === 'monitor' || currentPath === '/category/monitor';
  const isBuildPcActive = currentPath === '/build-pc' || currentPath === '/pc-builder';
  const isGearActive = currentCat === 'gaming-gear' || currentCat === 'chuot-lot-chuot' || currentCat === 'chuot' || currentCat === 'ban-phim' || currentCat === 'tai-nghe' || currentCat === 'ghe-ban' || currentCat === 'mouse' || currentCat === 'keyboard' || currentCat === 'headset';
  const isOfficeActive = currentCat === 'thiet-bi-van-phong' || currentCat === 'office-gear' || currentCat === 'office-equipment';
  const isPromoActive = isPromo;
  const isNewsActive = currentPath.startsWith('/post') || currentPath.startsWith('/news') || currentPath.startsWith('/tin-tuc');
  const isAiActive = currentPath === '/ai-assistant';
  const isCompareActive = currentPath === '/compare';

  const isCategoryMenuOpen = controlledCategoryMenuOpen ?? internalCategoryMenuOpen;

  // Debounce live search typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Live search products query
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['live-search', debouncedQuery, selectedCat],
    queryFn: () => storefrontService.getProducts({ q: debouncedQuery, category: selectedCat, limit: 6 }),
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000,
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setInternalCategoryMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCategoryMenu = () => {
    if (onToggleCategoryMenu) {
      onToggleCategoryMenu();
    } else {
      setInternalCategoryMenuOpen((prev) => !prev);
    }
  };

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
    setIsSearchFocused(false);
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
              style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              title="Nexora — Hệ Thống Bán Lẻ Máy Tính & Linh Kiện Chính Hãng"
            >
              <img
                src="/assets/images/logo.png"
                alt="Nexora Logo"
                style={{ height: '38px', width: 'auto', objectFit: 'contain', display: 'block' }}
              />
            </Link>

            <button
              type="button"
              className={`category-toggle desktop-only-link ${isCategoryMenuOpen ? 'is-active' : ''}`}
              id="categoryMenuToggle"
              onClick={handleToggleCategoryMenu}
              aria-expanded={isCategoryMenuOpen}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Danh mục</span>
              <i className="category-toggle__chevron fa-solid fa-chevron-down"></i>
            </button>
          </div>

          {/* Search Bar with Real-time Live Instant Search */}
          <form
            ref={searchContainerRef}
            className="search-bar"
            onSubmit={handleSearch}
            id="headerSearchForm"
            style={{ position: 'relative' }}
          >
            <input
              type="text"
              name="q"
              placeholder="Bạn muốn mua gì hôm nay? Đang giảm giá 50%..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
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

            {/* Live Search Instant Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="search-autocomplete-dropdown" role="listbox">
                {isSearching || debouncedQuery !== searchQuery.trim() ? (
                  <div className="search-autocomplete-loading">
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                    Đang tìm kiếm sản phẩm cho "<strong>{searchQuery.trim()}</strong>"...
                  </div>
                ) : searchResults && searchResults.products.length > 0 ? (
                  <>
                    <div className="search-autocomplete-header">
                      Gợi ý sản phẩm cho "<strong>{debouncedQuery}</strong>" ({searchResults.total} kết quả)
                    </div>
                    <div className="search-autocomplete-list">
                      {searchResults.products.map((p) => {
                        const price = Number(p.price);
                        const salePrice = p.salePrice ? Number(p.salePrice) : null;
                        const discount = salePrice && price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0;
                        return (
                          <Link
                            key={p.id}
                            to={`/product/detail/${p.slug}`}
                            className="search-autocomplete-item"
                            role="option"
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearchQuery('');
                            }}
                          >
                            <div className="search-item-thumb">
                              <img
                                src={getProductImage(p)}
                                alt=""
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  t.onerror = null;
                                  t.src = '/assets/images/placeholder.webp';
                                }}
                              />
                            </div>
                            <div className="search-item-info">
                              {p.category && <span className="search-item-cat">{p.category.name}</span>}
                              <div className="search-item-name">{highlightMatch(p.name, debouncedQuery)}</div>
                              <div className="search-item-price-row">
                                <span className="search-item-price-new">
                                  {(salePrice || price).toLocaleString('vi-VN')}đ
                                </span>
                                {salePrice && (
                                  <span className="search-item-price-old">
                                    {price.toLocaleString('vi-VN')}đ
                                  </span>
                                )}
                                {discount > 0 && (
                                  <span className="product-badge-discount">-{discount}%</span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      to={`/search?q=${encodeURIComponent(debouncedQuery)}${selectedCat ? `&cat=${encodeURIComponent(selectedCat)}` : ''}`}
                      className="search-autocomplete-footer"
                      onClick={() => setIsSearchFocused(false)}
                    >
                      <span>Xem tất cả {searchResults.total} sản phẩm</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </>
                ) : (
                  <div className="search-autocomplete-empty">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <p>
                      Không tìm thấy sản phẩm phù hợp với "<strong>{debouncedQuery || searchQuery.trim()}</strong>"
                    </p>
                    <span className="empty-sub">Thử tìm kiếm từ khóa khác như "Laptop", "RTX 4060", "B760"...</span>
                  </div>
                )}
              </div>
            )}
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
                    display: currentUser && wishlistCount > 0 ? 'flex' : 'none',
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

            {/* Cart: Dedicated Page /cart as in TechPilot */}
            <Link
              to="/cart"
              className="header-actions__item header-action header-action--cart"
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
            </Link>

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
                    {(currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') && (
                      <Link
                        to="/admin"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 16px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#0A5BFF',
                          backgroundColor: 'rgba(10, 91, 255, 0.08)',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="fa-solid fa-user-shield"></i> Trang quản trị
                      </Link>
                    )}
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
              <Link
                to="/auth/login"
                className="header-actions__item header-action header-action--account"
                title="Đăng nhập tài khoản"
              >
                <i className="fa-regular fa-circle-user header-action__icon" aria-hidden="true"></i>
                <span className="header-actions__label header-action__label">Đăng nhập</span>
              </Link>
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
      </header>

      {/* 3. Main Navigation Bar */}
      <nav className="main-nav" id="mainNavMenu">
        <div className="container main-nav__inner">
          <ul className="main-nav__links">
            <li>
              <Link to="/" className={isHomeActive ? 'is-active' : ''}>
                Trang chủ
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=pc" className={isPcActive ? 'is-active' : ''}>
                PC Gaming
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=laptop" className={isLaptopActive ? 'is-active' : ''}>
                Laptop
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=pc-linh-kien" className={isComponentsActive ? 'is-active' : ''}>
                Linh kiện PC
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=man-hinh" className={isMonitorActive ? 'is-active' : ''}>
                Màn hình
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link
                to="/build-pc"
                className={isBuildPcActive ? 'is-active' : ''}
                style={{ color: '#FACC15', fontWeight: 700 }}
              >
                <i
                  className="fa-solid fa-screwdriver-wrench"
                  style={{ marginRight: '4px' }}
                ></i>{' '}
                Xây dựng cấu hình
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=gaming-gear" className={isGearActive ? 'is-active' : ''}>
                Gaming Gear
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link to="/search?cat=thiet-bi-van-phong" className={isOfficeActive ? 'is-active' : ''}>
                Thiết bị văn phòng
              </Link>
            </li>
            <li>
              <Link to="/search?promo=1" className={`text-hot ${isPromoActive ? 'is-active' : ''}`}>
                Khuyến mãi <span className="dot-hot"></span>
              </Link>
            </li>
            <li>
              <Link to="/post" className={isNewsActive ? 'is-active' : ''}>
                Tin công nghệ
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link
                to="/ai-assistant"
                className={isAiActive ? 'is-active' : ''}
                style={{ color: '#8B5CF6', fontWeight: 700 }}
              >
                <i
                  className="fa-solid fa-wand-magic-sparkles"
                  style={{ marginRight: '4px' }}
                ></i>{' '}
                AI Tư vấn
              </Link>
            </li>
            <li className="desktop-only-link">
              <Link
                to="/compare"
                className={isCompareActive ? 'is-active' : ''}
                style={{ color: '#10B981', fontWeight: 700 }}
              >
                <i className="fa-solid fa-scale-balanced" style={{ marginRight: '4px' }}></i> So
                sánh
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* 4. Category Mega Menu Dropdown */}
      {isCategoryMenuOpen && (
        <CategorySidebar
          isStatic={false}
          onClose={() => setInternalCategoryMenuOpen(false)}
        />
      )}
    </div>
    </>
  );
};

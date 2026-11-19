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
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  categories,
  cartCount,
  wishlistCount,
  currentUser,
  onOpenCart,
  onOpenAuth,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !selectedCat) return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCat) params.set('cat', selectedCat);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 shadow-md">
      {/* 1. Top Utility Bar */}
      <div className="bg-slate-950 text-xs text-slate-300 py-1.5 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-6 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <i className="fa-solid fa-shield-halved"></i>
              Sản phẩm chính hãng - Xuất VAT đầy đủ
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-sky-400">
              <i className="fa-solid fa-truck-fast"></i>
              Giao nhanh - Miễn phí đơn từ 300K
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-amber-400">
              <i className="fa-solid fa-arrows-rotate"></i>
              Thu cũ đổi mới - Lên đời tiết kiệm
            </span>
          </div>
          <div className="flex items-center space-x-5 text-slate-400 font-medium">
            <Link to="/stores" className="hover:text-blue-400 transition flex items-center gap-1">
              <i className="fa-solid fa-location-dot"></i>
              Cửa hàng gần bạn
            </Link>
            <Link
              to="/order-tracking"
              className="hover:text-blue-400 transition flex items-center gap-1"
            >
              <i className="fa-solid fa-clipboard-list"></i>
              Tra cứu đơn hàng
            </Link>
            <a
              href="tel:18002097"
              className="text-rose-400 hover:text-rose-300 transition flex items-center gap-1 font-bold"
            >
              <i className="fa-solid fa-phone"></i>
              1800 2097
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Category Button */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-bolt text-white text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1">
                Nex<span className="text-blue-500">ora</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-1">
                Tech Hardware
              </span>
            </div>
          </Link>

          {/* Desktop Category Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white font-medium text-sm border border-slate-700/60 transition shadow-sm"
            >
              <i className="fa-solid fa-layer-group text-blue-400"></i>
              <span>Danh mục</span>
              <i
                className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
              ></i>
            </button>
          </div>
        </div>

        {/* Center: Search Bar with Category Dropdown */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex items-center">
          <div className="w-full flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-inner focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
            <input
              type="text"
              placeholder="Bạn muốn mua gì hôm nay? Đang giảm giá 50%..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-transparent text-white placeholder-slate-400 focus:outline-none"
            />
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="hidden xl:block bg-slate-900 text-xs text-slate-300 border-l border-slate-800 px-3 py-2.5 focus:outline-none cursor-pointer hover:bg-slate-850"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 transition flex items-center justify-center font-medium"
              aria-label="Tìm kiếm"
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </button>
          </div>
        </form>

        {/* Right: Actions (Wishlist, Cart, User, Theme) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition relative"
            title="Sản phẩm yêu thích"
          >
            <div className="relative">
              <i className="fa-regular fa-heart text-xl text-slate-300"></i>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="hidden xl:inline text-xs font-medium">Yêu thích</span>
          </Link>

          {/* Cart Button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition relative"
            title="Giỏ hàng của bạn"
          >
            <div className="relative">
              <i className="fa-solid fa-cart-shopping text-xl text-blue-400"></i>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium">Giỏ hàng</span>
              <span className="text-[10px] text-slate-400 font-semibold">{cartCount} sản phẩm</span>
            </div>
          </button>

          {/* User Account / Login */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-white transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                  {currentUser.fullName}
                </span>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Đăng nhập với vai trò</p>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400">
                      {currentUser.role}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    <i className="fa-solid fa-user mr-2 text-slate-400"></i> Trang cá nhân
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    <i className="fa-solid fa-box mr-2 text-slate-400"></i> Đơn hàng của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center"
                  >
                    <i className="fa-solid fa-right-from-bracket mr-2"></i> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <i className="fa-solid fa-user"></i>
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Secondary Navigation Bar */}
      <nav className="bg-slate-900/90 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 py-1.5 text-xs font-semibold whitespace-nowrap">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-blue-400 bg-blue-950/60 border border-blue-800/40 font-bold"
          >
            Trang chủ
          </Link>
          <Link
            to="/category/laptop-gaming"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Laptop Gaming
          </Link>
          <Link
            to="/category/pc-nexora"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            PC Nexora
          </Link>
          <Link
            to="/category/main-cpu-vga"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Linh kiện PC
          </Link>
          <Link
            to="/category/man-hinh"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Màn hình
          </Link>
          <Link
            to="/build-pc"
            className="px-3 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30 transition flex items-center gap-1.5 font-bold"
          >
            <i className="fa-solid fa-screwdriver-wrench"></i>
            Xây dựng cấu hình
          </Link>
          <Link
            to="/category/ban-phim"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Gaming Gear
          </Link>
          <Link
            to="/category/thiet-bi-van-phong"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Thiết bị văn phòng
          </Link>
          <Link
            to="/promotions"
            className="px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition flex items-center gap-1.5 font-bold"
          >
            <i className="fa-solid fa-fire"></i>
            Khuyến mãi
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </Link>
          <Link
            to="/ai-assistant"
            className="px-3 py-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition flex items-center gap-1.5 font-bold"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            AI Tư vấn
          </Link>
          <Link
            to="/compare"
            className="px-3 py-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition flex items-center gap-1.5 font-bold"
          >
            <i className="fa-solid fa-scale-balanced"></i>
            So sánh
          </Link>
          <Link
            to="/foundation"
            className="px-3 py-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-800/40 transition flex items-center gap-1.5 font-medium ml-auto"
            title="Xem báo cáo nền tảng, database và API"
          >
            <i className="fa-solid fa-server"></i>
            Kiến trúc nền tảng
          </Link>
        </div>
      </nav>
    </header>
  );
};

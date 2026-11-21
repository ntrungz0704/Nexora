import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';
import { rankComparedProducts } from '@nexora/shared';

interface CompareCategoryDef {
  key: string;
  label: string;
  slug: string;
  icon: string;
}

const COMPARE_CATEGORIES: CompareCategoryDef[] = [
  { key: 'laptop', label: 'Laptop', slug: 'laptop', icon: 'fa-laptop' },
  { key: 'pc', label: 'PC Lắp Sẵn', slug: 'pc', icon: 'fa-desktop' },
  { key: 'monitor', label: 'Màn hình', slug: 'monitor', icon: 'fa-tv' },
  { key: 'cpu', label: 'CPU', slug: 'cpu', icon: 'fa-microchip' },
  { key: 'mainboard', label: 'Bo mạch chủ', slug: 'mainboard', icon: 'fa-chess-board' },
  { key: 'vga', label: 'Card màn hình (VGA)', slug: 'vga', icon: 'fa-images' },
  { key: 'ram', label: 'RAM', slug: 'ram', icon: 'fa-memory' },
  { key: 'storage', label: 'Ổ cứng (SSD/HDD)', slug: 'storage', icon: 'fa-hard-drive' },
  { key: 'psu', label: 'Nguồn máy tính (PSU)', slug: 'psu', icon: 'fa-bolt' },
  { key: 'case', label: 'Vỏ Case', slug: 'case', icon: 'fa-box' },
  { key: 'cooling', label: 'Tản nhiệt', slug: 'cooling', icon: 'fa-snowflake' },
  { key: 'keyboard', label: 'Bàn phím', slug: 'keyboard', icon: 'fa-keyboard' },
  { key: 'mouse', label: 'Chuột', slug: 'mouse', icon: 'fa-computer-mouse' },
  { key: 'headset', label: 'Tai nghe', slug: 'headset', icon: 'fa-headphones' },
  { key: 'chair', label: 'Ghế Gaming', slug: 'chair', icon: 'fa-chair' },
];

interface PersonaOption {
  code: string;
  label: string;
  desc: string;
}

const PERSONAS_MAP: Record<string, PersonaOption[]> = {
  laptop: [
    {
      code: 'student',
      label: '🎓 Học sinh / Sinh viên',
      desc: 'Tối ưu mức giá, pin trâu, mỏng nhẹ di chuyển',
    },
    {
      code: 'office',
      label: '💼 Nhân viên văn phòng',
      desc: 'Màn hình sắc nét, bàn phím gõ êm, pin dùng cả ngày',
    },
    {
      code: 'developer',
      label: '👨‍💻 Lập trình viên / Coder',
      desc: 'CPU đa nhân, RAM >= 16GB, SSD nhanh, màn hình góc nhìn rộng',
    },
    {
      code: 'gamer',
      label: '🎮 Gamer (eSports / AAA)',
      desc: 'VGA rời RTX, CPU xung cao, tản nhiệt mát, màn hình 144Hz+',
    },
    {
      code: 'creator',
      label: '🎨 Đồ họa / Dựng phim 2D-3D',
      desc: 'Màn hình chuẩn màu sRGB/DCI-P3, RAM/VGA mạnh, SSD lớn',
    },
    {
      code: 'business',
      label: '✈️ Doanh nhân / Di chuyển nhiều',
      desc: 'Trọng lượng mỏng nhẹ (< 1.4kg), vỏ kim loại sang trọng, bảo mật',
    },
  ],
  pc: [
    {
      code: 'office',
      label: '🏢 Văn phòng / Kế toán',
      desc: 'Giá tốt, tiết kiệm điện, hoạt động ổn định 24/7',
    },
    {
      code: 'developer',
      label: '👨‍💻 Lập trình / Máy chủ local',
      desc: 'CPU Intel Core i7/Ryzen 7, RAM 32GB+, SSD 1TB, nâng cấp tốt',
    },
    {
      code: 'esports',
      label: '🎯 Gaming eSports (FPS cao)',
      desc: 'CPU xung đơn nhân cao, RTX 4060/4070, RAM 16GB 3600MHz+',
    },
    {
      code: 'creator',
      label: '🎬 Dựng phim 4K / Render 3D',
      desc: 'CPU đa nhân i9/Ryzen 9, RTX 4070Ti/4080, RAM 64GB+',
    },
  ],
  monitor: [
    {
      code: 'gamer',
      label: '🎮 Game thủ (144Hz+)',
      desc: 'Tần số quét cao, phản hồi 1ms, hỗ trợ G-Sync/FreeSync',
    },
    {
      code: 'creator',
      label: '🎨 Thiết kế đồ họa (Chuẩn màu)',
      desc: 'Tấm nền IPS/OLED, độ bao phủ 100% sRGB/DCI-P3, Delta E < 2',
    },
    {
      code: 'office',
      label: '💼 Văn phòng / Lập trình',
      desc: 'Chống mỏi mắt Eye Care, xoay dọc 90 độ, cổng Type-C PD',
    },
  ],
};

const DEFAULT_PERSONAS: PersonaOption[] = [
  {
    code: 'pp',
    label: '⚡ Tối ưu hiệu năng / giá (P/P)',
    desc: 'Tối đa hóa hiệu năng trên từng đồng chi phí bỏ ra',
  },
  {
    code: 'performance',
    label: '🔥 Hiệu năng tối đa',
    desc: 'Sức mạnh xử lý cao nhất, không giới hạn ngân sách',
  },
  {
    code: 'durability',
    label: '🌱 Tiết kiệm điện & Bền bỉ',
    desc: 'Nhiệt độ mát mẻ, linh kiện cao cấp, bảo hành dài hạn',
  },
];

export const ComparePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active category selection
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(() => {
    const cat = searchParams.get('cat');
    if (cat && COMPARE_CATEGORIES.some((c) => c.key === cat || c.slug === cat)) {
      return cat;
    }
    return 'laptop';
  });

  // Selected products for comparison (IDs)
  const [comparedIds, setComparedIds] = useState<number[]>(() => {
    const addId = searchParams.get('add');
    if (addId) return [parseInt(addId, 10)];
    return [];
  });

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Selected Persona
  const currentPersonas = PERSONAS_MAP[activeCategoryKey] || DEFAULT_PERSONAS;
  const [selectedPersonaCode, setSelectedPersonaCode] = useState<string>(
    () => currentPersonas[0]?.code || 'student',
  );

  // AI Analysis State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiWinnerId, setAiWinnerId] = useState<number | null>(null);
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-full-catalog'],
    queryFn: () => storefrontService.getProducts({ limit: 1000 }),
  });
  const allProducts = useMemo(() => productsData?.products || [], [productsData]);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  const addToCartMutation = useMutation({
    mutationFn: (p: ProductDto) => cartService.addItem(p.id, 1),
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
    },
  });

  // Currently compared products
  const comparedProducts = useMemo(() => {
    return allProducts.filter((p) => comparedIds.includes(p.id));
  }, [allProducts, comparedIds]);

  // Is Category Locked? (When at least 1 product is selected)
  const isCategoryLocked = comparedProducts.length > 0;

  // Active Category Meta
  const activeCategoryMeta = useMemo(() => {
    return COMPARE_CATEGORIES.find((c) => c.key === activeCategoryKey) || COMPARE_CATEGORIES[0]!;
  }, [activeCategoryKey]);

  // Products available in current category for dropdown
  const categoryProducts = useMemo(() => {
    const targetSlug = activeCategoryMeta.slug.toLowerCase();
    return allProducts.filter((p) => {
      const catSlug = (p.category?.slug || '').toLowerCase();
      const pName = p.name.toLowerCase();
      if (targetSlug === 'pc') {
        return catSlug === 'pc' || pName.includes('pc ') || pName.includes('workstation');
      }
      return catSlug === targetSlug || catSlug.includes(targetSlug) || pName.includes(targetSlug);
    });
  }, [allProducts, activeCategoryMeta]);

  // Filtered dropdown products by search input
  const dropdownProducts = useMemo(() => {
    if (!searchInput.trim()) return categoryProducts;
    const q = searchInput.toLowerCase().trim();
    return categoryProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.brand?.name || '').toLowerCase().includes(q),
    );
  }, [categoryProducts, searchInput]);

  // Add a product to compare
  const handleAddProduct = (p: ProductDto) => {
    if (comparedIds.includes(p.id)) {
      showToast('Sản phẩm này đã có trong bảng so sánh.');
      return;
    }
    if (comparedIds.length >= 4) {
      showToast('Bảng so sánh đã đạt tối đa 4 sản phẩm.');
      return;
    }
    setComparedIds((prev) => [...prev, p.id]);
    setIsSearchDropdownOpen(false);
    setSearchInput('');
    setAiWinnerId(null);
    setAiVerdict(null);
    showToast(`Đã thêm "${p.name}" vào so sánh.`);
  };

  // Remove a product
  const handleRemoveProduct = (id: number) => {
    setComparedIds((prev) => prev.filter((item) => item !== id));
    setAiWinnerId(null);
    setAiVerdict(null);
    showToast('Đã xóa sản phẩm khỏi so sánh.');
  };

  // Switch category
  const handleSelectCategory = (catKey: string) => {
    if (isCategoryLocked) {
      showToast(
        '⚠️ Quy tắc Category Lock: Hãy xóa hết sản phẩm đang so sánh trước khi đổi danh mục.',
      );
      return;
    }
    setActiveCategoryKey(catKey);
    setComparedIds([]);
    setSearchInput('');
    setAiWinnerId(null);
    setAiVerdict(null);
  };

  // Run AI Persona Analysis using exact TechPilot parity algorithm
  const handleRunAiAnalysis = () => {
    if (comparedProducts.length < 2) {
      showToast('Cần ít nhất 2 sản phẩm để AI tiến hành phân tích và chấm điểm.');
      return;
    }
    setIsAiAnalyzing(true);
    setTimeout(() => {
      // Score and rank products dynamically based on exact TechPilot multi-criteria algorithm
      const ranked = rankComparedProducts(comparedProducts, activeCategoryKey, selectedPersonaCode);

      const winnerData = ranked[0];
      if (winnerData) {
        setAiWinnerId(winnerData.product.id);
        const personaObj =
          currentPersonas.find((p) => p.code === selectedPersonaCode) || currentPersonas[0];
        const strengthsText =
          winnerData.strengths.length > 0 ? ` (${winnerData.strengths.join(', ')})` : '';
        setAiVerdict(
          `Dựa trên thuật toán Nexora AI đối chiếu Persona "${personaObj?.label}": "${winnerData.product.name}" đạt điểm tối ưu cao nhất (${winnerData.totalScore}/100)${strengthsText} nhờ cấu hình phù hợp vượt trội và tỷ lệ hiệu năng/giá thành tối ưu cho nhu cầu này.`,
        );
      }
      setIsAiAnalyzing(false);
      showToast('✨ Đã hoàn thành phân tích AI theo Persona!');
    }, 800);
  };

  return (
    <div
      className="home-page-wrapper"
      style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}
    >
      <StorefrontHeader
        currentUser={currentUser}
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      {/* Toast Notification */}
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

      <main
        className="container"
        style={{ marginTop: '24px', minHeight: '65vh', paddingBottom: '60px' }}
      >
        {/* Breadcrumb - Exactly aligned with container and navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#64748B',
            marginBottom: '20px',
          }}
        >
          <Link
            to="/"
            style={{ color: '#64748B', textDecoration: 'none' }}
            className="hover:text-blue-600 transition-colors"
          >
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>So sánh sản phẩm</span>
        </div>

        {/* Section Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 0 6px 0',
            }}
          >
            <i className="fa-solid fa-code-compare" style={{ color: '#0A5BFF' }}></i>
            So sánh sản phẩm theo Persona (Nexora AI)
          </h2>
          <p style={{ color: '#64748B', fontSize: '14.5px', margin: 0 }}>
            Chọn danh mục trước, thêm 2-4 sản phẩm và chọn đối tượng (Persona) để hệ thống phân tích
            người chiến thắng.
          </p>
        </div>

        {/* STEP 1: Category Bar Container with Underline Tabs */}
        <div className="cat-bar-container mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-filter text-blue-600"></i> BƯỚC 1: CHỌN LOẠI SẢN PHẨM MUỐN
              SO SÁNH:
            </span>
            {isCategoryLocked && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                🔒 Đã khóa danh mục theo sản phẩm đã chọn
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 w-full border-b border-slate-200">
            {COMPARE_CATEGORIES.map((cat) => {
              const isActive = cat.key === activeCategoryKey;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleSelectCategory(cat.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    cursor: isCategoryLocked && !isActive ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'rgba(10, 91, 255, 0.06)' : 'transparent',
                    color: isActive ? '#0A5BFF' : isCategoryLocked ? '#94A3B8' : '#475569',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #0A5BFF' : '3px solid transparent',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    marginBottom: '-1px',
                    opacity: isCategoryLocked && !isActive ? 0.5 : 1,
                  }}
                  className={`cat-tab-btn ${isActive ? 'active' : ''}`}
                  title={
                    isCategoryLocked && !isActive
                      ? 'Đã khóa danh mục theo sản phẩm so sánh'
                      : cat.label
                  }
                >
                  <i className={`fa-solid ${cat.icon}`}></i>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Add Product Box */}
        {comparedProducts.length < 4 && (
          <div
            ref={searchBoxRef}
            style={{
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
              position: 'relative',
            }}
          >
            <label
              htmlFor="compareSearchInput"
              style={{
                fontWeight: 700,
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                color: 'var(--text-primary, #0F172A)',
              }}
            >
              <i className="fa-solid fa-magnifying-glass" style={{ color: '#0A5BFF' }}></i>
              Tìm & Thêm sản phẩm vào so sánh (Còn trống {4 - comparedProducts.length} vị trí)
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="compareSearchInput"
                type="text"
                placeholder="Bấm vào để xem danh sách gợi ý hoặc nhập tên sản phẩm..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border, #CBD5E1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Autocomplete Dropdown matching Image 2 */}
              {isSearchDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    border: '1px solid var(--border, #E2E8F0)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '420px',
                    overflowY: 'auto',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#0A5BFF',
                      borderBottom: '1px solid var(--border, #E2E8F0)',
                      backgroundColor: 'rgba(10, 91, 255, 0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>⚡ DANH SÁCH SẢN PHẨM [{activeCategoryMeta.label.toUpperCase()}]:</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>
                      (HIỂN THỊ {dropdownProducts.length} SẢN PHẨM)
                    </span>
                  </div>

                  {dropdownProducts.length === 0 ? (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: '#64748B',
                        fontSize: '13px',
                      }}
                    >
                      Không tìm thấy sản phẩm nào trong danh mục {activeCategoryMeta.label}.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {dropdownProducts.map((p) => {
                        const price = p.salePrice ? Number(p.salePrice) : Number(p.price);
                        const isAlreadyAdded = comparedIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 16px',
                              borderBottom: '1px solid var(--border, #F1F5F9)',
                              gap: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                minWidth: 0,
                              }}
                            >
                              <img
                                src={getProductImage(p)}
                                alt=""
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'contain',
                                  flexShrink: 0,
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    '/assets/images/placeholder.webp';
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '13.5px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary, #0F172A)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                  title={p.name}
                                >
                                  {p.name}
                                </div>
                                <div
                                  style={{ fontSize: '13px', fontWeight: 700, color: '#0A5BFF' }}
                                >
                                  {price.toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddProduct(p)}
                              disabled={isAlreadyAdded}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: isAlreadyAdded ? '#E2E8F0' : '#10B981',
                                color: isAlreadyAdded ? '#94A3B8' : '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="fa-solid fa-plus"></i>{' '}
                              {isAlreadyAdded ? 'Đã thêm' : 'Thêm so sánh'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State (Image 1) */}
        {comparedProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
            }}
          >
            <i
              className="fa-solid fa-scale-unbalanced"
              style={{ fontSize: '64px', color: '#CBD5E1', marginBottom: '20px', display: 'block' }}
            ></i>
            <h3
              style={{
                marginBottom: '10px',
                fontWeight: 800,
                fontSize: '18px',
                color: 'var(--text-primary, #0F172A)',
              }}
            >
              Chưa có sản phẩm so sánh
            </h3>
            <p style={{ color: '#64748B', marginBottom: '20px', fontSize: '14px' }}>
              Hãy bấm chọn loại sản phẩm ở trên hoặc nhập tên vào ô tìm kiếm để bắt đầu so sánh
              chuyên sâu!
            </p>
          </div>
        ) : (
          <>
            {/* STEP 2: Persona Selection Box */}
            <div className="persona-box bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
              <h4
                style={{
                  margin: '0 0 8px 0',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0F172A)',
                  fontSize: '15px',
                }}
              >
                🎯 Chọn Persona / Nhu cầu sử dụng thực tế của bạn:
              </h4>
              <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '12px' }}>
                Hệ thống sẽ thay đổi ma trận trọng số chấm điểm 100 điểm để tìm sản phẩm phù hợp
                nhất cho đối tượng này.
              </p>

              <div className="persona-pills flex flex-wrap gap-2.5 mt-2">
                {currentPersonas.map((p) => {
                  const isActive = p.code === selectedPersonaCode;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      className={`persona-pill px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        isActive
                          ? 'active border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setSelectedPersonaCode(p.code);
                        setAiWinnerId(null);
                        setAiVerdict(null);
                      }}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* AI Analysis Trigger */}
              <div
                style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  disabled={isAiAnalyzing || comparedProducts.length < 2}
                  style={{
                    padding: '12px 28px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0A5BFF 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: comparedProducts.length >= 2 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(10, 91, 255, 0.3)',
                    opacity: comparedProducts.length >= 2 ? 1 : 0.6,
                  }}
                >
                  {isAiAnalyzing ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Đang phân tích dữ liệu...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> Phân Tích & Chấm Điểm AI
                      Theo Persona
                    </>
                  )}
                </button>
                {comparedProducts.length < 2 && (
                  <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                    * Thêm ít nhất 2 sản phẩm để so sánh
                  </span>
                )}
              </div>
            </div>

            {/* AI Verdict Banner */}
            {aiVerdict && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F172A, #1E1B4B)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  color: '#FFFFFF',
                  marginBottom: '24px',
                  border: '1px solid #4338CA',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#38BDF8',
                    fontWeight: 800,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  <i className="fa-solid fa-robot"></i> Kết quả phân tích Nexora AI
                </div>
                <div style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#E2E8F0' }}>
                  {aiVerdict}
                </div>
              </div>
            )}

            {/* Comparison Table */}
            <div
              style={{
                overflowX: 'auto',
                backgroundColor: 'var(--surface-card, #FFFFFF)',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
                marginBottom: '30px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '700px',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--border, #E2E8F0)',
                      backgroundColor: 'var(--surface-muted, #F8FAFC)',
                    }}
                  >
                    <th
                      style={{
                        padding: '20px',
                        width: '22%',
                        fontWeight: 800,
                        color: 'var(--text-primary, #0F172A)',
                      }}
                    >
                      Hạng mục so sánh
                    </th>

                    {comparedProducts.map((p) => {
                      const isWinner = aiWinnerId === p.id;
                      const price = p.salePrice ? Number(p.salePrice) : Number(p.price);
                      return (
                        <th
                          key={p.id}
                          style={{
                            padding: '20px',
                            width: `${78 / Math.max(1, Math.min(4, comparedProducts.length + (comparedProducts.length < 4 ? 1 : 0)))}%`,
                            textAlign: 'center',
                            position: 'relative',
                            borderLeft: '1px solid var(--border, #E2E8F0)',
                            verticalAlign: 'top',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(p.id)}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              fontSize: '18px',
                            }}
                            title="Xóa khỏi so sánh"
                          >
                            <i className="fa-solid fa-circle-xmark"></i>
                          </button>

                          {isWinner && (
                            <div style={{ marginBottom: '8px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  color: '#FFFFFF',
                                  background: 'linear-gradient(135deg, #10B981, #059669)',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                👑 Phù hợp nhất
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              marginTop: isWinner ? '4px' : '15px',
                            }}
                          >
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              style={{ height: '90px', objectFit: 'contain', marginBottom: '12px' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/assets/images/placeholder.webp';
                              }}
                            />
                            <strong
                              style={{
                                fontSize: '13.5px',
                                lineHeight: 1.4,
                                height: '38px',
                                overflow: 'hidden',
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary, #0F172A)',
                              }}
                              title={p.name}
                            >
                              {p.name}
                            </strong>
                            <span
                              style={{
                                color: '#0A5BFF',
                                fontWeight: 800,
                                fontSize: '16px',
                                marginBottom: '10px',
                              }}
                            >
                              {price.toLocaleString('vi-VN')}đ
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCartMutation.mutate(p)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#0A5BFF',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                            </button>
                          </div>
                        </th>
                      );
                    })}

                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => {
                      const slotNum = comparedProducts.length + idx + 1;
                      return (
                        <th
                          key={`empty-slot-${idx}`}
                          style={{
                            padding: '16px',
                            textAlign: 'center',
                            borderLeft: '1px solid var(--border, #E2E8F0)',
                            verticalAlign: 'middle',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('compareSearchInput');
                              el?.focus();
                            }}
                            style={{
                              width: '100%',
                              minHeight: '120px',
                              border: '2px dashed #10B981',
                              background: 'rgba(16, 185, 129, 0.06)',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              color: '#047857',
                            }}
                            title={`Click để chọn sản phẩm thêm vào vị trí ${slotNum}`}
                          >
                            <i
                              className="fa-solid fa-circle-plus"
                              style={{ fontSize: '34px', color: '#10B981' }}
                            ></i>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>
                              + Thêm sản phẩm {slotNum}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                              (Bấm để chọn)
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td
                      style={{
                        padding: '15px 20px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: 'var(--surface-muted, #F8FAFC)',
                      }}
                    >
                      Thương hiệu
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          padding: '15px 20px',
                          fontWeight: 600,
                          textAlign: 'center',
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          color: 'var(--text-primary, #0F172A)',
                        }}
                      >
                        {p.brand?.name || 'Chính Hãng'}
                      </td>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <td
                        key={`empty-td-brand-${idx}`}
                        style={{
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontStyle: 'italic',
                          fontSize: '12px',
                        }}
                      >
                        Chưa chọn
                      </td>
                    ))}
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td
                      style={{
                        padding: '15px 20px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: 'var(--surface-muted, #F8FAFC)',
                      }}
                    >
                      Danh mục
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          padding: '15px 20px',
                          textAlign: 'center',
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          color: 'var(--text-primary, #0F172A)',
                        }}
                      >
                        {p.category?.name || 'Công nghệ'}
                      </td>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <td
                        key={`empty-td-cat-${idx}`}
                        style={{
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontStyle: 'italic',
                          fontSize: '12px',
                        }}
                      >
                        Chưa chọn
                      </td>
                    ))}
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td
                      style={{
                        padding: '15px 20px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: 'var(--surface-muted, #F8FAFC)',
                      }}
                    >
                      Tồn kho thực tế
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          padding: '15px 20px',
                          textAlign: 'center',
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          fontWeight: 700,
                          color: p.stockQuantity > 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {p.stockQuantity > 0 ? `Sẵn hàng (${p.stockQuantity})` : 'Hết hàng'}
                      </td>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <td
                        key={`empty-td-stock-${idx}`}
                        style={{
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontStyle: 'italic',
                          fontSize: '12px',
                        }}
                      >
                        Chưa chọn
                      </td>
                    ))}
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border, #E2E8F0)' }}>
                    <td
                      style={{
                        padding: '15px 20px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: 'var(--surface-muted, #F8FAFC)',
                      }}
                    >
                      Thông số kỹ thuật
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          padding: '15px 20px',
                          fontSize: '12.5px',
                          color: '#475569',
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          verticalAlign: 'top',
                        }}
                      >
                        {p.specs && typeof p.specs === 'object' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {Object.entries(p.specs)
                              .slice(0, 6)
                              .map(([k, v]) => {
                                if (typeof v === 'object' && v !== null) return null;
                                return (
                                  <div key={k}>
                                    <strong style={{ color: 'var(--text-primary, #0F172A)' }}>
                                      {k}:
                                    </strong>{' '}
                                    {String(v)}
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <span>Tiêu chuẩn nhà sản xuất</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <td
                        key={`empty-td-specs-${idx}`}
                        style={{
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontStyle: 'italic',
                          fontSize: '12px',
                        }}
                      >
                        Chưa chọn
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td
                      style={{
                        padding: '15px 20px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: 'var(--surface-muted, #F8FAFC)',
                      }}
                    >
                      Bảo hành chính hãng
                    </td>
                    {comparedProducts.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          padding: '15px 20px',
                          textAlign: 'center',
                          fontSize: '12.5px',
                          color: '#475569',
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                        }}
                      >
                        24 tháng • 1 đổi 1 trong 7 ngày đầu
                      </td>
                    ))}
                    {Array.from({ length: 4 - comparedProducts.length }).map((_, idx) => (
                      <td
                        key={`empty-td-war-${idx}`}
                        style={{
                          borderLeft: '1px solid var(--border, #E2E8F0)',
                          textAlign: 'center',
                          color: '#94A3B8',
                          fontStyle: 'italic',
                          fontSize: '12px',
                        }}
                      >
                        Chưa chọn
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
};

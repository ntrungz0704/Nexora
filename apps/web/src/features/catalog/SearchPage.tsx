import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { ProductCard } from '../storefront/ProductCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import type { AuthUser, ProductDto } from '@nexora/shared';

const BRANDS = ['ASUS', 'ACER', 'MSI', 'LENOVO', 'LG', 'SAMSUNG', 'INTEL', 'AMD', 'LOGITECH', 'CORSAIR', 'GIGABYTE'];

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá', min: 0, max: 0 },
  { id: 'under-15m', label: 'Dưới 15 triệu', min: 0, max: 15000000 },
  { id: '15-25m', label: 'Từ 15 đến 25 triệu', min: 15000000, max: 25000000 },
  { id: 'over-25m', label: 'Trên 25 triệu', min: 25000000, max: 0 },
];

interface SubcategoryDef {
  key: string;
  name: string;
  query: string;
}

const CATEGORY_SUBGROUPS: Record<string, SubcategoryDef[]> = {
  'pc-linh-kien': [
    { key: 'mainboard', name: 'MAINBOARD', query: 'mainboard' },
    { key: 'cpu', name: 'CPU', query: 'cpu' },
    { key: 'vga', name: 'VGA', query: 'vga' },
    { key: 'ram', name: 'RAM', query: 'ram' },
    { key: 'storage', name: 'Ổ CỨNG', query: 'storage' },
    { key: 'case', name: 'CASE', query: 'case' },
    { key: 'cooling', name: 'TẢN NHIỆT', query: 'cooling' },
    { key: 'psu', name: 'NGUỒN', query: 'psu' },
  ],
  'linh-kien-pc': [
    { key: 'mainboard', name: 'MAINBOARD', query: 'mainboard' },
    { key: 'cpu', name: 'CPU', query: 'cpu' },
    { key: 'vga', name: 'VGA', query: 'vga' },
    { key: 'ram', name: 'RAM', query: 'ram' },
    { key: 'storage', name: 'Ổ CỨNG', query: 'storage' },
    { key: 'case', name: 'CASE', query: 'case' },
    { key: 'cooling', name: 'TẢN NHIỆT', query: 'cooling' },
    { key: 'psu', name: 'NGUỒN', query: 'psu' },
  ],
  'main-cpu-vga': [
    { key: 'mainboard', name: 'MAINBOARD', query: 'mainboard' },
    { key: 'cpu', name: 'CPU', query: 'cpu' },
    { key: 'vga', name: 'VGA', query: 'vga' },
    { key: 'ram', name: 'RAM', query: 'ram' },
    { key: 'storage', name: 'Ổ CỨNG', query: 'storage' },
    { key: 'case', name: 'CASE', query: 'case' },
    { key: 'cooling', name: 'TẢN NHIỆT', query: 'cooling' },
    { key: 'psu', name: 'NGUỒN', query: 'psu' },
  ],
  'laptop': [
    { key: 'gaming', name: 'LAPTOP GAMING', query: 'gaming' },
    { key: 'office', name: 'LAPTOP VĂN PHÒNG', query: 'van-phong' },
    { key: 'macbook', name: 'MACBOOK', query: 'apple' },
  ],
  'pc': [
    { key: 'gaming', name: 'PC GAMING', query: 'gaming' },
    { key: 'creator', name: 'PC ĐỒ HỌA', query: 'creator' },
    { key: 'office', name: 'PC VĂN PHÒNG', query: 'van-phong' },
  ],
  'pc-nexora': [
    { key: 'gaming', name: 'PC GAMING', query: 'gaming' },
    { key: 'creator', name: 'PC ĐỒ HỌA', query: 'creator' },
    { key: 'office', name: 'PC VĂN PHÒNG', query: 'van-phong' },
  ],
  'gaming-gear': [
    { key: 'keyboard', name: 'BÀN PHÍM', query: 'keyboard' },
    { key: 'mouse', name: 'CHUỘT', query: 'mouse' },
    { key: 'headset', name: 'TAI NGHE', query: 'headset' },
    { key: 'chair', name: 'GHẾ GAMING', query: 'chair' },
    { key: 'speaker', name: 'LOA', query: 'speaker' },
  ],
  'office-gear': [
    { key: 'office-equipment', name: 'THIẾT BỊ VĂN PHÒNG', query: 'office-equipment' },
    { key: 'power-bank', name: 'SẠC DỰ PHÒNG', query: 'power-bank' },
  ],
  'thiet-bi-van-phong': [
    { key: 'office-equipment', name: 'THIẾT BỊ VĂN PHÒNG', query: 'office-equipment' },
    { key: 'power-bank', name: 'SẠC DỰ PHÒNG', query: 'power-bank' },
  ],
};

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const queryClient = useQueryClient();

  const queryQ = searchParams.get('q') || '';
  const queryCat = slug || searchParams.get('cat') || '';
  const queryPromo = searchParams.get('promo') === '1';

  const [userKeyword, setUserKeyword] = useState<string | null>(null);
  const keywordInput = userKeyword !== null ? userKeyword : queryQ;

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [userPromoOnly, setUserPromoOnly] = useState<boolean | null>(null);
  const promoOnly = userPromoOnly !== null ? userPromoOnly : queryPromo;
  const [activeSubgroup, setActiveSubgroup] = useState<string>('');

  // Dropdown states for filter chips
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close filter dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target as Node)) {
        setIsPriceDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
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
    mutationFn: (product: ProductDto) => cartService.addItem(product.id, 1),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    },
  });

  // Determine active category object
  const activeCategory = useMemo(() => {
    if (!queryCat || queryCat === 'all') return null;
    const clean = queryCat.toLowerCase().replace(/\s+/g, '-');
    const norm = removeVietnameseTones(queryCat.replace(/-/g, ' '));
    return categories.find((c) => {
      const cNorm = removeVietnameseTones(c.name);
      return c.slug === clean || c.slug === queryCat || cNorm === norm;
    });
  }, [categories, queryCat]);

  // Subgroups list for this category
  const subcategoryList: SubcategoryDef[] = useMemo(() => {
    const catSlug = queryCat.toLowerCase().replace(/\s+/g, '-');
    if (CATEGORY_SUBGROUPS[catSlug]) return CATEGORY_SUBGROUPS[catSlug]!;
    if (catSlug.includes('linh-kien') || catSlug.includes('main')) return CATEGORY_SUBGROUPS['pc-linh-kien']!;
    if (catSlug.includes('laptop')) return CATEGORY_SUBGROUPS['laptop']!;
    if (catSlug.includes('pc')) return CATEGORY_SUBGROUPS['pc']!;
    if (catSlug.includes('van-phong') || catSlug.includes('office') || catSlug.includes('thiet-bi')) return CATEGORY_SUBGROUPS['office-gear']!;
    if (catSlug.includes('gear') || catSlug.includes('phim') || catSlug.includes('chuot')) return CATEGORY_SUBGROUPS['gaming-gear']!;
    return CATEGORY_SUBGROUPS['pc-linh-kien']!;
  }, [queryCat]);

  // Filter products logic
  const filteredProducts = useMemo(() => {
    const VIRTUAL_GROUPS: Record<string, string[]> = {
      'pc-linh-kien': ['mainboard', 'cpu', 'vga', 'ram', 'storage', 'case', 'cooling', 'psu'],
      'linh-kien-pc': ['mainboard', 'cpu', 'vga', 'ram', 'storage', 'case', 'cooling', 'psu'],
      'main-cpu-vga': ['mainboard', 'cpu', 'vga', 'ram', 'storage', 'case', 'cooling', 'psu'],
      'gaming-gear': ['keyboard', 'mouse', 'chair', 'headset', 'speaker', 'console'],
      'office-gear': ['office-equipment', 'power-bank'],
      'thiet-bi-van-phong': ['office-equipment', 'power-bank'],
      'thiet bi van phong': ['office-equipment', 'power-bank'],
      'pc': ['pc'],
      'laptop': ['laptop'],
      'man-hinh': ['monitor'],
      'monitor': ['monitor'],
    };

    return allProducts.filter((product) => {
      // 1. Category filter
      if (queryCat && queryCat !== 'all') {
        const catSlug = (product.category?.slug || '').toLowerCase();
        const catName = (product.category?.name || '').toLowerCase();
        const pName = product.name.toLowerCase();
        const cleanQueryCat = queryCat.toLowerCase().replace(/\s+/g, '-');
        const queryNorm = removeVietnameseTones(queryCat.replace(/-/g, ' '));
        const catNorm = removeVietnameseTones(catName);
        const pNameNorm = removeVietnameseTones(pName);

        if (VIRTUAL_GROUPS[cleanQueryCat]) {
          const allowedSlugs = VIRTUAL_GROUPS[cleanQueryCat];
          if (!allowedSlugs.includes(catSlug)) {
            return false;
          }
        } else {
          const matchesDirect =
            catSlug === cleanQueryCat ||
            catSlug.includes(cleanQueryCat) ||
            cleanQueryCat.includes(catSlug) ||
            catNorm.includes(queryNorm) ||
            queryNorm.includes(catNorm) ||
            pNameNorm.includes(queryNorm);
          if (!matchesDirect) return false;
        }
      }

      // 2. Subcategory filter
      if (activeSubgroup) {
        const subDef = subcategoryList.find((s) => s.key === activeSubgroup);
        if (subDef) {
          const qSub = subDef.query.toLowerCase();
          const pNameLower = product.name.toLowerCase();
          const pCatSlug = (product.category?.slug || '').toLowerCase();
          const matchesSub = pCatSlug === qSub || pCatSlug.includes(qSub) || pNameLower.includes(qSub);
          if (!matchesSub) return false;
        }
      }

      // 3. Query text filter
      if (queryQ.trim()) {
        const q = queryQ.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = (product.category?.name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }

      // 4. Promo filter
      if (promoOnly) {
        const p = Number(product.price);
        const sp = product.salePrice ? Number(product.salePrice) : null;
        if (!sp || sp >= p) return false;
      }

      // 5. In stock filter
      if (inStockOnly && product.stockQuantity <= 0) {
        return false;
      }

      // 6. Brand filter
      if (selectedBrands.length > 0) {
        const pName = product.name.toUpperCase();
        const bName = (product.brand?.name || '').toUpperCase();
        const matchesBrand = selectedBrands.some((b) => pName.includes(b) || bName.includes(b));
        if (!matchesBrand) return false;
      }

      // 7. Price range filter
      const curPrice = product.salePrice ? Number(product.salePrice) : Number(product.price);
      if (priceRange === 'under-15m' && curPrice >= 15000000) return false;
      if (priceRange === '15-25m' && (curPrice < 15000000 || curPrice > 25000000)) return false;
      if (priceRange === 'over-25m' && curPrice <= 25000000) return false;

      return true;
    }).sort((a, b) => {
      const pA = a.salePrice ? Number(a.salePrice) : Number(a.price);
      const pB = b.salePrice ? Number(b.salePrice) : Number(b.price);
      if (sortBy === 'price-asc') return pA - pB;
      if (sortBy === 'price-desc') return pB - pA;
      if (sortBy === 'title-asc') return a.name.localeCompare(b.name, 'vi');
      if (sortBy === 'title-desc') return b.name.localeCompare(a.name, 'vi');
      return b.id - a.id; // newest
    });
  }, [allProducts, queryCat, activeSubgroup, subcategoryList, queryQ, promoOnly, inStockOnly, selectedBrands, priceRange, sortBy]);

  // Subgroup counts map
  const subgroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of subcategoryList) {
      const qSub = sub.query.toLowerCase();
      const count = allProducts.filter((p) => {
        const pCatSlug = (p.category?.slug || '').toLowerCase();
        const pNameLower = p.name.toLowerCase();
        return pCatSlug === qSub || pCatSlug.includes(qSub) || pNameLower.includes(qSub);
      }).length;
      counts[sub.key] = count;
    }
    return counts;
  }, [allProducts, subcategoryList]);

  const handleSidebarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keywordInput.trim()) {
      params.set('q', keywordInput.trim());
    } else {
      params.delete('q');
    }
    setUserKeyword(null);
    setSearchParams(params);
  };

  const handleClearAllFilters = () => {
    setSelectedBrands([]);
    setPriceRange('all');
    setInStockOnly(false);
    setUserPromoOnly(false);
    setActiveSubgroup('');
    setSortBy('newest');
    setUserKeyword('');
    const params = new URLSearchParams();
    if (queryCat) params.set('cat', queryCat);
    setSearchParams(params);
  };

  const activeCategoryName = useMemo(() => {
    if (queryPromo) return 'Sản phẩm đang Khuyến mãi';
    if (!queryCat || queryCat === 'all') {
      return queryQ ? `Tìm kiếm: "${queryQ}"` : 'Tất cả sản phẩm';
    }
    const clean = queryCat.toLowerCase().replace(/\s+/g, '-');
    if (clean === 'pc-linh-kien' || clean === 'linh-kien-pc') return 'Linh kiện PC';
    if (clean === 'gaming-gear') return 'Gaming Gear';
    if (clean === 'office-gear' || clean === 'thiet-bi-van-phong') return 'Thiết bị văn phòng';
    if (clean === 'pc' || clean === 'pc-techpilot' || clean === 'pc-nexora') return 'PC & Build PC';
    if (clean === 'laptop') return 'Laptop';
    if (clean === 'man-hinh' || clean === 'monitor') return 'Màn hình';
    return activeCategory?.name || queryCat;
  }, [activeCategory, queryCat, queryPromo, queryQ]);

  const activePriceLabel = useMemo(() => {
    const found = PRICE_RANGES.find((r) => r.id === priceRange);
    return found && found.id !== 'all' ? found.label : 'Giá';
  }, [priceRange]);

  const activeBrandLabel = useMemo(() => {
    if (selectedBrands.length === 1) return selectedBrands[0];
    if (selectedBrands.length > 1) return `Thương hiệu (${selectedBrands.length})`;
    return 'Thương hiệu';
  }, [selectedBrands]);

  // Pagination
  const PAGE_SIZE = 24;
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const { startPage, endPage, middlePages } = useMemo(() => {
    const range = 2;
    const start = Math.max(2, currentPage - range);
    const end = Math.min(totalPages - 1, currentPage + range);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return { startPage: start, endPage: end, middlePages: pages };
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set('page', String(newPage));
    } else {
      params.delete('page');
    }
    setSearchParams(params);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

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
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF' }}></i>
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
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
        }}
      />

      <main style={{ minHeight: '600px', paddingBottom: '80px' }}>
        {/* Breadcrumb */}
        <section className="container breadcrumb" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Link to="/" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', color: '#94A3B8' }}></i>
          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>{activeCategoryName}</span>
        </section>

        {/* 2-Column Search Layout */}
        <section className="container search-page" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>
          {/* Sidebar */}
          <aside className="search-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Widget 1: Bộ lọc tìm kiếm */}
            <div
              className="search-widget"
              style={{
                background: 'var(--surface-card, #FFFFFF)',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0', color: 'var(--text-primary, #0F172A)' }}>
                Bộ lọc tìm kiếm
              </h3>
              <form onSubmit={handleSidebarSearch} className="search-widget__form" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={keywordInput}
                  onChange={(e) => setUserKeyword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #CBD5E1)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn--block"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#0A5BFF',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i> Lọc kết quả
                </button>
              </form>
            </div>

            {/* Widget 2: Danh mục sản phẩm */}
            <div className="search-widget">
              <h3>Danh mục sản phẩm</h3>
              <div className="category-list">
                <Link
                  to="/search"
                  className={`category-list__item ${!queryCat || queryCat === 'all' ? 'is-active' : ''}`}
                >
                  <i className="fa-solid fa-boxes-stacked"></i>
                  <span>Tất cả danh mục</span>
                </Link>

                {categories.map((cat) => {
                  const cleanCat = cat.slug.toLowerCase();
                  const cleanCurrent = (queryCat || '').toLowerCase().replace(/\s+/g, '-');
                  const isActive = cleanCurrent === cleanCat || cleanCurrent.includes(cleanCat) || cleanCat.includes(cleanCurrent);
                  return (
                    <Link
                      key={cat.id || cat.slug}
                      to={`/search?cat=${cat.slug}`}
                      className={`category-list__item ${isActive ? 'is-active' : ''}`}
                    >
                      <i className={cat.icon || 'fa-solid fa-tag'}></i>
                      <span>{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Results */}
          <main className="search-main">
            {/* Header: Title, Count, Sort */}
            <div
              className="search-results-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary, #0F172A)' }}>
                  {activeCategoryName}
                </h1>
                <p className="results-count" style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #64748B)' }}>
                  Tìm thấy <strong>{filteredProducts.length}</strong> mẫu sản phẩm {queryPromo ? 'đang giảm giá' : 'phù hợp'}
                </p>
              </div>

              <div className="sort-options" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="sortBy" style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)' }}>Xếp theo:</label>
                <select
                  id="sortBy"
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #CBD5E1)',
                    padding: '0 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    color: 'var(--text-primary, #0F172A)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price-low">Giá từ thấp đến cao</option>
                  <option value="price-high">Giá từ cao đến thấp</option>
                  <option value="title-asc">Tên từ A-Z</option>
                  <option value="title-desc">Tên từ Z-A</option>
                </select>
              </div>
            </div>

            {/* Subcategory Chips Bar / Active Promo Tag */}
            {queryPromo && (
              <div className="active-filters" style={{ marginBottom: '8px' }}>
                <span className="active-filter-tag">
                  Đang giảm giá{' '}
                  <i
                    className="fa-solid fa-xmark active-filter-tag__remove"
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.delete('promo');
                      setSearchParams(p);
                    }}
                    title="Bỏ lọc giảm giá"
                  ></i>
                </span>
              </div>
            )}

            {!queryPromo && subcategoryList && subcategoryList.length > 0 && (
              <div className="subcategory-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 0', marginBottom: '8px' }}>
                <button
                  type="button"
                  className={`subcategory-chip ${activeSubgroup === '' ? 'is-active' : ''}`}
                  onClick={() => setActiveSubgroup('')}
                >
                  TẤT CẢ
                </button>
                {subcategoryList.map((sub) => {
                  const count = subgroupCounts[sub.key] || 0;
                  return (
                    <button
                      key={sub.key}
                      type="button"
                      className={`subcategory-chip ${activeSubgroup === sub.key ? 'is-active' : ''}`}
                      onClick={() => setActiveSubgroup(activeSubgroup === sub.key ? '' : sub.key)}
                    >
                      {sub.name} <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: '4px' }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filter Chips Bar */}
            <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px 0', marginBottom: '16px', borderBottom: '1px solid var(--border, #E2E8F0)', alignItems: 'center' }}>
              {/* Quick Toggle: Sẵn hàng */}
              <span
                className={`filter-chip ${inStockOnly ? 'is-active' : ''}`}
                onClick={() => setInStockOnly(!inStockOnly)}
                title="Chỉ hiện sản phẩm còn hàng"
              >
                <i className="fa-solid fa-box-open"></i> Sẵn hàng
              </span>

              {/* Quick Toggle: Đang giảm giá */}
              <span
                className={`filter-chip ${promoOnly ? 'is-active' : ''}`}
                onClick={() => setUserPromoOnly(!promoOnly)}
                title="Sản phẩm đang giảm giá"
              >
                <i className="fa-solid fa-tags"></i> Đang giảm giá
              </span>

              {/* Price Dropdown Chip */}
              <div ref={priceDropdownRef} style={{ position: 'relative' }}>
                <span
                  className={`filter-chip ${priceRange !== 'all' ? 'is-active' : ''}`}
                  onClick={() => {
                    setIsPriceDropdownOpen(!isPriceDropdownOpen);
                    setIsBrandDropdownOpen(false);
                  }}
                >
                  <i className="fa-solid fa-money-bill-wave"></i>
                  {activePriceLabel}
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
                </span>

                {isPriceDropdownOpen && (
                  <div
                    className="filter-chip__dropdown is-open"
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100 }}
                  >
                    {PRICE_RANGES.map((pr) => (
                      <div
                        key={pr.id}
                        className={`filter-chip__dropdown-item ${priceRange === pr.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          setPriceRange(pr.id);
                          setIsPriceDropdownOpen(false);
                        }}
                      >
                        {pr.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Dropdown Chip */}
              <div ref={brandDropdownRef} style={{ position: 'relative' }}>
                <span
                  className={`filter-chip ${selectedBrands.length > 0 ? 'is-active' : ''}`}
                  onClick={() => {
                    setIsBrandDropdownOpen(!isBrandDropdownOpen);
                    setIsPriceDropdownOpen(false);
                  }}
                >
                  <i className="fa-solid fa-building"></i>
                  {activeBrandLabel}
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }}></i>
                </span>

                {isBrandDropdownOpen && (
                  <div
                    className="filter-chip__dropdown is-open"
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, maxHeight: '280px', overflowY: 'auto' }}
                  >
                    <div
                      className={`filter-chip__dropdown-item ${selectedBrands.length === 0 ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedBrands([]);
                        setIsBrandDropdownOpen(false);
                      }}
                    >
                      Tất cả thương hiệu
                    </div>
                    {BRANDS.map((b) => {
                      const isSel = selectedBrands.includes(b);
                      return (
                        <div
                          key={b}
                          className={`filter-chip__dropdown-item ${isSel ? 'is-selected' : ''}`}
                          onClick={() => {
                            setSelectedBrands((prev) =>
                              prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b],
                            );
                          }}
                        >
                          {b}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clear filters shortcut */}
              {(selectedBrands.length > 0 || priceRange !== 'all' || inStockOnly || promoOnly || activeSubgroup) && (
                <button
                  type="button"
                  className="clear-all-filters"
                  onClick={handleClearAllFilters}
                >
                  <i className="fa-solid fa-xmark"></i> Xóa tất cả lọc
                </button>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <>
                <div
                  className="products-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '18px',
                  }}
                >
                  {paginatedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod) => addToCartMutation.mutate(prod)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    {currentPage > 1 && (
                      <button
                        type="button"
                        className="pagination__btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Trang trước"
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                    )}

                    {/* Trang đầu tiên */}
                    <button
                      type="button"
                      className={`pagination__item ${currentPage === 1 ? 'is-active' : ''}`}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>

                    {/* Dấu ba chấm đầu */}
                    {startPage > 2 && <span className="pagination__dots">&hellip;</span>}

                    {/* Các trang ở giữa */}
                    {middlePages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`pagination__item ${currentPage === page ? 'is-active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Dấu ba chấm cuối */}
                    {endPage < totalPages - 1 && <span className="pagination__dots">&hellip;</span>}

                    {/* Trang cuối cùng */}
                    {totalPages > 1 && (
                      <button
                        type="button"
                        className={`pagination__item ${currentPage === totalPages ? 'is-active' : ''}`}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}

                    {currentPage < totalPages && (
                      <button
                        type="button"
                        className="pagination__btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Trang sau"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  backgroundColor: 'var(--surface-card, #FFFFFF)',
                  borderRadius: '16px',
                  border: '1px solid var(--border, #E5E7EB)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '24px', color: '#9CA3AF' }}></i>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  Không tìm thấy sản phẩm phù hợp
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Hãy thử thay đổi từ khóa hoặc xóa bớt các bộ lọc đang chọn.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="auth-btn-primary"
                  style={{ display: 'inline-block', width: 'auto', padding: '0 24px', height: '42px', fontSize: '13px' }}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </main>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
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

const BRANDS = ['ASUS', 'ACER', 'MSI', 'LENOVO', 'LG', 'SAMSUNG', 'INTEL', 'LOGITECH'];

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

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    queryFn: () => storefrontService.getProducts({ limit: 120 }),
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

  // Filter products logic
  const filteredProducts = useMemo(() => {
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

        const isOfficeEquip =
          (queryNorm.includes('van phong') || queryNorm.includes('office') || queryNorm.includes('thiet bi vp')) &&
          (catNorm.includes('van phong') || pNameNorm.includes('canon') || pNameNorm.includes('epson') || pNameNorm.includes('may in') || pNameNorm.includes('in '));

        const isPowerBank =
          (queryNorm.includes('sac du phong') || queryNorm.includes('sac dp') || queryNorm.includes('power bank')) &&
          (catNorm.includes('sac du phong') || pNameNorm.includes('sac') || pNameNorm.includes('anker'));

        const isGear =
          (queryNorm.includes('gaming gear') || queryNorm.includes('gear')) &&
          (catSlug.includes('ban-phim') || catSlug.includes('chuot') || catSlug.includes('tai-nghe') || pNameNorm.includes('chuot') || pNameNorm.includes('ban phim') || pNameNorm.includes('tai nghe'));

        const isLinhKien =
          (queryNorm.includes('linh kien') || queryNorm.includes('pc linh kien') || queryNorm.includes('component')) &&
          (catSlug.includes('main') || catSlug.includes('case') || catSlug.includes('cung') || pNameNorm.includes('rtx') || pNameNorm.includes('core') || pNameNorm.includes('ryzen') || pNameNorm.includes('ssd'));

        const isPcBuild =
          (queryNorm.includes('pc build') || queryNorm.includes('may tinh bo') || queryNorm === 'pc') &&
          (catSlug.includes('pc') || pNameNorm.includes('pc gaming') || pNameNorm.includes('workstation'));

        const matchesCat =
          isOfficeEquip ||
          isPowerBank ||
          isGear ||
          isLinhKien ||
          isPcBuild ||
          catSlug === cleanQueryCat ||
          catSlug.includes(cleanQueryCat) ||
          cleanQueryCat.includes(catSlug) ||
          catNorm.includes(queryNorm) ||
          queryNorm.includes(catNorm) ||
          pNameNorm.includes(queryNorm);

        if (!matchesCat) {
          return false;
        }
      }

      // 2. Query text filter
      if (queryQ.trim()) {
        const q = queryQ.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = (product.category?.name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }

      // 3. Promo filter
      if (queryPromo) {
        const p = Number(product.price);
        const sp = product.salePrice ? Number(product.salePrice) : null;
        if (!sp || sp >= p) return false;
      }

      // 4. In stock filter
      if (inStockOnly && product.stockQuantity <= 0) {
        return false;
      }

      // 5. Brand filter
      if (selectedBrands.length > 0) {
        const pName = product.name.toUpperCase();
        const matchesBrand = selectedBrands.some((b) => pName.includes(b));
        if (!matchesBrand) return false;
      }

      // 6. Price range
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
      if (sortBy === 'newest') return b.id - a.id;
      return 0;
    });
  }, [allProducts, queryCat, queryQ, queryPromo, selectedBrands, priceRange, inStockOnly, sortBy]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b],
    );
  };

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setPriceRange('all');
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const activeCategory = useMemo(() => {
    if (!queryCat || queryCat === 'all') return null;
    const clean = queryCat.toLowerCase().replace(/\s+/g, '-');
    const norm = removeVietnameseTones(queryCat.replace(/-/g, ' '));
    return categories.find((c) => {
      const cNorm = removeVietnameseTones(c.name);
      return c.slug === clean || c.slug === queryCat || cNorm === norm;
    });
  }, [categories, queryCat]);

  const activeCategoryName =
    activeCategory?.name || (queryPromo ? 'Sản phẩm Khuyến mãi' : 'Tất cả sản phẩm');

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
        <div className="container" style={{ padding: '16px 0' }}>
          <nav
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #6B7280)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Link to="/" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #111827)' }}>
              {queryQ ? `Tìm kiếm: "${queryQ}"` : activeCategoryName}
            </span>
          </nav>
        </div>

        <section className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px minmax(0, 1fr)',
              gap: '24px',
              alignItems: 'flex-start',
            }}
          >
            {/* Left Column: Filter Sidebar */}
            <aside
              style={{
                backgroundColor: 'var(--surface-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border, #E5E7EB)',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
                  <i className="fa-solid fa-sliders" style={{ color: '#0A5BFF', marginRight: '6px' }}></i>
                  Bộ lọc tìm kiếm
                </h3>
                {(selectedBrands.length > 0 || priceRange !== 'all' || inStockOnly) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#EF4444',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {/* 1. Category Tree */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                  Danh mục sản phẩm
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  <Link
                    to="/search"
                    style={{
                      fontSize: '13px',
                      color: !queryCat ? 'var(--primary, #0A5BFF)' : 'var(--text-secondary)',
                      fontWeight: !queryCat ? 700 : 500,
                      textDecoration: 'none',
                      padding: '4px 0',
                    }}
                  >
                    Tất cả danh mục
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      style={{
                        fontSize: '13px',
                        color:
                          queryCat === c.slug || activeCategory?.id === c.id
                            ? 'var(--primary, #0A5BFF)'
                            : 'var(--text-secondary)',
                        fontWeight:
                          queryCat === c.slug || activeCategory?.id === c.id ? 700 : 500,
                        textDecoration: 'none',
                        padding: '4px 0',
                      }}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 2. Price Range */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                  Khoảng giá
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {[
                    { id: 'all', label: 'Tất cả mức giá' },
                    { id: 'under-15m', label: 'Dưới 15 triệu' },
                    { id: '15-25m', label: 'Từ 15 đến 25 triệu' },
                    { id: 'over-25m', label: 'Trên 25 triệu' },
                  ].map((r) => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="priceRange"
                        checked={priceRange === r.id}
                        onChange={() => setPriceRange(r.id)}
                        style={{ accentColor: '#0A5BFF' }}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Brands */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                  Thương hiệu
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  {BRANDS.map((b) => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b)}
                        onChange={() => toggleBrand(b)}
                        style={{ accentColor: '#0A5BFF' }}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Stock toggle */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    style={{ accentColor: '#0A5BFF' }}
                  />
                  <span>Chỉ hiện sản phẩm còn hàng</span>
                </label>
              </div>
            </aside>

            {/* Right Column: Search Results */}
            <div>
              {/* Top Filter & Sort Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  backgroundColor: 'var(--surface-card, #FFFFFF)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border, #E5E7EB)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700 }}>
                  Tìm thấy{' '}
                  <span style={{ color: 'var(--primary, #0A5BFF)' }}>
                    {filteredProducts.length}
                  </span>{' '}
                  sản phẩm
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="featured">Nổi bật nhất</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="newest">Hàng mới về</option>
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length > 0 ? (
                <div
                  className="products-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod) => addToCartMutation.mutate(prod)}
                    />
                  ))}
                </div>
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
                    onClick={handleClearFilters}
                    className="auth-btn-primary"
                    style={{ display: 'inline-block', width: 'auto', padding: '0 24px', height: '42px', fontSize: '13px' }}
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

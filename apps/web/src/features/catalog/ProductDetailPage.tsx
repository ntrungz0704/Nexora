import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { ProductCard } from '../storefront/ProductCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

interface FormattedSpec {
  label: string;
  value: string;
}

const SPEC_LABEL_MAP: Record<string, string> = {
  cpu_model: 'Bộ vi xử lý (CPU)',
  cpu: 'Bộ vi xử lý (CPU)',
  gpu_model: 'Card màn hình (VGA/GPU)',
  gpu: 'Card đồ họa (VGA)',
  ram_gb: 'Dung lượng RAM',
  ram: 'Bộ nhớ RAM',
  ram_type: 'Loại RAM',
  storage_gb: 'Dung lượng ổ cứng',
  storage_type: 'Loại ổ cứng',
  storage: 'Ổ cứng',
  screen_size: 'Kích thước màn hình',
  resolution: 'Độ phân giải',
  refresh_rate: 'Tần số quét',
  panel_type: 'Tấm nền màn hình',
  battery_wh: 'Dung lượng Pin',
  battery: 'Pin',
  weight_kg: 'Trọng lượng máy',
  weight: 'Trọng lượng',
  os: 'Hệ điều hành',
  color: 'Màu sắc',
  warranty_months: 'Thời hạn bảo hành',
  warranty: 'Bảo hành',
  power_watts: 'Công suất nguồn',
  psu: 'Nguồn máy tính (PSU)',
  form_factor: 'Kích thước / Form Factor',
  socket: 'Socket hỗ trợ',
  chipset: 'Chipset',
  connectivity: 'Kết nối',
  wireless: 'Kết nối không dây',
  switch_type: 'Loại switch bàn phím',
  dpi: 'Độ phân giải DPI',
  sensor: 'Cảm biến',
  ports: 'Cổng kết nối',
  audio: 'Âm thanh',
  cooling: 'Tản nhiệt',
  mainboard: 'Bo mạch chủ',
  case: 'Vỏ thùng máy (Case)',
};

const IGNORED_SPEC_KEYS = new Set([
  'schema_version',
  'schemaversion',
  'category_slug',
  'categoryslug',
  'use_cases',
  'usecases',
  'model',
  'model_code',
  'modelcode',
  'specs',
  'raw',
  'id',
  'sku',
  'createdat',
  'updatedat',
  'slug',
  'expansion',
]);

function parseSpecs(rawSpecs: unknown, product?: ProductDto): FormattedSpec[] {
  let parsed: Record<string, unknown> | null = null;
  if (typeof rawSpecs === 'string') {
    try {
      parsed = JSON.parse(rawSpecs);
    } catch {
      parsed = null;
    }
  } else if (rawSpecs && typeof rawSpecs === 'object') {
    parsed = rawSpecs as Record<string, unknown>;
  }

  const results: FormattedSpec[] = [];
  const seenLabels = new Set<string>();

  const addSpec = (label: string, value: string) => {
    if (!label || !value || value === '[object Object]' || seenLabels.has(label)) return;
    seenLabels.add(label);
    results.push({ label, value });
  };

  if (parsed) {
    const traverse = (obj: Record<string, unknown>) => {
      for (const [key, val] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (IGNORED_SPEC_KEYS.has(key) || IGNORED_SPEC_KEYS.has(lowerKey)) continue;
        if (val === null || val === undefined || val === '') continue;

        if (typeof val === 'object' && !Array.isArray(val)) {
          traverse(val as Record<string, unknown>);
        } else if (Array.isArray(val)) {
          const strItems = val
            .filter((item) => typeof item === 'string' || typeof item === 'number')
            .map((item) => String(item).trim())
            .filter(Boolean);
          if (strItems.length > 0 && !IGNORED_SPEC_KEYS.has(lowerKey)) {
            const label = SPEC_LABEL_MAP[lowerKey] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            addSpec(label, strItems.join(', '));
          }
        } else {
          let valStr = String(val).trim();
          if (valStr === '[object Object]' || valStr === 'undefined' || valStr === 'null') continue;

          const label = SPEC_LABEL_MAP[lowerKey] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

          if (lowerKey === 'ram_gb' && !valStr.toLowerCase().includes('gb')) valStr += ' GB';
          if (lowerKey === 'storage_gb' && !valStr.toLowerCase().includes('gb')) {
            const num = Number(valStr);
            valStr = !isNaN(num) && num >= 1024 ? `${num / 1024} TB` : `${valStr} GB`;
          }
          if (lowerKey === 'weight_kg' && !valStr.toLowerCase().includes('kg')) valStr += ' kg';
          if (lowerKey === 'refresh_rate' && !valStr.toLowerCase().includes('hz')) valStr += ' Hz';
          if (lowerKey === 'battery_wh' && !valStr.toLowerCase().includes('wh')) valStr += ' Wh';
          if (lowerKey === 'warranty_months' && !valStr.toLowerCase().includes('tháng')) valStr += ' tháng';
          if (lowerKey === 'power_watts' && !valStr.toLowerCase().includes('w')) valStr += ' W';

          addSpec(label, valStr);
        }
      }
    };
    traverse(parsed);
  }

  // Add authentic relational metadata from verified product record
  if (product) {
    if (product.brand?.name) addSpec('Thương hiệu', product.brand.name);
    if (product.category?.name) addSpec('Dòng sản phẩm', product.category.name);
  }

  return results;
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews' | 'aiChat'>('specs');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Product AI Q&A State
  const [productAiQuestion, setProductAiQuestion] = useState('');
  const [productAiAnswer, setProductAiAnswer] = useState<string | null>(null);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  const handleAskProductAi = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = (customQ || productAiQuestion).trim();
    if (!q || !product) return;

    setIsAiAnswering(true);
    setProductAiAnswer(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/ai/product-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          question: q,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setProductAiAnswer(json.data.answer);
      } else {
        setProductAiAnswer('Xin lỗi, hiện tại hệ thống AI đang nâng cấp dữ liệu cho sản phẩm này.');
      }
    } catch {
      setProductAiAnswer('Lỗi kết nối khi gửi câu hỏi tới AI.');
    } finally {
      setIsAiAnswering(false);
    }
  };

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
  const allProducts = productsData?.products || [];

  // Find product by slug or id
  const product =
    allProducts.find((p) => p.slug === slug || String(p.id) === slug) || allProducts[0];

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
    mutationFn: (qty: number) => {
      if (!product) return Promise.reject();
      return cartService.addItem(product.id, qty);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product?.name}" (${quantity} sản phẩm) vào giỏ!`);
    },
  });

  const handleBuyNow = async () => {
    if (!product) return;
    await cartService.addItem(product.id, quantity);
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    navigate('/checkout');
  };

  if (!product) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Đang tải thông tin sản phẩm...</div>;
  }

  const p = Number(product.price);
  const sp = product.salePrice ? Number(product.salePrice) : null;
  const hasDiscount = sp !== null && sp < p && sp > 0;
  const currentPrice = hasDiscount ? sp : p;
  const originalPrice = p;
  const discountPercent = hasDiscount ? Math.round(((p - sp) / p) * 100) : 0;
  const mainImage = getProductImage(product);

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const specsList = parseSpecs(product.specs, product);
  const isOutOfStock = Number(product.stockQuantity ?? 0) <= 0;
  const relatedProducts = allProducts.filter((item) => item.id !== product.id).slice(0, 4);

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
        {/* Breadcrumb - Perfectly aligned with navigation container */}
        <div className="container" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
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
            <Link
              to={`/category/${product.category?.slug || 'all'}`}
              style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}
            >
              {product.category?.name || 'Sản phẩm'}
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #111827)' }}>
              {product.name}
            </span>
          </nav>
        </div>

        {/* Product Showcase */}
        <section className="container">
          <div
            style={{
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              borderRadius: '20px',
              border: '1px solid var(--border, #E5E7EB)',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              display: 'grid',
              gridTemplateColumns: '460px minmax(0, 1fr)',
              gap: '40px',
              alignItems: 'flex-start',
              marginBottom: '36px',
            }}
          >
            {/* Left: Product Images */}
            <div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '16px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid var(--border, #E5E7EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={mainImage}
                  alt={product.name}
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease',
                  }}
                />
                {hasDiscount && (
                  <span
                    className="product-card__badge product-card__badge--promo"
                    style={{ position: 'absolute', top: '16px', left: '16px' }}
                  >
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {/* Thumbnails row */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                {[mainImage, mainImage, mainImage].map((img, i) => (
                  <div
                    key={i}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '10px',
                      border: i === 0 ? '2px solid #0A5BFF' : '1px solid var(--border)',
                      padding: '4px',
                      backgroundColor: '#F9FAFB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={img} alt="Thumb" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Buy Box */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {product.category?.name || 'Chính Hãng'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Mã SKU: <strong>{product.sku}</strong>
                </span>
              </div>

              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  margin: '0 0 12px 0',
                }}
              >
                {product.name}
              </h1>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ color: '#FACC15', fontSize: '13px' }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>5.0</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>(24 đánh giá)</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                {isOutOfStock ? (
                  <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-xmark"></i> Hết hàng
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-check"></i> Còn hàng ({product.stockQuantity} sản phẩm)
                  </span>
                )}
              </div>

              {/* Price Box */}
              <div
                style={{
                  backgroundColor: 'var(--surface-muted, #F8FAFC)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '14px',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary, #0A5BFF)' }}>
                  {formatPrice(currentPrice)}
                </span>
                {hasDiscount && (
                  <span
                    style={{
                      fontSize: '16px',
                      color: 'var(--text-secondary)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                  (Đã bao gồm VAT 10%)
                </span>
              </div>

              {/* Specs Highlights */}
              {specsList.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                    Thông số nổi bật:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {specsList.slice(0, 4).map((spec, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '12px',
                          backgroundColor: 'var(--surface-muted, #F1F5F9)',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i className="fa-solid fa-microchip" style={{ color: '#0A5BFF' }}></i>
                        <strong>{spec.label}:</strong> {spec.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Buy Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    height: '48px',
                    opacity: isOutOfStock ? 0.5 : 1,
                  }}
                >
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    style={{
                      width: '38px',
                      height: '100%',
                      border: 'none',
                      background: 'var(--surface-muted, #F3F4F6)',
                      fontWeight: 700,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '44px', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setQuantity((prev) => prev + 1)}
                    style={{
                      width: '38px',
                      height: '100%',
                      border: 'none',
                      background: 'var(--surface-muted, #F3F4F6)',
                      fontWeight: 700,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock || addToCartMutation.isPending}
                  onClick={() => addToCartMutation.mutate(quantity)}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '10px',
                    border: isOutOfStock ? '1px solid var(--border, #D1D5DB)' : '2px solid #0A5BFF',
                    backgroundColor: isOutOfStock ? 'var(--surface-muted, #F3F4F6)' : '#EFF6FF',
                    color: isOutOfStock ? 'var(--text-secondary, #9CA3AF)' : '#0A5BFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <i className={isOutOfStock ? "fa-solid fa-ban" : "fa-solid fa-cart-plus"}></i>
                  {isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className={isOutOfStock ? "" : "auth-btn-primary"}
                  style={{
                    flex: 1,
                    height: '48px',
                    fontSize: '14px',
                    margin: 0,
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isOutOfStock ? 'var(--border, #E5E7EB)' : undefined,
                    color: isOutOfStock ? 'var(--text-secondary, #9CA3AF)' : undefined,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isOutOfStock ? 'Tạm hết hàng' : 'Mua ngay'}
                </button>
              </div>

              {/* Commitments Box */}
              <div
                style={{
                  border: '1px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#FAFAFA',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#0A5BFF', marginRight: '6px' }}></i>
                  Cam kết chính hãng 100%
                </div>
                <div>
                  <i className="fa-solid fa-rotate-left" style={{ color: '#16A34A', marginRight: '6px' }}></i>
                  1 đổi 1 trong 7 ngày nếu lỗi
                </div>
                <div>
                  <i className="fa-solid fa-truck-fast" style={{ color: '#0A5BFF', marginRight: '6px' }}></i>
                  Miễn phí vận chuyển cho đơn từ 500.000đ
                </div>
                <div>
                  <i className="fa-solid fa-phone" style={{ color: '#EF4444', marginRight: '6px' }}></i>
                  Tư vấn kỹ thuật: 1800 2097
                </div>
              </div>
            </div>
          </div>

          {/* Details & Specifications Tabs */}
          <div
            style={{
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              borderRadius: '20px',
              border: '1px solid var(--border, #E5E7EB)',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              marginBottom: '40px',
            }}
          >
            {/* Tab buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderBottom: '2px solid var(--border, #E5E7EB)',
                paddingBottom: '12px',
                marginBottom: '24px',
              }}
            >
              {[
                { id: 'specs', label: 'Thông số kỹ thuật chi tiết' },
                { id: 'desc', label: 'Mô tả sản phẩm' },
                { id: 'reviews', label: 'Đánh giá & Nhận xét (24)' },
                { id: 'aiChat', label: '⚡ Hỏi Đáp AI Về Sản Phẩm Này' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeTab === tab.id ? 'var(--primary, #0A5BFF)' : 'transparent',
                    color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Specs Table */}
            {activeTab === 'specs' && (
              <div>
                {specsList.length > 0 ? (
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <tbody>
                      {specsList.map((spec, idx) => (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? 'var(--surface-muted, rgba(0, 0, 0, 0.02))' : 'transparent',
                            borderBottom: '1px solid var(--border, #E2E8F0)',
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              fontWeight: 700,
                              width: '35%',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {spec.label}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Thông số kỹ thuật chi tiết của sản phẩm đang được cập nhật.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Description */}
            {activeTab === 'desc' && (
              <div style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-primary)' }}>
                <p>{product.shortDescription}</p>
                <p>
                  Sản phẩm được phân phối chính hãng bởi <strong>Nexora</strong> với đầy đủ hóa đơn VAT, tem bảo hành chính hãng và hỗ trợ kỹ thuật trọn đời máy.
                </p>
              </div>
            )}

            {/* Tab 3: Reviews */}
            {activeTab === 'reviews' && (
              <div>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: 900, color: 'var(--primary, #0A5BFF)' }}>
                      5.0
                    </div>
                    <div style={{ color: '#FACC15', fontSize: '16px' }}>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Dựa trên 24 đánh giá
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Trần Văn Nam</strong>
                      <span style={{ fontSize: '11px', color: '#16A34A' }}>
                        <i className="fa-solid fa-badge-check"></i> Đã mua hàng
                      </span>
                    </div>
                    <div style={{ color: '#FACC15', fontSize: '11px', margin: '2px 0 4px 0' }}>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                      <i className="fa-solid fa-star"></i>
                    </div>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      Sản phẩm đóng gói rất cẩn thận, full box nguyên seal chính hãng. Giao hàng hỏa tốc trong 2h siêu nhanh!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: AI Product Q&A */}
            {activeTab === 'aiChat' && (
              <div>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0A5BFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      <i className="fa-solid fa-robot"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        Trợ Lý AI Chuyên Sâu Về {product.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        Hỏi về benchmark FPS game, khả năng nâng cấp RAM/SSD, cổng kết nối và bảo hành
                      </div>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0' }}>
                    {[
                      'Sản phẩm này chiến mượt game AAA nào?',
                      'Khả năng nâng cấp RAM và ổ cứng thế nào?',
                      'Chính sách bảo hành và đổi trả ra sao?',
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setProductAiQuestion(q);
                          handleAskProductAi(undefined, q);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '12px',
                          color: '#334155',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleAskProductAi} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={productAiQuestion}
                      onChange={(e) => setProductAiQuestion(e.target.value)}
                      placeholder="Nhập câu hỏi bạn muốn hỏi AI về sản phẩm này..."
                      style={{
                        flex: 1,
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isAiAnswering || !productAiQuestion.trim()}
                      style={{
                        padding: '0 24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#0A5BFF',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        opacity: isAiAnswering || !productAiQuestion.trim() ? 0.6 : 1,
                      }}
                    >
                      {isAiAnswering ? 'Đang trả lời...' : 'Hỏi AI'}
                    </button>
                  </form>
                </div>

                {productAiAnswer && (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      border: '1px solid #BFDBFE',
                      boxShadow: '0 4px 16px rgba(10, 91, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A5BFF', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                      <i className="fa-solid fa-sparkles"></i>
                      <span>Câu trả lời từ Nexora AI:</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#1E293B', whiteSpace: 'pre-line' }}>
                      {productAiAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '20px',
                  color: 'var(--text-primary)',
                }}
              >
                Sản phẩm cùng phân khúc
              </h2>
              <div
                className="products-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '16px',
                }}
              >
                {relatedProducts.map((pItem) => (
                  <ProductCard
                    key={pItem.id}
                    product={pItem}
                    onAddToCart={(item) => {
                      cartService.addItem(item.id, 1);
                      queryClient.invalidateQueries({ queryKey: ['cart'] });
                      showToast(`Đã thêm "${item.name}" vào giỏ!`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

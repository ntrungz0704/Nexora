import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { ProductCard } from '../storefront/ProductCard';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser } from '@nexora/shared';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    queryFn: () => storefrontService.getProducts({ limit: 40 }),
  });
  const allProducts = productsData?.products || [];

  // Find product by slug or id
  const product =
    allProducts.find((p) => p.slug === slug || String(p.id) === slug) || allProducts[0];

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
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

  const specsEntries = product.specs ? Object.entries(product.specs) : [];
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
        wishlistCount={0}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
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
                <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check"></i> Còn hàng ({product.stockQuantity} sản phẩm)
                </span>
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
              {specsEntries.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                    Thông số nổi bật:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {specsEntries.slice(0, 4).map(([key, val], i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '12px',
                          backgroundColor: '#F1F5F9',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i className="fa-solid fa-microchip" style={{ color: '#0A5BFF' }}></i>
                        <strong>{key}:</strong> {String(val)}
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
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    style={{
                      width: '38px',
                      height: '100%',
                      border: 'none',
                      background: '#F3F4F6',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '44px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    style={{
                      width: '38px',
                      height: '100%',
                      border: 'none',
                      background: '#F3F4F6',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => addToCartMutation.mutate(quantity)}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '10px',
                    border: '2px solid #0A5BFF',
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="auth-btn-primary"
                  style={{
                    flex: 1,
                    height: '48px',
                    fontSize: '14px',
                    margin: 0,
                  }}
                >
                  Mua ngay
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
                  Miễn phí vận chuyển toàn quốc
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
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}
                >
                  <tbody>
                    {specsEntries.map(([k, v], idx) => (
                      <tr
                        key={k}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#F8FAFC' : 'transparent',
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
                          {k}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {String(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Description */}
            {activeTab === 'desc' && (
              <div style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-primary)' }}>
                <p>{product.shortDescription}</p>
                <p>
                  Sản phẩm được phân phối chính hãng bởi <strong>TechPilot</strong> với đầy đủ hóa đơn VAT, tem bảo hành chính hãng và hỗ trợ kỹ thuật trọn đời máy.
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

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart || null}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Chào mừng trở lại, ${user.fullName}!`);
        }}
      />
    </div>
  );
};

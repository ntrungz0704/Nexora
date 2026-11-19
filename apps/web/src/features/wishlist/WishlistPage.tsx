import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { ProductCard } from '../storefront/ProductCard';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import type { AuthUser, ProductDto } from '@nexora/shared';

export const WishlistPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local storage favorites IDs
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('techpilot-wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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
    queryFn: () => storefrontService.getProducts({ limit: 50 }),
  });
  const allProducts = productsData?.products || [];

  // Default to showing first 3 products if empty for demo fidelity, or actual wishlist
  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(String(p.id)));
  // If wishlist is empty initially, seed with first 2 products for rich UI
  const displayProducts =
    wishlistProducts.length > 0 ? wishlistProducts : allProducts.slice(0, 3);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const addToCartMutation = useMutation({
    mutationFn: (product: ProductDto) => cartService.addItem(product.id, 1),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    },
  });

  const handleToggleWishlist = (productId: string | number) => {
    const idStr = String(productId);
    const updated = wishlistIds.includes(idStr)
      ? wishlistIds.filter((id) => id !== idStr)
      : [...wishlistIds, idStr];
    setWishlistIds(updated);
    localStorage.setItem('techpilot-wishlist', JSON.stringify(updated));
    showToast('Đã cập nhật danh sách yêu thích.');
  };

  return (
    <div className="home-page-wrapper">
      {/* Toast */}
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
        wishlistCount={displayProducts.length}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
        }}
      />

      <main style={{ minHeight: '600px', paddingBottom: '60px' }}>
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
              Danh sách yêu thích
            </span>
          </nav>
        </div>

        {/* Wishlist Content */}
        <section className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              borderBottom: '2px solid var(--border, #E5E7EB)',
              paddingBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="fa-solid fa-heart" style={{ color: '#EF4444', fontSize: '18px' }}></i>
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary)',
                  }}
                >
                  Sản phẩm yêu thích
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Quản lý và lưu lại các sản phẩm bạn đang quan tâm ({displayProducts.length} sản phẩm)
                </p>
              </div>
            </div>

            <Link
              to="/search"
              className="btn btn--outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-magnifying-glass"></i> Tiếp tục tìm kiếm
            </Link>
          </div>

          {displayProducts.length > 0 ? (
            <div
              className="products-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '16px',
              }}
            >
              {displayProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(prod) => addToCartMutation.mutate(prod)}
                  onToggleWishlist={handleToggleWishlist}
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
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <i
                  className="fa-regular fa-heart"
                  style={{ fontSize: '36px', color: '#9CA3AF' }}
                ></i>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Danh sách yêu thích trống
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', margin: '0 auto 24px auto' }}>
                Bạn chưa lưu sản phẩm nào. Hãy bấm vào biểu tượng trái tim trên các sản phẩm công nghệ để lưu lại!
              </p>
              <Link
                to="/"
                className="auth-btn-primary"
                style={{
                  display: 'inline-block',
                  maxWidth: '220px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  textDecoration: 'none',
                }}
              >
                Khám phá sản phẩm ngay
              </Link>
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

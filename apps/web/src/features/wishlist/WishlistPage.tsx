import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { ProductCard } from '../storefront/ProductCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import type { AuthUser, ProductDto } from '@nexora/shared';

export const WishlistPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Categories for Header
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  // Fetch Cart for Header count
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  // Fetch Real User Wishlist from API / MySQL Database
  const { data: wishlistEntries = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!currentUser,
  });

  const wishlistProducts = wishlistEntries.map((entry) => entry.product);

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: (product: ProductDto) => cartService.addItem(product.id, 1),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    },
    onError: () => {
      showToast('Không thể thêm sản phẩm vào giỏ hàng.');
    },
  });

  // Remove from Wishlist Mutation
  const removeWishlistMutation = useMutation({
    mutationFn: (productId: number | string) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
      showToast('Đã xóa sản phẩm khỏi danh sách yêu thích.');
    },
    onError: () => {
      showToast('Lỗi khi cập nhật danh sách yêu thích.');
    },
  });

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // 1. Requirement Parity with TechPilot: Guest user MUST NOT access Wishlist
  if (!currentUser) {
    return <Navigate to="/auth/login?redirect=/wishlist" replace />;
  }

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

      {/* Main Storefront Header */}
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={wishlistProducts.length}
        currentUser={currentUser}
        onLogout={handleLogout}
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

        {/* Wishlist Content Section */}
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
                  Quản lý và lưu lại các sản phẩm bạn đang quan tâm ({wishlistProducts.length} sản phẩm)
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

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '32px', color: '#0A5BFF' }}></i>
              <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Đang tải danh sách yêu thích...
              </p>
            </div>
          ) : wishlistProducts.length > 0 ? (
            <div
              className="products-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '16px',
              }}
            >
              {wishlistProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isInWishlist={true}
                  onAddToCart={(prod) => addToCartMutation.mutate(prod)}
                  onToggleWishlist={(id) => removeWishlistMutation.mutate(id)}
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
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary, #6B7280)',
                  maxWidth: '420px',
                  margin: '0 auto 24px auto',
                  lineHeight: '1.5',
                }}
              >
                Hãy khám phá các sản phẩm công nghệ tuyệt vời tại Nexora và nhấn vào biểu tượng
                trái tim để lưu lại những món đồ bạn yêu thích!
              </p>
              <Link
                to="/search"
                className="btn btn--primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  backgroundColor: '#0A5BFF',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Khám phá sản phẩm ngay <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Main Storefront Footer */}
      <StorefrontFooter />
    </div>
  );
};

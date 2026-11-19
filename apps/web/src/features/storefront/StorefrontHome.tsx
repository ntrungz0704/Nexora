import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from './StorefrontHeader';
import { CategorySidebar } from './CategorySidebar';
import { HeroCarousel } from './HeroCarousel';
import { PromoCards } from './PromoCards';
import { ServicePolicyBar } from './ServicePolicyBar';
import { FlashSaleSection } from './FlashSaleSection';
import { ProductCatalogSection } from './ProductCatalogSection';
import { BottomFeatures } from './BottomFeatures';
import { CartDrawer } from './CartDrawer';
import { AuthModal } from './AuthModal';
import { StorefrontFooter } from './StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import type { AuthUser, ProductDto } from '@nexora/shared';

export const StorefrontHome: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  // 2. Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => storefrontService.getProducts({ limit: 20 }),
  });
  const products = productsData?.products || [];

  // 3. Fetch Flash Sale Products
  const { data: flashSaleProducts = [] } = useQuery({
    queryKey: ['flash-sale'],
    queryFn: () => storefrontService.getFlashSale(),
  });

  // 4. Fetch Cart
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: (product: ProductDto) => cartService.addItem(product.id, 1),
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    },
    onError: (err: unknown) => {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      showToast(errorResponse.response?.data?.error?.message || 'Không thể thêm sản phẩm vào giỏ.');
    },
  });

  // Update Cart Item Quantity Mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartService.updateItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove Cart Item Mutation
  const removeItemMutation = useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Đã xóa sản phẩm khỏi giỏ hàng.');
    },
  });

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    showToast('Đã đăng xuất tài khoản.');
  };

  return (
    <div className="home-page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
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

      {/* Main Storefront Header */}
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={1}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main>
        {/* 4. HERO SECTION */}
        <section className="container hero-section">
          {/* Left: Vertical Category Menu */}
          <div className="hero-section__left" id="heroCategorySlot">
            <CategorySidebar categories={categories} />
          </div>

          {/* Center: Large Hero Banner Carousel */}
          <HeroCarousel />

          {/* Right: 3 Promotion Cards */}
          <PromoCards />
        </section>

        {/* 5. SERVICE FEATURES */}
        <ServicePolicyBar />

        {/* 6. FLASH SALE */}
        <FlashSaleSection
          products={flashSaleProducts.length > 0 ? flashSaleProducts : products.slice(0, 5)}
          onAddToCart={(p) => addToCartMutation.mutate(p)}
        />

        {/* 7. MAIN PRODUCTS CATALOG */}
        <ProductCatalogSection
          products={products}
          onAddToCart={(p) => addToCartMutation.mutate(p)}
        />

        {/* 14. BOTTOM FEATURES */}
        <BottomFeatures />
      </main>

      {/* 15. FOOTER */}
      <StorefrontFooter />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart || null}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(id, qty) => updateQuantityMutation.mutate({ id, quantity: qty })}
        onRemoveItem={(id) => removeItemMutation.mutate(id)}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          showToast(`Chào mừng trở lại, ${user.fullName}!`);
        }}
      />
    </div>
  );
};

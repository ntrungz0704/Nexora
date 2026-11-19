import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from './StorefrontHeader';
import { CategorySidebar } from './CategorySidebar';
import { HeroCarousel } from './HeroCarousel';
import { PromoCards } from './PromoCards';
import { ServicePolicyBar } from './ServicePolicyBar';
import { FlashSaleSection } from './FlashSaleSection';
import { ProductCatalogSection } from './ProductCatalogSection';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-blue-400 text-xs font-bold animate-bounce">
          <i className="fa-solid fa-circle-check text-sm text-cyan-300"></i>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-7">
        {/* Top Hero Section matching Image 3: Left Category Sidebar, Center Carousel, Right Promo Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Vertical Category Menu (3 cols on lg) */}
          <div className="hidden lg:block lg:col-span-3">
            <CategorySidebar categories={categories} />
          </div>

          {/* Center Column: Hero Carousel Banner (6 cols on lg) */}
          <div className="lg:col-span-6">
            <HeroCarousel />
          </div>

          {/* Right Column: 3 Promotional Feature Cards (3 cols on lg) */}
          <div className="lg:col-span-3">
            <PromoCards />
          </div>
        </section>

        {/* 5 Service Features Policy Badges */}
        <ServicePolicyBar />

        {/* Flash Sale Section */}
        <FlashSaleSection
          products={flashSaleProducts.length > 0 ? flashSaleProducts : products.slice(0, 4)}
          onAddToCart={(p) => addToCartMutation.mutate(p)}
        />

        {/* Main Product Showcase with Category Tabs */}
        <ProductCatalogSection
          products={products}
          onAddToCart={(p) => addToCartMutation.mutate(p)}
        />
      </main>

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

      {/* Storefront Footer */}
      <StorefrontFooter />
    </div>
  );
};

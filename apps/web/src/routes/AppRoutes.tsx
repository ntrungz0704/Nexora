import { Route, Routes } from 'react-router-dom';
import { StorefrontHome } from '../features/storefront/StorefrontHome';
import { SearchPage } from '../features/catalog/SearchPage';
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
import { WishlistPage } from '../features/wishlist/WishlistPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { CheckoutSuccessPage } from '../features/checkout/CheckoutSuccessPage';
import { PcBuilderPage } from '../features/pcBuilder/PcBuilderPage';
import { ComparePage } from '../features/compare/ComparePage';
import { AiAssistantPage } from '../features/ai/AiAssistantPage';
import { TradeInPage } from '../features/tradeIn/TradeInPage';
import { NewsPage } from '../features/news/NewsPage';
import { PostDetailPage } from '../features/news/PostDetailPage';
import { OrderTrackingPage } from '../features/orderTracking/OrderTrackingPage';
import { StoresPage } from '../features/stores/StoresPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { FoundationDashboard } from '../features/system/FoundationDashboard';
import { MainLayout } from '../layouts/MainLayout';

function ArchitectureInfoPage() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Nexora Architectural Boundaries</h1>
      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
        <li>Single-Vendor Store Model: Customer, Staff (internal store employees), Admin.</li>
        <li>Modular Monolith Backend (`apps/api`) backed by MySQL 8.4 + Prisma ORM.</li>
        <li>Shared Zod Wire Contracts (`packages/shared`) enforcing strict FE/BE parity.</li>
        <li>Business domains (Catalog, Orders, Inventory, Purchasing) proceed phase-by-phase.</li>
      </ul>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Main Customer Storefront & Catalog */}
      <Route path="/" element={<StorefrontHome />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/category/:slug" element={<SearchPage />} />
      <Route path="/product/detail/:slug" element={<ProductDetailPage />} />
      <Route path="/product/:slug" element={<ProductDetailPage />} />

      {/* 2. Customer Commerce Journey */}
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

      {/* 3. Specialized Customer Tools */}
      <Route path="/build-pc" element={<PcBuilderPage />} />
      <Route path="/pc-builder" element={<PcBuilderPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/ai-assistant" element={<AiAssistantPage />} />
      <Route path="/thu-cu-doi-moi" element={<TradeInPage />} />
      <Route path="/trade-in" element={<TradeInPage />} />

      {/* 4. Content & Tech News */}
      <Route path="/post" element={<NewsPage />} />
      <Route path="/posts" element={<NewsPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/post/:slug" element={<PostDetailPage />} />

      {/* 5. Customer Services & Support */}
      <Route path="/order-tracking" element={<OrderTrackingPage />} />
      <Route path="/stores" element={<StoresPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/orders" element={<ProfilePage />} />
      <Route path="/orders" element={<ProfilePage />} />

      {/* 6. Authentication Routes (TechPilot Exact Parity) */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 7. Store Management & Administration (Single-Vendor Backoffice) */}
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

      {/* 8. Technical Foundation & Architecture Pages */}
      <Route element={<MainLayout />}>
        <Route path="/foundation" element={<FoundationDashboard />} />
        <Route path="/architecture" element={<ArchitectureInfoPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<StorefrontHome />} />
    </Routes>
  );
}

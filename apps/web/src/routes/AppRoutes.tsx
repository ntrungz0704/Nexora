import { Route, Routes } from 'react-router-dom';
import { StorefrontHome } from '../features/storefront/StorefrontHome';
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
      {/* 1. Main Customer Storefront */}
      <Route path="/" element={<StorefrontHome />} />
      <Route path="/search" element={<StorefrontHome />} />
      <Route path="/category/:slug" element={<StorefrontHome />} />

      {/* 2. Technical Foundation & Architecture Pages */}
      <Route element={<MainLayout />}>
        <Route path="/foundation" element={<FoundationDashboard />} />
        <Route path="/architecture" element={<ArchitectureInfoPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<StorefrontHome />} />
    </Routes>
  );
}

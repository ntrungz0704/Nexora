import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import type { AuthUser } from '@nexora/shared';

export const NotFoundPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
        }}
      />

      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-5xl font-black shadow-inner">
            404
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">Không tìm thấy trang</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang vị trí mới trong hệ thống
            Nexora.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              Về trang chủ
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95"
            >
              Tìm sản phẩm
            </Link>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

export const ComparePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  // Selected products for comparison
  const [comparedIds, setComparedIds] = useState<string[]>(() => {
    const addId = searchParams.get('add');
    if (addId) return [addId];
    return [];
  });

  // Pick first 3 items by default if none selected
  const displayProducts = allProducts.filter((p) => {
    if (comparedIds.length > 0) return comparedIds.includes(String(p.id));
    return true;
  }).slice(0, 3);

  const addToCartMutation = useMutation({
    mutationFn: (p: ProductDto) => cartService.addItem(p.id, 1),
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
    },
  });

  const removeComparedProduct = (id: string | number) => {
    setComparedIds((prev) => prev.filter((item) => item !== String(id)));
    showToast('Đã xóa sản phẩm khỏi bảng so sánh.');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
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
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF', fontSize: '16px' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={1}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1280px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>So sánh thông số kỹ thuật</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: '0 0 6px 0' }}>
            So Sánh Sản Phẩm Công Nghệ
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
            Đặt các dòng sản phẩm cạnh nhau để đối chiếu thông số phần cứng, hiệu năng thực tế và giá bán chính hãng.
          </p>
        </div>

        {/* Comparison Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '20px', width: '220px', fontSize: '14px', fontWeight: 700, color: '#475569' }}>
                    Sản phẩm
                  </th>
                  {displayProducts.map((p) => {
                    const price = Number(p.price);
                    const salePrice = p.salePrice ? Number(p.salePrice) : null;
                    return (
                      <th key={p.id} style={{ padding: '20px', width: '280px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ position: 'relative', width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeComparedProduct(p.id)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: '#F1F5F9',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                color: '#64748B',
                              }}
                              title="Bỏ so sánh"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                          <Link
                            to={`/product/detail/${p.slug}`}
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#0F172A',
                              textDecoration: 'none',
                              lineHeight: '1.4',
                            }}
                          >
                            {p.name}
                          </Link>
                          <div>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444' }}>
                              {(salePrice || price).toLocaleString('vi-VN')}đ
                            </span>
                            {salePrice && salePrice < price && (
                              <span style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'line-through', marginLeft: '8px' }}>
                                {price.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCartMutation.mutate(p)}
                            style={{
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#0A5BFF',
                              color: '#FFFFFF',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#64748B', fontSize: '13px', backgroundColor: '#F8FAFC' }}>
                    Thương hiệu
                  </td>
                  {displayProducts.map((p) => (
                    <td key={p.id} style={{ padding: '16px 20px', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                      {p.brandId ? 'Chính Hãng' : 'TechPilot Official'}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#64748B', fontSize: '13px', backgroundColor: '#F8FAFC' }}>
                    Tình trạng kho
                  </td>
                  {displayProducts.map((p) => (
                    <td key={p.id} style={{ padding: '16px 20px', fontSize: '13.5px', color: '#10B981', fontWeight: 700 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                      Sẵn hàng (Còn {p.stockQuantity} sản phẩm)
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#64748B', fontSize: '13px', backgroundColor: '#F8FAFC' }}>
                    Thông số kỹ thuật
                  </td>
                  {displayProducts.map((p) => (
                    <td key={p.id} style={{ padding: '16px 20px', fontSize: '13px', color: '#334155' }}>
                      {p.specs ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Object.entries(p.specs).map(([key, val]) => (
                            <div key={key}>
                              <strong style={{ color: '#0F172A' }}>{key}:</strong> {String(val)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Tiêu chuẩn nhà sản xuất</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#64748B', fontSize: '13px', backgroundColor: '#F8FAFC' }}>
                    Chính sách bảo hành
                  </td>
                  {displayProducts.map((p) => (
                    <td key={p.id} style={{ padding: '16px 20px', fontSize: '13px', color: '#0F172A' }}>
                      24 tháng chính hãng • 1 đổi 1 trong 30 ngày
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <StorefrontFooter />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart || null}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(id, qty) => cartService.updateItem(id, qty)}
        onRemoveItem={(id) => cartService.removeItem(id)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Chào mừng, ${user.fullName}!`);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

interface BuilderPartCategory {
  key: string;
  name: string;
  icon: string;
  categorySlug: string;
  wattage: number;
}

const BUILDER_CATEGORIES: BuilderPartCategory[] = [
  { key: 'cpu', name: 'Bộ vi xử lý (CPU)', icon: 'fa-solid fa-microchip', categorySlug: 'main-cpu-vga', wattage: 125 },
  { key: 'mainboard', name: 'Bo mạch chủ (Mainboard)', icon: 'fa-solid fa-chess-board', categorySlug: 'main-cpu-vga', wattage: 50 },
  { key: 'ram', name: 'Bộ nhớ trong (RAM)', icon: 'fa-solid fa-memory', categorySlug: 'linh-kien-pc', wattage: 15 },
  { key: 'vga', name: 'Card màn hình rời (VGA)', icon: 'fa-solid fa-ticket', categorySlug: 'main-cpu-vga', wattage: 250 },
  { key: 'storage', name: 'Ổ cứng SSD / HDD', icon: 'fa-solid fa-hard-drive', categorySlug: 'o-cung', wattage: 10 },
  { key: 'psu', name: 'Nguồn máy tính (PSU)', icon: 'fa-solid fa-plug', categorySlug: 'case-nguon-tan', wattage: 0 },
  { key: 'case', name: 'Vỏ máy tính (Case)', icon: 'fa-solid fa-computer', categorySlug: 'case-nguon-tan', wattage: 0 },
  { key: 'cooling', name: 'Tản nhiệt CPU (Cooler)', icon: 'fa-solid fa-fan', categorySlug: 'case-nguon-tan', wattage: 20 },
];

export const PcBuilderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected components map
  const [selectedParts, setSelectedParts] = useState<Record<string, ProductDto>>({});
  // Active category being picked in modal
  const [activePickingCategory, setActivePickingCategory] = useState<BuilderPartCategory | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Calculate totals
  const totalAmount = Object.values(selectedParts).reduce((sum, p) => {
    const pr = p.salePrice ? Number(p.salePrice) : Number(p.price);
    return sum + pr;
  }, 0);

  const estimatedWattage = BUILDER_CATEGORIES.reduce((watt, cat) => {
    return selectedParts[cat.key] ? watt + cat.wattage : watt;
  }, 100);

  const recommendedPsu = Math.ceil((estimatedWattage * 1.3) / 50) * 50;

  const handleSelectPart = (catKey: string, product: ProductDto) => {
    setSelectedParts((prev) => ({ ...prev, [catKey]: product }));
    setActivePickingCategory(null);
    setModalSearch('');
    showToast(`Đã chọn "${product.name}" vào cấu hình.`);
  };

  const handleRemovePart = (catKey: string) => {
    setSelectedParts((prev) => {
      const next = { ...prev };
      delete next[catKey];
      return next;
    });
    showToast('Đã bỏ linh kiện khỏi cấu hình.');
  };

  const handleClearAll = () => {
    setSelectedParts({});
    showToast('Đã làm mới cấu hình PC.');
  };

  const handleAddAllToCart = async () => {
    const parts = Object.values(selectedParts);
    if (parts.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 linh kiện trước khi thêm vào giỏ hàng.');
      return;
    }
    try {
      for (const part of parts) {
        await cartService.addItem(part.id, 1);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm toàn bộ ${parts.length} linh kiện cấu hình vào giỏ hàng!`);
      setIsCartOpen(true);
    } catch {
      showToast('Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
  };

  const filteredModalProducts = allProducts.filter((p) => {
    if (!modalSearch) return true;
    return p.name.toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <div className="pc-builder-page-wrapper" style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
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

      {/* Main Builder Container */}
      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1280px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary, #64748B)', marginBottom: '24px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: 'var(--primary, #0A5BFF)', fontWeight: 600 }}>Xây dựng cấu hình PC</span>
        </div>

        {/* Hero Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A5BFF 0%, #1E40AF 100%)',
            borderRadius: '20px',
            padding: '36px 40px',
            color: '#FFFFFF',
            marginBottom: '32px',
            boxShadow: '0 10px 25px rgba(10, 91, 255, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
              <i className="fa-solid fa-screwdriver-wrench"></i>
              <span>PC BUILDER 2.0</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0' }}>Xây Dựng Cấu Hình PC Chuyên Nghiệp</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', maxWidth: '600px' }}>
              Tự tay chọn linh kiện máy tính phù hợp ngân sách và hiệu năng. Hệ thống tự động tính toán điện năng và kiểm tra tương thích.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-arrow-rotate-right"></i> Làm mới
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: '#FFFFFF',
                color: '#0A5BFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <i className="fa-solid fa-print"></i> In / Xuất Báo Giá
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>
          {/* Left Column: Components List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {BUILDER_CATEGORIES.map((cat, idx) => {
              const selected = selectedParts[cat.key];
              const price = selected ? (selected.salePrice ? Number(selected.salePrice) : Number(selected.price)) : 0;
              return (
                <div
                  key={cat.key}
                  style={{
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    border: selected ? '1.5px solid #0A5BFF' : '1px solid var(--border, #E2E8F0)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left: Category Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 220px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: selected ? '#EFF6FF' : '#F1F5F9',
                        color: selected ? '#0A5BFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      <i className={cat.icon}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Linh kiện {idx + 1}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                        {cat.name}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Selected Part or Empty */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {selected ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={getProductImage(selected)}
                          alt={selected.name}
                          style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '4px' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Link
                            to={`/product/detail/${selected.slug}`}
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary, #0F172A)',
                              textDecoration: 'none',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {selected.name}
                          </Link>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444', marginTop: '2px' }}>
                            {price.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                        Chưa chọn sản phẩm
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {selected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePickingCategory(cat)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(cat.key)}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: '1px solid #FEE2E2',
                            background: '#FEF2F2',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Xóa linh kiện"
                        >
                          <i className="fa-solid fa-trash-can" style={{ fontSize: '13px' }}></i>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActivePickingCategory(cat)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#0A5BFF',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(10, 91, 255, 0.2)',
                        }}
                      >
                        <i className="fa-solid fa-plus"></i> Chọn linh kiện
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Summary Box */}
          <div
            style={{
              position: 'sticky',
              top: '90px',
              backgroundColor: 'var(--surface-card, #FFFFFF)',
              border: '1px solid var(--border, #E2E8F0)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', color: 'var(--text-primary, #0F172A)' }}>
              Tóm Tắt Cấu Hình
            </h3>

            {/* Spec Highlights */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                <span style={{ color: '#64748B' }}>Số linh kiện đã chọn:</span>
                <strong style={{ color: '#0F172A' }}>{Object.keys(selectedParts).length} / {BUILDER_CATEGORIES.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                <span style={{ color: '#64748B' }}>Công suất tiêu thụ ước tính:</span>
                <strong style={{ color: '#3B82F6' }}>~{estimatedWattage} W</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Khuyến nghị nguồn (PSU):</span>
                <strong style={{ color: '#10B981' }}>{recommendedPsu} W+</strong>
              </div>
            </div>

            {/* Total Price */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Tổng Chi Phí Ước Tính:
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#EF4444' }}>
                {totalAmount.toLocaleString('vi-VN')}đ
              </div>
              <small style={{ color: '#94A3B8', fontSize: '11px' }}>Đã bao gồm 10% VAT & Hỗ trợ lắp ráp miễn phí</small>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={Object.keys(selectedParts).length === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: Object.keys(selectedParts).length > 0 ? '#0A5BFF' : '#CBD5E1',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: Object.keys(selectedParts).length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: Object.keys(selectedParts).length > 0 ? '0 6px 20px rgba(10, 91, 255, 0.3)' : 'none',
                }}
              >
                <i className="fa-solid fa-cart-plus"></i> Thêm Tất Cả Vào Giỏ Hàng
              </button>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                disabled={Object.keys(selectedParts).length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #0A5BFF',
                  backgroundColor: 'transparent',
                  color: '#0A5BFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: Object.keys(selectedParts).length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Đặt Mua Ngay
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Part Picker Modal */}
      {activePickingCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Chọn {activePickingCategory.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  Danh sách sản phẩm chính hãng sẵn sàng lắp đặt
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setActivePickingCategory(null); setModalSearch(''); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94A3B8', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Search */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <input
                type="text"
                placeholder="Tìm linh kiện theo tên, mã sản phẩm, thương hiệu..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Modal Products List */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {filteredModalProducts.map((p) => {
                const pr = p.salePrice ? Number(p.salePrice) : Number(p.price);
                return (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div>
                      <img
                        src={getProductImage(p)}
                        alt={p.name}
                        style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '10px' }}
                      />
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A', marginBottom: '6px', height: '36px', overflow: 'hidden' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                        {pr.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPart(activePickingCategory.key, p)}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0A5BFF',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Chọn vào dàn PC
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
          showToast(`Chào mừng trở lại, ${user.fullName}!`);
        }}
      />
    </div>
  );
};

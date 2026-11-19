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

interface StoreItem {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  isFlagship?: boolean;
}

const STORES_SEED: StoreItem[] = [
  {
    id: '1',
    name: 'Showroom Nexora Quận 1 (Flagship)',
    city: 'hcm',
    address: 'Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 7300 2097',
    hours: '08:00 - 21:30 (Mở cửa cả T7 & CN)',
    isFlagship: true,
  },
  {
    id: '2',
    name: 'Showroom Nexora Quận 10',
    city: 'hcm',
    address: 'Số 386 Đường 3/2, Phường 12, Quận 10, TP. Hồ Chí Minh',
    phone: '028 7300 2098',
    hours: '08:00 - 21:30',
  },
  {
    id: '3',
    name: 'Showroom Nexora Cầu Giấy (Hà Nội)',
    city: 'hanoi',
    address: 'Số 152 Đường Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội',
    phone: '024 7300 2097',
    hours: '08:00 - 21:30 (Mở cửa cả T7 & CN)',
    isFlagship: true,
  },
  {
    id: '4',
    name: 'Showroom Nexora Đống Đa (Hà Nội)',
    city: 'hanoi',
    address: 'Số 89 Đường Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
    phone: '024 7300 2099',
    hours: '08:00 - 21:30',
  },
  {
    id: '5',
    name: 'Showroom Nexora Hải Châu (Đà Nẵng)',
    city: 'danang',
    address: 'Số 68 Đường Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, TP. Đà Nẵng',
    phone: '0236 7300 2097',
    hours: '08:00 - 21:00',
  },
  {
    id: '6',
    name: 'Showroom Nexora Ninh Kiều (Cần Thơ)',
    city: 'cantho',
    address: 'Số 45 Đường 30/4, Phường An Lạc, Quận Ninh Kiều, TP. Cần Thơ',
    phone: '0292 7300 2097',
    hours: '08:00 - 21:00',
  },
];

export const StoresPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [selectedCity, setSelectedCity] = useState('all');

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

  const filteredStores = selectedCity === 'all'
    ? STORES_SEED
    : STORES_SEED.filter((s) => s.city === selectedCity);

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
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

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1100px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#0A5BFF', fontWeight: 600 }}>Hệ thống cửa hàng</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
            Hệ Thống Showroom & Cửa Hàng Gần Bạn
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14.5px' }}>
            Không gian trải nghiệm công nghệ thực tế, tư vấn build máy chuyên sâu và trạm bảo hành chính hãng.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'all', label: 'Tất cả các tỉnh / thành' },
            { id: 'hcm', label: 'TP. Hồ Chí Minh' },
            { id: 'hanoi', label: 'Hà Nội' },
            { id: 'danang', label: 'Đà Nẵng' },
            { id: 'cantho', label: 'Cần Thơ' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCity(c.id)}
              style={{
                padding: '9px 20px',
                borderRadius: '30px',
                border: selectedCity === c.id ? 'none' : '1px solid #E2E8F0',
                backgroundColor: selectedCity === c.id ? '#0A5BFF' : '#FFFFFF',
                color: selectedCity === c.id ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedCity === c.id ? '0 4px 12px rgba(10, 91, 255, 0.25)' : 'none',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Store Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredStores.map((store) => (
            <div
              key={store.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: store.isFlagship ? '1.5px solid #0A5BFF' : '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {store.isFlagship && (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#EFF6FF',
                    color: '#0A5BFF',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  ⭐ FLAGSHIP
                </span>
              )}

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', paddingRight: store.isFlagship ? '80px' : '0' }}>
                  {store.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: '#0A5BFF', marginTop: '3px' }}></i>
                    <span>{store.address}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <i className="fa-solid fa-phone" style={{ color: '#10B981', marginTop: '3px' }}></i>
                    <strong style={{ color: '#0F172A' }}>{store.phone}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <i className="fa-regular fa-clock" style={{ color: '#F59E0B', marginTop: '3px' }}></i>
                    <span>{store.hours}</span>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <span style={{ fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px' }}>
                    🚗 Có chỗ đỗ ô tô
                  </span>
                  <span style={{ fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px' }}>
                    🛠️ Kỹ thuật tại chỗ
                  </span>
                  <span style={{ fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px' }}>
                    💳 Quẹt thẻ miễn phí
                  </span>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <i className="fa-solid fa-diamond-turn-right" style={{ color: '#0A5BFF' }}></i> Chỉ đường trên Google Maps
              </a>
            </div>
          ))}
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';

const DEFAULT_SIDEBAR_CARDS = [
  {
    id: 1,
    title: 'BUILD PC THEO YÊU CẦU',
    subtitle: 'Tối ưu cấu hình - Cân mọi ngân sách',
    imageUrl: '/assets/images/banner-build-pc.jpg',
    linkUrl: '/build-pc',
    cta: 'Xem ngay',
  },
  {
    id: 2,
    title: 'MUA NGAY - TRẢ SAU',
    subtitle: 'Nhận hàng, kiểm tra rồi thanh toán (COD)',
    imageUrl: '/assets/images/banner-pay-later.jpg',
    linkUrl: '/search',
    cta: 'Mua ngay',
  },
  {
    id: 3,
    title: 'THU CŨ ĐỔI MỚI MÁY CŨ',
    subtitle: 'Trợ giá lên tới 6 triệu đồng',
    imageUrl: '/assets/images/banner-trade-in.jpg',
    linkUrl: '/thu-cu-doi-moi',
    cta: 'Xem chi tiết',
  },
];

export const PromoCards: React.FC = () => {
  const { data: sidebarBanners = [] } = useQuery({
    queryKey: ['banners', 'sidebar'],
    queryFn: () => storefrontService.getBanners('sidebar'),
  });

  const activeBanners = sidebarBanners.filter((b) => b.isActive).slice(0, 3);

  const cards =
    activeBanners.length > 0
      ? activeBanners.map((b, idx) => ({
          id: b.id,
          title: b.title,
          subtitle:
            DEFAULT_SIDEBAR_CARDS[idx]?.subtitle || 'Ưu đãi chính hãng dành riêng cho bạn tại Nexora',
          imageUrl:
            b.imageUrl.startsWith('/') || b.imageUrl.startsWith('http')
              ? b.imageUrl
              : `/${b.imageUrl}`,
          linkUrl: b.linkUrl || '/search',
          cta: DEFAULT_SIDEBAR_CARDS[idx]?.cta || 'Xem ngay',
        }))
      : DEFAULT_SIDEBAR_CARDS;

  return (
    <div className="hero-section__right">
      {cards.map((card, idx) => (
        <div
          key={card.id}
          className="promo-card promo-card--dark"
          style={{
            background: `linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.35) 80%), url('${card.imageUrl}') center/cover no-repeat`,
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h4
              style={{
                color: idx === 1 ? '#60a5fa' : '#ffffff',
                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
              }}
            >
              {card.title}
            </h4>
            <p style={{ color: '#cbd5e1', marginBottom: '12px' }}>{card.subtitle}</p>
          </div>
          {idx === 1 && (
            <span className="promo-card__number" style={{ opacity: 0.15, color: '#ffffff' }}>
              <i className="fa-solid fa-truck-fast"></i>
            </span>
          )}
          <Link
            to={card.linkUrl}
            className="btn btn--primary btn--sm"
            style={{ position: 'relative', zIndex: 2 }}
          >
            {card.cta}
          </Link>
        </div>
      ))}
    </div>
  );
};

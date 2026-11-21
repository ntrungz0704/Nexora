import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import type { BannerDto } from '@nexora/shared';

interface SlideItem {
  id: number;
  imageUrl: string;
  title: string;
  linkUrl: string;
}

const FALLBACK_SLIDES: SlideItem[] = [
  {
    id: 1,
    imageUrl: '/assets/banners/nexora-hero-desktop.webp',
    title: 'Nexora — Công nghệ cho mọi giới hạn',
    linkUrl: '/search',
  },
];

export const HeroCarousel: React.FC<{ banners?: BannerDto[] }> = ({ banners: propBanners }) => {
  const { data: fetchedBanners = [] } = useQuery({
    queryKey: ['banners', 'hero'],
    queryFn: () => storefrontService.getBanners('hero'),
    enabled: !propBanners,
  });

  const activeBanners = (propBanners ?? fetchedBanners).filter(
    (b) => b.isActive && b.placement === 'hero',
  );

  const slides: SlideItem[] =
    activeBanners.length > 0
      ? activeBanners.map((b) => ({
          id: b.id,
          imageUrl:
            b.imageUrl.startsWith('/') || b.imageUrl.startsWith('http')
              ? b.imageUrl
              : `/${b.imageUrl}`,
          title: b.title,
          linkUrl: b.linkUrl || '/search',
        }))
      : FALLBACK_SLIDES;

  const [currentIdx, setCurrentIdx] = useState(0);
  const safeIdx = currentIdx >= slides.length ? 0 : currentIdx;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goPrev = () => setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setCurrentIdx((prev) => (prev + 1) % slides.length);

  return (
    <div className="hero-section__center" id="heroCarousel" style={{ position: 'relative' }}>
      {slides.map((slide, idx) => {
        const isActive = idx === safeIdx;
        return (
          <Link
            key={slide.id}
            to={slide.linkUrl}
            className={`carousel-slide ${isActive ? 'is-active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(8, 19, 37, 0.72) 0%, rgba(8, 19, 37, 0.28) 48%, rgba(8, 19, 37, 0.05) 100%), url('${slide.imageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
              textDecoration: 'none',
            }}
          >
            <div className="carousel-slide__content" style={{ maxWidth: '520px' }}>
              <span className="carousel-slide__tag">NEXORA OFFICIAL</span>
              <h2 style={{ color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
                {slide.title}
              </h2>
              <p style={{ color: '#E2E8F0', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                Sản phẩm phần cứng chính hãng — Bảo hành tiêu chuẩn nhà sản xuất, giao nhanh toàn
                quốc.
              </p>
              <span
                className="btn btn--light"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Khám phá ngay <i className="fa-solid fa-arrow-right"></i>
              </span>
            </div>
          </Link>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              goPrev();
            }}
            aria-label="Banner trước"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: '13px' }}></i>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              goNext();
            }}
            aria-label="Banner tiếp theo"
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '13px' }}></i>
          </button>
        </>
      )}

      <div className="carousel-controls">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`carousel-dot ${idx === safeIdx ? 'is-active' : ''}`}
            onClick={() => setCurrentIdx(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

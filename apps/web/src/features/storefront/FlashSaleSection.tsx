import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';
import { ProductCard } from './ProductCard';

interface FlashSaleSectionProps {
  campaignName?: string;
  endTime?: string;
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

function calcRemaining(endTimeIso: string | undefined, nowMs: number): { hours: number; minutes: number; seconds: number } {
  if (!endTimeIso) return { hours: 0, minutes: 0, seconds: 0 };
  const diffMs = Math.max(0, new Date(endTimeIso).getTime() - nowMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  campaignName,
  endTime,
  products,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!endTime) return;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const timeLeft = calcRemaining(endTime, nowMs);

  if (!products || products.length === 0) return null;

  return (
    <section className="flash-sale-section container" style={{ marginTop: '28px' }}>
      <header className="flash-sale-header">
        <div className="flash-sale-heading">
          <h2 className="flash-sale-title">
            <span className="flash-sale-icon" aria-hidden="true">
              ⚡
            </span>
            {campaignName || 'FLASH SALE'}
          </h2>

          {endTime && (
            <>
              <span className="flash-sale-ending-text" id="flashEndingText">
                Kết thúc sau
              </span>

              <div
                className="flash-sale-countdown countdown"
                id="flashCountdown"
                aria-label="Thời gian Flash Sale còn lại"
              >
                <div className="countdown-unit">
                  <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>
                  <span>GIỜ</span>
                </div>

                <span className="countdown-separator">:</span>

                <div className="countdown-unit">
                  <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>
                  <span>PHÚT</span>
                </div>

                <span className="countdown-separator">:</span>

                <div className="countdown-unit">
                  <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>
                  <span>GIÂY</span>
                </div>
              </div>
            </>
          )}
        </div>

        <Link className="flash-sale-view-all" to="/search?flash=1">
          Xem tất cả <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div
        className="products-grid flash-sale-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        {products.slice(0, 5).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            isFlashSale={true}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>
    </section>
  );
};

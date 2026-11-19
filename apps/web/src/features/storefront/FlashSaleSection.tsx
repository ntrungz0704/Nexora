import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';
import { ProductCard } from './ProductCard';

interface FlashSaleSectionProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  products,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="flash-sale-section container" style={{ marginTop: '28px' }}>
      <header className="flash-sale-header">
        <div className="flash-sale-heading">
          <h2 className="flash-sale-title">
            <span className="flash-sale-icon" aria-hidden="true">
              ⚡
            </span>
            FLASH SALE
          </h2>

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

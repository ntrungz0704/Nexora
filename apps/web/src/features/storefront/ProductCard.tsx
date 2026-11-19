import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';
import { getProductImage } from '../../lib/productImage';

interface ProductCardProps {
  product: ProductDto;
  isFlashSale?: boolean;
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFlashSale = false,
  onAddToCart,
  onToggleWishlist,
}) => {
  const imageUrl = getProductImage(product);
  const p = Number(product.price);
  const sp = product.salePrice ? Number(product.salePrice) : null;
  const hasDiscount = sp !== null && sp < p && sp > 0;
  const currentPrice = hasDiscount ? sp : p;
  const originalPrice = p;
  const discountPercent = hasDiscount ? Math.round(((p - sp) / p) * 100) : 0;

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const specsList = product.specs ? Object.entries(product.specs).slice(0, 3) : [];

  return (
    <div className="product-card" data-full-title={product.name} title={product.name}>
      {hasDiscount && discountPercent > 0 && (
        <span
          className={`product-card__badge ${
            isFlashSale ? 'product-card__badge--flash' : 'product-card__badge--promo'
          }`}
          title={isFlashSale ? '⚡ Flash Sale Giảm Sâu' : '🏷️ Sản phẩm Khuyến Mãi'}
        >
          {isFlashSale ? (
            <>
              <i className="fa-solid fa-fire-flame-curved"></i> 🔥 -{discountPercent}%
            </>
          ) : (
            <>
              <i className="fa-solid fa-tag"></i> -{discountPercent}%
            </>
          )}
        </span>
      )}

      {/* Wishlist Button */}
      <button
        type="button"
        className="product-card__wishlist-btn"
        onClick={() => onToggleWishlist?.(product.id)}
        title="Thêm vào yêu thích"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 5,
          background: 'var(--bg-card, #FFFFFF)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary, #64748B)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <i className="fa-regular fa-heart" style={{ fontSize: '14px' }}></i>
      </button>

      {/* Compare Button */}
      <Link
        to={`/compare?add=${product.id}`}
        className="product-card__compare-btn"
        title="Thêm vào so sánh sản phẩm"
        style={{
          position: 'absolute',
          top: '12px',
          right: '50px',
          zIndex: 5,
          background: 'var(--bg-card, #FFFFFF)',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#10B981',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          textDecoration: 'none',
        }}
      >
        <i className="fa-solid fa-scale-balanced" style={{ fontSize: '13px' }}></i>
      </Link>

      {/* Thumbnail */}
      <Link
        to={`/product/detail/${product.slug}`}
        className="product-card__thumb"
        title={product.name}
      >
        <img
          className="product-card__image"
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
          }}
        />
      </Link>

      {/* Body */}
      <div className="product-card__body">
        <Link
          to={`/product/detail/${product.slug}`}
          className="product-card__name"
          title={product.name}
        >
          {product.name}
        </Link>

        {specsList.length > 0 && (
          <div className="product-card__specs-box">
            <div className="specs-pill-grid">
              {specsList.map(([_key, val], i) => (
                <span key={i} className="specs-pill">
                  <i className="fa-solid fa-microchip"></i> {val}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="product-card__price">
          <span className="product-card__price-now">{formatPrice(currentPrice)}</span>
          {hasDiscount && (
            <span className="product-card__price-old">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="product-card__rating">
          <span className="stars">
            <i className="fa-solid fa-star" style={{ color: '#FACC15' }}></i>
            <i className="fa-solid fa-star" style={{ color: '#FACC15' }}></i>
            <i className="fa-solid fa-star" style={{ color: '#FACC15' }}></i>
            <i className="fa-solid fa-star" style={{ color: '#FACC15' }}></i>
            <i className="fa-solid fa-star" style={{ color: '#FACC15' }}></i>
          </span>
          <span className="product-card__reviews">(24)</span>
        </div>

        {isFlashSale && (
          <div className="sold-bar" style={{ marginTop: '6px' }}>
            <div className="sold-bar__track">
              <div className="sold-bar__fill" style={{ width: '68%' }}></div>
              <div className="sold-bar__text">Đã bán 17/25</div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Add to Cart Button */}
      <div className="product-card__add-form">
        <button
          type="button"
          className="product-card__add"
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
        >
          <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ
        </button>
      </div>
    </div>
  );
};

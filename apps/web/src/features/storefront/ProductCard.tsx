import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';
import { getProductImage } from '../../lib/productImage';
import { authService } from '../../services/authService';

interface ProductCardProps {
  product: ProductDto;
  isFlashSale?: boolean;
  isInWishlist?: boolean;
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

interface SpecPill {
  icon: string;
  label: string;
}

function extractProductPills(product: ProductDto): SpecPill[] {
  const pills: SpecPill[] = [];
  const raw = product.specs;
  const s: Record<string, unknown> = {};

  if (raw && typeof raw === 'object') {
    if ('specs' in raw && raw.specs && typeof raw.specs === 'object') {
      Object.assign(s, raw.specs);
    }
    Object.assign(s, raw);
  }

  // 1. CPU
  if (s.cpu_model && typeof s.cpu_model === 'string') {
    const cpu = s.cpu_model
      .replace(/^Intel\s+(Core\s+)?/i, '')
      .replace(/^AMD\s+(Ryzen\s+)?/i, 'R')
      .replace(/\s+Processor$/i, '');
    pills.push({ icon: 'fa-solid fa-microchip', label: cpu.length > 22 ? cpu.slice(0, 22) : cpu });
  }

  // 2. RAM
  if (s.ram_gb) {
    const ramType = s.ram_type ? String(s.ram_type).toUpperCase() : '';
    const label = `${s.ram_gb}GB ${ramType}`.trim();
    pills.push({ icon: 'fa-solid fa-memory', label });
  }

  // 3. Storage
  if (s.storage_gb) {
    const gb = Number(s.storage_gb);
    const sizeStr = gb >= 1000 ? `${(gb / 1000).toFixed(gb % 1000 === 0 ? 0 : 1)}TB` : `${gb}GB`;
    const typeStr = String(s.storage_type || '').toLowerCase().includes('hdd') ? 'HDD' : 'SSD';
    pills.push({ icon: 'fa-solid fa-hard-drive', label: `${sizeStr} ${typeStr}` });
  }

  // 4. GPU
  if (pills.length < 3 && s.gpu_model && typeof s.gpu_model === 'string') {
    const gpu = s.gpu_model
      .replace(/^NVIDIA\s+(GeForce\s+)?/i, '')
      .replace(/^AMD\s+(Radeon\s+)?/i, '')
      .replace(/\s+Laptop GPU$/i, '');
    pills.push({ icon: 'fa-solid fa-gamepad', label: gpu.length > 22 ? gpu.slice(0, 22) : gpu });
  }

  // 5. Display / Màn hình
  if (pills.length < 3 && (s.display_size_inch || s.resolution || s.refresh_rate_hz)) {
    let disp = '';
    if (s.display_size_inch) disp += `${s.display_size_inch}" `;
    if (s.refresh_rate_hz && Number(s.refresh_rate_hz) > 60) disp += `${s.refresh_rate_hz}Hz `;
    else if (s.resolution) disp += `${s.resolution} `;
    if (disp.trim()) {
      pills.push({ icon: 'fa-solid fa-display', label: disp.trim() });
    }
  }

  // 6. Generic keys for accessories / peripherals
  if (pills.length < 3) {
    const secondaryKeys: { key: string; icon: string; prefix?: string; suffix?: string }[] = [
      { key: 'switch_type', icon: 'fa-solid fa-keyboard' },
      { key: 'sensor', icon: 'fa-solid fa-computer-mouse' },
      { key: 'dpi', icon: 'fa-solid fa-bullseye', prefix: 'DPI ' },
      { key: 'connection', icon: 'fa-solid fa-wifi' },
      { key: 'wattage', icon: 'fa-solid fa-bolt', suffix: 'W' },
      { key: 'chipset', icon: 'fa-solid fa-microchip' },
      { key: 'socket', icon: 'fa-solid fa-plug' },
    ];
    for (const item of secondaryKeys) {
      if (s[item.key]) {
        const val = `${item.prefix || ''}${s[item.key]}${item.suffix || ''}`;
        pills.push({ icon: item.icon, label: String(val) });
        if (pills.length >= 3) break;
      }
    }
  }

  // 7. Fallback: Parse from shortDescription or name
  if (pills.length === 0 && (product.shortDescription || product.name)) {
    const text = `${product.shortDescription || ''} ${product.name}`;
    const cpuMatch = text.match(/(i[3579]-[\w]+|Ryzen\s+[3579]\s+[\w]+|M[1234]\s+(Pro|Max)?)/i);
    if (cpuMatch) pills.push({ icon: 'fa-solid fa-microchip', label: cpuMatch[0] });

    const ramMatch = text.match(/(\d+\s*GB\s*(DDR[45])?)/i);
    if (ramMatch) pills.push({ icon: 'fa-solid fa-memory', label: ramMatch[0] });

    const ssdMatch = text.match(/((SSD\s*)?(\d+\s*(GB|TB))\s*(NVMe|PCIe)?)/i);
    if (ssdMatch) pills.push({ icon: 'fa-solid fa-hard-drive', label: ssdMatch[0] });

    if (pills.length < 3) {
      const gpuMatch = text.match(/(RTX\s*\d{4}(\s*Ti)?|GTX\s*\d{4}|Radeon\s*\w+)/i);
      if (gpuMatch) pills.push({ icon: 'fa-solid fa-gamepad', label: gpuMatch[0] });
    }
  }

  // 8. Absolute fallback: guarantee 2 pills for uniform alignment
  if (pills.length === 0) {
    if (product.category?.name) {
      pills.push({ icon: 'fa-solid fa-tag', label: product.category.name });
    }
    pills.push({ icon: 'fa-solid fa-shield-halved', label: 'Chính hãng 100%' });
  }

  return pills.slice(0, 3);
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFlashSale = false,
  isInWishlist = false,
  onAddToCart,
  onToggleWishlist,
}) => {
  const navigate = useNavigate();
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

  const pills = React.useMemo(() => extractProductPills(product), [product]);

  const isOutOfStock = (product.stockQuantity ?? 1) <= 0;

  return (
    <div className={`product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}`} data-full-title={product.name} title={product.name}>
      {isOutOfStock ? (
        <span
          className="product-card__badge"
          style={{
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontWeight: 700,
            zIndex: 4,
          }}
          title="Sản phẩm hiện đang tạm hết hàng"
        >
          <i className="fa-solid fa-circle-xmark"></i> Hết hàng
        </span>
      ) : (
        hasDiscount && discountPercent > 0 && (
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
        )
      )}

      {/* Wishlist Button: Auth Required Parity with TechPilot */}
      <button
        type="button"
        className="product-card__wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const user = authService.getCurrentUser();
          if (!user) {
            navigate(
              '/auth/login?redirect=' +
                encodeURIComponent(window.location.pathname + window.location.search),
            );
            return;
          }
          onToggleWishlist?.(product.id);
        }}
        title={isInWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
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
          color: isInWishlist ? '#EF4444' : 'var(--text-secondary, #64748B)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <i
          className={isInWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
          style={{ fontSize: '14px', color: isInWishlist ? '#EF4444' : undefined }}
        ></i>
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

        <div className="product-card__specs-box">
          <div className="specs-pill-grid">
            {pills.map((pill, i) => (
              <span key={i} className="specs-pill" title={pill.label}>
                <i className={pill.icon}></i> {pill.label}
              </span>
            ))}
          </div>
        </div>

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
          disabled={isOutOfStock}
          className={`product-card__add ${isOutOfStock ? 'product-card__add--disabled' : ''}`}
          style={isOutOfStock ? { backgroundColor: '#94A3B8', borderColor: '#94A3B8', cursor: 'not-allowed', color: '#FFFFFF' } : undefined}
          onClick={(e) => {
            e.preventDefault();
            if (!isOutOfStock) {
              onAddToCart(product);
            }
          }}
        >
          <i className={isOutOfStock ? "fa-solid fa-ban" : "fa-solid fa-cart-plus"}></i> {isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { ProductDto } from '@nexora/shared';

interface FlashSaleSectionProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({ products, onAddToCart }) => {
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

  const formatPrice = (val: string | number) => {
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  const calculateDiscount = (price: string, salePrice: string | null | undefined) => {
    if (!salePrice) return 0;
    const p = Number(price);
    const sp = Number(salePrice);
    if (p <= 0 || sp >= p) return 0;
    return Math.round(((p - sp) / p) * 100);
  };

  return (
    <section className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-900/40 rounded-2xl p-5 shadow-2xl">
      {/* Header with Title & Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-rose-900/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <i className="fa-solid fa-bolt text-xl animate-bounce"></i>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              FLASH SALE{' '}
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                GIẢM TỚI 30%
              </span>
            </h2>
            <p className="text-xs text-rose-300">
              Cơ hội săn công nghệ phần cứng đỉnh cao giá hủy diệt
            </p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Kết thúc sau:</span>
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-white">
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-rose-400">:</span>
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-rose-400">:</span>
            <span className="bg-rose-600 px-2 py-1 rounded-md shadow">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const discount = calculateDiscount(p.price, p.salePrice);
          return (
            <div
              key={p.id}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-md hover:shadow-rose-950/30"
            >
              <div>
                {/* Product Thumbnail & Discount Badge */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 mb-3 flex items-center justify-center p-2">
                  <img
                    src={p.thumbnailUrl || '/assets/images/placeholder.webp'}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                    }}
                  />
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      -{discount}%
                    </span>
                  )}
                  <span className="absolute top-2 right-2 bg-slate-900/80 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Trả góp 0%
                  </span>
                </div>

                {/* Brand & Title */}
                <span className="text-[10px] font-bold uppercase text-blue-400">
                  {p.brand?.name || 'Nexora Tech'}
                </span>
                <h3
                  className="text-xs font-bold text-white line-clamp-2 mt-0.5 group-hover:text-blue-400 transition"
                  title={p.name}
                >
                  {p.name}
                </h3>
              </div>

              {/* Price & Progress Bar */}
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black text-rose-500">
                    {formatPrice(p.salePrice || p.price)}
                  </span>
                  {p.salePrice && (
                    <span className="text-[11px] text-slate-500 line-through">
                      {formatPrice(p.price)}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                  <div className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>⚡ Đang bán chạy</span>
                  <span className="text-amber-400 font-semibold">Còn {p.stockQuantity} chiếc</span>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={() => onAddToCart(p)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                >
                  <i className="fa-solid fa-cart-plus"></i>
                  <span>Thêm vào giỏ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import type { ProductDto } from '@nexora/shared';

interface ProductCatalogSectionProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (product: ProductDto) => void;
}

const TABS = [
  { id: 'all', label: 'Tất cả sản phẩm', slug: undefined },
  { id: 'laptop-gaming', label: 'Laptop Gaming', slug: 'laptop-gaming' },
  { id: 'pc-nexora', label: 'PC Nexora', slug: 'pc-nexora' },
  { id: 'main-cpu-vga', label: 'Linh kiện PC', slug: 'main-cpu-vga' },
  { id: 'man-hinh', label: 'Màn hình', slug: 'man-hinh' },
  { id: 'ban-phim', label: 'Gaming Gear', slug: 'ban-phim' },
];

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  products,
  onAddToCart,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts =
    activeTab === 'all' ? products : products.filter((p) => p.category?.slug === activeTab);

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
    <section className="space-y-5">
      {/* Section Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-blue-600 inline-block"></span>
            Sản Phẩm Công Nghệ Nổi Bật
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Linh kiện, PC và Laptop tuyển chọn chính hãng 100%
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredProducts.map((p) => {
          const discount = calculateDiscount(p.price, p.salePrice);
          const specs = p.specs || {};
          const firstSpecs = Object.values(specs).slice(0, 2);

          return (
            <div
              key={p.id}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-md hover:shadow-blue-950/30"
            >
              <div>
                {/* Image & Tags */}
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
                    <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      -{discount}%
                    </span>
                  )}
                  <span className="absolute top-2 right-2 bg-slate-900/80 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Trả góp 0%
                  </span>
                </div>

                {/* Brand */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span className="text-blue-400 uppercase">{p.brand?.name || 'Nexora'}</span>
                  <span>Mã: {p.sku}</span>
                </div>

                {/* Product Title */}
                <h3
                  className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition"
                  title={p.name}
                >
                  {p.name}
                </h3>

                {/* Specs preview tags */}
                {firstSpecs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {firstSpecs.map((specVal: unknown, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-medium bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                      >
                        {String(specVal)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Add to Cart Action */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-black text-rose-500">
                    {formatPrice(p.salePrice || p.price)}
                  </span>
                  {p.salePrice && (
                    <span className="text-[11px] text-slate-500 line-through">
                      {formatPrice(p.price)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAddToCart(p)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <i className="fa-solid fa-cart-plus text-xs"></i>
                    <span>Thêm giỏ</span>
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 flex items-center justify-center transition border border-slate-700/60"
                    title="Thêm vào yêu thích"
                  >
                    <i className="fa-regular fa-heart text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

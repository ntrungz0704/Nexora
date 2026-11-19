import React, { useState } from 'react';
import type { ProductDto } from '@nexora/shared';
import { ProductCard } from './ProductCard';

interface ProductCatalogSectionProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

const TABS = [
  { id: 'all', label: 'Tất cả sản phẩm', slug: undefined },
  { id: 'laptop', label: 'Laptop', slug: 'laptop' },
  { id: 'pc-nexora', label: 'PC TechPilot', slug: 'pc-nexora' },
  { id: 'main-cpu-vga', label: 'Linh kiện PC', slug: 'main-cpu-vga' },
  { id: 'man-hinh', label: 'Màn hình', slug: 'man-hinh' },
  { id: 'ban-phim', label: 'Gaming Gear', slug: 'ban-phim' },
];

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  products,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts =
    activeTab === 'all'
      ? products
      : products.filter(
          (p) =>
            p.category?.slug === activeTab ||
            p.category?.name.toLowerCase().includes(activeTab) ||
            p.name.toLowerCase().includes(activeTab),
        );

  return (
    <section className="container" style={{ marginTop: '36px' }}>
      {/* Header & Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '4px',
              height: '24px',
              backgroundColor: 'var(--primary, #0A5BFF)',
              borderRadius: '2px',
              display: 'inline-block',
            }}
          ></span>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Sản phẩm nổi bật
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                backgroundColor:
                  activeTab === tab.id ? 'var(--primary, #0A5BFF)' : 'var(--surface-card, #FFFFFF)',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        className="products-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>
    </section>
  );
};

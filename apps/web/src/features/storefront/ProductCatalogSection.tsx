import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';
import { ProductCard } from './ProductCard';

interface ProductCatalogSectionProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
  onToggleWishlist?: (productId: number | string) => void;
}

const POPULAR_CATEGORIES = [
  { name: 'Laptop', slug: 'laptop', cat: 'laptop' },
  { name: 'PC', slug: 'pc', cat: 'pc' },
  { name: 'Màn hình', slug: 'monitor', cat: 'monitor' },
  { name: 'Mainboard', slug: 'mainboard', cat: 'mainboard' },
  { name: 'CPU', slug: 'cpu', cat: 'cpu' },
  { name: 'VGA', slug: 'vga', cat: 'vga' },
  { name: 'RAM', slug: 'ram', cat: 'ram' },
  { name: 'Ổ cứng', slug: 'storage', cat: 'storage' },
  { name: 'Case', slug: 'case', cat: 'case' },
  { name: 'Tản nhiệt', slug: 'cooling', cat: 'cooling' },
  { name: 'Nguồn', slug: 'psu', cat: 'psu' },
  { name: 'Bàn phím', slug: 'keyboard', cat: 'keyboard' },
  { name: 'Chuột', slug: 'mouse', cat: 'mouse' },
  { name: 'Ghế', slug: 'chair', cat: 'chair' },
  { name: 'Tai nghe', slug: 'headset', cat: 'headset' },
  { name: 'Loa', slug: 'speaker', cat: 'speaker' },
  { name: 'Console', slug: 'console', cat: 'console' },
  { name: 'Phụ kiện', slug: 'accessories', cat: 'accessories' },
  { name: 'Thiết bị VP', slug: 'office-equipment', cat: 'office-equipment' },
  { name: 'Sạc DP', slug: 'power-bank', cat: 'power-bank' },
];

const BEST_SELLER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'pc', label: 'PC Gaming' },
  { id: 'components', label: 'Linh Kiện' },
  { id: 'monitor', label: 'Màn Hình' },
  { id: 'gear', label: 'Gaming Gear' },
];

const BRAND_LOGOS = [
  { name: 'ASUS', file: 'asus.svg' },
  { name: 'MSI', file: 'msi.svg' },
  { name: 'GIGABYTE', file: 'gigabyte.svg' },
  { name: 'INTEL', file: 'intel.svg' },
  { name: 'AMD', file: 'amd.svg' },
  { name: 'SAMSUNG', file: 'samsung.svg' },
  { name: 'CORSAIR', file: 'corsair.svg' },
  { name: 'ACER', file: 'acer.svg' },
  { name: 'DELL', file: 'dell.svg' },
  { name: 'HP', file: 'hp.svg' },
  { name: 'LENOVO', file: 'lenovo.svg' },
  { name: 'LG', file: 'lg.svg' },
  { name: 'LOGITECH', file: 'logitech.svg' },
  { name: 'RAZER', file: 'razer.svg' },
  { name: 'KINGSTON', file: 'kingston.svg' },
];

const CUSTOMER_REVIEWS = [
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'Khách hàng mua ROG Zephyrus G16',
    comment: 'Máy đóng gói cực kỳ cẩn thận, nguyên seal chính hãng, giao hỏa tốc trong 2 giờ. Kỹ thuật viên hỗ trợ cài win và test máy rất nhiệt tình!',
  },
  {
    name: 'Trần Văn Hoàng',
    role: 'Khách hàng build PC Workstation',
    comment: 'Cấu hình i9 14900K kèm RTX 4090 chạy mượt mà không bị nghẽn, giá rẻ hơn mặt bằng chung vài triệu và tặng kèm gói vệ sinh máy trọn đời.',
  },
  {
    name: 'Lê Thu Trang',
    role: 'Khách hàng mua màn hình OLED',
    comment: 'Màn hình Samsung Odyssey OLED G9 hình ảnh quá đỉnh, màu đen sâu tuyệt đối. Đổi trả 7 ngày 1-đổi-1 làm mình rất yên tâm khi mua online.',
  },
  {
    name: 'Đặng Quốc Huy',
    role: 'Game thủ eSports',
    comment: 'Chuột Logitech Superlight 2 chính hãng siêu nhẹ, click chuẩn xác, tư vấn AI trên web chuẩn nhu cầu mình cần. Sẽ tiếp tục ủng hộ Nexora!',
  },
];

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  products,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  // Filter products for Best Sellers tab
  const getFilteredBestSellers = () => {
    if (activeTab === 'all') return products.slice(0, 10);
    if (activeTab === 'laptop') {
      return products.filter((p) => p.category?.slug.includes('laptop') || p.name.toLowerCase().includes('laptop'));
    }
    if (activeTab === 'pc') {
      return products.filter((p) => p.category?.slug.includes('pc') || p.name.toLowerCase().includes('pc'));
    }
    if (activeTab === 'components') {
      return products.filter((p) =>
        ['mainboard', 'cpu', 'vga', 'ram', 'storage', 'case', 'cooling', 'psu', 'main-cpu-vga', 'case-nguon-tan', 'o-cung'].includes(p.category?.slug || '') ||
        p.name.toLowerCase().includes('rtx') ||
        p.name.toLowerCase().includes('cpu') ||
        p.name.toLowerCase().includes('ram')
      );
    }
    if (activeTab === 'monitor') {
      return products.filter((p) => p.category?.slug === 'monitor' || p.category?.slug.includes('man-hinh') || p.name.toLowerCase().includes('màn hình'));
    }
    if (activeTab === 'gear') {
      return products.filter((p) =>
        ['keyboard', 'mouse', 'chair', 'headset', 'speaker', 'ban-phim', 'chuot-lot-chuot', 'tai-nghe'].includes(p.category?.slug || '') ||
        p.name.toLowerCase().includes('chuột') ||
        p.name.toLowerCase().includes('bàn phím')
      );
    }
    return products.slice(0, 10);
  };

  const bestSellerList = getFilteredBestSellers();

  // Highlight and New Arrivals slices
  const featuredProducts = products.filter((p) => p.isFeatured || p.isHot).slice(0, 5);
  const newProducts = [...products].reverse().slice(0, 5);
  const appleProducts = products.filter((p) => p.name.toLowerCase().includes('apple') || p.name.toLowerCase().includes('macbook') || p.category?.slug.includes('pc')).slice(0, 4);

  // Category specific slices
  const laptopProducts = products.filter((p) => p.category?.slug.includes('laptop') || p.name.toLowerCase().includes('laptop')).slice(0, 5);
  const pcProducts = products.filter((p) => p.category?.slug.includes('pc') || p.name.toLowerCase().includes('pc')).slice(0, 5);
  const componentProducts = products.filter((p) =>
    ['main-cpu-vga', 'case-nguon-tan', 'o-cung'].includes(p.category?.slug || '') ||
    p.name.toLowerCase().includes('rtx') ||
    p.name.toLowerCase().includes('intel')
  ).slice(0, 5);
  const monitorProducts = products.filter((p) => p.category?.slug.includes('man-hinh') || p.name.toLowerCase().includes('màn hình')).slice(0, 5);
  const gearProducts = products.filter((p) =>
    ['ban-phim', 'chuot-lot-chuot', 'tai-nghe'].includes(p.category?.slug || '') ||
    p.name.toLowerCase().includes('chuột') ||
    p.name.toLowerCase().includes('phím')
  ).slice(0, 5);

  return (
    <>
      {/* ===== SẢN PHẨM NỔI BẬT (HOT) ===== */}
      {featuredProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-fire" style={{ color: '#ff4757', marginRight: '8px' }}></i>Sản phẩm nổi bật</h2>
            <Link to="/search?sort=popular" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 7. POPULAR CIRCULAR CATEGORIES STRIP ===== */}
      <section className="container section" style={{ marginTop: '36px' }}>
        <div className="section__head">
          <h2>Danh mục sản phẩm</h2>
          <Link to="/search" className="section__more">
            Xem tất cả <i className="fa-solid fa-chevron-right"></i>
          </Link>
        </div>
        <div className="category-strip">
          {POPULAR_CATEGORIES.map((item, idx) => (
            <Link key={idx} to={`/search?cat=${item.slug}`} className="category-strip__item">
              <div className="category-strip__icon">
                <img
                  src={`/assets/images/categories/category-${item.cat}.png`}
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).outerHTML = `<i class="fa-solid fa-tag" style="font-size: 24px; color: var(--primary);"></i>`;
                  }}
                />
              </div>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== BANNER TRUNG GIAN RTX 50 BLACKWELL ===== */}
      <section className="container section" style={{ marginTop: '28px' }}>
        <div
          className="promo-banner"
          style={{
            background: "linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.45) 60%, rgba(15, 23, 42, 0.1) 100%), url('/assets/images/rtx-banner.jpg') center/cover no-repeat",
            minHeight: '210px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '32px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="promo-banner__content">
            <span
              className="promo-banner__tag"
              style={{
                backgroundColor: '#0A5BFF',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              SẮP RA MẮT
            </span>
            <h3 style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.8)', fontSize: '24px', fontWeight: 800, margin: '10px 0 6px 0' }}>
              NVIDIA GeForce RTX 50 Series
            </h3>
            <p style={{ color: '#e2e8f0', textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontSize: '14px', margin: 0, maxWidth: '650px' }}>
              Sức mạnh tối thượng từ kiến trúc Blackwell, dẫn đầu cuộc cách mạng đồ họa AI thế hệ mới.
            </p>
          </div>
          <Link
            to="/auth/register"
            className="btn btn--light"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            Đăng ký thông tin <i className="fa-solid fa-bell"></i>
          </Link>
        </div>
      </section>

      {/* ===== 8. BEST SELLER PRODUCTS WITH TABS ===== */}
      <section className="container section section-best-sellers" style={{ marginTop: '36px' }}>
        <div className="best-seller-section__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Sản phẩm bán chạy
          </h2>
          <div className="tabs-nav" style={{ display: 'flex', gap: '8px' }}>
            {BEST_SELLER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                  backgroundColor: activeTab === tab.id ? '#0A5BFF' : '#FFFFFF',
                  color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="products-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
          }}
        >
          {bestSellerList.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </section>

      {/* ===== SẢN PHẨM MỚI VỀ (NEW ARRIVALS) ===== */}
      {newProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-sparkles" style={{ color: '#2ed573', marginRight: '8px' }}></i>Sản phẩm mới về</h2>
            <Link to="/search?sort=newest" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {newProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 9. TRIPLE PROMOTION BANNER ===== */}
      <section className="container section" style={{ marginTop: '36px' }}>
        <div className="promo-banners-container">
          <div className="promo-banner" style={{ backgroundImage: "url('/assets/images/promo-banner-1.jpg')" }}>
            <div className="promo-banner__content">
              <h3>Build PC Cực Chất</h3>
              <p>Tặng kèm tản nhiệt khí khi lắp PC nguyên bộ.</p>
            </div>
            <Link to="/build-pc" className="btn btn--sm">Build Ngay</Link>
          </div>
          <div className="promo-banner" style={{ backgroundImage: "url('/assets/images/promo-banner-2.jpg')" }}>
            <div className="promo-banner__content">
              <h3>BẢO HÀNH CHÍNH HÃNG</h3>
              <p>Cam kết bảo hành chính hãng 12-36 tháng cho tất cả sản phẩm.</p>
            </div>
            <Link to="/policy/warranty" className="btn btn--sm">Xem ngay</Link>
          </div>
          <div className="promo-banner" style={{ backgroundImage: "url('/assets/images/promo-banner-3.jpg')" }}>
            <div className="promo-banner__content">
              <h3>Thu Cũ Đổi Mới</h3>
              <p>Nâng cấp máy mới trợ giá lên tới 15%.</p>
            </div>
            <Link to="/trade-in" className="btn btn--sm">Đổi Máy Ngay</Link>
          </div>
        </div>
      </section>

      {/* ===== 10. LAPTOP GAMING & ĐỒ HỌA ===== */}
      {laptopProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-gamepad" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>Laptop Gaming & Đồ Họa</h2>
            <Link to="/category/laptop" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {laptopProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== BANNER GIAO HÀNG MIỄN PHÍ TOÀN QUỐC ===== */}
      <section className="container section" style={{ marginTop: '28px' }}>
        <div
          className="promo-banner"
          style={{
            backgroundImage: "url('/assets/images/installment-banner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '160px',
            borderRadius: '16px',
            padding: '28px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="promo-banner__content">
            <h3 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0' }}>GIAO HÀNG MIỄN PHÍ TOÀN QUỐC</h3>
            <p style={{ color: '#CBD5E1', fontSize: '13.5px', margin: 0 }}>Giao hàng nhanh — kiểm tra trước, thanh toán sau (COD). Áp dụng cho đơn hàng từ 500.000đ.</p>
          </div>
          <Link
            to="/search"
            className="btn btn--light"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '10px 22px',
              borderRadius: '10px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Mua ngay <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </section>

      {/* ===== 11. PC GAMING & BUILD SẴN ===== */}
      {pcProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-desktop" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>PC Gaming & Đồng Bộ</h2>
            <Link to="/category/pc-nexora" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {pcProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 12. LINH KIỆN PC ===== */}
      {componentProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-microchip" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>Linh Kiện Máy Tính Chính Hãng</h2>
            <Link to="/category/main-cpu-vga" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {componentProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 13. MÀN HÌNH MÁY TÍNH ===== */}
      {monitorProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-tv" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>Màn Hình Gaming & Đồ Họa</h2>
            <Link to="/category/man-hinh" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {monitorProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 14. GAMING GEAR ===== */}
      {gearProducts.length > 0 && (
        <section className="container section" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-keyboard" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>Gaming Gear & Phụ Kiện</h2>
            <Link to="/category/ban-phim" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {gearProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== MÁY TÍNH BỘ ĐỒNG BỘ ===== */}
      {appleProducts.length > 0 && (
        <section className="container section section-apple-zone" style={{ marginTop: '36px' }}>
          <div className="section__head">
            <h2><i className="fa-solid fa-boxes-stacked" style={{ color: '#0A5BFF', marginRight: '8px' }}></i>Máy tính bộ đồng bộ</h2>
            <Link to="/category/pc-nexora" className="section__more">
              Xem tất cả <i className="fa-solid fa-chevron-right"></i>
            </Link>
          </div>
          <div className="product-grid product-grid--6">
            <div
              className="apple-banner"
              style={{
                backgroundImage: "linear-gradient(135deg, rgba(15,91,255,0.95), rgba(7,26,51,0.6)), url('/assets/images/apple-banner-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '16px',
                padding: '30px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>PREMIUM LINE</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0', color: '#FFFFFF' }}>Máy tính bộ đồng bộ</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, opacity: 0.9 }}>Trải nghiệm các bộ máy tính All-in-One, máy tính văn phòng và máy tính đồng bộ cấu hình cao tại Nexora.</p>
              </div>
              <Link
                to="/search?cat=pc-nexora"
                className="btn btn--outline-light btn--sm"
                style={{
                  border: '1.5px solid rgba(255,255,255,0.8)',
                  color: '#FFFFFF',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  alignSelf: 'flex-start',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Khám phá ngay <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
            {appleProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ===== 15. TECHNOLOGY NEWS & AI HUB ===== */}
      <section className="container section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          {/* Left: 4 Technology News Cards */}
          <div>
            <div className="section__head" style={{ marginBottom: '16px' }}>
              <h2><i className="fa-solid fa-newspaper" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> Tin Tức Công Nghệ</h2>
              <Link to="/news" className="section__more">Xem thêm <i className="fa-solid fa-chevron-right"></i></Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                {
                  title: 'Đánh giá chi tiết NVIDIA RTX 50 Series: Kiến trúc Blackwell',
                  img: '/assets/images/news/news-rtx-50.jpg',
                  date: '18/11/2026',
                  desc: 'Tìm hiểu sức mạnh thực tế của dòng card RTX 5090 và RTX 5080 với GDDR7...',
                },
                {
                  title: 'So sánh Intel Core Ultra 9 vs AMD Ryzen 9 9950X',
                  img: '/assets/images/news/news-intel-ultra.jpg',
                  date: '17/11/2026',
                  desc: 'Kiểm nghiệm hiệu năng render Cinebench 2026 và Blender giữa 2 con chip đầu bảng...',
                },
                {
                  title: 'Top 5 bàn phím cơ không dây độ trễ siêu thấp cho eSports',
                  img: '/assets/images/news/news-mouse-gaming.jpg',
                  date: '15/11/2026',
                  desc: 'Tổng hợp các bàn phím Switch cơ học bấm mượt mà, kết nối 2.4GHz không giật lag...',
                },
                {
                  title: 'Hướng dẫn cân chỉnh màu màn hình Gaming OLED cao cấp',
                  img: '/assets/images/news/news-build-pc.jpg',
                  date: '12/11/2026',
                  desc: 'Bí quyết giúp người dùng khai thác tối đa dải màu DCI-P3 99% và bảo vệ màn hình...',
                },
              ].map((news, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ height: '130px', overflow: 'hidden' }}>
                    <img src={news.img} alt={news.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}><i className="fa-regular fa-clock"></i> {news.date}</span>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '6px 0', lineHeight: '1.4', color: '#0F172A' }}>
                        {news.title}
                      </h4>
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {news.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Prominent AI Modules Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="section__head" style={{ marginBottom: '16px' }}>
              <h2><i className="fa-solid fa-microchip" style={{ color: '#8B5CF6', marginRight: '8px' }}></i> Góc Trợ Lý AI</h2>
            </div>

            {/* AI Recommendation Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 10px 25px rgba(139, 92, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(139, 92, 246, 0.25)', color: '#C4B5FD', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '3px 8px', borderRadius: '20px' }}>
                  AI 4.0 Smart
                </span>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '22px', color: '#A78BFA' }}></i>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.3 }}>Tư Vấn Chọn Máy AI</h3>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Khảo sát 5 câu hỏi nhanh để AI tìm 3 cấu hình tối ưu nhất theo ngân sách của bạn.
              </p>
              <Link
                to="/ai-assistant"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  marginTop: '4px',
                }}
              >
                Mở AI Tư Vấn <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>

            {/* AI Comparison Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(16, 185, 129, 0.25)', color: '#6EE7B7', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '3px 8px', borderRadius: '20px' }}>
                  Chuyên Sâu
                </span>
                <i className="fa-solid fa-scale-balanced" style={{ fontSize: '22px', color: '#34D399' }}></i>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.3 }}>So Sánh Cấu Hình AI</h3>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Chọn 2–4 sản phẩm để đối chiếu bảng thông số thật và xem đánh giá ưu/nhược từ AI.
              </p>
              <Link
                to="/compare"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  marginTop: '4px',
                }}
              >
                Mở Trang So Sánh <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 16. STRATEGIC PARTNER BRANDS ===== */}
      <section className="container section" style={{ marginTop: '40px' }}>
        <div className="section__head section__head--brand-partners">
          <h2>ĐỐI TÁC CHIẾN LƯỢC</h2>
        </div>
        <div className="brand-slider">
          <div className="brand-slider__track">
            {[...BRAND_LOGOS, ...BRAND_LOGOS].map((b, idx) => (
              <div key={idx} className="brand-logo-card" title={b.name}>
                <img
                  src={`/assets/images/brands/${b.file}`}
                  alt={b.name}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'block';
                    }
                  }}
                />
                <span className="brand-logo-text-fallback" style={{ display: 'none' }}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 17. CUSTOMER REVIEWS ===== */}
      <section className="container section" style={{ marginTop: '36px', marginBottom: '36px' }}>
        <div className="section__head">
          <h2>Khách hàng nói gì về Nexora</h2>
        </div>
        <div className="review-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {CUSTOMER_REVIEWS.map((rev, idx) => (
            <div
              key={idx}
              className="review-card"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0A5BFF', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                    {rev.name.slice(0, 1)}
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0F172A', display: 'block' }}>{rev.name}</strong>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{rev.role}</span>
                  </div>
                </div>
                <div style={{ color: '#F59E0B', fontSize: '12px', marginBottom: '10px' }}>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
                <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  "{rev.comment}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
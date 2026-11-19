import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Slide {
  id: number;
  bgImage: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  specs: string[];
  priceNotice?: string;
  ctaText: string;
  ctaLink: string;
  ctaIcon: string;
}

const slides: Slide[] = [
  {
    id: 1,
    bgImage: '/assets/images/banner-rtx-bg.jpg',
    tag: 'SẮP RA MẮT',
    tagColor: 'bg-blue-600 text-white',
    title: 'NVIDIA RTX 50 SERIES',
    subtitle: 'Sẵn sàng cho kỷ nguyên đồ họa thế hệ mới',
    specs: [
      'Kiến trúc Blackwell 4nm',
      'Bộ nhớ GDDR7 siêu tốc',
      'Tăng tốc AI gấp 2 lần',
      'DLSS 4 tối ưu hóa hiệu năng',
    ],
    priceNotice: 'Nhận thông tin sớm nhất',
    ctaText: 'Đăng ký ngay',
    ctaLink: '/products/rtx-50-series',
    ctaIcon: 'fa-solid fa-envelope',
  },
  {
    id: 2,
    bgImage: '/assets/images/rog-banner-bg.jpg',
    tag: 'SỨC MẠNH VƯỢT TRỘI',
    tagColor: 'bg-rose-600 text-white',
    title: 'ROG ZEPHYRUS G16 (2024)',
    subtitle: 'Hiệu năng đỉnh cao cho game thủ & creator',
    specs: [
      'Intel® Core™ Ultra 9 185H',
      'NVIDIA® GeForce RTX™ 4070 8GB',
      'Màn hình OLED 2.5K 240Hz',
      'RAM LPDDR5X 32GB siêu mỏng 1.85kg',
    ],
    priceNotice: 'Giá chỉ từ 59.990.000đ',
    ctaText: 'Mua ngay',
    ctaLink: '/products/asus-rog-zephyrus-g16',
    ctaIcon: 'fa-solid fa-cart-shopping',
  },
  {
    id: 3,
    bgImage: '/assets/images/apple-banner-bg.jpg',
    tag: 'CỰC PHẨM APPLE',
    tagColor: 'bg-slate-700 text-white',
    title: 'MacBook Pro 16 M3 Max',
    subtitle: 'Quái vật hiệu năng dành cho dân chuyên nghiệp',
    specs: [
      'Chip Apple M3 Max 14-core',
      'GPU 30-core cực mạnh',
      'Màn hình Liquid Retina XDR 120Hz',
      '36GB Unified Memory, 1TB SSD',
    ],
    priceNotice: 'Giá chỉ từ 89.990.000đ',
    ctaText: 'Khám phá ngay',
    ctaLink: '/products/macbook-pro-16-m3-max',
    ctaIcon: 'fa-solid fa-arrow-right',
  },
  {
    id: 4,
    bgImage: '/assets/images/banner-1.jpg',
    tag: 'CHIẾN THẦN HIỆU NĂNG',
    tagColor: 'bg-amber-600 text-white',
    title: 'PC Gaming Ultra Max',
    subtitle: 'Cỗ máy hủy diệt mọi tựa game AAA ở thiết lập 4K cao nhất',
    specs: [
      'CPU Intel Core i9-14900K 24 nhân',
      'VGA NVIDIA RTX 4090 24GB',
      'RAM 64GB DDR5 6000MHz RGB',
      'Tản nhiệt nước Custom AIO 360mm',
    ],
    priceNotice: 'Chỉ từ 124.990.000đ',
    ctaText: 'Build ngay',
    ctaLink: '/build-pc',
    ctaIcon: 'fa-solid fa-screwdriver-wrench',
  },
  {
    id: 5,
    bgImage: '/assets/images/banner-3.jpg',
    tag: 'TRẢI NGHIỆM VÔ CỰC',
    tagColor: 'bg-indigo-600 text-white',
    title: 'Samsung Odyssey OLED G9',
    subtitle: 'Màn hình cong 49 inch chuẩn điện ảnh cho đắm chìm tuyệt đối',
    specs: [
      'Tấm nền QD-OLED 49 inch Dual QHD',
      'Tần số quét siêu nhanh 240Hz',
      'Tốc độ phản hồi tức thì 0.03ms',
      'Tỷ lệ siêu rộng 32:9',
    ],
    priceNotice: 'Giá ưu đãi 34.500.000đ',
    ctaText: 'Xem chi tiết',
    ctaLink: '/products/samsung-odyssey-oled-g9',
    ctaIcon: 'fa-solid fa-arrow-right',
  },
];

export const HeroCarousel: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentIdx] ?? slides[0];

  if (!slide) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden h-[420px] bg-slate-900 border border-slate-800 shadow-2xl group">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-100 group-hover:scale-105"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.94) 0%, rgba(2, 6, 23, 0.75) 45%, rgba(2, 6, 23, 0.2) 100%), url('${slide.bgImage}')`,
        }}
      />

      {/* Slide Content */}
      <div className="relative z-10 h-full p-6 sm:p-10 flex flex-col justify-center max-w-xl">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-max shadow-md ${slide.tagColor}`}
        >
          {slide.tag}
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2 drop-shadow-md">
          {slide.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mb-4 line-clamp-2">{slide.subtitle}</p>

        {/* Specs checklist */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200 mb-5">
          {slide.specs.map((spec, i) => (
            <li key={i} className="flex items-center gap-1.5 font-medium">
              <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
              <span className="truncate">{spec}</span>
            </li>
          ))}
        </ul>

        {/* Price & CTA button */}
        <div className="flex items-center gap-4">
          <Link
            to={slide.ctaLink}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <i className={slide.ctaIcon}></i>
            <span>{slide.ctaText}</span>
          </Link>
          {slide.priceNotice && (
            <span className="text-sm font-bold text-amber-400">{slide.priceNotice}</span>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <button
        type="button"
        onClick={() => setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-700/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Slide trước"
      >
        <i className="fa-solid fa-chevron-left text-sm"></i>
      </button>

      <button
        type="button"
        onClick={() => setCurrentIdx((prev) => (prev + 1) % slides.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-700/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Slide tiếp theo"
      >
        <i className="fa-solid fa-chevron-right text-sm"></i>
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-6 sm:left-10 z-20 flex items-center space-x-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIdx(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIdx ? 'w-8 bg-blue-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
            }`}
            aria-label={`Đi tới slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

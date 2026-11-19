import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Slide {
  bg: string;
  tag: string;
  title: string;
  desc: string;
  specs: string[];
  priceHtml: string;
  link: string;
  btnText: string;
  btnIcon: string;
}

const slides: Slide[] = [
  {
    bg: '/assets/images/rog-banner-bg.jpg',
    tag: 'Sức mạnh vượt trội',
    title: 'ROG ZEPHYRUS G16',
    desc: 'Hiệu năng đỉnh cao cho game thủ & creator',
    specs: [
      'Intel® Core™ Ultra 9',
      'NVIDIA® GeForce RTX™ 4070',
      'Màn hình OLED 2.5K 240Hz',
      'RAM LPDDR5X 32GB',
    ],
    priceHtml: 'Chỉ từ <strong>39.990.000đ</strong>',
    link: '/category/laptop',
    btnText: 'Mua ngay',
    btnIcon: 'fa-solid fa-arrow-right',
  },
  {
    bg: '/assets/images/apple-banner-bg.jpg',
    tag: 'Cực phẩm Apple',
    title: 'MacBook Pro 16 M3 Max',
    desc: 'Quái vật hiệu năng dành cho dân chuyên nghiệp',
    specs: [
      'Chip Apple M3 Max 14-core',
      'GPU 30-core cực mạnh',
      'Màn hình Liquid Retina XDR',
      '36GB Unified Memory, 1TB SSD',
    ],
    priceHtml: 'Chỉ từ <strong>89.990.000đ</strong>',
    link: '/category/laptop',
    btnText: 'Mua ngay',
    btnIcon: 'fa-solid fa-arrow-right',
  },
  {
    bg: '/assets/images/banner-1.jpg',
    tag: 'Chiến thần hiệu năng',
    title: 'PC Gaming Ultra Max',
    desc: 'Cỗ máy hủy diệt mọi tựa game AAA ở thiết lập cao nhất',
    specs: [
      'CPU Intel Core i9-14900K',
      'VGA NVIDIA RTX 4090 24GB',
      'RAM 64GB DDR5 6000MHz',
      'Tản nhiệt nước Custom',
    ],
    priceHtml: 'Chỉ từ <strong>125.000.000đ</strong>',
    link: '/build-pc',
    btnText: 'Build ngay',
    btnIcon: 'fa-solid fa-arrow-right',
  },
  {
    bg: '/assets/images/banner-3.jpg',
    tag: 'Trải nghiệm vô cực',
    title: 'Odyssey OLED G9',
    desc: 'Màn hình cong 49 inch chuẩn điện ảnh cho đắm chìm tuyệt đối',
    specs: [
      'Tấm nền QD-OLED siêu nét',
      'Tần số quét 240Hz',
      'Tốc độ phản hồi 0.03ms',
      'Tỷ lệ siêu rộng 32:9',
    ],
    priceHtml: 'Chỉ từ <strong>34.500.000đ</strong>',
    link: '/category/man-hinh',
    btnText: 'Khám phá',
    btnIcon: 'fa-solid fa-arrow-right',
  },
  {
    bg: '/assets/images/banner-rtx-bg.jpg',
    tag: 'SẮP RA MẮT',
    title: 'NVIDIA RTX 50 SERIES',
    desc: 'Sẵn sàng cho kỷ nguyên đồ họa thế hệ mới',
    specs: [
      'Kiến trúc Blackwell 4nm',
      'Bộ nhớ GDDR7 siêu tốc',
      'Tăng tốc AI gấp 2 lần',
      'DLSS 4 tối ưu hóa hiệu năng',
    ],
    priceHtml: 'Nhận thông tin sớm nhất',
    link: '/auth/register',
    btnText: 'Đăng ký ngay',
    btnIcon: 'fa-solid fa-envelope',
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

  return (
    <div className="hero-section__center" id="heroCarousel">
      {slides.map((slide, idx) => {
        const isActive = idx === currentIdx;
        return (
          <div
            key={idx}
            className={`carousel-slide ${isActive ? 'is-active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%), url('${slide.bg}')`,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <div className="carousel-slide__content">
              <span className="carousel-slide__tag">{slide.tag}</span>
              <h2>{slide.title}</h2>
              <p>{slide.desc}</p>
              <ul className="carousel-slide__specs">
                {slide.specs.map((spec, specIdx) => (
                  <li key={specIdx}>
                    <i className="fa-solid fa-circle-check"></i> {spec}
                  </li>
                ))}
              </ul>
              <div
                className="carousel-slide__price"
                dangerouslySetInnerHTML={{ __html: slide.priceHtml }}
              />
              <Link to={slide.link} className="btn btn--light" style={{ alignSelf: 'flex-start' }}>
                {slide.btnText} <i className={slide.btnIcon}></i>
              </Link>
            </div>
          </div>
        );
      })}

      <div className="carousel-controls">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`carousel-dot ${idx === currentIdx ? 'is-active' : ''}`}
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

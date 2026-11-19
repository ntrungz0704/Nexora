import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryDto } from '@nexora/shared';

interface MegaColumn {
  title: string;
  items: { name: string; query: string; badge?: 'hot' | 'new' | 'promo' }[];
}

interface MenuItemDef {
  id: string;
  name: string;
  slug: string;
  icon: string;
  megaColumns?: MegaColumn[];
}

const STATIC_MENU_TREE: MenuItemDef[] = [
  {
    id: 'laptop',
    name: 'Laptop',
    slug: 'laptop',
    icon: 'fa-solid fa-laptop',
    megaColumns: [
      {
        title: 'Thương hiệu nổi bật',
        items: [
          { name: 'ASUS', query: 'brand=asus', badge: 'hot' },
          { name: 'ACER', query: 'brand=acer' },
          { name: 'MSI', query: 'brand=msi' },
          { name: 'LENOVO', query: 'brand=lenovo' },
          { name: 'LG - Gram', query: 'brand=lg' },
        ],
      },
      {
        title: 'Phân khúc giá',
        items: [
          { name: 'Dưới 15 triệu', query: 'max_price=15000000' },
          { name: 'Từ 15 đến 20 triệu', query: 'min_price=15000000&max_price=20000000' },
          { name: 'Trên 20 triệu', query: 'min_price=20000000', badge: 'hot' },
        ],
      },
      {
        title: 'CPU Intel & AMD',
        items: [
          { name: 'Intel Core i5', query: 'cpu=core-i5' },
          { name: 'Intel Core i7', query: 'cpu=core-i7' },
          { name: 'Intel Core i9', query: 'cpu=core-i9' },
          { name: 'Intel Core Ultra', query: 'cpu=core-ultra', badge: 'new' },
          { name: 'AMD Ryzen 7', query: 'cpu=ryzen-7' },
        ],
      },
      {
        title: 'Nhu cầu sử dụng',
        items: [
          { name: 'Đồ họa - Studio', query: 'need=graphic' },
          { name: 'Học tập - Văn phòng', query: 'need=office' },
          { name: 'Mỏng nhẹ cao cấp', query: 'need=ultrabook', badge: 'hot' },
        ],
      },
    ],
  },
  {
    id: 'laptop-gaming',
    name: 'Laptop Gaming',
    slug: 'laptop-gaming',
    icon: 'fa-solid fa-gamepad',
    megaColumns: [
      {
        title: 'Thương hiệu Gaming',
        items: [
          { name: 'ASUS / ROG Gaming', query: 'brand=asus', badge: 'hot' },
          { name: 'ACER / Predator', query: 'brand=acer' },
          { name: 'MSI Gaming', query: 'brand=msi' },
          { name: 'LENOVO Legion', query: 'brand=lenovo' },
          { name: 'GIGABYTE / AORUS', query: 'brand=gigabyte' },
        ],
      },
      {
        title: 'Phân khúc giá Gaming',
        items: [
          { name: 'Dưới 20 triệu', query: 'max_price=20000000' },
          { name: 'Từ 20 đến 25 triệu', query: 'min_price=20000000&max_price=25000000' },
          { name: 'Trên 30 triệu', query: 'min_price=30000000', badge: 'hot' },
          { name: 'Gaming RTX 50 Series', query: 'gpu=rtx-50', badge: 'new' },
        ],
      },
      {
        title: 'Dòng máy nổi tiếng',
        items: [
          { name: 'ROG Zephyrus', query: 'model=zephyrus', badge: 'hot' },
          { name: 'ASUS TUF Gaming', query: 'model=tuf' },
          { name: 'Acer Nitro 5 / 16', query: 'model=nitro' },
          { name: 'MSI Katana / Cyborg', query: 'model=katana' },
        ],
      },
      {
        title: 'Card đồ họa rời',
        items: [
          { name: 'NVIDIA RTX 4050 6GB', query: 'gpu=rtx-4050' },
          { name: 'NVIDIA RTX 4060 8GB', query: 'gpu=rtx-4060', badge: 'hot' },
          { name: 'NVIDIA RTX 4070 8GB', query: 'gpu=rtx-4070' },
          { name: 'NVIDIA RTX 4090 16GB', query: 'gpu=rtx-4090' },
        ],
      },
    ],
  },
  {
    id: 'pc-nexora',
    name: 'PC TechPilot',
    slug: 'pc-nexora',
    icon: 'fa-solid fa-desktop',
    megaColumns: [
      {
        title: 'PC Gaming cấu hình sẵn',
        items: [
          { name: 'PC Gaming Entry i3/i5', query: 'tier=entry' },
          { name: 'PC Gaming Mid-range RTX 4060', query: 'tier=mid', badge: 'hot' },
          { name: 'PC Gaming High-end RTX 4080', query: 'tier=high' },
          { name: 'PC Gaming Ultra RTX 4090', query: 'tier=ultra', badge: 'new' },
        ],
      },
      {
        title: 'PC Đồ họa & Thiết kế',
        items: [
          { name: 'PC Kiến Trúc - Render 3D', query: 'purpose=render' },
          { name: 'PC Dựng Phim Premiere 4K', query: 'purpose=video' },
          { name: 'PC AI - Machine Learning', query: 'purpose=ai', badge: 'hot' },
        ],
      },
      {
        title: 'PC Văn phòng & Doanh nghiệp',
        items: [
          { name: 'PC Văn phòng nhỏ gọn Slim', query: 'type=slim' },
          { name: 'PC Kế toán - Bán hàng', query: 'type=pos' },
          { name: 'PC Đồng bộ Dell / HP', query: 'brand=oem' },
        ],
      },
    ],
  },
  {
    id: 'main-cpu-vga',
    name: 'Main, CPU, VGA',
    slug: 'main-cpu-vga',
    icon: 'fa-solid fa-microchip',
    megaColumns: [
      {
        title: 'Card màn hình (VGA)',
        items: [
          { name: 'NVIDIA RTX 5090 32GB', query: 'vga=rtx-5090', badge: 'new' },
          { name: 'NVIDIA RTX 4070 Super', query: 'vga=rtx-4070-super', badge: 'hot' },
          { name: 'NVIDIA RTX 4060 8GB', query: 'vga=rtx-4060' },
          { name: 'AMD Radeon RX 7800 XT', query: 'vga=rx-7800-xt' },
        ],
      },
      {
        title: 'Bộ vi xử lý (CPU)',
        items: [
          { name: 'Intel Core Ultra 9 / 7 / 5', query: 'cpu=core-ultra', badge: 'new' },
          { name: 'Intel Core i9-14900K', query: 'cpu=i9-14900k', badge: 'hot' },
          { name: 'Intel Core i7-14700K', query: 'cpu=i7-14700k' },
          { name: 'AMD Ryzen 7 7800X3D', query: 'cpu=7800x3d', badge: 'hot' },
        ],
      },
      {
        title: 'Bo mạch chủ (Mainboard)',
        items: [
          { name: 'Intel Z790 / Z890', query: 'mb=z790' },
          { name: 'Intel B760 Series', query: 'mb=b760', badge: 'hot' },
          { name: 'AMD X670 / B650', query: 'mb=b650' },
        ],
      },
    ],
  },
  {
    id: 'case-nguon-tan',
    name: 'Case, Nguồn, Tản',
    slug: 'case-nguon-tan',
    icon: 'fa-solid fa-hard-drive',
    megaColumns: [
      {
        title: 'Vỏ máy tính (Case)',
        items: [
          { name: 'Case Bể Cá (Dual Chamber)', query: 'case=panoramic', badge: 'hot' },
          { name: 'Case ITX Mini siêu nhỏ gọn', query: 'case=itx' },
          { name: 'Case Kèm Sẵn Quạt RGB', query: 'case=fan-rgb' },
        ],
      },
      {
        title: 'Nguồn máy tính (PSU)',
        items: [
          { name: 'Nguồn chuẩn ATX 3.0 PCIe 5.0', query: 'psu=atx3', badge: 'new' },
          { name: 'Nguồn 750W - 850W Gold', query: 'psu=850w', badge: 'hot' },
          { name: 'Nguồn 1000W - 1200W Platinum', query: 'psu=1000w' },
        ],
      },
      {
        title: 'Tản nhiệt PC',
        items: [
          { name: 'Tản nhiệt nước AIO 360mm', query: 'cooling=aio-360', badge: 'hot' },
          { name: 'Tản nhiệt khí tháp đôi', query: 'cooling=air-dual' },
          { name: 'Fan Case ARGB đồng bộ Hub', query: 'cooling=fan' },
        ],
      },
    ],
  },
  {
    id: 'o-cung',
    name: 'Ổ cứng SSD & HDD',
    slug: 'o-cung',
    icon: 'fa-solid fa-server',
    megaColumns: [
      {
        title: 'Ổ cứng SSD M.2 NVMe',
        items: [
          { name: 'SSD PCIe Gen 5.0 siêu tốc', query: 'ssd=gen5', badge: 'new' },
          { name: 'SSD Samsung 990 Pro 1TB/2TB', query: 'ssd=990pro', badge: 'hot' },
          { name: 'SSD Kingston KC3000 / NV2', query: 'ssd=kingston' },
        ],
      },
      {
        title: 'Bộ nhớ RAM DDR5 / DDR4',
        items: [
          { name: 'RAM DDR5 6000MHz - 7200MHz', query: 'ram=ddr5', badge: 'hot' },
          { name: 'RAM Corsair Vengeance RGB', query: 'ram=corsair' },
          { name: 'RAM Laptop SO-DIMM', query: 'ram=laptop' },
        ],
      },
    ],
  },
  {
    id: 'loa-micro-webcam',
    name: 'Loa, Micro, Webcam',
    slug: 'loa-micro-webcam',
    icon: 'fa-solid fa-volume-high',
  },
  {
    id: 'man-hinh',
    name: 'Màn hình',
    slug: 'man-hinh',
    icon: 'fa-solid fa-tv',
    megaColumns: [
      {
        title: 'Tấm nền & Công nghệ',
        items: [
          { name: 'Màn hình QD-OLED / OLED', query: 'panel=oled', badge: 'hot' },
          { name: 'Màn hình Fast IPS 240Hz', query: 'panel=ips' },
          { name: 'Màn hình cong Gaming 1000R', query: 'panel=curved' },
        ],
      },
      {
        title: 'Độ phân giải',
        items: [
          { name: 'Màn hình 4K UHD 144Hz', query: 'res=4k', badge: 'hot' },
          { name: 'Màn hình 2K QHD 165Hz - 240Hz', query: 'res=2k' },
          { name: 'Màn hình Full HD Gaming', query: 'res=fhd' },
        ],
      },
    ],
  },
  {
    id: 'ban-phim',
    name: 'Bàn phím',
    slug: 'ban-phim',
    icon: 'fa-solid fa-keyboard',
  },
  {
    id: 'chuot-lot-chuot',
    name: 'Chuột + Lót chuột',
    slug: 'chuot-lot-chuot',
    icon: 'fa-solid fa-computer-mouse',
  },
  {
    id: 'tai-nghe',
    name: 'Tai Nghe',
    slug: 'tai-nghe',
    icon: 'fa-solid fa-headphones',
  },
  {
    id: 'ghe-ban',
    name: 'Ghế - Bàn Gaming',
    slug: 'ghe-ban',
    icon: 'fa-solid fa-chair',
  },
  {
    id: 'phan-mem-mang',
    name: 'Phần mềm, mạng',
    slug: 'phan-mem-mang',
    icon: 'fa-solid fa-network-wired',
  },
  {
    id: 'phu-kien',
    name: 'Phụ kiện (Hub, sạc, cáp..)',
    slug: 'phu-kien',
    icon: 'fa-solid fa-plug',
  },
  {
    id: 'thiet-bi-van-phong',
    name: 'Thiết bị văn phòng',
    slug: 'thiet-bi-van-phong',
    icon: 'fa-solid fa-print',
  },
  {
    id: 'sac-du-phong',
    name: 'Sạc dự phòng',
    slug: 'sac-du-phong',
    icon: 'fa-solid fa-battery-half',
  },
];

export interface CategorySidebarProps {
  categories?: CategoryDto[];
  isStatic?: boolean;
  onClose?: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({ isStatic = true, onClose }) => {
  const [activePanelId, setActivePanelId] = useState<string | null>(null);

  const activeCategory = STATIC_MENU_TREE.find((c) => c.id === activePanelId);

  return (
    <>
      {!isStatic && (
        <div
          className="category-overlay"
          id="categoryMenuOverlay"
          style={{ display: 'block', zIndex: 998 }}
          onClick={onClose}
        />
      )}
      <section
        className={`category-dropdown ${isStatic ? 'is-static' : 'is-active'} ${activePanelId ? 'has-active-panel' : ''}`}
        id={isStatic ? 'categoryStaticMenu' : 'categoryMegaDropdown'}
        aria-label="Menu danh mục sản phẩm"
        onMouseLeave={() => setActivePanelId(null)}
        style={!isStatic ? { zIndex: 9999 } : undefined}
      >
        <div className="category-dropdown__inner">
          {!isStatic && onClose && (
            <button
              className="category-drawer-close"
              type="button"
              onClick={onClose}
              aria-label="Đóng danh mục"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#64748B',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}

          {/* Sidebar */}
          <nav className="category-dropdown__sidebar" aria-label="Danh mục chính">
            {STATIC_MENU_TREE.map((cat) => {
              const isHovered = activePanelId === cat.id;
              const hasMega = Boolean(cat.megaColumns && cat.megaColumns.length > 0);

              return (
                <div
                  key={cat.id}
                  className={`category-sidebar__row ${isHovered ? 'is-active' : ''}`}
                  onMouseEnter={() => {
                    if (hasMega) {
                      setActivePanelId(cat.id);
                    } else {
                      setActivePanelId(null);
                    }
                  }}
                >
                  <div className="category-sidebar__item-wrapper">
                    <Link
                      to={`/category/${cat.slug}`}
                      className="category-sidebar__item"
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                    >
                      <div className="category-sidebar__item-left">
                        <i className={`${cat.icon} category-icon`} aria-hidden="true"></i>
                        <span>{cat.name}</span>
                      </div>
                      {hasMega && (
                        <i
                          className="fa-solid fa-chevron-right category-chevron desktop-only-inline"
                          aria-hidden="true"
                        ></i>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Desktop Mega Panels Flyout */}
          {activeCategory && activeCategory.megaColumns && (
            <div className="category-dropdown__mega">
              <div className="category-mega__panel is-active">
                <div className="mega-panel__header">
                  <span className="mega-panel__group-name">{activeCategory.name}</span>
                  <Link
                    to={`/category/${activeCategory.slug}`}
                    className="mega-panel__view-all"
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                  >
                    Xem tất cả {activeCategory.name}{' '}
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px' }}></i>
                  </Link>
                </div>

                <div className="mega-panel__inner">
                  {activeCategory.megaColumns.map((col, colIdx) => (
                    <div key={colIdx} className="mega-panel__column">
                      <h4 className="mega-panel__title">{col.title}</h4>
                      <ul className="mega-panel__list">
                        {col.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <Link
                              to={`/search?${item.query}`}
                              onClick={() => {
                                if (onClose) onClose();
                              }}
                            >
                              {item.name}
                              {item.badge === 'hot' && (
                                <span
                                  className="mega-badge mega-badge--hot"
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '9px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#EF4444',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                  }}
                                >
                                  HOT
                                </span>
                              )}
                              {item.badge === 'new' && (
                                <span
                                  className="mega-badge mega-badge--new"
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '9px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#0A5BFF',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                  }}
                                >
                                  Mới
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

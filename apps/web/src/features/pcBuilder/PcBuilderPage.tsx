import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

interface BuilderPartCategory {
  key: string;
  name: string;
  icon: string;
  wattage: number;
  isCore?: boolean;
}

const BUILDER_PARTS: BuilderPartCategory[] = [
  { key: 'cpu', name: 'Bộ vi xử lý (CPU)', icon: 'fa-solid fa-microchip', wattage: 125, isCore: true },
  { key: 'mainboard', name: 'Bo mạch chủ (Mainboard)', icon: 'fa-solid fa-clone', wattage: 50, isCore: true },
  { key: 'ram', name: 'Bộ nhớ trong (RAM)', icon: 'fa-solid fa-server', wattage: 15, isCore: true },
  { key: 'vga', name: 'Card màn hình (VGA)', icon: 'fa-solid fa-sd-card', wattage: 250, isCore: false },
  { key: 'storage', name: 'Ổ cứng (SSD/HDD)', icon: 'fa-solid fa-database', wattage: 10, isCore: true },
  { key: 'psu', name: 'Nguồn máy tính (PSU)', icon: 'fa-solid fa-plug', wattage: 0, isCore: true },
  { key: 'case', name: 'Vỏ máy tính (Case)', icon: 'fa-solid fa-box', wattage: 0, isCore: true },
  { key: 'cooler', name: 'Tản nhiệt PC', icon: 'fa-solid fa-fan', wattage: 25, isCore: false },
  { key: 'monitor', name: 'Màn hình', icon: 'fa-solid fa-tv', wattage: 0, isCore: false },
  { key: 'mouse', name: 'Chuột', icon: 'fa-solid fa-computer-mouse', wattage: 0, isCore: false },
  { key: 'keyboard', name: 'Bàn phím', icon: 'fa-solid fa-keyboard', wattage: 0, isCore: false },
  { key: 'chair', name: 'Ghế Gaming', icon: 'fa-solid fa-chair', wattage: 0, isCore: false },
];

function extractSocket(name: string, specs?: unknown): string | null {
  const text = (name + ' ' + JSON.stringify(specs || {})).toUpperCase();
  if (text.includes('LGA1700') || text.includes('LGA 1700')) return 'LGA1700';
  if (text.includes('AM5')) return 'AM5';
  if (text.includes('AM4')) return 'AM4';
  if (text.includes('LGA1200') || text.includes('LGA 1200')) return 'LGA1200';
  if (text.includes('LGA1151') || text.includes('LGA 1151')) return 'LGA1151';
  return null;
}

function extractRamType(name: string, specs?: unknown): string | null {
  const text = (name + ' ' + JSON.stringify(specs || {})).toUpperCase();
  if (text.includes('DDR5')) return 'DDR5';
  if (text.includes('DDR4')) return 'DDR4';
  if (text.includes('DDR3')) return 'DDR3';
  return null;
}

interface SelectedPartInfo {
  product: ProductDto | null;
  isOwned: boolean;
  name: string;
  price: number;
}

export const PcBuilderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flow mode: 'build_full' | 'upgrade' | 'prebuilt'
  const [flowMode, setFlowMode] = useState<'build_full' | 'upgrade' | 'prebuilt'>('build_full');

  // Selected parts dictionary
  const [config, setConfig] = useState<Record<string, SelectedPartInfo>>(() => {
    try {
      const saved = localStorage.getItem('nexora_pc_config');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal picking state
  const [activePart, setActivePart] = useState<BuilderPartCategory | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => storefrontService.getProducts({ limit: 1000 }),
  });
  const allProducts = useMemo(() => productsData?.products || [], [productsData]);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  // Save config to localStorage
  const saveConfig = (newConfig: Record<string, SelectedPartInfo>) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('nexora_pc_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Select a product from modal
  const handleSelectProduct = (product: ProductDto) => {
    if (!activePart) return;
    const price = product.salePrice ? Number(product.salePrice) : Number(product.price);
    const newConfig = {
      ...config,
      [activePart.key]: {
        product,
        isOwned: false,
        name: product.name,
        price,
      },
    };
    saveConfig(newConfig);
    setActivePart(null);
    setModalSearch('');
    showToast(`Đã chọn "${product.name}" vào cấu hình.`);
  };

  // Toggle "Đã có sẵn" owned part
  const handleToggleOwned = (part: BuilderPartCategory) => {
    const existing = config[part.key];
    if (existing && existing.isOwned) {
      const next = { ...config };
      delete next[part.key];
      saveConfig(next);
      showToast(`Đã bỏ ${part.name} khỏi cấu hình.`);
    } else {
      const newConfig = {
        ...config,
        [part.key]: {
          product: null,
          isOwned: true,
          name: `[Đã có sẵn] ${part.name}`,
          price: 0,
        },
      };
      saveConfig(newConfig);
      showToast(`Đã đánh dấu sở hữu sẵn ${part.name}.`);
    }
  };

  // Remove a part
  const handleRemovePart = (partKey: string) => {
    const next = { ...config };
    delete next[partKey];
    saveConfig(next);
    showToast('Đã xóa linh kiện khỏi cấu hình.');
  };

  // Reset all
  const handleResetConfig = () => {
    saveConfig({});
    showToast('Đã làm mới cấu hình PC.');
  };

  // Pre-built PC selection: load parts
  const handleSelectPrebuilt = (pc: ProductDto) => {
    const price = pc.salePrice ? Number(pc.salePrice) : Number(pc.price);
    const newConfig: Record<string, SelectedPartInfo> = {
      case: {
        product: pc,
        isOwned: false,
        name: pc.name,
        price,
      },
    };
    saveConfig(newConfig);
    setFlowMode('build_full');
    showToast(`Đã chọn bộ "${pc.name}" vào dàn PC!`);
  };

  // Calculations
  const partKeys = Object.keys(config);
  const selectedCount = partKeys.length;
  const buyItems = partKeys.filter((k) => config[k] && !config[k].isOwned && config[k].product);
  const ownedItems = partKeys.filter((k) => config[k] && config[k].isOwned);

  const totalPrice = buyItems.reduce((sum, k) => sum + (config[k]?.price || 0), 0);

  // Power PSU estimation
  const hasCpu = Boolean(config['cpu']);
  const hasGpu = Boolean(config['vga']);

  const estimatedWattage = useMemo(() => {
    if (!hasCpu && !hasGpu) return 0;
    let base = 80; // motherboard, fans, chipset
    for (const part of BUILDER_PARTS) {
      if (config[part.key]) {
        base += part.wattage;
      }
    }
    return base;
  }, [config, hasCpu, hasGpu]);

  const gpuMinimumWattage = useMemo(() => {
    if (!hasGpu) return 0;
    const gpuName = (config['vga']?.name || '').toLowerCase();
    if (gpuName.includes('4090')) return 850;
    if (gpuName.includes('4080')) return 750;
    if (gpuName.includes('4070')) return 650;
    if (gpuName.includes('4060')) return 550;
    return 500;
  }, [config, hasGpu]);

  const recommendedPsuWattage = useMemo(() => {
    if (!hasCpu && !hasGpu) return 300;
    const calc = Math.ceil((estimatedWattage * 1.3) / 50) * 50;
    return Math.max(calc, gpuMinimumWattage, 450);
  }, [estimatedWattage, gpuMinimumWattage, hasCpu, hasGpu]);

  // Compatibility alerts & warnings
  const buildAlerts = useMemo(() => {
    const alerts: { type: 'error' | 'warning'; message: string }[] = [];

    const selectedCpu = config['cpu']?.product;
    const selectedMb = config['mainboard']?.product;
    const selectedRam = config['ram']?.product;

    if (selectedCpu && selectedMb) {
      const cpuSocket = extractSocket(selectedCpu.name, selectedCpu.specs);
      const mbSocket = extractSocket(selectedMb.name, selectedMb.specs);
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        alerts.push({
          type: 'error',
          message: `Lỗi Socket: CPU (${cpuSocket}) không khớp với Mainboard (${mbSocket})`,
        });
      }
    }

    if (selectedMb && selectedRam) {
      const mbRam = extractRamType(selectedMb.name, selectedMb.specs);
      const ramType = extractRamType(selectedRam.name, selectedRam.specs);
      if (mbRam && ramType && mbRam !== ramType) {
        alerts.push({
          type: 'error',
          message: `Lỗi RAM: Mainboard hỗ trợ (${mbRam}) nhưng chọn RAM (${ramType})`,
        });
      }
    }

    if (flowMode !== 'upgrade') {
      const coreKeys = ['cpu', 'mainboard', 'ram', 'storage', 'psu', 'case'];
      const missing = coreKeys.filter((k) => !config[k]);
      if (missing.length > 0) {
        alerts.push({
          type: 'warning',
          message: `Thiếu linh kiện cốt lõi: ${missing.map((k) => BUILDER_PARTS.find((p) => p.key === k)?.name.toUpperCase().split(' ')[0]).join(', ')}`,
        });
      }
    }

    return alerts;
  }, [config, flowMode]);

  const modalNotice = useMemo(() => {
    if (!activePart) return null;
    const selectedCpu = config['cpu']?.product;
    const selectedMb = config['mainboard']?.product;

    if (activePart.key === 'mainboard' && selectedCpu) {
      const cpuSocket = extractSocket(selectedCpu.name, selectedCpu.specs);
      if (cpuSocket) {
        return `Lọc Mainboard tương thích với Socket của CPU ${selectedCpu.name} (${cpuSocket})`;
      }
    }
    if (activePart.key === 'cpu' && selectedMb) {
      const mbSocket = extractSocket(selectedMb.name, selectedMb.specs);
      if (mbSocket) {
        return `Lọc CPU tương thích với Socket của Mainboard ${selectedMb.name} (${mbSocket})`;
      }
    }
    if (activePart.key === 'ram' && selectedMb) {
      const mbRam = extractRamType(selectedMb.name, selectedMb.specs);
      if (mbRam) {
        return `Lọc RAM tương thích với chuẩn bộ nhớ của Mainboard ${selectedMb.name} (${mbRam})`;
      }
    }
    return 'Tự động hiển thị linh kiện tương thích với dàn PC của bạn.';
  }, [activePart, config]);

  const getProductCompatibility = (p: ProductDto) => {
    if (!activePart) return { compatible: true, reason: '' };
    const selectedCpu = config['cpu']?.product;
    const selectedMb = config['mainboard']?.product;

    if (activePart.key === 'mainboard' && selectedCpu) {
      const cpuSocket = extractSocket(selectedCpu.name, selectedCpu.specs);
      const pSocket = extractSocket(p.name, p.specs);
      if (cpuSocket && pSocket && cpuSocket !== pSocket) {
        return {
          compatible: false,
          reason: `Socket không khớp: CPU (${cpuSocket}) vs Mainboard (${pSocket})`,
        };
      }
    }

    if (activePart.key === 'cpu' && selectedMb) {
      const mbSocket = extractSocket(selectedMb.name, selectedMb.specs);
      const pSocket = extractSocket(p.name, p.specs);
      if (mbSocket && pSocket && mbSocket !== pSocket) {
        return {
          compatible: false,
          reason: `Socket không khớp: Mainboard (${mbSocket}) vs CPU (${pSocket})`,
        };
      }
    }

    if (activePart.key === 'ram' && selectedMb) {
      const mbRam = extractRamType(selectedMb.name, selectedMb.specs);
      const pRam = extractRamType(p.name, p.specs);
      if (mbRam && pRam && mbRam !== pRam) {
        return {
          compatible: false,
          reason: `Chuẩn RAM không khớp: Mainboard (${mbRam}) vs RAM (${pRam})`,
        };
      }
    }

    return { compatible: true, reason: '' };
  };

  // Add all newly bought components to cart
  const handleAddToCart = async () => {
    if (buyItems.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 linh kiện cần mua để thêm vào giỏ hàng.');
      return;
    }
    try {
      for (const key of buyItems) {
        const prod = config[key]?.product;
        if (prod) {
          await cartService.addItem(prod.id, 1);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm ${buyItems.length} linh kiện vào giỏ hàng thành công!`);
      navigate('/cart');
    } catch {
      showToast('Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
  };

  // Filtered products for modal picker
  const filteredModalProducts = useMemo(() => {
    if (!activePart) return [];
    const catKey = activePart.key;

    const PART_CATEGORY_MAP: Record<string, string[]> = {
      cpu: ['cpu'],
      mainboard: ['mainboard'],
      ram: ['ram'],
      vga: ['vga'],
      storage: ['storage'],
      psu: ['psu'],
      case: ['case'],
      cooler: ['cooling'],
      monitor: ['monitor'],
      mouse: ['mouse'],
      keyboard: ['keyboard'],
      chair: ['chair'],
    };

    const targetSlugs = PART_CATEGORY_MAP[catKey] || [catKey];

    return allProducts.filter((p) => {
      // 1. Text search
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = (p.brand?.name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBrand) return false;
      }

      const nameLower = p.name.toLowerCase();
      const catSlug = (p.category?.slug || '').toLowerCase();

      // Check category slug match
      if (targetSlugs.some((s) => catSlug === s || catSlug.includes(s))) {
        return true;
      }

      // Fallback keyword matching
      switch (catKey) {
        case 'cpu':
          return nameLower.includes('cpu') || nameLower.includes('intel core') || nameLower.includes('ryzen');
        case 'mainboard':
          return nameLower.includes('mainboard') || nameLower.includes('bo mạch') || nameLower.includes('b760') || nameLower.includes('z790') || nameLower.includes('b650');
        case 'ram':
          return nameLower.includes('ram') || nameLower.includes('ddr4') || nameLower.includes('ddr5');
        case 'vga':
          return nameLower.includes('vga') || nameLower.includes('rtx') || nameLower.includes('card màn hình') || nameLower.includes('radeon');
        case 'storage':
          return nameLower.includes('ssd') || nameLower.includes('ổ cứng') || nameLower.includes('nvme');
        case 'psu':
          return nameLower.includes('psu') || nameLower.includes('nguồn');
        case 'case':
          return nameLower.includes('case') || nameLower.includes('vỏ');
        case 'cooler':
          return nameLower.includes('tản nhiệt') || nameLower.includes('cooler') || nameLower.includes('aio');
        case 'monitor':
          return nameLower.includes('màn hình');
        case 'mouse':
          return nameLower.includes('chuột');
        case 'keyboard':
          return nameLower.includes('bàn phím');
        case 'chair':
          return nameLower.includes('ghế');
        default:
          return true;
      }
    });
  }, [allProducts, activePart, modalSearch]);

  // Pre-built PC products
  const prebuiltPcs = useMemo(() => {
    return allProducts.filter(
      (p) =>
        p.category?.slug === 'pc' ||
        p.category?.slug === 'pc-nexora' ||
        p.category?.slug === 'pc-techpilot' ||
        p.name.toLowerCase().includes('pc ') ||
        p.name.toLowerCase().includes('creator') ||
        p.name.toLowerCase().includes('workstation'),
    );
  }, [allProducts]);

  return (
    <div className="pc-builder-page-wrapper" style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(10, 91, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      {/* Breadcrumb */}
      <section className="container">
        <div className="breadcrumb" style={{ paddingTop: '16px', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Link to="/" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', color: '#94A3B8' }}></i>
          <span style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>Xây dựng cấu hình PC</span>
        </div>
      </section>

      <div className="pc-builder-container">
        {/* Header */}
        <div className="pc-builder-header">
          <h1>
            <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i>
            Xây Dựng Cấu Hình PC & Tự Chọn Linh Kiện
          </h1>
          <p>Hệ thống tự động kiểm tra tương thích Socket, RAM, Kích thước Case & Ước tính Nguồn (PSU) chính xác 100%</p>
        </div>

        {/* 3 Flow Selector Banner */}
        <div className="tp-flow-banner">
          <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '10px', fontSize: '14.5px' }}>
            <i className="fa-solid fa-route" style={{ color: '#0B63E5', marginRight: '6px' }}></i>
            Bạn đang muốn xây dựng cấu hình thế nào?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className={`btn-flow-tab ${flowMode === 'build_full' ? 'active' : ''}`}
              onClick={() => setFlowMode('build_full')}
            >
              <i className="fa-solid fa-desktop"></i> Build máy mới hoàn chỉnh
            </button>
            <button
              type="button"
              className={`btn-flow-tab ${flowMode === 'upgrade' ? 'active' : ''}`}
              onClick={() => setFlowMode('upgrade')}
            >
              <i className="fa-solid fa-wrench"></i> Nâng cấp máy đang có / Đã có sẵn linh kiện
            </button>
            <button
              type="button"
              className={`btn-flow-tab ${flowMode === 'prebuilt' ? 'active' : ''}`}
              onClick={() => setFlowMode('prebuilt')}
            >
              <i className="fa-solid fa-box-open"></i> Chọn PC lắp sẵn Nexora
            </button>
          </div>
        </div>

        {/* TAB 1 & 2: PC Builder List & Summary */}
        {flowMode !== 'prebuilt' ? (
          <div className="pc-builder-layout">
            {/* Left: 12 Components List */}
            <main className="pc-builder-list">
              {BUILDER_PARTS.map((part) => {
                const selected = config[part.key];
                return (
                  <div key={part.key} className="pc-builder-row">
                    <div className="pc-builder-icon">
                      <i className={part.icon}></i>
                    </div>

                    <div className="pc-builder-part-name">
                      {part.name}
                    </div>

                    <div className="pc-builder-selected-info">
                      {selected ? (
                        <>
                          {selected.product && (
                            <img
                              src={getProductImage(selected.product)}
                              alt={selected.name}
                              className="pc-builder-selected-img"
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.onerror = null;
                                t.src = '/assets/images/placeholder.webp';
                              }}
                            />
                          )}
                          <div className="pc-builder-selected-details">
                            <span className="pc-builder-selected-title" title={selected.name}>
                              {selected.name}
                            </span>
                            {selected.isOwned ? (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                                <i className="fa-solid fa-circle-check"></i> Đã sở hữu
                              </span>
                            ) : (
                              <span className="pc-builder-selected-price">
                                {selected.price.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="pc-builder-placeholder">Chưa chọn linh kiện</span>
                      )}
                    </div>

                    <div className="pc-builder-actions">
                      {selected ? (
                        <>
                          <button
                            type="button"
                            className="btn-change-part"
                            onClick={() => {
                              setActivePart(part);
                              setModalSearch('');
                            }}
                          >
                            Đổi
                          </button>
                          <button
                            type="button"
                            className="btn-remove-part"
                            onClick={() => handleRemovePart(part.key)}
                            title="Xóa linh kiện"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-select-part"
                            onClick={() => {
                              setActivePart(part);
                              setModalSearch('');
                            }}
                          >
                            <i className="fa-solid fa-plus"></i> Chọn mua
                          </button>
                          <button
                            type="button"
                            className="btn-owned-part"
                            onClick={() => handleToggleOwned(part)}
                            title="Khai báo bạn đã sở hữu linh kiện này"
                          >
                            <i className="fa-solid fa-check"></i> Đã có
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </main>

            {/* Right: Summary & PSU Estimation */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* PSU Analysis Card */}
              <div className="pc-builder-summary-card">
                <div className="pc-builder-summary-title">
                  <span>
                    <i className="fa-solid fa-bolt" style={{ color: '#EAB308', marginRight: '6px' }}></i>
                    Ước tính công suất Nguồn
                  </span>
                </div>

                {!hasCpu && !hasGpu ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)', textAlign: 'center', padding: '16px 0' }}>
                    Vui lòng chọn CPU hoặc VGA để hệ thống bắt đầu tính toán công suất nguồn phù hợp.
                  </div>
                ) : (
                  <div>
                    <div className="pc-builder-summary-row">
                      <span>Công suất tải đỉnh ước tính:</span>
                      <strong style={{ color: '#0B63E5' }}>{estimatedWattage}W</strong>
                    </div>
                    <div className="pc-builder-summary-row">
                      <span>Tối thiểu do VGA đề xuất:</span>
                      <strong>{gpuMinimumWattage > 0 ? `${gpuMinimumWattage}W` : '(Chưa chọn VGA)'}</strong>
                    </div>
                    <div
                      className="pc-builder-summary-row"
                      style={{ marginTop: '8px', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}
                    >
                      <span style={{ fontWeight: 600 }}>Nguồn khuyến nghị:</span>
                      <strong style={{ color: '#EF4444', fontSize: '16px' }}>{recommendedPsuWattage}W</strong>
                    </div>
                    <div className="pc-builder-summary-row" style={{ marginTop: '6px' }}>
                      <span>Trạng thái nguồn:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: config['psu'] ? '#D1FAE5' : '#FEF3C7',
                          color: config['psu'] ? '#059669' : '#D97706',
                        }}
                      >
                        {config['psu'] ? 'Đã trang bị nguồn' : 'Chưa chọn Nguồn'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginTop: '8px', textAlign: 'right' }}>
                      * Đã bao gồm 30% dự phòng công suất an toàn.
                    </div>
                  </div>
                )}
              </div>

              {/* Build Summary Card */}
              <div className="pc-builder-summary-card">
                <div className="pc-builder-summary-title">
                  <span>Tóm tắt cấu hình</span>
                  <i className="fa-solid fa-desktop" style={{ color: '#0B63E5' }}></i>
                </div>

                <div className="pc-builder-summary-row">
                  <span>Linh kiện trong cấu hình:</span>
                  <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{selectedCount}</strong>
                </div>

                <div className="pc-builder-summary-row">
                  <span>Mua mới / Đã có sẵn:</span>
                  <span>
                    <strong style={{ color: '#0B63E5' }}>{buyItems.length}</strong> mua /{' '}
                    <strong style={{ color: '#059669' }}>{ownedItems.length}</strong> sẵn
                  </span>
                </div>

                {/* Compatibility Alerts */}
                {buildAlerts.length > 0 && (
                  <div style={{ marginTop: '14px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary, #0F172A)' }}>
                      Kiểm tra tương thích:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {buildAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: alert.type === 'error' ? '#FEF2F2' : '#FFFBEB',
                            border: `1px solid ${alert.type === 'error' ? '#FCA5A5' : '#FCD34D'}`,
                            color: alert.type === 'error' ? '#DC2626' : '#B45309',
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          <i
                            className={`fa-solid ${alert.type === 'error' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'}`}
                            style={{ marginRight: '6px' }}
                          ></i>
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border, #E2E8F0)', margin: '16px 0' }}></div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)', textAlign: 'right' }}>
                  Tổng giá tiền cần thanh toán:
                </div>
                <div className="pc-builder-total-price">
                  {totalPrice.toLocaleString('vi-VN')}đ
                </div>

                <button
                  type="button"
                  className="btn-add-config-to-cart"
                  onClick={handleAddToCart}
                  disabled={buyItems.length === 0}
                >
                  <i className="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng
                </button>

                <button
                  type="button"
                  className="btn-reset-config"
                  onClick={handleResetConfig}
                >
                  <i className="fa-solid fa-trash-can" style={{ marginRight: '4px' }}></i> Xóa hết cấu hình
                </button>
              </div>
            </aside>
          </div>
        ) : (
          /* TAB 3: Pre-built PCs Grid */
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: '0 0 6px 0' }}>
                📦 Danh Sách Bộ PC Lắp Sẵn Tối Ưu Bởi Nexora
              </h3>
              <p style={{ color: 'var(--text-secondary, #64748B)', fontSize: '14.5px', margin: 0 }}>
                Đã được các chuyên gia Nexora lắp ráp và test độ ổn định. Mua nguyên bộ hoặc tùy chỉnh theo ý bạn!
              </p>
            </div>

            <div className="prebuilt-grid">
              {prebuiltPcs.map((pc) => {
                const price = pc.salePrice ? Number(pc.salePrice) : Number(pc.price);
                return (
                  <div key={pc.id} className="prebuilt-card">
                    <div>
                      <img
                        src={getProductImage(pc)}
                        alt={pc.name}
                        className="prebuilt-img"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.onerror = null;
                          t.src = '/assets/images/placeholder.webp';
                        }}
                      />
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary, #0F172A)' }}>
                        {pc.name}
                      </h4>
                      {pc.specs ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                          {(() => {
                            const rawSpecs = ((pc.specs as Record<string, unknown>)?.specs as Record<string, unknown>) || (pc.specs as Record<string, unknown>);
                            const cpu = rawSpecs.cpu_model || rawSpecs.cpu || rawSpecs.CPU;
                            const gpu = rawSpecs.gpu_model || rawSpecs.gpu || rawSpecs.VGA || rawSpecs.vga;
                            const ram = rawSpecs.ram_gb ? `${rawSpecs.ram_gb}GB RAM` : rawSpecs.ram || rawSpecs.RAM;
                            const storage = rawSpecs.storage_gb ? `${rawSpecs.storage_gb}GB SSD` : rawSpecs.storage || rawSpecs.ssd;

                            const items = [
                              cpu ? `⚡ CPU: ${cpu}` : null,
                              gpu ? `🎮 VGA: ${gpu}` : null,
                              ram ? `💾 RAM: ${ram}` : null,
                              storage ? `🚀 Ổ cứng: ${storage}` : null,
                            ].filter(Boolean);

                            if (items.length > 0) {
                              return items.map((it, idx) => (
                                <div key={idx} style={{ color: '#334155', fontWeight: 500 }}>
                                  {it}
                                </div>
                              ));
                            }
                            return (
                              <div style={{ color: '#334155', fontWeight: 500 }}>
                                ⚡ Cấu hình chuẩn tối ưu hiệu năng
                              </div>
                            );
                          })()}
                        </div>
                      ) : null}
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <i className="fa-solid fa-shield-halved"></i> Bảo hành 36 tháng • 1 đổi 1 30 ngày
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444', marginBottom: '12px' }}>
                        {price.toLocaleString('vi-VN')}đ
                      </div>
                      <button
                        type="button"
                        className="btn-select-part"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleSelectPrebuilt(pc)}
                      >
                        <i className="fa-solid fa-check"></i> Chọn cấu hình này
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Chọn Linh Kiện */}
      {activePart && (
        <div className="pc-modal-backdrop" onClick={() => setActivePart(null)}>
          <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pc-modal-header">
              <h4 className="pc-modal-title">
                Chọn {activePart.name}
              </h4>
              <button
                type="button"
                className="pc-modal-close"
                onClick={() => setActivePart(null)}
              >
                &times;
              </button>
            </div>

            <div className="pc-modal-body">
              {/* Compatibility Notice */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#EFF6FF',
                  borderLeft: '4px solid #3B82F6',
                  color: '#1E3A8A',
                  fontSize: '12.5px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                {modalNotice}
              </div>

              {/* Search Box */}
              <div className="pc-search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm theo tên, thương hiệu..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Products List Container */}
              <div className="pc-modal-products-list">
                {filteredModalProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: '36px', color: '#CBD5E1', marginBottom: '10px', display: 'block' }}></i>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Không tìm thấy linh kiện phù hợp</p>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Thử xóa từ khóa tìm kiếm để xem tất cả linh kiện</span>
                  </div>
                ) : (
                  filteredModalProducts.map((p) => {
                    const price = p.salePrice ? Number(p.salePrice) : Number(p.price);
                    const compat = getProductCompatibility(p);
                    return (
                      <div
                        key={p.id}
                        className="pc-modal-item"
                        style={{
                          background: !compat.compatible ? '#FFF8F8' : undefined,
                          opacity: !compat.compatible ? 0.85 : 1,
                        }}
                      >
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="pc-modal-item-img"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.onerror = null;
                            t.src = '/assets/images/placeholder.webp';
                          }}
                        />
                        <div className="pc-modal-item-name">
                          <span>{p.name}</span>
                          {compat.compatible ? (
                            <span className="pc-builder-compatibility-badge">
                              <i className="fa-solid fa-circle-check"></i> Tương thích tốt
                            </span>
                          ) : (
                            <span className="pc-builder-blocker-badge">
                              <i className="fa-solid fa-triangle-exclamation"></i> {compat.reason}
                            </span>
                          )}
                        </div>
                        <div className="pc-modal-item-price">
                          {price.toLocaleString('vi-VN')}đ
                        </div>
                        <div>
                          {compat.compatible ? (
                            <button
                              type="button"
                              className="btn-choose-item"
                              onClick={() => handleSelectProduct(p)}
                            >
                              Chọn mua
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-choose-item"
                              style={{
                                background: '#FEE2E2',
                                color: '#EF4444',
                                border: '1px solid #FCA5A5',
                                cursor: 'not-allowed',
                              }}
                              disabled
                            >
                              Không vừa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <StorefrontFooter />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, AiRecommendationRole, ProductDto } from '@nexora/shared';

// ==========================================
// 1. DATA DICTIONARIES (MATCHING TECHPILOT)
// ==========================================
interface BudgetOption {
  code: string;
  label: string;
  desc: string;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  { code: 'under_10m', label: 'Dưới 10 triệu', desc: 'Phân khúc under_10m' },
  { code: '10_15m', label: '10 - 15 triệu', desc: 'Phân khúc 10_15m' },
  { code: '15_20m', label: '15 - 20 triệu', desc: 'Phân khúc 15_20m' },
  { code: '20_25m', label: '20 - 25 triệu', desc: 'Phân khúc 20_25m' },
  { code: '25_35m', label: '25 - 35 triệu', desc: 'Phân khúc 25_35m' },
  { code: 'over_35m', label: 'Trên 35 triệu', desc: 'Phân khúc over_35m' },
];

interface CategoryOption {
  key: string;
  label: string;
  desc: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'laptop', label: 'Laptop', desc: 'Máy tính xách tay di động', icon: 'fa-solid fa-laptop' },
  { key: 'pc', label: 'PC Lắp Sẵn', desc: 'Máy bộ để bàn cố định', icon: 'fa-solid fa-desktop' },
  { key: 'monitor', label: 'Màn hình', desc: 'Hiển thị đồ họa / Gaming', icon: 'fa-solid fa-tv' },
  { key: 'gear', label: 'Gaming Gear', desc: 'Bàn phím, chuột, tai nghe...', icon: 'fa-solid fa-gamepad' },
];

const GEAR_SUBCATS = [
  { key: 'keyboard', label: 'Bàn phím' },
  { key: 'mouse', label: 'Chuột' },
  { key: 'headset', label: 'Tai nghe' },
  { key: 'speaker', label: 'Loa' },
  { key: 'chair', label: 'Ghế Gaming' },
  { key: 'console', label: 'Tay cầm / Console' },
  { key: 'accessories', label: 'Phụ kiện khác' },
];

interface PurposeOption {
  code: string;
  label: string;
  desc: string;
}

const PURPOSES_MAP: Record<string, PurposeOption[]> = {
  laptop: [
    { code: 'office', label: '💻 Học tập / Văn phòng', desc: 'Word, Excel, học online, lướt web mượt mà' },
    { code: 'coding', label: '👨‍💻 Lập trình / Công nghệ', desc: 'VSCode, Docker, Android Studio, IDEs' },
    { code: 'design', label: '🎨 Đồ họa / Dựng phim 2D-3D', desc: 'Photoshop, Premiere, AutoCAD, Blender' },
    { code: 'gaming', label: '🎮 Chơi Game (eSports / AAA)', desc: 'Valorant, LoL, FC Online, Black Myth Wukong' },
    { code: 'travel', label: '✈️ Di chuyển / Công tác', desc: 'Mỏng nhẹ, pin trâu, độ bền cao' },
  ],
  pc: [
    { code: 'office', label: '🏢 Văn phòng / Kế toán', desc: 'Bền bỉ, hoạt động liên tục, tiết kiệm điện' },
    { code: 'coding', label: '👨‍💻 Lập trình / Máy chủ local', desc: 'Chạy đa nhiệm, ảo hóa, biên dịch nhanh' },
    { code: 'design_2d', label: '🖌️ Thiết kế Đồ họa 2D', desc: 'Photoshop, Illustrator, Lightroom, Canva' },
    { code: 'render_3d', label: '🎬 Dựng phim 4K / Rendering 3D', desc: 'Premiere, After Effects, Maya, Blender' },
    { code: 'gaming_esports', label: '🎯 Gaming eSports (High FPS)', desc: 'CS2, Valorant, LoL, Naraka 240Hz+' },
    { code: 'gaming_aaa', label: '🔥 Gaming AAA 4K / Ray Tracing', desc: 'Cyberpunk 2077, Wukong, Elden Ring, GTA V' },
    { code: 'livestream', label: '🎙️ Livestream / Creator', desc: 'Vừa game vừa stream OBS, vMix mượt mà' },
    { code: 'ai_ml', label: '🤖 AI / Machine Learning', desc: 'VRAM GPU lớn (RTX 4060/4070+), CUDA Core' },
  ],
  monitor: [
    { code: 'office', label: '💼 Văn phòng / Đọc tài liệu', desc: 'Bảo vệ mắt, chống chói, góc nhìn rộng IPS' },
    { code: 'gaming', label: '🎮 Chơi Game eSports / Fast IPS', desc: 'Tần số quét cao 144Hz-240Hz, phản hồi 1ms' },
    { code: 'design', label: '🎨 Đồ họa / Chuẩn màu sRGB/DCI-P3', desc: 'Màu sắc chính xác Delta E < 2, IPS/OLED' },
    { code: 'video_edit', label: '🎬 Dựng phim / Màn hình siêu rộng (Ultrawide)', desc: 'Không gian làm việc rộng, độ phân giải 2K/4K' },
    { code: 'entertainment', label: '🍿 Giải trí / Xem phim 4K', desc: 'Độ phân giải 4K, HDR, loa tích hợp' },
  ],
  gear_mouse: [
    { code: 'fps', label: '🎯 Chơi game FPS (Cảm biến siêu chuẩn)', desc: 'Trọng lượng siêu nhẹ, DPI cao, switch bền' },
    { code: 'moba', label: '⚔️ Chơi game MOBA / MMO', desc: 'Nhiều nút bấm phụ lập trình macro' },
    { code: 'office', label: '💼 Văn phòng / Công thái học', desc: 'Chống đau cổ tay, click yên tĩnh (Silent)' },
  ],
  gear_keyboard: [
    { code: 'gaming', label: '🎮 Chơi game phản hồi nhanh', desc: 'Switch cơ học (Red/Blue/Brown/Speed), RGB' },
    { code: 'typing', label: '✍️ Gõ văn bản / Lập trình', desc: 'Cảm giác gõ sướng tay, Hotswap, Custom keycap' },
    { code: 'silent', label: '🤫 Yên tĩnh văn phòng', desc: 'Silent Switch không gây ồn đồng nghiệp' },
  ],
  gear_headset: [
    { code: 'esports', label: '🎧 Gaming eSports 7.1', desc: 'Định vị tiếng chân, mic lọc ồn đàm thoại clear' },
    { code: 'music', label: '🎵 Nghe nhạc / Giải trí', desc: 'Âm bass ấm, dải âm cân bằng, đeo thoải mái' },
  ],
  gear_default: [
    { code: 'gaming', label: '🎮 Gaming & Giải trí', desc: 'Trang bị tối ưu trải nghiệm chiến game đỉnh cao' },
    { code: 'office', label: '💼 Văn phòng & Làm việc', desc: 'Thiết kế tinh gọn, bền bỉ, công thái học' },
  ],
};

interface PriorityOption {
  code: string;
  label: string;
}

const PRIORITIES_MAP: Record<string, PriorityOption[]> = {
  laptop: [
    { code: 'performance', label: '⚡ Hiệu năng tối đa trong tầm giá' },
    { code: 'battery', label: '🔋 Thời lượng pin dài (Pin trâu)' },
    { code: 'lightweight', label: '🪶 Mỏng nhẹ, dễ mang đi (Dưới 1.5kg)' },
    { code: 'display', label: '🖥️ Màn hình đẹp, tần số quét cao / Chuẩn màu' },
    { code: 'keyboard', label: '⌨️ Bàn phím nảy tốt, gõ sướng' },
    { code: 'upgradeability', label: '🛠️ Dễ nâng cấp RAM & SSD sau này' },
    { code: 'cooling_noise', label: '❄️ Máy mát & Ít ồn khi tải nặng' },
  ],
  pc: [
    { code: 'cpu_performance', label: '🧠 Hiệu năng CPU tối đa (Xử lý dữ liệu / Render / Biên dịch)' },
    { code: 'gpu_performance', label: '🎨 Hiệu năng Card đồ họa GPU (Chơi Game / 3D / AI)' },
    { code: 'upgradeability', label: '🛠️ Khả năng mở rộng & Nâng cấp lâu dài' },
    { code: 'cooling', label: '❄️ Tản nhiệt mát mẻ, ổn định 24/7' },
    { code: 'low_noise', label: '🤫 Hoạt động êm ái, ít tiếng ồn' },
    { code: 'compact_case', label: '📦 Case nhỏ gọn (Mini-ITX / mATX)' },
    { code: 'rgb_design', label: '✨ Thiết kế đẹp, LED RGB phong cách' },
    { code: 'power_efficiency', label: '🌱 Nguồn linh kiện bền bỉ, tiết kiệm điện' },
  ],
  monitor: [
    { code: 'refresh_rate', label: '⚡ Tần số quét cao (144Hz - 240Hz+)' },
    { code: 'resolution', label: '📐 Độ phân giải cao (2K QHD / 4K UHD)' },
    { code: 'color_accuracy', label: '🎨 Màu sắc chuẩn xác (sRGB 100% / DCI-P3)' },
    { code: 'screen_size', label: '📺 Kích thước màn hình lớn (27 inch+)' },
    { code: 'response_time', label: '⏱️ Tốc độ phản hồi tức thì (0.5ms - 1ms)' },
    { code: 'eye_care', label: '👁️ Bảo vệ mắt (Flicker-Free, Low Blue Light)' },
    { code: 'connectivity', label: '🔌 Đa dạng cổng (Type-C 65W PD, DisplayPort)' },
  ],
  gear: [
    { code: 'wireless', label: '📡 Kết nối không dây tốc độ cao (2.4GHz / BT)' },
    { code: 'ergonomic', label: '🧘 Thiết kế công thái học chống mỏi' },
    { code: 'rgb', label: '✨ Đèn nền LED RGB nhiều hiệu ứng' },
    { code: 'durability', label: '⭐ Độ bền linh kiện cao, switch chính hãng' },
  ],
};

export const AiAssistantPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // Form State
  const [budgetCode, setBudgetCode] = useState<string>('20_25m');
  const [category, setCategory] = useState<string>('laptop');
  const [subcategory, setSubcategory] = useState<string>('keyboard');
  const [purpose, setPurpose] = useState<string>('office');
  const [software, setSoftware] = useState<string>('');
  const [priority, setPriority] = useState<string>('performance');
  const [brand, setBrand] = useState<string>('');
  const [excluded, setExcluded] = useState<string>('');

  // Results State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<AiRecommendationRole[] | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  // Calculate dynamic purposes
  const currentPurposes: PurposeOption[] = useMemo(() => {
    if (category === 'gear') {
      const key = `gear_${subcategory}`;
      return PURPOSES_MAP[key] || PURPOSES_MAP.gear_default || [];
    }
    return PURPOSES_MAP[category] || PURPOSES_MAP.laptop || [];
  }, [category, subcategory]);

  // Calculate dynamic priorities
  const currentPriorities: PriorityOption[] = useMemo(() => {
    if (category === 'gear') return PRIORITIES_MAP.gear || [];
    return PRIORITIES_MAP[category] || PRIORITIES_MAP.laptop || [];
  }, [category]);

  const handleNextStep = () => {
    if (currentStep === 1 && !budgetCode) {
      alert('Vui lòng chọn khoảng ngân sách đầu tư trước khi tiếp tục!');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmitSurvey();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitSurvey = async () => {
    setIsAnalyzing(true);
    setRecommendations(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/ai/assistant/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: purpose,
          budgetRange: budgetCode,
          categoryPreference: category === 'gear' ? subcategory : category,
          priority: priority,
          brandPreference: brand || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.data.recommendations);
        setAnalysisSummary(json.data.analysisSummary);
      } else {
        throw new Error('Survey failed');
      }
    } catch {
      showToast('Có lỗi xảy ra khi phân tích. Vui lòng thử lại!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setRecommendations(null);
    setAnalysisSummary(null);
  };

  const handleAddToCart = async (product: ProductDto) => {
    try {
      await cartService.addToCart(product.id, 1);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    } catch {
      showToast('Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  const formatPrice = (val: number | string) => {
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="home-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StorefrontHeader
        currentUser={currentUser}
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất tài khoản.');
        }}
      />

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i>
          {toastMessage}
        </div>
      )}

      <main style={{ flex: 1, padding: '30px 20px 60px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* =========================================
              WIZARD CONTAINER
             ========================================= */}
          {!recommendations && !isAnalyzing && (
            <div
              style={{
                backgroundColor: 'var(--surface-card, #FFFFFF)',
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
                padding: '40px',
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, rgba(10, 91, 255, 0.1) 0%, rgba(10, 91, 255, 0.2) 100%)',
                    color: '#0A5BFF',
                  }}
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i> NEXORA AI 4.0
                </span>
              </div>

              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  margin: '0 0 10px 0',
                  color: 'var(--text-primary, #0F172A)',
                }}
              >
                Khảo Sát AI Gợi Ý Sản Phẩm Tối Ưu
              </h2>
              <p style={{ color: 'var(--text-secondary, #64748B)', fontSize: '15px', marginBottom: '35px' }}>
                Trả lời 5 câu hỏi nhanh để Trợ lý AI phân tích và lọc ra 3 sản phẩm phù hợp nhất trong kho hàng.
              </p>

              {/* Progress Steps Tracker */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '35px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    backgroundColor: 'var(--border, #E2E8F0)',
                    zIndex: 1,
                  }}
                />

                {[
                  { step: 1, label: 'Ngân sách' },
                  { step: 2, label: 'Loại máy' },
                  { step: 3, label: 'Mục đích' },
                  { step: 4, label: 'Ưu tiên' },
                  { step: 5, label: 'Bộ lọc' },
                ].map((item) => {
                  const isCompleted = item.step < currentStep;
                  const isActive = item.step === currentStep;

                  return (
                    <div
                      key={item.step}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '20%',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#0A5BFF' : isCompleted ? '#10B981' : '#FFFFFF',
                          border: `2px solid ${isActive ? '#0A5BFF' : isCompleted ? '#10B981' : 'var(--border, #E2E8F0)'}`,
                          color: isActive || isCompleted ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          boxShadow: isActive ? '0 0 12px rgba(10, 91, 255, 0.4)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {isCompleted ? <i className="fa-solid fa-check" style={{ fontSize: '12px' }}></i> : item.step}
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? '#0A5BFF' : isCompleted ? '#10B981' : 'var(--text-secondary, #64748B)',
                          marginTop: '8px',
                          textAlign: 'center',
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* PANEL 1: NGÂN SÁCH */}
              {currentStep === 1 && (
                <div>
                  <h4 style={{ marginBottom: '20px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Bước 1: Chọn khoảng ngân sách đầu tư của bạn:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '16px',
                      marginBottom: '25px',
                    }}
                  >
                    {BUDGET_OPTIONS.map((b) => {
                      const isSelected = budgetCode === b.code;
                      return (
                        <div
                          key={b.code}
                          onClick={() => setBudgetCode(b.code)}
                          style={{
                            border: `2px solid ${isSelected ? '#0A5BFF' : 'var(--border, #E2E8F0)'}`,
                            backgroundColor: isSelected ? 'rgba(10, 91, 255, 0.04)' : '#FFFFFF',
                            borderRadius: '14px',
                            padding: '24px 20px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 0 1px #0A5BFF' : 'none',
                          }}
                        >
                          <i className="fa-solid fa-coins" style={{ fontSize: '26px', color: '#0A5BFF', marginBottom: '10px', display: 'block' }}></i>
                          <span style={{ fontWeight: 700, fontSize: '15px', display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {b.label}
                          </span>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
                            {b.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PANEL 2: LOẠI MÁY */}
              {currentStep === 2 && (
                <div>
                  <h4 style={{ marginBottom: '20px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Bước 2: Chọn dòng sản phẩm bạn cần tư vấn:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '25px',
                    }}
                  >
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <div
                          key={cat.key}
                          onClick={() => setCategory(cat.key)}
                          style={{
                            border: `2px solid ${isSelected ? '#0A5BFF' : 'var(--border, #E2E8F0)'}`,
                            backgroundColor: isSelected ? 'rgba(10, 91, 255, 0.04)' : '#FFFFFF',
                            borderRadius: '14px',
                            padding: '24px 20px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 0 1px #0A5BFF' : 'none',
                          }}
                        >
                          <i className={cat.icon} style={{ fontSize: '26px', color: '#0A5BFF', marginBottom: '10px', display: 'block' }}></i>
                          <span style={{ fontWeight: 700, fontSize: '15px', display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {cat.label}
                          </span>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
                            {cat.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {category === 'gear' && (
                    <div style={{ marginTop: '20px' }}>
                      <label style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '10px', display: 'block' }}>
                        Chọn loại Gear cụ thể:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {GEAR_SUBCATS.map((sub) => {
                          const isSubSelected = subcategory === sub.key;
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => setSubcategory(sub.key)}
                              style={{
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: `1px solid ${isSubSelected ? '#0A5BFF' : 'var(--border, #CBD5E1)'}`,
                                backgroundColor: isSubSelected ? '#0A5BFF' : '#F8FAFC',
                                color: isSubSelected ? '#FFFFFF' : 'var(--text-primary)',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 3: MỤC ĐÍCH */}
              {currentStep === 3 && (
                <div>
                  <h4 style={{ marginBottom: '20px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Bước 3: Chọn mục đích sử dụng chính:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '16px',
                      marginBottom: '25px',
                    }}
                  >
                    {currentPurposes.map((p) => {
                      const isSelected = purpose === p.code;
                      return (
                        <div
                          key={p.code}
                          onClick={() => setPurpose(p.code)}
                          style={{
                            border: `2px solid ${isSelected ? '#0A5BFF' : 'var(--border, #E2E8F0)'}`,
                            backgroundColor: isSelected ? 'rgba(10, 91, 255, 0.04)' : '#FFFFFF',
                            borderRadius: '14px',
                            padding: '20px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 0 1px #0A5BFF' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                              {p.label}
                            </span>
                            <i className="fa-regular fa-circle-dot" style={{ color: isSelected ? '#0A5BFF' : '#CBD5E1' }}></i>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: 0, lineHeight: 1.4 }}>
                            {p.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Phần mềm hoặc tựa game bạn thường dùng nhất (nếu có):
                    </label>
                    <input
                      type="text"
                      value={software}
                      onChange={(e) => setSoftware(e.target.value)}
                      placeholder="Ví dụ: Premiere, AutoCAD, Docker, Wukong, Valorant..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border, #CBD5E1)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* PANEL 4: TIÊU CHÍ ƯU TIÊN */}
              {currentStep === 4 && (
                <div>
                  <h4 style={{ marginBottom: '20px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Bước 4: Tiêu chí ưu tiên hàng đầu:
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '16px',
                      marginBottom: '25px',
                    }}
                  >
                    {currentPriorities.map((item) => {
                      const isSelected = priority === item.code;
                      return (
                        <div
                          key={item.code}
                          onClick={() => setPriority(item.code)}
                          style={{
                            border: `2px solid ${isSelected ? '#0A5BFF' : 'var(--border, #E2E8F0)'}`,
                            backgroundColor: isSelected ? 'rgba(10, 91, 255, 0.04)' : '#FFFFFF',
                            borderRadius: '14px',
                            padding: '20px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 0 1px #0A5BFF' : 'none',
                          }}
                        >
                          <i className="fa-solid fa-star" style={{ color: '#0A5BFF', fontSize: '20px', marginBottom: '10px', display: 'block' }}></i>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PANEL 5: BỘ LỌC THƯƠNG HIỆU & LOẠI TRỪ */}
              {currentStep === 5 && (
                <div>
                  <h4 style={{ marginBottom: '20px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    Bước 5: Thương hiệu và yêu cầu loại trừ:
                  </h4>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Thương hiệu ưu tiên (nếu có):
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ví dụ: ASUS, MSI, Dell, Gigabyte, Razer..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border, #CBD5E1)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Thương hiệu hoặc yếu tố MUỐN LOẠI TRỪ:
                    </label>
                    <input
                      type="text"
                      value={excluded}
                      onChange={(e) => setExcluded(e.target.value)}
                      placeholder="Ví dụ: Apple, Celeron, 8GB RAM..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border, #CBD5E1)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* WIZARD NAVIGATION CONTROLS */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '35px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border, #E2E8F0)',
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    visibility: currentStep > 1 ? 'visible' : 'hidden',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #CBD5E1)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary, #0F172A)',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Quay lại
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    padding: '11px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0A5BFF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(10, 91, 255, 0.3)',
                  }}
                >
                  {currentStep === totalSteps ? (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> Phân Tích & Lấy Đề Xuất AI
                    </>
                  ) : (
                    <>
                      Tiếp tục <i className="fa-solid fa-arrow-right"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================
              LOADING SPINNER
             ========================================= */}
          {isAnalyzing && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '60px 20px',
                textAlign: 'center',
                border: '1px solid var(--border, #E2E8F0)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
              }}
            >
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '54px', color: '#0A5BFF', marginBottom: '20px' }}></i>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Trợ lý AI đang chấm điểm cấu hình...
              </h3>
              <p style={{ color: 'var(--text-secondary, #64748B)', maxWidth: '500px', margin: '0 auto', fontSize: '14px' }}>
                Hệ thống đang chạy thuật toán phân tích 100 điểm, lọc kho sản phẩm thật và tạo báo cáo tư vấn tối ưu...
              </p>
            </div>
          )}

          {/* =========================================
              RECOMMENDATIONS RESULTS (3 CARDS)
             ========================================= */}
          {recommendations && recommendations.length > 0 && (
            <div>
              <div style={{ marginTop: '20px', marginBottom: '25px', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    marginBottom: '10px',
                  }}
                >
                  <i className="fa-solid fa-check-double"></i> Kết quả đã phân tích
                </span>
                <h3 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🤖 3 Đề Xuất Tối Ưu Từ Nexora AI
                </h3>
                {analysisSummary && (
                  <p style={{ color: 'var(--text-secondary, #64748B)', fontSize: '14.5px', marginTop: '6px' }}>
                    {analysisSummary}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                }}
              >
                {recommendations.map((item, idx) => {
                  const p = item.product;
                  const imageUrl = getProductImage(p);
                  const isBestFit = item.role === 'BEST_MATCH';
                  const isBestValue = item.role === 'BEST_VALUE';
                  const roleBadgeColor = isBestFit ? '#10B981' : isBestValue ? '#3B82F6' : '#8B5CF6';
                  const roleBadgeBg = isBestFit
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : isBestValue
                    ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                    : 'linear-gradient(135deg, #8B5CF6, #6D28D9)';

                  const circumference = 2 * Math.PI * 20;
                  const offset = circumference - (item.score / 100) * circumference;

                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid var(--border, #E2E8F0)',
                        borderRadius: '20px',
                        backgroundColor: '#FFFFFF',
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                      }}
                    >
                      {/* Header with image & score */}
                      <div
                        style={{
                          position: 'relative',
                          padding: '48px 20px 20px',
                          textAlign: 'center',
                          background: 'linear-gradient(180deg, #F1F5F9 0%, #FFFFFF 100%)',
                          borderBottom: '1px solid var(--border, #E2E8F0)',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: '#FFFFFF',
                            background: roleBadgeBg,
                            letterSpacing: '0.3px',
                          }}
                        >
                          {item.roleTitle}
                        </span>

                        {/* Circular Score Ring */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '12px',
                            width: '52px',
                            height: '52px',
                          }}
                        >
                          <svg viewBox="0 0 48 48" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <circle cx="24" cy="24" r="20" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="none"
                              stroke={roleBadgeColor}
                              strokeWidth="4"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              lineHeight: 1,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {item.score}
                            <small style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>điểm</small>
                          </div>
                        </div>

                        <img
                          src={imageUrl}
                          alt={p.name}
                          style={{
                            height: '130px',
                            objectFit: 'contain',
                            margin: '0 auto',
                            display: 'block',
                          }}
                        />
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            margin: '0 0 8px 0',
                            lineHeight: 1.45,
                            color: 'var(--text-primary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          title={p.name}
                        >
                          {p.name}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                          <span style={{ color: '#0A5BFF', fontWeight: 800, fontSize: '20px' }}>
                            {formatPrice(p.salePrice || p.price)}
                          </span>
                          <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                            Còn {p.stockQuantity} máy
                          </span>
                        </div>

                        {/* Customer Value & Real-World Hardware Highlights */}
                        <div
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            padding: '12px 14px',
                            marginBottom: '16px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#0A5BFF',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="fa-solid fa-microchip"></i> Cấu hình phần cứng then chốt
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                            {(() => {
                              const raw = p.specs as Record<string, unknown> | null;
                              const inner = (raw && typeof raw === 'object' && raw.specs && typeof raw.specs === 'object')
                                ? (raw.specs as Record<string, unknown>)
                                : (raw && typeof raw === 'object' ? raw : {});

                              const cpu = inner.cpu_model || inner.cpu || null;
                              const gpu = inner.gpu_model || inner.gpu || inner.vga || null;
                              const ram = inner.ram_gb ? `${inner.ram_gb}GB ${inner.ram_type || 'RAM'}` : inner.ram || null;
                              const storage = inner.storage_gb ? `${Number(inner.storage_gb) >= 1000 ? `${Number(inner.storage_gb) / 1000}TB` : `${inner.storage_gb}GB`} ${inner.storage_type || 'SSD'}` : inner.storage || null;

                              const items: { label: string; value: string; icon: string }[] = [];
                              if (cpu) items.push({ label: 'CPU', value: String(cpu), icon: 'fa-microchip' });
                              if (gpu) items.push({ label: 'Card đồ họa', value: String(gpu), icon: 'fa-tv' });
                              if (ram) items.push({ label: 'Bộ nhớ RAM', value: String(ram), icon: 'fa-memory' });
                              if (storage) items.push({ label: 'Ổ cứng SSD', value: String(storage), icon: 'fa-hard-drive' });

                              if (items.length === 0) {
                                items.push({ label: 'Thương hiệu', value: p.brand?.name || 'Chính hãng', icon: 'fa-tag' });
                                items.push({ label: 'Phân khúc', value: p.category?.name || 'Máy tính cao cấp', icon: 'fa-layer-group' });
                                items.push({ label: 'Tình trạng', value: 'Mới 100% Seal', icon: 'fa-box-open' });
                                items.push({ label: 'Bảo hành', value: '36 Tháng', icon: 'fa-shield-halved' });
                              }

                              return items.slice(0, 4).map((spec, sIdx) => (
                                <div key={sIdx} style={{ fontSize: '12px', lineHeight: 1.35 }}>
                                  <div style={{ color: '#64748B', fontWeight: 500, fontSize: '11px' }}>
                                    <i className={`fa-solid ${spec.icon}`} style={{ marginRight: '4px', opacity: 0.7 }}></i>
                                    {spec.label}
                                  </div>
                                  <div
                                    style={{
                                      color: '#0F172A',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={spec.value}
                                  >
                                    {spec.value}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Customer Buying Incentives & Trust Badges */}
                        <div
                          style={{
                            backgroundColor: 'rgba(10, 91, 255, 0.04)',
                            border: '1px solid rgba(10, 91, 255, 0.12)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            marginBottom: '16px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#0A5BFF',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <i className="fa-solid fa-gift"></i> Đặc quyền mua hàng tại Nexora
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#1E293B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '11px' }}></i>
                              <span><strong>Bảo hành chính hãng</strong> (1 đổi 1 trong 7 ngày nếu lỗi)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '11px' }}></i>
                              <span><strong>Miễn phí vận chuyển</strong> cho đơn từ 500.000đ</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="fa-solid fa-circle-check" style={{ color: '#10B981', fontSize: '11px' }}></i>
                              <span><strong>Hỗ trợ kỹ thuật</strong> &amp; Hotline 1800 2097 miễn phí</span>
                            </div>
                          </div>
                        </div>

                        {/* Reasons */}
                        {item.reasons && item.reasons.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: '#047857',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px',
                              }}
                            >
                              <i className="fa-solid fa-circle-check"></i> Điểm nổi bật
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.5 }}>
                              {item.reasons.map((r, rIdx) => (
                                <li key={rIdx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Trade-offs */}
                        {item.tradeOffs && (
                          <div style={{ marginBottom: '16px' }}>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: '#B45309',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px',
                              }}
                            >
                              <i className="fa-solid fa-triangle-exclamation"></i> Cần lưu ý
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.5 }}>
                              {item.tradeOffs}
                            </p>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div
                          style={{
                            marginTop: 'auto',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--border, #E2E8F0)',
                          }}
                        >
                          <Link
                            to={`/product/detail/${p.slug}`}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 700,
                              textAlign: 'center',
                              textDecoration: 'none',
                              backgroundColor: '#F1F5F9',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border, #E2E8F0)',
                            }}
                          >
                            <i className="fa-solid fa-eye"></i> Chi tiết
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 700,
                              textAlign: 'center',
                              border: 'none',
                              backgroundColor: '#0A5BFF',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                            }}
                          >
                            <i className="fa-solid fa-cart-plus"></i> Chọn mua
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ textAlign: 'center', marginTop: '35px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={resetWizard}
                  style={{
                    padding: '12px 30px',
                    borderRadius: '10px',
                    border: '1px solid var(--border, #CBD5E1)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Làm khảo sát mới
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React, { useState } from 'react';
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

export const AiAssistantPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 5-Step Questionnaire States
  const [persona, setPersona] = useState('gaming');
  const [budgetRange, setBudgetRange] = useState('15m-25m');
  const [categoryPref, setCategoryPref] = useState('laptop');
  const [priority, setPriority] = useState('performance');
  const [brandPref, setBrandPref] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleRunSurvey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setRecommendations(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/ai/assistant/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          budgetRange,
          categoryPreference: categoryPref,
          priority,
          brandPreference: brandPref || undefined,
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

  const handleAddToCart = async (product: ProductDto) => {
    try {
      await cartService.addToCart(product.id, 1);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${product.name}" vào giỏ hàng thành công!`);
    } catch {
      showToast('Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-800">
      <StorefrontHeader
        currentUser={currentUser}
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden mb-10">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
              <i className="fas fa-microchip text-emerald-300"></i>
              Thuật toán chấm điểm 100 điểm đa tiêu chí
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              AI Tư Vấn Cấu Hình & Phần Cứng
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed">
              Hệ thống khảo sát 5 bước độc quyền của Nexora. Chỉ cần 30 giây chọn nhu cầu, AI sẽ quét toàn bộ kho linh kiện, chấm điểm mức độ tương thích và đề xuất 3 giải pháp tối ưu: Phù hợp nhất, Đáng tiền nhất và Hiệu năng cao nhất.
            </p>
          </div>
        </div>

        {/* 5-Step Questionnaire Form */}
        <section className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
            Khảo sát nhu cầu người dùng (5 Bước thông minh)
          </h2>

          <form onSubmit={handleRunSurvey} className="space-y-8">
            {/* Step 1: Persona */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Bước 1: Mục đích sử dụng chính của bạn là gì?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'gaming', label: 'Gaming & Esports', icon: 'fa-gamepad', desc: 'Max FPS, Ray Tracing' },
                  { id: 'office', label: 'Văn phòng & Học tập', icon: 'fa-briefcase', desc: 'Êm ái, mỏng nhẹ, pin trâu' },
                  { id: 'creator', label: 'Đồ họa & Render 3D', icon: 'fa-palette', desc: 'Màn hình chuẩn màu, GPU mạnh' },
                  { id: 'developer', label: 'Lập trình & Kỹ thuật', icon: 'fa-code', desc: 'RAM khủng, đa nhân mạnh' },
                  { id: 'business', label: 'Doanh nhân sang trọng', icon: 'fa-laptop', desc: 'Thiết kế cao cấp, bảo mật' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setPersona(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      persona === item.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <i className={`fas ${item.icon} text-xl mb-2 ${persona === item.id ? 'text-blue-600' : 'text-gray-400'}`}></i>
                    <div className="font-bold text-sm text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Budget */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Bước 2: Khoảng ngân sách đầu tư mong muốn
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'under-15m', label: 'Dưới 15 Triệu', desc: 'Phổ thông tiết kiệm' },
                  { id: '15m-25m', label: '15 - 25 Triệu', desc: 'Tầm trung quốc dân' },
                  { id: '25m-40m', label: '25 - 40 Triệu', desc: 'Cận cao cấp hiệu năng cao' },
                  { id: 'above-40m', label: 'Trên 40 Triệu', desc: 'Flagship đỉnh cao' },
                ].map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setBudgetRange(b.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      budgetRange === b.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900">{b.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Category preference */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Bước 3: Loại thiết bị mong muốn
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'laptop', label: 'Laptop Mỏng Nhẹ' },
                  { id: 'laptop-gaming', label: 'Laptop Gaming Chuyên Nghiệp' },
                  { id: 'pc', label: 'PC Để Bàn / Case Lắp Ráp' },
                  { id: 'parts', label: 'Linh kiện phần cứng rời' },
                ].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoryPref(c.id)}
                    className={`p-3.5 rounded-2xl border text-center font-medium text-sm transition-all ${
                      categoryPref === c.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Key Priority */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Bước 4: Tiêu chí bạn ưu tiên số 1
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'performance', label: '⚡ Hiệu năng tối đa', desc: 'Ưu tiên CPU, GPU, RAM' },
                  { id: 'durability', label: '🛡️ Độ bền & Tản nhiệt', desc: 'Vỏ kim loại, máy mát mẻ' },
                  { id: 'screen', label: '🌈 Màn hình xuất sắc', desc: 'Chuẩn màu OLED, IPS 2K' },
                  { id: 'battery', label: '🔋 Thời lượng pin & Nhẹ', desc: 'Pin trên 8h, dưới 1.5kg' },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      priority === p.id
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 5: Brand preference */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                Bước 5: Thương hiệu bạn ưa thích (Tùy chọn)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: '', label: 'Tất cả (AI tự chọn)' },
                  { id: 'asus', label: 'ASUS / ROG' },
                  { id: 'msi', label: 'MSI' },
                  { id: 'acer', label: 'Acer' },
                  { id: 'apple', label: 'Apple' },
                  { id: 'lenovo', label: 'Lenovo' },
                  { id: 'logitech', label: 'Logitech' },
                ].map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setBrandPref(b.id)}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                      brandPref === b.id
                        ? 'border-blue-600 bg-blue-600 text-white font-bold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex items-center justify-center">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-xl"></i>
                    AI đang tính toán ma trận 100 điểm...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles text-xl"></i>
                    Bắt đầu AI Phân Tích & Đề Xuất
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section: 3 Distinct Recommendation Roles */}
        {recommendations && (
          <section className="space-y-8 animate-in fade-in duration-300 mb-16">
            {analysisSummary && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-2xl flex items-center gap-3">
                <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
                <div className="text-sm font-medium">{analysisSummary}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => {
                const isBestMatch = rec.role === 'BEST_MATCH';
                const isBestValue = rec.role === 'BEST_VALUE';

                return (
                  <div
                    key={rec.role}
                    className={`bg-white rounded-3xl p-6 shadow-md border flex flex-col justify-between transition-all relative overflow-hidden ${
                      isBestMatch
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10'
                        : isBestValue
                        ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                        : 'border-purple-400 ring-2 ring-purple-400/20'
                    }`}
                  >
                    {/* Role Header Badge */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            isBestMatch
                              ? 'bg-amber-100 text-amber-800'
                              : isBestValue
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          <i
                            className={`fas ${
                              isBestMatch ? 'fa-crown' : isBestValue ? 'fa-sack-dollar' : 'fa-bolt'
                            }`}
                          ></i>
                          {rec.roleTitle}
                        </span>

                        <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                          <span className="text-blue-600 text-lg font-extrabold">{rec.score}</span>
                          <span className="text-xs text-gray-400">/100đ</span>
                        </div>
                      </div>

                      {/* Product Image & Title */}
                      <div className="w-full h-48 bg-slate-50 rounded-2xl p-4 flex items-center justify-center mb-4 border border-gray-100">
                        <img
                          src={getProductImage(rec.product)}
                          alt={rec.product.name}
                          className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                        />
                      </div>

                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2">
                        {rec.product.name}
                      </h3>

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-xl font-extrabold text-red-600">
                          {Number(rec.product.salePrice || rec.product.price).toLocaleString('vi-VN')}đ
                        </span>
                        {rec.product.salePrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {Number(rec.product.price).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>

                      {/* Match Reasons */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 mb-4 border border-gray-100">
                        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Lý do AI lựa chọn:
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-600">
                          {rec.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <i className="fas fa-check text-emerald-500 mt-0.5 shrink-0"></i>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {rec.tradeOffs && (
                        <div className="text-xs text-gray-500 italic mb-4">
                          <span className="font-semibold text-gray-600">Điểm cần lưu ý:</span> {rec.tradeOffs}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Link
                        to={`/product/${rec.product.slug}`}
                        className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5"
                      >
                        <i className="fas fa-eye text-gray-500"></i>
                        Chi tiết
                      </Link>
                      <button
                        onClick={() => handleAddToCart(rec.product)}
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <i className="fas fa-cart-plus"></i>
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <StorefrontFooter />

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm shadow-xl z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

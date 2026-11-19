import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

interface AiComparisonBreakdown {
  metric: string;
  scores: Record<string, number>;
  explanation: string;
}

interface AiCompareResult {
  categoryLocked: boolean;
  categoryName: string;
  products: ProductDto[];
  comparisonAnalysis: {
    verdict: string;
    winnerForPersona: string;
    breakdown: AiComparisonBreakdown[];
  };
}

export const ComparePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    queryFn: () => storefrontService.getProducts({ limit: 40 }),
  });
  const allProducts = productsData?.products || [];

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  // Selected category filter to enforce Category Lock
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('laptop');

  // Selected products for comparison
  const [comparedIds, setComparedIds] = useState<number[]>(() => {
    const addId = searchParams.get('add');
    if (addId) return [parseInt(addId, 10)];
    return [];
  });

  // AI Comparison state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiCompareResult | null>(null);

  // Products filtered by locked category
  const filteredProducts = allProducts.filter((p) => {
    if (!selectedCategorySlug) return true;
    return p.category?.slug.toLowerCase().includes(selectedCategorySlug.toLowerCase());
  });

  // Display products
  const displayProducts = comparedIds.length > 0
    ? allProducts.filter((p) => comparedIds.includes(p.id))
    : filteredProducts.slice(0, 2);

  const addToCartMutation = useMutation({
    mutationFn: (p: ProductDto) => cartService.addToCart(p.id, 1),
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
    },
  });

  const handleSelectProduct = (productId: number) => {
    const targetProduct = allProducts.find((p) => p.id === productId);
    if (!targetProduct) return;

    if (displayProducts.length > 0 && displayProducts[0]) {
      const existingCatId = displayProducts[0].categoryId;
      if (targetProduct.categoryId !== existingCatId) {
        showToast('⚠️ Quy tắc Category Lock: Chỉ được so sánh các sản phẩm cùng nhóm danh mục!');
        return;
      }
    }

    if (comparedIds.includes(productId)) {
      setComparedIds((prev) => prev.filter((id) => id !== productId));
    } else {
      if (comparedIds.length >= 4) {
        showToast('Chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
        return;
      }
      setComparedIds((prev) => [...prev, productId]);
    }
    setAiAnalysis(null);
  };

  const removeComparedProduct = (id: number) => {
    setComparedIds((prev) => prev.filter((item) => item !== id));
    setAiAnalysis(null);
    showToast('Đã xóa sản phẩm khỏi bảng so sánh.');
  };

  const handleRunAiComparison = async () => {
    if (displayProducts.length < 2) {
      showToast('Cần tối thiểu 2 sản phẩm để kích hoạt AI Phân tích.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/ai/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: displayProducts.map((p) => p.id),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAiAnalysis(json.data);
      } else {
        const errJson = await res.json();
        showToast(errJson.error?.message || 'Không thể thực hiện so sánh AI.');
      }
    } catch {
      showToast('Có lỗi kết nối khi phân tích.');
    } finally {
      setIsAnalyzing(false);
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
          <i className="fas fa-chevron-right text-[10px]"></i>
          <span className="text-blue-600 font-semibold">So sánh sản phẩm</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <i className="fas fa-scale-balanced"></i>
              Category Lock & AI Trade-off Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              So Sánh Sản Phẩm Công Nghệ
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Quy tắc chuẩn mực: Chỉ so sánh các sản phẩm cùng nhóm danh mục để đảm bảo độ chính xác.
            </p>
          </div>

          {/* Category-First Selector */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 pl-2">Chọn nhóm:</span>
            <select
              value={selectedCategorySlug}
              onChange={(e) => {
                setSelectedCategorySlug(e.target.value);
                setComparedIds([]);
                setAiAnalysis(null);
              }}
              className="text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-blue-500"
            >
              <option value="laptop">Laptop / Máy tính xách tay</option>
              <option value="pc">PC TechPilot / Case</option>
              <option value="ban-phim">Bàn phím cơ</option>
              <option value="chuot">Chuột gaming</option>
              <option value="man-hinh">Màn hình hiển thị</option>
            </select>
          </div>
        </div>

        {/* Quick Add Product Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 mb-8 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Thêm sản phẩm trong nhóm ({filteredProducts.length} mẫu):
          </span>
          <div className="flex flex-wrap gap-2">
            {filteredProducts.slice(0, 6).map((p) => {
              const isSelected = displayProducts.some((dp) => dp.id === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <i className={`fas ${isSelected ? 'fa-check' : 'fa-plus'} mr-1.5 text-[10px]`}></i>
                  {p.name.length > 25 ? `${p.name.slice(0, 25)}...` : p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="p-5 w-48 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Thuộc tính
                  </th>
                  {displayProducts.map((p) => {
                    const price = Number(p.price);
                    const salePrice = p.salePrice ? Number(p.salePrice) : null;
                    return (
                      <th key={p.id} className="p-5 w-64 align-top">
                        <div className="relative">
                          {displayProducts.length > 2 && (
                            <button
                              onClick={() => removeComparedProduct(p.id)}
                              className="absolute top-0 right-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                              title="Bỏ so sánh"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          )}
                          <div className="w-full h-36 bg-slate-50 rounded-2xl p-2 flex items-center justify-center mb-3">
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <Link
                            to={`/product/${p.slug}`}
                            className="font-bold text-sm text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug mb-2 block"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-base font-extrabold text-red-600">
                              {(salePrice || price).toLocaleString('vi-VN')}đ
                            </span>
                            {salePrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {price.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCartMutation.mutate(p)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <i className="fas fa-cart-plus"></i>
                            Thêm vào giỏ
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr>
                  <td className="p-4 font-bold text-gray-500 text-xs uppercase bg-slate-50/50">Thương hiệu</td>
                  {displayProducts.map((p) => (
                    <td key={p.id} className="p-4 font-semibold text-gray-900">
                      {p.brand?.name || 'Chính Hãng'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-500 text-xs uppercase bg-slate-50/50">Tình trạng kho</td>
                  {displayProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      {p.stockQuantity > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <i className="fas fa-check-circle"></i> Sẵn hàng ({p.stockQuantity})
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold text-xs">Tạm hết hàng</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-500 text-xs uppercase bg-slate-50/50">Thông số kỹ thuật</td>
                  {displayProducts.map((p) => (
                    <td key={p.id} className="p-4 text-xs text-gray-700 space-y-1">
                      {p.specs ? (
                        Object.entries(p.specs).map(([k, v]) => (
                          <div key={k}>
                            <span className="font-semibold text-gray-900">{k}:</span> {String(v)}
                          </div>
                        ))
                      ) : (
                        <span>Tiêu chuẩn nhà sản xuất</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-500 text-xs uppercase bg-slate-50/50">Bảo hành chính hãng</td>
                  {displayProducts.map((p) => (
                    <td key={p.id} className="p-4 text-xs font-medium text-gray-700">
                      24 tháng • 1 đổi 1 trong 7 ngày đầu
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Analysis Trigger Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleRunAiComparison}
            disabled={isAnalyzing || displayProducts.length < 2}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all hover:scale-105 flex items-center gap-2.5 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                AI đang đối chiếu thông số & trade-offs...
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles"></i>
                Kích hoạt AI Đối Chiếu & Nhận Định Chuyên Sâu
              </>
            )}
          </button>
        </div>

        {/* AI Trade-off & Verdict Card */}
        {aiAnalysis && (
          <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20 mb-12 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 mb-4 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <i className="fas fa-robot text-base"></i>
              Nhận định từ Nexora AI
            </div>

            <h3 className="text-xl md:text-2xl font-extrabold mb-3 leading-snug">
              {aiAnalysis.comparisonAnalysis.winnerForPersona}
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {aiAnalysis.comparisonAnalysis.verdict}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {aiAnalysis.comparisonAnalysis.breakdown.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                    {item.metric}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.explanation}</p>
                  <div className="space-y-1.5">
                    {Object.entries(item.scores).map(([name, score]: [string, number]) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[140px] text-slate-400">{name}</span>
                        <span className="font-extrabold text-emerald-400">{score}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

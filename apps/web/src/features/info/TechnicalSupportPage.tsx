import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

export const TechnicalSupportPage: React.FC = () => {
  const [currentUser] = React.useState(() => authService.getCurrentUser());

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

  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [orderCode, setOrderCode] = useState('');
  const [productName, setProductName] = useState('');
  const [issueType, setIssueType] = useState('PhanCung');
  const [description, setDescription] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !productName.trim() ||
      !description.trim()
    ) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại, sản phẩm và mô tả sự cố.');
      return;
    }

    const generatedTicket = `SUP-${Date.now().toString().slice(-6)}`;

    // Persist ticket locally
    try {
      const stored = JSON.parse(localStorage.getItem('nexora_support_tickets') || '[]');
      stored.push({
        ticketId: generatedTicket,
        customerName,
        customerPhone,
        customerEmail,
        orderCode,
        productName,
        issueType,
        description,
        status: 'Chờ tiếp nhận',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('nexora_support_tickets', JSON.stringify(stored));
    } catch {
      // Ignore localStorage error
    }

    setTicketId(generatedTicket);
  };

  return (
    <div className="page-wrapper min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={wishlistCount}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          window.location.reload();
        }}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Hỗ trợ kỹ thuật</span>
        </nav>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-3">
            Trung Tâm Hỗ Trợ & Bảo Trì
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Đội ngũ chuyên viên kỹ thuật phần cứng và hệ thống Nexora luôn đồng hành để khắc phục
            nhanh chóng mọi vấn đề của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Support Channels & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Kênh Hỗ Trợ Trực Tiếp
              </h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-phone-volume"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Hotline Kỹ Thuật
                  </h3>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    1900 8888 (Phím 2)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hỗ trợ từ 08:00 - 21:30 cả thứ 7 & Chủ Nhật
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Tra Cứu Bảo Hành
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Khách hàng mua hàng tại Nexora có thể mang máy đến bất kỳ showroom nào trên toàn
                    quốc hoặc gửi chuyển phát về trung tâm bảo hành để được kiểm tra miễn phí.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Trợ Lý Ảo Nexora AI
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Bạn có thể bấm vào biểu tượng chatbot ở góc dưới màn hình để hỏi nhanh mã lỗi
                    phần cứng hoặc kiểm tra tính tương thích linh kiện 24/7.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Request Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Tạo Phiếu Yêu Cầu Hỗ Trợ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Vui lòng mô tả chi tiết sự cố gặp phải để kỹ thuật viên chuẩn bị sẵn linh kiện và
                phương án xử lý nhanh nhất
              </p>

              {ticketId ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-clipboard-check"></i>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                    Tiếp Nhận Yêu Cầu Thành Công!
                  </h3>
                  <div className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block">
                      Mã phiếu hỗ trợ (Ticket ID):
                    </span>
                    <strong className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {ticketId}
                    </strong>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                    Kỹ thuật viên Nexora sẽ gọi điện cho bạn qua số điện thoại{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{customerPhone}</strong>{' '}
                    trong vòng 60 phút để hướng dẫn xử lý hoặc hẹn lịch kiểm tra trực tiếp.
                  </p>
                  <button
                    onClick={() => {
                      setTicketId('');
                      setOrderCode('');
                      setProductName('');
                      setDescription('');
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Tạo yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Họ và tên khách hàng *
                      </label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email nhận thông báo
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mã đơn hàng (Nếu có)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: TP-2026..."
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Loại sự cố cần hỗ trợ
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="PhanCung">
                        Sự cố phần cứng (không lên hình, mất nguồn, tiếng kêu lạ)
                      </option>
                      <option value="PhanMem">
                        Lỗi phần mềm, Windows, màn hình xanh (BSOD), driver
                      </option>
                      <option value="BaoHanh">Yêu cầu bảo hành / đổi mới linh kiện 30 ngày</option>
                      <option value="NangCap">Tư vấn nâng cấp RAM, SSD, VGA, tản nhiệt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tên sản phẩm / Model máy gặp sự cố *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Laptop ASUS ROG Zephyrus G16, hoặc Card RTX 4070 Ti..."
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mô tả chi tiết tình trạng lỗi *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Mô tả hoàn cảnh xảy ra lỗi (ví dụ: máy tự tắt khi chơi game nặng, quạt kêu to, cắm sạc không nhận...)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-wrench"></i>
                    <span>Gửi Phiếu Yêu Cầu Hỗ Trợ Kỹ Thuật</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

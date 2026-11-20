import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

export const ContactPage: React.FC = () => {
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

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('TuVan');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, email và nội dung liên hệ.');
      return;
    }

    if (!email.includes('@')) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    // Persist contact message locally
    try {
      const stored = JSON.parse(localStorage.getItem('nexora_contact_messages') || '[]');
      stored.push({
        id: `MSG-${Date.now()}`,
        fullName,
        email,
        phone,
        subject,
        message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('nexora_contact_messages', JSON.stringify(stored));
    } catch {
      // Ignore localStorage error
    }

    setIsSent(true);
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
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Liên hệ hợp tác</span>
        </nav>

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-3">
            Hỗ Trợ & Hợp Tác
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Liên Hệ Với Nexora
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe, hỗ trợ giải đáp thắc mắc và kết nối hợp tác kinh doanh cùng quý đối tác, khách hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Contact Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Thông Tin Trụ Sở & Hotline
              </h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Trụ Sở Flagship</h3>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Tổng Đài Hỗ Trợ</h3>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    1900 8888 <span className="text-xs font-normal text-slate-500">(08:00 - 21:30 hàng ngày)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-base mt-0.5">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Email Tiếp Nhận</h3>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    contact@nexora.local / hotro@nexora.local
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/stores"
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-store"></i>
                  <span>Xem Hệ Thống 50+ Cửa Hàng Toàn Quốc</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Gửi Tin Nhắn Cho Chúng Tôi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Để lại thông tin và nhu cầu của bạn, đội ngũ chuyên viên Nexora sẽ phản hồi trong vòng 2 giờ làm việc.
              </p>

              {isSent ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-paper-plane"></i>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Gửi Tin Nhắn Thành Công!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                    Cảm ơn bạn đã liên hệ với Nexora. Bộ phận chăm sóc khách hàng đã tiếp nhận thông tin và sẽ liên hệ lại qua email hoặc số điện thoại của bạn.
                  </p>
                  <button
                    onClick={() => {
                      setIsSent(false);
                      setFullName('');
                      setEmail('');
                      setPhone('');
                      setMessage('');
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Gửi tin nhắn khác
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
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email liên hệ *
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Chủ đề liên hệ
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="TuVan">Tư vấn mua hàng & cấu hình</option>
                        <option value="BaoHanh">Hỗ trợ kỹ thuật & bảo hành</option>
                        <option value="HopTac">Hợp tác kinh doanh & đại lý</option>
                        <option value="Khac">Ý kiến đóng góp khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nội dung chi tiết *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Nhập nội dung bạn cần hỗ trợ hoặc thông tin trao đổi hợp tác..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Gửi Yêu Cầu Liên Hệ</span>
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

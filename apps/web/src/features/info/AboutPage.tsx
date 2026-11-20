import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

export const AboutPage: React.FC = () => {
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
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Giới thiệu Nexora</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-2xl relative z-10">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              Về thương hiệu Nexora
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Kết Nối Công Nghệ <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Kiến Tạo Tương Lai
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Nexora là hệ thống bán lẻ máy tính, laptop, linh kiện phần cứng và thiết bị gaming gear chính hãng hàng đầu tại Việt Nam. Chúng tôi cam kết mang tới sản phẩm chuẩn mực, công nghệ tiên phong và dịch vụ hậu mãi vượt trội cho mọi người dùng đam mê công nghệ.
            </p>
          </div>
        </section>

        {/* Core Values Grid */}
        <section className="mb-12">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Giá Trị Cốt Lõi</h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Những nguyên tắc nền tảng định hình từng trải nghiệm mua sắm tại Nexora
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-certificate"></i>
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white">100% Chính Hãng</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Toàn bộ linh kiện và thiết bị đều được nhập khẩu chính ngạch từ các đối tác công nghệ toàn cầu hàng đầu như ASUS, MSI, Gigabyte, Intel, AMD, Corsair.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white">Công Nghệ Tiên Phong</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ứng dụng trợ lý AI thông minh tư vấn cấu hình, thuật toán so sánh linh kiện chuyên sâu và hệ thống tra cứu tiến độ đơn hàng tự động.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white">Bảo Hành Minh Bạch</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Chính sách bảo hành điện tử chính hãng từ 12 đến 36 tháng theo serial number, đổi mới 1-đổi-1 trong 30 ngày cho lỗi kỹ thuật từ nhà sản xuất.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-headset"></i>
              </div>
              <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-white">Tận Tâm Phục Vụ</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Đội ngũ kỹ thuật viên am hiểu phần cứng sẵn sàng hỗ trợ kiểm tra, vệ sinh máy và giải đáp thắc mắc chuyên môn trong suốt vòng đời sản phẩm.
              </p>
            </div>
          </div>
        </section>

        {/* Business Scope */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Lĩnh Vực Hoạt Động Trọng Tâm</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm mb-2 flex items-center gap-2">
                <i className="fa-solid fa-laptop"></i> Laptop & Thiết Bị Di Động
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cung cấp dải sản phẩm laptop gaming, laptop mỏng nhẹ văn phòng, workstation di động phục vụ đồ họa, kiến trúc và lập trình chuyên nghiệp.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm mb-2 flex items-center gap-2">
                <i className="fa-solid fa-desktop"></i> PC Gaming & Workstation
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tư vấn và lắp ráp các dàn máy tính để bàn tối ưu hiệu năng, tản nhiệt nước custom và thiết lập cấu hình theo ngân sách cá nhân hóa.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm mb-2 flex items-center gap-2">
                <i className="fa-solid fa-keyboard"></i> Linh Kiện & Gaming Gear
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Phân phối CPU, GPU, RAM, SSD, màn hình máy tính tần số quét cao, bàn phím cơ, chuột gaming và phụ kiện bàn làm việc công thái học.
              </p>
            </div>
          </div>
        </section>

        {/* Action Callout */}
        <section className="text-center p-8 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-3xl">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bạn Cần Tư Vấn Cấu Hình Phù Hợp?</h3>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
            Khám phá công cụ xây dựng cấu hình PC thông minh hoặc liên hệ ngay với đội ngũ kỹ thuật viên Nexora để được hỗ trợ tức thì.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/build-pc" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors">
              Xây dựng cấu hình PC
            </Link>
            <Link to="/contact" className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors">
              Liên hệ hợp tác
            </Link>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

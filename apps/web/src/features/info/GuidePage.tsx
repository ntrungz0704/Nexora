import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

export const GuidePage: React.FC = () => {
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

  const steps = [
    {
      num: '01',
      title: 'Tìm Kiếm & Khám Phá Sản Phẩm',
      desc: 'Sử dụng thanh tìm kiếm thông minh hoặc duyệt theo từng danh mục (Laptop, PC Gaming, CPU, GPU, Màn hình, Gear). Bạn có thể áp dụng các bộ lọc chuyên sâu về tầm giá, chuẩn RAM, dung lượng SSD và thương hiệu để tìm thiết bị phù hợp nhất.',
      icon: 'fa-magnifying-glass',
    },
    {
      num: '02',
      title: 'Xem Thông Số & So Sánh Cấu Hình AI',
      desc: 'Xem kỹ bảng thông số kỹ thuật chi tiết của sản phẩm. Bạn có thể bấm nút "So sánh" để đặt 2 hay nhiều linh kiện/máy tính cạnh nhau hoặc sử dụng trợ lý Nexora AI để nhận phân tích ưu nhược điểm cho nhu cầu học tập, làm việc hay gaming.',
      icon: 'fa-scale-balanced',
    },
    {
      num: '03',
      title: 'Thêm Vào Giỏ Hàng Hoặc Tự Build PC',
      desc: 'Bấm "Thêm vào giỏ hàng" để lưu sản phẩm. Nếu bạn muốn tự ráp dàn máy, hãy sử dụng tính năng "PC Builder" để được hệ thống tự động kiểm tra tính tương thích giữa bo mạch chủ, chip xử lý, tản nhiệt và nguồn công suất thực.',
      icon: 'fa-cart-plus',
    },
    {
      num: '04',
      title: 'Nhập Địa Chỉ & Áp Dụng Mã Giảm Giá',
      desc: 'Tại trang Thanh toán (Checkout), điền chính xác họ tên, số điện thoại và địa chỉ nhận hàng. Nhập mã voucher hoặc coupon ưu đãi (ví dụ: TECHPILOT100, GIAM5PHANTRAM) để được chiết khấu trực tiếp vào tổng hóa đơn.',
      icon: 'fa-ticket',
    },
    {
      num: '05',
      title: 'Lựa Chọn Phương Thức Thanh Toán',
      desc: 'Linh hoạt lựa chọn: Thanh toán tiền mặt khi nhận hàng (COD đồng kiểm) hoặc Thanh toán trực tuyến an toàn qua cổng VNPay (hỗ trợ quét mã QR ứng dụng ngân hàng, thẻ ATM nội địa và thẻ quốc tế Visa/Mastercard có bảo mật OTP).',
      icon: 'fa-credit-card',
    },
    {
      num: '06',
      title: 'Nhận Đơn Hàng & Tra Cứu Trực Tuyến',
      desc: 'Sau khi đặt hàng thành công, hệ thống sẽ cấp Mã đơn hàng (VD: TP-2026...). Bạn có thể vào mục "Tra cứu đơn hàng" để theo dõi trực tiếp lộ trình vận chuyển, tình trạng đóng gói và thông tin hóa đơn điện tử VAT minh bạch.',
      icon: 'fa-box-open',
    },
  ];

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
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Hướng dẫn mua hàng online</span>
        </nav>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-3">
            Quy Trình Chuẩn Hóa
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Hướng Dẫn Mua Hàng Online Tại Nexora
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Quy trình mua sắm an toàn, nhanh chóng và minh bạch từ lúc chọn sản phẩm đến khi nhận hàng tận tay
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((st) => (
            <div
              key={st.num}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                    <i className={`fa-solid ${st.icon}`}></i>
                  </div>
                  <span className="text-3xl font-black text-slate-200 dark:text-slate-800 select-none">
                    {st.num}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <i className="fa-solid fa-circle-question text-blue-600"></i> Các Câu Hỏi Thường Gặp
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Tôi có được kiểm tra sản phẩm trước khi thanh toán tiền mặt (COD) không?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Có. Nexora áp dụng chính sách đồng kiểm ngoại quan cùng bưu tá. Bạn được mở hộp carton để kiểm tra tình trạng nguyên seal, tem bảo hành chính hãng và đúng model trước khi thanh toán.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Thời gian giao hàng mất bao lâu?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nội thành TP.HCM và Hà Nội giao hỏa tốc từ 2 giờ đến trong ngày. Các tỉnh thành khác giao từ 1 - 3 ngày làm việc qua đối tác vận chuyển chuyên biệt thiết bị công nghệ.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Sản phẩm có xuất hóa đơn điện tử VAT không?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                100% sản phẩm phân phối bởi Nexora đều có hóa đơn VAT điện tử hợp pháp được xuất gửi qua email của khách hàng sau khi đơn hàng giao thành công.
              </p>
            </div>
          </div>
        </section>

        {/* Action Callout */}
        <section className="text-center p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold mb-2">Bắt Đầu Trải Nghiệm Mua Sắm Ngay</h3>
          <p className="text-xs md:text-sm text-blue-100 max-w-lg mx-auto mb-6">
            Hàng ngàn sản phẩm máy tính và linh kiện phần cứng chính hãng đang sẵn sàng phục vụ bạn với giá tốt nhất thị trường.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/search" className="px-6 py-2.5 bg-white text-blue-600 font-bold text-xs rounded-xl shadow transition-transform hover:scale-105">
              Khám phá sản phẩm
            </Link>
            <Link to="/order-tracking" className="px-6 py-2.5 bg-blue-800/60 hover:bg-blue-800 text-white font-bold text-xs rounded-xl border border-blue-400/40 transition-colors">
              Tra cứu đơn hàng
            </Link>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-12">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: About */}
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <span className="text-xl font-extrabold text-white">
              Nex<span className="text-blue-500">ora</span>
            </span>
          </Link>
          <p className="text-slate-400 leading-relaxed text-xs">
            Hệ thống bán lẻ máy tính để bàn, laptop gaming, linh kiện PC cao cấp và thiết bị công
            nghệ chính hãng hàng đầu Việt Nam.
          </p>
          <div className="pt-2 text-xs text-slate-300 space-y-1">
            <p>
              <i className="fa-solid fa-location-dot text-blue-400 mr-2"></i> 123 Đường Nguyễn Huệ,
              Phường Bến Nghé, Quận 1, TP. HCM
            </p>
            <p>
              <i className="fa-solid fa-phone text-blue-400 mr-2"></i> Hotline: 1800 2097 (8:00 -
              21:30)
            </p>
            <p>
              <i className="fa-solid fa-envelope text-blue-400 mr-2"></i> Email: hotro@nexora.vn
            </p>
          </div>
        </div>

        {/* Col 2: Customer Support */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Hỗ Trợ Khách Hàng
          </h4>
          <ul className="space-y-2">
            <li>
              <Link to="/huong-dan-mua-hang" className="hover:text-blue-400 transition">
                Hướng dẫn mua hàng trực tuyến
              </Link>
            </li>
            <li>
              <Link to="/chinh-sach-tra-gop" className="hover:text-blue-400 transition">
                Chính sách trả góp 0% lãi suất
              </Link>
            </li>
            <li>
              <Link to="/order-tracking" className="hover:text-blue-400 transition">
                Tra cứu trạng thái đơn hàng
              </Link>
            </li>
            <li>
              <Link to="/quy-dinh-bao-hanh" className="hover:text-blue-400 transition">
                Quy định và chính sách bảo hành
              </Link>
            </li>
            <li>
              <Link to="/thu-cu-doi-moi" className="hover:text-blue-400 transition">
                Chính sách thu cũ đổi mới
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Policies */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Chính Sách Bán Hàng
          </h4>
          <ul className="space-y-2">
            <li>
              <Link to="/chinh-sach-giao-hang" className="hover:text-blue-400 transition">
                Chính sách giao hàng toàn quốc
              </Link>
            </li>
            <li>
              <Link to="/chinh-sach-doi-tra" className="hover:text-blue-400 transition">
                Chính sách đổi trả trong 7 ngày
              </Link>
            </li>
            <li>
              <Link to="/chinh-sach-bao-mat" className="hover:text-blue-400 transition">
                Chính sách bảo mật thông tin
              </Link>
            </li>
            <li>
              <Link to="/xuat-hoa-don-vat" className="hover:text-blue-400 transition">
                Hỗ trợ xuất hóa đơn điện tử VAT
              </Link>
            </li>
            <li>
              <Link
                to="/foundation"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Trạng thái hệ thống kỹ thuật
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Payments & Trust */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Phương Thức Thanh Toán
          </h4>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold text-[10px]">
              💵 COD Tiền mặt
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-bold text-[10px]">
              🏦 Chuyển khoản Napas
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 font-bold text-[10px]">
              💳 VNPay QR
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold text-[10px]">
              ✨ Trả góp qua thẻ
            </span>
          </div>

          <h4 className="text-sm font-bold text-white uppercase tracking-wider pt-3">
            Kết Nối Với Chúng Tôi
          </h4>
          <div className="flex space-x-3 pt-1">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-brands fa-youtube"></i>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-brands fa-tiktok"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Lower Footer */}
      <div className="border-t border-slate-900 py-4 bg-black/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
          <p>
            © 2026 Nexora Tech Store. Single-Vendor Hardware E-Commerce & Store Management System.
          </p>
          <p>Đồ án tốt nghiệp chuyên ngành Kỹ thuật Phần mềm — Modern Architecture Monolith.</p>
        </div>
      </div>
    </footer>
  );
};

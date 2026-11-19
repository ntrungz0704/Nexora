import React from 'react';
import { Link } from 'react-router-dom';

export const PromoCards: React.FC = () => {
  return (
    <div className="flex flex-col gap-3.5 h-[420px]">
      {/* Card 1: Build PC */}
      <div
        className="flex-1 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden bg-slate-900 border border-slate-800 shadow-lg group hover:border-blue-500/50 transition"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.65) 60%, rgba(15, 23, 42, 0.2) 100%), url('/assets/images/banner-build-pc.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Dịch vụ đặc biệt
          </span>
          <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
            BUILD PC THEO YÊU CẦU
          </h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
            Tối ưu cấu hình - Cân mọi ngân sách
          </p>
        </div>
        <div className="relative z-10">
          <Link
            to="/build-pc"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
          >
            <span>Xem ngay</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        </div>
      </div>

      {/* Card 2: Pay Later (COD) */}
      <div
        className="flex-1 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden bg-slate-900 border border-slate-800 shadow-lg group hover:border-blue-500/50 transition"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.65) 60%, rgba(15, 23, 42, 0.2) 100%), url('/assets/images/banner-pay-later.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            An tâm mua sắm
          </span>
          <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
            MUA NGAY - TRẢ SAU
          </h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
            Nhận hàng, kiểm tra rồi thanh toán (COD)
          </p>
        </div>
        <div className="relative z-10">
          <Link
            to="/category/laptop-gaming"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
          >
            <span>Mua ngay</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        </div>
      </div>

      {/* Card 3: Trade-in */}
      <div
        className="flex-1 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden bg-slate-900 border border-slate-800 shadow-lg group hover:border-blue-500/50 transition"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.65) 60%, rgba(15, 23, 42, 0.2) 100%), url('/assets/images/banner-trade-in.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Trợ giá tối đa
          </span>
          <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
            THU CŨ ĐỔI MỚI MÁY CŨ
          </h3>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
            Trợ giá lên tới 6 triệu đồng
          </p>
        </div>
        <div className="relative z-10">
          <Link
            to="/thu-cu-doi-moi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
          >
            <span>Xem chi tiết</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

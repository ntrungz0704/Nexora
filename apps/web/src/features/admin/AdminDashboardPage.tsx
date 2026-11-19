import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { AuthUser } from '@nexora/shared';

export const AdminDashboardPage: React.FC = () => {
  const [currentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Admin Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
        }}
      >
        <div>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px', paddingLeft: '8px' }}>
            <img src="/assets/images/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>Tech<span style={{ color: '#38BDF8' }}>Pilot</span></span>
              <div style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase' }}>Store Management</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Tổng quan (Dashboard)', icon: 'fa-solid fa-chart-pie', active: true },
              { label: 'Quản lý đơn hàng', icon: 'fa-solid fa-box-archive' },
              { label: 'Sản phẩm & Tồn kho', icon: 'fa-solid fa-boxes-stacked' },
              { label: 'Danh mục sản phẩm', icon: 'fa-solid fa-layer-group' },
              { label: 'Mã giảm giá & Flash Sale', icon: 'fa-solid fa-ticket' },
              { label: 'Khách hàng', icon: 'fa-solid fa-users' },
              { label: 'Tin tức & Bài viết', icon: 'fa-solid fa-newspaper' },
              { label: 'Cấu hình hệ thống', icon: 'fa-solid fa-gear' },
            ].map((menu, idx) => (
              <a
                key={idx}
                href="#admin"
                onClick={(e) => e.preventDefault()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: menu.active ? '#1E293B' : 'transparent',
                  color: menu.active ? '#38BDF8' : '#94A3B8',
                  fontSize: '13.5px',
                  fontWeight: menu.active ? 700 : 500,
                  textDecoration: 'none',
                }}
              >
                <i className={menu.icon} style={{ width: '18px', textAlign: 'center' }}></i>
                <span>{menu.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Back to Storefront Link */}
        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#94A3B8',
              fontSize: '13px',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Về trang bán hàng</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* Top Navbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
              Bảng Quản Trị Hệ Thống (Single-Vendor Store)
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '13.5px' }}>
              Theo dõi tình hình kinh doanh, doanh thu, đơn hàng và lượng hàng tồn kho theo thời gian thực.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                {currentUser?.fullName || 'Quản Trị Viên'}
              </div>
              <span style={{ fontSize: '11px', color: '#0A5BFF', fontWeight: 700, backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '10px' }}>
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0A5BFF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'A'}
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Doanh thu hôm nay', val: '128.500.000đ', icon: 'fa-solid fa-money-bill-trend-up', change: '+18.4%', isPositive: true },
            { label: 'Đơn hàng mới', val: '24 đơn', icon: 'fa-solid fa-bag-shopping', change: '+6 đơn', isPositive: true },
            { label: 'Sản phẩm sắp hết', val: '5 sản phẩm', icon: 'fa-solid fa-triangle-exclamation', change: 'Cần nhập hàng', isPositive: false },
            { label: 'Khách hàng thành viên', val: '1.420 người', icon: 'fa-solid fa-users', change: '+12 mới', isPositive: true },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{stat.label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F8FAFC', color: '#0A5BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  <i className={stat.icon}></i>
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                {stat.val}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: stat.isPositive ? '#10B981' : '#EF4444' }}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Orders Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 0 18px 0' }}>
            Đơn Hàng Gần Nhất Cần Xử Lý
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Mã đơn</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Ngày đặt</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Phương thức</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Tổng tiền</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'NEX-892401', name: 'Nguyễn Văn An', date: '18/11/2026 14:30', method: 'VietQR', total: 3290000, status: 'Đang vận chuyển', badge: '#0A5BFF' },
                  { code: 'NEX-892398', name: 'Trần Thị Mai', date: '18/11/2026 11:15', method: 'COD', total: 18990000, status: 'Chờ đóng gói', badge: '#F59E0B' },
                  { code: 'NEX-892390', name: 'Lê Hoàng Long', date: '17/11/2026 19:40', method: 'VNPAY', total: 23990000, status: 'Đã hoàn tất', badge: '#10B981' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0A5BFF' }}>{row.code}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{row.name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{row.date}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{row.method}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#EF4444' }}>{row.total.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: row.badge, backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

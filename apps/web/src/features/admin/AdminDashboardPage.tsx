import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import type { AuthUser, AdminDashboardSummaryDto, OrderDto, ProductDto } from '@nexora/shared';

interface InventoryLogItem {
  id: string | number;
  createdAt: string;
  changeType: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string | null;
  referenceId?: string | null;
  product?: { name: string; sku: string };
}

interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getTabFromPath = (): 'dashboard' | 'orders' | 'products' | 'categories' | 'inventory' => {
    if (location.pathname.includes('/orders')) return 'orders';
    if (location.pathname.includes('/products')) return 'products';
    if (location.pathname.includes('/categories')) return 'categories';
    if (location.pathname.includes('/inventory')) return 'inventory';
    return 'dashboard';
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'inventory'>(getTabFromPath);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tabId: 'dashboard' | 'orders' | 'products' | 'categories' | 'inventory') => {
    setActiveTab(tabId);
    navigate(tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`);
  };

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductCategory, setNewProductCategory] = useState('1');
  const [newProductDesc, setNewProductDesc] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getAuthHeaders = useCallback(() => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }, []);

  const { data: adminData } = useQuery({
    queryKey: ['admin-data', currentUser?.role],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const headers = getAuthHeaders();
      const [sumRes, ordersRes, prodsRes, catsRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/dashboard/summary`, { headers }),
        fetch(`${apiUrl}/admin/orders?limit=20`, { headers }),
        fetch(`${apiUrl}/admin/products?limit=20`, { headers }),
        fetch(`${apiUrl}/admin/categories`, { headers }),
        fetch(`${apiUrl}/admin/inventory/logs?limit=20`, { headers }),
      ]);

      const sumJson = sumRes.ok ? await sumRes.json() : { data: null };
      const ordersJson = ordersRes.ok ? await ordersRes.json() : { data: { orders: [] } };
      const prodsJson = prodsRes.ok ? await prodsRes.json() : { data: { products: [] } };
      const catsJson = catsRes.ok ? await catsRes.json() : { data: [] };
      const logsJson = logsRes.ok ? await logsRes.json() : { data: [] };

      return {
        summary: sumJson.data as AdminDashboardSummaryDto | null,
        orders: ordersJson.data.orders as OrderDto[],
        products: prodsJson.data.products as ProductDto[],
        categories: catsJson.data as AdminCategoryItem[],
        inventoryLogs: logsJson.data as InventoryLogItem[],
      };
    },
  });

  const summary = adminData?.summary || null;
  const orders = adminData?.orders || [];
  const products = adminData?.products || [];
  const categories = adminData?.categories || [];
  const inventoryLogs = adminData?.inventoryLogs || [];

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(`Cập nhật trạng thái đơn hàng thành ${status}!`);
        queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      } else {
        showToast('Không thể cập nhật trạng thái đơn hàng.');
      }
    } catch {
      showToast('Có lỗi kết nối.');
    }
  };

  const handleGenerateAiDescription = async () => {
    if (!newProductName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm trước khi gọi AI.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/admin/products/ai-generate-description`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newProductName,
          categoryName: 'Phần cứng công nghệ',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setNewProductDesc(json.data.description);
        showToast('AI đã hoàn thành tạo mô tả chuẩn SEO!');
      }
    } catch {
      showToast('Lỗi sinh mô tả AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) {
      showToast('Vui lòng nhập đầy đủ tên và giá sản phẩm.');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/admin/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newProductName,
          categoryId: parseInt(newProductCategory, 10),
          price: newProductPrice,
          stockQuantity: parseInt(newProductStock, 10),
          shortDescription: newProductDesc.slice(0, 200),
          sku: `NX-${Date.now().toString().slice(-4)}`,
        }),
      });

      if (res.ok) {
        showToast('Tạo sản phẩm mới thành công!');
        setIsAddProductOpen(false);
        setNewProductName('');
        setNewProductPrice('');
        setNewProductDesc('');
        queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      } else {
        showToast('Không thể tạo sản phẩm.');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.');
    }
  };

  const handleSwitchToStaff = async () => {
    try {
      const session = await authService.login({ email: 'staff@nexora.local', password: 'password123' });
      setCurrentUser(session.user);
      showToast(`Đã chuyển sang tài khoản Nhân viên: ${session.user.fullName}`);
      queryClient.invalidateQueries({ queryKey: ['admin-data'] });
    } catch {
      showToast('Không thể đăng nhập tài khoản nhân viên.');
    }
  };

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-6 shrink-0 shadow-xl">
        <div>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg">
              N
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight">Nexora Admin</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Single-Vendor Store</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Tổng quan (Dashboard)', icon: 'fa-chart-pie' },
              { id: 'orders', label: 'Quản lý đơn hàng', icon: 'fa-box-archive' },
              { id: 'products', label: 'Sản phẩm & Tồn kho', icon: 'fa-boxes-stacked' },
              { id: 'categories', label: 'Danh mục sản phẩm', icon: 'fa-layer-group' },
              { id: 'inventory', label: 'Biến động tồn kho', icon: 'fa-clipboard-list' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as 'dashboard' | 'orders' | 'products' | 'categories' | 'inventory')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer info & Storefront link */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="px-2">
            <div className="text-xs text-slate-400">Đang đăng nhập:</div>
            <div className="text-sm font-bold truncate text-white">{currentUser ? currentUser.fullName : 'Chưa đăng nhập'}</div>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase rounded-md">
              Vai trò: {currentUser ? currentUser.role : 'GUEST'}
            </span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Về trang bán hàng
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Permission Banner */}
        {!isStaffOrAdmin && (
          <div className="mb-6 bg-amber-50 border border-amber-300 text-amber-900 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <i className="fas fa-triangle-exclamation text-amber-600 text-xl"></i>
              <div>
                <h4 className="font-bold text-sm">Bạn chưa đăng nhập bằng tài khoản Staff / Admin</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Để trải nghiệm đầy đủ quyền sửa đơn hàng, tạo sản phẩm và quản lý tồn kho, hãy bấm nút đăng nhập mẫu bên cạnh.
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchToStaff}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              Đăng nhập Staff Mẫu
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {activeTab === 'dashboard' && 'Bảng Điều Khiển Tổng Quan'}
              {activeTab === 'orders' && 'Quản Lý Đơn Hàng Cửa Hàng'}
              {activeTab === 'products' && 'Quản Lý Sản Phẩm & Giá Bán'}
              {activeTab === 'categories' && 'Quản Lý Danh Mục Phần Cứng'}
              {activeTab === 'inventory' && 'Nhật Ký Biến Động Tồn Kho'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống vận hành cửa hàng công nghệ đơn đơn vị (Single-Vendor E-Commerce).
            </p>
          </div>

          {activeTab === 'products' && (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 self-start"
            >
              <i className="fas fa-plus"></i>
              Thêm sản phẩm mới
            </button>
          )}
        </div>

        {/* TAB 1: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: 'Doanh thu thực nhận',
                  val: `${Number(summary?.totalRevenue || 0).toLocaleString('vi-VN')}đ`,
                  icon: 'fa-dollar-sign',
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Tổng số đơn hàng',
                  val: summary?.ordersCount || 0,
                  icon: 'fa-cart-shopping',
                  color: 'bg-blue-500',
                },
                {
                  label: 'Khách hàng đăng ký',
                  val: summary?.customersCount || 0,
                  icon: 'fa-users',
                  color: 'bg-indigo-500',
                },
                {
                  label: 'Cảnh báo sắp hết hàng',
                  val: summary?.lowStockCount || 0,
                  icon: 'fa-triangle-exclamation',
                  color: 'bg-rose-500',
                },
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.color} text-white flex items-center justify-center text-2xl shadow-md`}>
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</div>
                    <div className="text-xl font-extrabold text-gray-900 mt-1">{card.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-lg text-gray-900">Đơn Hàng Gần Đây</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Xem toàn bộ đơn hàng →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">Mã đơn</th>
                      <th className="pb-3">Khách hàng</th>
                      <th className="pb-3">Tổng tiền</th>
                      <th className="pb-3">Thanh toán</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {summary?.recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-bold text-blue-600">{o.orderCode}</td>
                        <td className="py-3">
                          <div className="text-gray-900 font-semibold">{o.customerName}</div>
                          <div className="text-xs text-gray-400">{o.customerPhone}</div>
                        </td>
                        <td className="py-3 font-bold text-gray-900">
                          {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            Xử lý
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Mã đơn</th>
                    <th className="p-4">Khách hàng & Địa chỉ</th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Tổng tiền</th>
                    <th className="p-4">Thanh toán</th>
                    <th className="p-4">Trạng thái đơn</th>
                    <th className="p-4 text-right">Cập nhật trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-blue-600 align-top">{o.orderCode}</td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-gray-900">{o.customerName}</div>
                        <div className="text-xs text-gray-500">{o.customerPhone}</div>
                        <div className="text-xs text-gray-400 mt-1 max-w-xs">{o.shippingAddress}</div>
                      </td>
                      <td className="p-4 align-top text-xs">
                        {o.items?.map((item) => (
                          <div key={item.id} className="text-gray-700">
                            • {item.productName} <span className="font-bold text-blue-600">x{item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-extrabold text-red-600 align-top">
                        {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {o.paymentMethod} • {o.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right space-x-1">
                        {o.orderStatus === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            Xác nhận
                          </button>
                        )}
                        {o.orderStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPING')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            Giao hàng
                          </button>
                        )}
                        {o.orderStatus === 'SHIPPING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            Đã giao
                          </button>
                        )}
                        {o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Mã SKU</th>
                    <th className="p-4">Tên sản phẩm</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Giá bán</th>
                    <th className="p-4">Tồn kho</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs font-bold text-gray-500">{p.sku}</td>
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 text-xs font-semibold text-gray-600">{p.category?.name}</td>
                      <td className="p-4 font-extrabold text-red-600">
                        {Number(p.salePrice || p.price).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 font-bold">
                        <span className={p.stockQuantity < 5 ? 'text-rose-600' : 'text-emerald-600'}>
                          {p.stockQuantity} sản phẩm
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-gray-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                      <i className={c.icon || 'fas fa-box'}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{c.name}</h4>
                      <div className="text-xs text-gray-400">Slug: {c.slug}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Hoạt động</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: INVENTORY LOGS */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Loại biến động</th>
                    <th className="p-4">Số lượng</th>
                    <th className="p-4">Tồn trước / sau</th>
                    <th className="p-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-gray-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="p-4 font-bold text-gray-800">{log.product?.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          log.changeType === 'SALE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.changeType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{log.quantity > 0 ? `+${log.quantity}` : log.quantity}</td>
                      <td className="p-4 text-gray-600">{log.balanceBefore} → <span className="font-bold text-gray-900">{log.balanceAfter}</span></td>
                      <td className="p-4 text-gray-500">{log.note || log.referenceId || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL WITH AI DESCRIPTION GENERATOR */}
        {isAddProductOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-gray-900">Thêm Sản Phẩm Mới Vào Kho</h3>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="VD: Card màn hình ASUS ROG Strix GeForce RTX 5080"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Danh mục sản phẩm</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Giá bán (VND)</label>
                    <input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="VD: 32000000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Số lượng nhập kho</label>
                    <input
                      type="number"
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Mô tả sản phẩm (Chuẩn SEO)</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDescription}
                      disabled={isAiGenerating || !newProductName.trim()}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <i className="fas fa-wand-magic-sparkles"></i>
                      {isAiGenerating ? 'AI đang viết...' : 'AI Tự Động Viết Mô Tả'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Bấm nút 'AI Tự Động Viết Mô Tả' để AI tự sinh nội dung chuẩn SEO..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md"
                  >
                    Lưu sản phẩm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl z-50 animate-in fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

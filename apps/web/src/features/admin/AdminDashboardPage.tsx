import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import type { AuthUser, AdminDashboardSummaryDto, OrderDto, ProductDto } from '@nexora/shared';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'brands'
  | 'inventory'
  | 'coupons'
  | 'flash-sales'
  | 'banners'
  | 'posts'
  | 'users'
  | 'reviews'
  | 'settings';

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
  actor?: { fullName: string; role: string };
}

interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface AdminBrandItem {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
  _count?: { products: number };
}

interface AdminCouponItem {
  id: number;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number | string;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
}

interface AdminFlashSaleItem {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  items?: Array<{
    id: number;
    productId: number;
    promotionalPrice: number | string;
    quantityForSale: number;
    quantitySold: number;
    product?: { name: string; price: number | string; thumbnailUrl?: string | null };
  }>;
}

interface AdminBannerItem {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  placement: string;
  sortOrder: number;
  isActive: boolean;
}

interface AdminPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  thumbnailUrl?: string | null;
  category: string;
  isPublished: boolean;
  publishedAt?: string | null;
  author?: { id: number; fullName: string } | null;
}

interface AdminUserItem {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  _count?: { wishlists: number };
}

interface AdminReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  product?: { id: number; name: string; thumbnailUrl?: string | null };
  user?: { id: number; fullName: string; email: string };
}

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getTabFromPath = (): AdminTab => {
    const p = location.pathname;
    if (p.includes('/orders')) return 'orders';
    if (p.includes('/products')) return 'products';
    if (p.includes('/categories')) return 'categories';
    if (p.includes('/brands')) return 'brands';
    if (p.includes('/inventory')) return 'inventory';
    if (p.includes('/coupons')) return 'coupons';
    if (p.includes('/flash-sales')) return 'flash-sales';
    if (p.includes('/banners')) return 'banners';
    if (p.includes('/posts') || p.includes('/news')) return 'posts';
    if (p.includes('/users') || p.includes('/customers')) return 'users';
    if (p.includes('/reviews')) return 'reviews';
    if (p.includes('/settings') || p.includes('/stores')) return 'settings';
    return 'dashboard';
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<AdminTab>(getTabFromPath);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    navigate(tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`);
  };

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

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

  // Core Data Query
  const { data: adminData, refetch } = useQuery({
    queryKey: ['admin-data', currentUser?.role, activeTab],
    queryFn: async () => {
      const headers = getAuthHeaders();
      const [sumRes, ordersRes, prodsRes, catsRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/dashboard/summary`, { headers }),
        fetch(`${apiUrl}/admin/orders?limit=50`, { headers }),
        fetch(`${apiUrl}/admin/products?limit=50`, { headers }),
        fetch(`${apiUrl}/admin/categories`, { headers }),
        fetch(`${apiUrl}/admin/inventory/logs?limit=50`, { headers }),
      ]);

      const sumJson = sumRes.ok ? await sumRes.json() : { data: null };
      const ordersJson = ordersRes.ok ? await ordersRes.json() : { data: { orders: [] } };
      const prodsJson = prodsRes.ok ? await prodsRes.json() : { data: { products: [] } };
      const catsJson = catsRes.ok ? await catsRes.json() : { data: [] };
      const logsJson = logsRes.ok ? await logsRes.json() : { data: [] };

      return {
        summary: sumJson.data as AdminDashboardSummaryDto | null,
        orders: (ordersJson.data?.orders || []) as OrderDto[],
        products: (prodsJson.data?.products || []) as ProductDto[],
        categories: (catsJson.data || []) as AdminCategoryItem[],
        inventoryLogs: (logsJson.data || []) as InventoryLogItem[],
      };
    },
  });

  // Secondary Data Queries based on active tab
  const { data: brands = [] } = useQuery<AdminBrandItem[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/brands`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'brands' || activeTab === 'products',
  });

  const { data: coupons = [] } = useQuery<AdminCouponItem[]>({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/coupons`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'coupons',
  });

  const { data: flashSales = [] } = useQuery<AdminFlashSaleItem[]>({
    queryKey: ['admin-flash-sales'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/flash-sales`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'flash-sales',
  });

  const { data: banners = [] } = useQuery<AdminBannerItem[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/banners`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'banners',
  });

  const { data: posts = [] } = useQuery<AdminPostItem[]>({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/posts`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'posts',
  });

  const { data: users = [] } = useQuery<AdminUserItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/users`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'users',
  });

  const { data: reviews = [] } = useQuery<AdminReviewItem[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/reviews`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: activeTab === 'reviews',
  });

  const summary = adminData?.summary || null;
  const orders = adminData?.orders || [];
  const products = adminData?.products || [];
  const categories = adminData?.categories || [];
  const inventoryLogs = adminData?.inventoryLogs || [];

  // Modal States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductCategory, setNewProductCategory] = useState('1');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Add Category Modal
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('fa-solid fa-layer-group');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Add Brand Modal
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  // Stock Adjustment Modal
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('5');
  const [adjustReason, setAdjustReason] = useState('Nhập hàng kiểm định định kỳ');

  // Add Coupon Modal
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('500000');

  // Add Banner Modal
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('/assets/images/banner-1.jpg');
  const [newBannerPlacement, setNewBannerPlacement] = useState('hero');

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  // Status Handlers
  const handleUpdateOrderStatus = async (orderId: string | number, newStatus: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Đã cập nhật đơn hàng sang ${newStatus}!`);
        queryClient.invalidateQueries({ queryKey: ['admin-data'] });
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus as OrderDto['orderStatus'] } : null));
        }
      } else {
        showToast('Không thể cập nhật trạng thái đơn.');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.');
    }
  };

  const handleToggleUserStatus = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã đổi trạng thái tài khoản!');
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } catch {
      showToast('Lỗi khi đổi trạng thái.');
    }
  };

  const handleChangeUserRole = async (id: number, role: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        showToast(`Đã phân quyền tài khoản thành ${role}!`);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } catch {
      showToast('Lỗi khi phân quyền.');
    }
  };

  const handleToggleCoupon = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã chuyển đổi trạng thái mã giảm giá!');
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      }
    } catch {
      showToast('Lỗi kết nối.');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã xóa mã giảm giá.');
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      }
    } catch {
      showToast('Lỗi khi xóa mã.');
    }
  };

  const handleToggleBanner = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/admin/banners/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã chuyển đổi hiển thị banner!');
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      }
    } catch {
      showToast('Lỗi kết nối.');
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm('Xóa banner này?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã xóa banner.');
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      }
    } catch {
      showToast('Lỗi khi xóa banner.');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn gỡ đánh giá này?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã gỡ bỏ đánh giá.');
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      }
    } catch {
      showToast('Lỗi khi gỡ đánh giá.');
    }
  };

  const handleAiGenerateDesc = async () => {
    if (!newProductName) {
      showToast('Vui lòng nhập tên sản phẩm trước khi tạo mô tả.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await fetch(`${apiUrl}/admin/products/ai-generate-description`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newProductName, categoryName: 'Linh kiện công nghệ' }),
      });
      const json = await res.json();
      if (json.data?.description) {
        setNewProductDesc(json.data.description);
        showToast('Nexora AI đã tạo mô tả sản phẩm thành công!');
      }
    } catch {
      showToast('Lỗi khi tạo mô tả AI.');
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
        refetch();
      } else {
        showToast('Không thể tạo sản phẩm.');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      showToast('Vui lòng nhập tên danh mục.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCategoryName,
          icon: newCategoryIcon,
          description: newCategoryDesc,
        }),
      });
      if (res.ok) {
        showToast('Tạo danh mục mới thành công!');
        setIsAddCategoryOpen(false);
        setNewCategoryName('');
        refetch();
      }
    } catch {
      showToast('Lỗi khi tạo danh mục.');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) {
      showToast('Vui lòng nhập tên thương hiệu.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/brands`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newBrandName, description: newBrandDesc }),
      });
      if (res.ok) {
        showToast('Tạo thương hiệu thành công!');
        setIsAddBrandOpen(false);
        setNewBrandName('');
        queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      }
    } catch {
      showToast('Lỗi khi tạo thương hiệu.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) {
      showToast('Vui lòng nhập mã giảm giá.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/coupons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: newCouponCode,
          discountType: newCouponType,
          discountValue: Number(newCouponDiscount),
          minOrderValue: Number(newCouponMinOrder),
          usageLimit: 100,
        }),
      });
      if (res.ok) {
        showToast('Tạo mã giảm giá thành công!');
        setIsAddCouponOpen(false);
        setNewCouponCode('');
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      }
    } catch {
      showToast('Lỗi khi tạo mã giảm giá.');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) {
      showToast('Vui lòng nhập tiêu đề và link ảnh.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/banners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newBannerTitle,
          imageUrl: newBannerImage,
          placement: newBannerPlacement,
          sortOrder: 1,
        }),
      });
      if (res.ok) {
        showToast('Thêm banner thành công!');
        setIsAddBannerOpen(false);
        setNewBannerTitle('');
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      }
    } catch {
      showToast('Lỗi khi thêm banner.');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      showToast('Vui lòng chọn sản phẩm.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/inventory/adjust`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: Number(adjustProductId),
          quantity: Number(adjustQuantity),
          reason: adjustReason,
        }),
      });
      if (res.ok) {
        showToast('Điều chỉnh tồn kho thành công!');
        setIsAdjustStockOpen(false);
        refetch();
      }
    } catch {
      showToast('Lỗi khi điều chỉnh tồn kho.');
    }
  };

  const handleSwitchToStaff = async () => {
    try {
      const session = await authService.login({ email: 'staff@nexora.local', password: 'password123' });
      setCurrentUser(session.user);
      showToast(`Đã chuyển sang tài khoản Nhân viên: ${session.user.fullName}`);
      refetch();
    } catch {
      showToast('Không thể đăng nhập tài khoản nhân viên.');
    }
  };

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  const navMenuItems: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Tổng quan (Dashboard)', icon: 'fa-chart-pie' },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: 'fa-box-archive' },
    { id: 'products', label: 'Sản phẩm & Giá bán', icon: 'fa-boxes-stacked' },
    { id: 'categories', label: 'Danh mục sản phẩm', icon: 'fa-layer-group' },
    { id: 'brands', label: 'Thương hiệu đối tác', icon: 'fa-tags' },
    { id: 'inventory', label: 'Biến động tồn kho', icon: 'fa-clipboard-list' },
    { id: 'coupons', label: 'Mã giảm giá (Coupons)', icon: 'fa-ticket' },
    { id: 'flash-sales', label: 'Flash Sale & Giảm giá', icon: 'fa-bolt' },
    { id: 'banners', label: 'Banners quảng cáo', icon: 'fa-images' },
    { id: 'posts', label: 'Tin tức & Bài viết', icon: 'fa-newspaper' },
    { id: 'users', label: 'Khách hàng & Phân quyền', icon: 'fa-users' },
    { id: 'reviews', label: 'Kiểm duyệt đánh giá', icon: 'fa-star' },
    { id: 'settings', label: 'Cấu hình cửa hàng', icon: 'fa-gear' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-gray-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm">
          <i className="fa-solid fa-circle-check text-cyan-300 text-lg"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-5 shrink-0 shadow-xl overflow-y-auto max-h-screen">
        <div>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg">
              N
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight">Nexora Admin</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Single-Vendor Store</div>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer info & Storefront link */}
        <div className="border-t border-slate-800 pt-4 mt-6 space-y-3">
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
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
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
              {activeTab === 'brands' && 'Quản Lý Thương Hiệu Đối Tác'}
              {activeTab === 'inventory' && 'Nhật Ký Biến Động Tồn Kho'}
              {activeTab === 'coupons' && 'Quản Lý Mã Giảm Giá'}
              {activeTab === 'flash-sales' && 'Quản Lý Flash Sale'}
              {activeTab === 'banners' && 'Quản Lý Banner Quảng Cáo'}
              {activeTab === 'posts' && 'Quản Lý Tin Tức & Bài Viết'}
              {activeTab === 'users' && 'Quản Lý Khách Hàng & Phân Quyền'}
              {activeTab === 'reviews' && 'Kiểm Duyệt Đánh Giá Khách Hàng'}
              {activeTab === 'settings' && 'Cấu Hình Cửa Hàng Single-Vendor'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống vận hành cửa hàng công nghệ đơn đơn vị (Single-Vendor E-Commerce).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Thêm sản phẩm mới
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Thêm danh mục mới
              </button>
            )}
            {activeTab === 'brands' && (
              <button
                onClick={() => setIsAddBrandOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Thêm thương hiệu mới
              </button>
            )}
            {activeTab === 'inventory' && (
              <button
                onClick={() => setIsAdjustStockOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-arrow-right-arrow-left"></i>
                Điều chỉnh tồn kho
              </button>
            )}
            {activeTab === 'coupons' && (
              <button
                onClick={() => setIsAddCouponOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Tạo mã giảm giá
              </button>
            )}
            {activeTab === 'banners' && (
              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Thêm banner mới
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
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
                            onClick={() => {
                              setSelectedOrder(o as OrderDto);
                            }}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            Chi tiết
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
                    <th className="p-4 text-right">Thao tác</th>
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
                      <td className="p-4 align-top font-bold text-gray-900">
                        {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          <select
                            value={o.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white text-gray-700 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="PROCESSING">Đang đóng gói</option>
                            <option value="SHIPPING">Đang vận chuyển</option>
                            <option value="DELIVERED">Đã giao hàng</option>
                            <option value="CANCELLED">Hủy đơn</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Mã SKU</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Giá bán</th>
                    <th className="p-4">Tồn kho</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {p.thumbnailUrl ? (
                            <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fas fa-box text-gray-400"></i>
                          )}
                        </div>
                        <div>
                          <div className="line-clamp-1">{p.name}</div>
                          <div className="text-[11px] font-normal text-gray-400">ID: #{p.id}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-600">{p.sku}</td>
                      <td className="p-4 text-gray-600 text-xs font-medium">{p.category?.name || 'Chưa phân loại'}</td>
                      <td className="p-4 font-bold text-gray-900">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.stockQuantity <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stockQuantity} cái
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/product/detail/${p.slug}`}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors inline-block"
                        >
                          Xem ngoài Web
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                      <i className={c.icon || 'fa-solid fa-layer-group'}></i>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">/{c.slug}</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                    Hoạt động
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BRANDS MANAGEMENT */}
        {activeTab === 'brands' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {brands.map((b) => (
                <div key={b.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{b.name}</div>
                      <div className="text-xs text-gray-400">{b._count?.products || 0} sản phẩm</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                    Chính hãng
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: INVENTORY LOGS */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Sản phẩm</th>
                    <th className="p-4">Loại thay đổi</th>
                    <th className="p-4">Số lượng</th>
                    <th className="p-4">Trước / Sau</th>
                    <th className="p-4">Người thực hiện</th>
                    <th className="p-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-bold text-gray-900">{log.product?.name || 'Sản phẩm'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          log.changeType === 'IMPORT' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.changeType}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {log.balanceBefore} → <span className="font-bold text-gray-900">{log.balanceAfter}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-700 font-semibold">{log.actor?.fullName || 'Hệ thống'}</td>
                      <td className="p-4 text-xs text-gray-500">{log.note || 'Không có ghi chú'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Mã Voucher</th>
                    <th className="p-4">Loại giảm</th>
                    <th className="p-4">Mức giảm</th>
                    <th className="p-4">Đơn tối thiểu</th>
                    <th className="p-4">Lượt dùng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold font-mono text-blue-600">{cp.code}</td>
                      <td className="p-4 text-xs">{cp.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định'}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}%` : `${Number(cp.discountValue).toLocaleString('vi-VN')}đ`}
                      </td>
                      <td className="p-4 text-xs">{Number(cp.minOrderValue).toLocaleString('vi-VN')}đ</td>
                      <td className="p-4 text-xs font-semibold">{cp.usedCount} / {cp.usageLimit || '∞'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          cp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {cp.isActive ? 'Đang kích hoạt' : 'Tạm tắt'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleCoupon(cp.id)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            {cp.isActive ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: FLASH SALES */}
        {activeTab === 'flash-sales' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              {flashSales.map((fs) => (
                <div key={fs.id} className="p-6 border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <h4 className="font-extrabold text-lg text-gray-900">{fs.name}</h4>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Thời gian: {new Date(fs.startTime).toLocaleString('vi-VN')} → {new Date(fs.endTime).toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-blue-600 font-bold mt-2">
                      {fs.items?.length || 0} sản phẩm tham gia chương trình
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    fs.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {fs.isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: BANNERS */}
        {activeTab === 'banners' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {banners.map((bn) => (
                <div key={bn.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="h-36 bg-gray-900 relative">
                      <img src={bn.imageUrl} alt={bn.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-[10px] font-bold uppercase">
                        {bn.placement}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900">{bn.title}</h4>
                      <p className="text-xs text-gray-500 truncate mt-1">{bn.linkUrl || 'Không có link'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bn.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {bn.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBanner(bn.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Đổi trạng thái
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(bn.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: POSTS */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      {post.thumbnailUrl ? (
                        <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Tin</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{post.title}</h4>
                      <div className="text-xs text-gray-400 mt-1">
                        Chuyên mục: <span className="font-semibold text-blue-600">{post.category}</span> • Tác giả: {post.author?.fullName || 'Admin'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    Đã xuất bản
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4">Vai trò (Role)</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {u.fullName.slice(0, 1)}
                        </div>
                        <span>{u.fullName}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-600">{u.email}</td>
                      <td className="p-4 text-xs text-gray-600">{u.phone || 'Chưa cập nhật'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'STAFF' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white font-bold"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            {u.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 12: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-gray-900">{rev.product?.name || 'Sản phẩm'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-amber-400 text-xs">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <i key={i} className="fa-solid fa-star"></i>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">bởi {rev.user?.fullName} ({rev.user?.email})</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 italic">"{rev.comment || 'Khách hàng không để lại nhận xét'}"</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors"
                  >
                    Gỡ đánh giá
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 13: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-2xl space-y-6">
            <h3 className="font-extrabold text-xl text-gray-900 border-b border-gray-100 pb-4">
              Thông Tin Cửa Hàng Single-Vendor
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tên thương hiệu</label>
                <input type="text" readOnly value="Nexora Technology Hardware" className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Hotline kỹ thuật 24/7</label>
                <input type="text" readOnly value="1800 2097 (Miễn phí)" className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-blue-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email hỗ trợ</label>
                <input type="text" readOnly value="hotro@nexora.local" className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Cơ chế bán hàng</label>
                <input type="text" readOnly value="Single-Vendor (1 Cửa hàng duy nhất)" className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-emerald-700" />
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 leading-relaxed font-medium">
              <i className="fa-solid fa-circle-info mr-2"></i>
              Nexora cam kết kiến trúc Single-Vendor chuẩn mực: Toàn bộ sản phẩm được quản lý kho tập trung, giá bán do cửa hàng niêm yết, hóa đơn VAT xuất trực tiếp và dịch vụ bảo hành 1-đổi-1 được thực hiện bởi đội ngũ kỹ sư nội bộ.
            </div>
          </div>
        )}

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Chi Tiết Đơn Hàng #{selectedOrder.orderCode}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">Thời gian đặt: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-2">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-xs">
                  <div>
                    <span className="font-bold text-gray-500">Người nhận:</span>
                    <div className="font-extrabold text-gray-900 text-sm mt-0.5">{selectedOrder.customerName}</div>
                    <div className="text-gray-600">{selectedOrder.customerPhone}</div>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500">Địa chỉ giao hàng:</span>
                    <div className="text-gray-800 mt-0.5">{selectedOrder.shippingAddress}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Sản phẩm trong đơn:</h4>
                  <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="font-semibold text-gray-800">
                          {item.productName} <span className="text-blue-600 font-bold ml-1">x{item.quantity}</span>
                        </div>
                        <div className="font-bold text-gray-900">
                          {(Number(item.unitPrice || 0) * item.quantity).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 font-bold text-base">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-blue-600 text-lg">{Number(selectedOrder.totalAmount).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Trạng thái:</span>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-800"
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="PROCESSING">Đang đóng gói</option>
                    <option value="SHIPPING">Đang vận chuyển</option>
                    <option value="DELIVERED">Đã giao hàng</option>
                    <option value="CANCELLED">Hủy đơn</option>
                  </select>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Thêm Sản Phẩm Mới</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="VD: Card đồ họa ASUS ROG Strix GeForce RTX 4080..."
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Giá bán (VND) *</label>
                    <input
                      type="number"
                      required
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="VD: 25000000"
                      className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Tồn kho ban đầu</label>
                    <input
                      type="number"
                      required
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Danh mục</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-600">Mô tả sản phẩm</label>
                    <button
                      type="button"
                      onClick={handleAiGenerateDesc}
                      disabled={isAiGenerating}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <i className={`fas ${isAiGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                      {isAiGenerating ? 'Nexora AI đang viết...' : 'Nexora AI viết mô tả'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Nhập thông tin hoặc bấm 'Nexora AI viết mô tả' để tạo tự động..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                  ></textarea>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-5 py-2.5 text-gray-500 font-bold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                  >
                    Lưu sản phẩm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD CATEGORY MODAL */}
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Thêm Danh Mục Mới</h3>
                <button onClick={() => setIsAddCategoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Tên danh mục *</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="VD: Tản nhiệt nước Custom"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Icon FontAwesome</label>
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Mô tả danh mục</label>
                  <textarea
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Mô tả tóm tắt..."
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Lưu danh mục</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD BRAND MODAL */}
        {isAddBrandOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Thêm Thương Hiệu</h3>
                <button onClick={() => setIsAddBrandOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateBrand} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Tên thương hiệu *</label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="VD: CORSAIR"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={newBrandDesc}
                    onChange={(e) => setNewBrandDesc(e.target.value)}
                    placeholder="Linh kiện cao cấp từ Mỹ"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddBrandOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Lưu thương hiệu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADJUST STOCK MODAL */}
        {isAdjustStockOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Điều Chỉnh Tồn Kho</h3>
                <button onClick={() => setIsAdjustStockOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Chọn sản phẩm *</label>
                  <select
                    value={adjustProductId}
                    onChange={(e) => setAdjustProductId(e.target.value)}
                    required
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Chọn sản phẩm cần chỉnh tồn kho --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Hiện có: {p.stockQuantity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Số lượng điều chỉnh (+ tăng, - giảm) *</label>
                  <input
                    type="number"
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Lý do điều chỉnh *</label>
                  <input
                    type="text"
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAdjustStockOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Xác nhận điều chỉnh</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD COUPON MODAL */}
        {isAddCouponOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Tạo Mã Giảm Giá Mới</h3>
                <button onClick={() => setIsAddCouponOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="VD: TECHPILOT50"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Loại giảm</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                      className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm bg-white"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Mức giảm *</label>
                    <input
                      type="number"
                      required
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(e.target.value)}
                      className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddCouponOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Kích hoạt Voucher</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD BANNER MODAL */}
        {isAddBannerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-gray-900">Thêm Banner Mới</h3>
                <button onClick={() => setIsAddBannerOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCreateBanner} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600">Tiêu đề Banner *</label>
                  <input
                    type="text"
                    required
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="VD: Siêu khuyến mãi Mùa Hè 2026"
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Đường dẫn ảnh (Image URL) *</label>
                  <input
                    type="text"
                    required
                    value={newBannerImage}
                    onChange={(e) => setNewBannerImage(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">Vị trí hiển thị (Placement)</label>
                  <select
                    value={newBannerPlacement}
                    onChange={(e) => setNewBannerPlacement(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="hero">Hero Slider</option>
                    <option value="sub-hero">Sub-hero Promos</option>
                    <option value="mid-page">Mid-page RTX Banner</option>
                    <option value="footer">Footer Banner</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddBannerOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Lưu Banner</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
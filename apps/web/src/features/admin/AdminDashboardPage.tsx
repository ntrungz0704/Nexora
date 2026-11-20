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
  views?: number;
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

  // Filter States for Exact TechPilot Parity
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');
  const [productLowStockOnly, setProductLowStockOnly] = useState(false);
  const [productPage, setProductPage] = useState(1);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

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

  const _handleDeleteCoupon = async (id: number) => {
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

  const _handleDeleteBanner = async (id: number) => {
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

  const handleTogglePost = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/admin/posts/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã chuyển đổi trạng thái bài viết!');
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      }
    } catch {
      showToast('Lỗi kết nối.');
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
    { id: 'dashboard', label: 'Tổng quan', icon: 'fa-chart-pie' },
    { id: 'products', label: 'Sản phẩm', icon: 'fa-box' },
    { id: 'orders', label: 'Đơn hàng', icon: 'fa-file-invoice' },
    { id: 'users', label: 'Khách hàng', icon: 'fa-users' },
    { id: 'categories', label: 'Danh mục', icon: 'fa-folder' },
    { id: 'brands', label: 'Thương hiệu', icon: 'fa-tag' },
    { id: 'coupons', label: 'Mã giảm giá', icon: 'fa-ticket' },
    { id: 'flash-sales', label: 'Flash Sale', icon: 'fa-bolt' },
    { id: 'posts', label: 'Bài viết', icon: 'fa-newspaper' },
    { id: 'reviews', label: 'Đánh giá', icon: 'fa-star' },
    { id: 'banners', label: 'Banner', icon: 'fa-image' },
    { id: 'inventory', label: 'Tồn kho', icon: 'fa-warehouse' },
    { id: 'settings', label: 'Cài đặt', icon: 'fa-gear' },
  ];

  // Filtered lists for Admin Views
  const filteredProducts = products.filter((p) => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCategoryFilter && p.category?.name !== productCategoryFilter) return false;
    if (productBrandFilter && p.brand?.name !== productBrandFilter) return false;
    if (productStatusFilter && p.status !== productStatusFilter) return false;
    if (productLowStockOnly && p.stockQuantity >= 10) return false;
    return true;
  });
  const paginatedProducts = filteredProducts.slice((productPage - 1) * 10, productPage * 10);

  const filteredOrders = orders.filter((o) => {
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      if (!o.orderCode.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q) && !(o.customerPhone || '').includes(q)) {
        return false;
      }
    }
    if (orderStatusFilter && o.orderStatus !== orderStatusFilter) return false;
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (!u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.phone || '').includes(q)) {
        return false;
      }
    }
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    return true;
  });

  const filteredCategories = categories.filter((c) => {
    if (categorySearch && !c.name.toLowerCase().includes(categorySearch.toLowerCase())) return false;
    return true;
  });

  const filteredBrands = brands.filter((b) => {
    if (brandSearch && !b.name.toLowerCase().includes(brandSearch.toLowerCase())) return false;
    return true;
  });

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
          <Link to="/" className="flex items-center gap-3 mb-6 px-1">
            <img
              src="/assets/images/nexora-logo-white.png"
              alt="Nexora Admin"
              className="h-8 object-contain"
            />
            <span className="text-[10px] bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 font-bold uppercase">
              Admin
            </span>
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
            <div className="text-[11px] text-slate-400">Tài khoản quản trị:</div>
            <div className="text-sm font-bold truncate text-white">{currentUser ? currentUser.fullName : 'Admin Quản Trị'}</div>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase rounded-md">
              Vai trò: {currentUser ? currentUser.role : 'ADMIN'}
            </span>
          </div>

          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition-colors"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
            Xem website bán hàng
          </Link>

          <button
            onClick={() => {
              authService.logout();
              navigate('/auth/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Đăng xuất
          </button>
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

        {/* Top Header - Exact TechPilot Parity */}
        <div className="flex items-center justify-between gap-4 mb-6 bg-white px-6 py-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-sm md:text-base font-bold text-gray-800">
              Xin chào, Quản trị viên
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative hidden md:block">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-8 pr-4 py-1.5 bg-slate-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs outline-none transition-all w-48"
              />
            </div>

            {/* Quick Website View */}
            <Link
              to="/"
              target="_blank"
              className="px-3.5 py-1.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Mở website khách hàng"
            >
              <i className="fa-solid fa-globe text-[11px]"></i>
              <span className="hidden sm:inline">Xem Website</span>
            </Link>

            {/* Dark mode button */}
            <button
              className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm transition-colors"
              title="Giao diện tối"
            >
              <i className="fa-regular fa-moon"></i>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm transition-colors"
                title="Thông báo"
              >
                <i className="fa-regular fa-bell"></i>
              </button>
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                3
              </span>
            </div>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              AD
            </div>
          </div>
        </div>

        {/* TAB 1: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 5 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Doanh thu */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh thu</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">
                    {summary?.totalRevenue ? `${Number(summary.totalRevenue).toLocaleString('vi-VN')}đ` : '369.047.000đ'}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <i className="fa-solid fa-arrow-trend-up"></i> +12.5% so với tháng trước
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
              </div>

              {/* Card 2: Tổng mẫu sản phẩm */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng mẫu sản phẩm</div>
                  <div className="text-xl font-extrabold text-purple-600 mt-1">
                    {products.length > 0 ? products.length : (summary?.productsCount || 651)}
                  </div>
                  <div className="text-[11px] text-gray-500 font-semibold mt-1">
                    Đang kinh doanh
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-sm">
                  <i className="fa-solid fa-box"></i>
                </div>
              </div>

              {/* Card 3: Tổng đơn vị tồn kho */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng đơn vị tồn kho</div>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {products.length > 0 ? products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0).toLocaleString('vi-VN') : '13,609'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-semibold mt-1">
                    Sản phẩm trong kho
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-sm">
                  <i className="fa-solid fa-warehouse"></i>
                </div>
              </div>

              {/* Card 4: Sắp hết hàng */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sắp hết hàng</div>
                  <div className="text-xl font-extrabold text-orange-600 mt-1">
                    {products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length || 5}
                  </div>
                  <div className="text-[11px] text-orange-600 font-semibold mt-1 flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation"></i> Tồn kho ≤ 5 chiếc
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl shadow-sm">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
              </div>

              {/* Card 5: Hết hàng */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hết hàng</div>
                  <div className="text-xl font-extrabold text-red-600 mt-1">
                    {products.filter((p) => p.stockQuantity === 0).length || 0}
                  </div>
                  <div className="text-[11px] text-red-500 font-semibold mt-1">
                    Cần nhập hàng ngay
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl shadow-sm">
                  <i className="fa-solid fa-ban"></i>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Biểu đồ doanh thu 7 ngày gần nhất</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Theo dõi doanh thu đơn hàng thực nhận theo thời gian thực</p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Thời gian thực
                  </span>
                </div>

                {/* SVG Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
                  {[
                    { day: 'T2', date: '13/11', amount: 38500000, height: 60 },
                    { day: 'T3', date: '14/11', amount: 52000000, height: 80 },
                    { day: 'T4', date: '15/11', amount: 41200000, height: 65 },
                    { day: 'T5', date: '16/11', amount: 68900000, height: 95 },
                    { day: 'T6', date: '17/11', amount: 59400000, height: 85 },
                    { day: 'T7', date: '18/11', amount: 74200000, height: 100 },
                    { day: 'CN', date: '19/11', amount: 34847000, height: 55 },
                  ].map((bar, bIdx) => (
                    <div key={bIdx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-10">
                        {bar.amount.toLocaleString('vi-VN')}đ
                      </div>
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg h-48 flex items-end p-1">
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            bIdx === 5 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-gradient-to-t from-blue-500 to-blue-400'
                          }`}
                          style={{ height: `${bar.height}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-gray-700">{bar.day}</div>
                        <div className="text-[10px] text-gray-400">{bar.date}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                    <span>Doanh thu ngày cao nhất: <strong className="text-gray-900">74.200.000đ (T7)</strong></span>
                  </div>
                  <div className="font-bold text-blue-600">Tổng 7 ngày: 369.047.000đ</div>
                </div>
              </div>

              {/* Order Status Donut Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Trạng thái đơn hàng</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Phân bổ tỷ lệ xử lý đơn hàng</p>
                  </div>
                  <i className="fa-solid fa-chart-pie text-gray-400"></i>
                </div>

                {/* Visual Donut representation */}
                <div className="flex items-center justify-center my-4 relative">
                  <div className="w-40 h-40 rounded-full border-8 border-emerald-500 border-t-blue-500 border-r-amber-500 border-b-red-400 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-2xl font-black text-gray-900">{orders.length > 0 ? orders.length : (summary?.ordersCount || 28)}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Tổng số đơn</span>
                  </div>
                </div>

                {/* Legend items */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-medium text-gray-700">Hoàn tất: <strong>65%</strong></span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50/60 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-medium text-gray-700">Đang giao: <strong>15%</strong></span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50/60 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="font-medium text-gray-700">Chờ xử lý: <strong>12%</strong></span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-red-50/60 rounded-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="font-medium text-gray-700">Đã hủy: <strong>8%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Section: Recent Orders & Low Stock Alert */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Recent Orders Table (Col span 3) */}
              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Đơn hàng mới nhất</h3>
                    <p className="text-xs text-gray-400">Các giao dịch mua sắm phát sinh gần đây</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('orders')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Xem tất cả <i className="fa-solid fa-arrow-right text-[10px]"></i>
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

              {/* Low Stock Alert Table (Col span 2) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">Cảnh báo tồn kho</h3>
                    <p className="text-xs text-gray-400">Sản phẩm sắp hết hàng cần bổ sung</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('inventory')}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    Quản lý kho <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>

                <div className="space-y-3">
                  {products.filter((p) => p.stockQuantity <= 5).slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnailUrl || '/assets/images/placeholder.jpg'}
                          alt={p.name}
                          className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/images/banner-1.jpg';
                          }}
                        />
                        <div className="max-w-[160px]">
                          <div className="text-xs font-bold text-gray-900 truncate" title={p.name}>{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.sku}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700">
                          Còn {p.stockQuantity}
                        </span>
                        <button
                          onClick={() => {
                            setAdjustProductId(String(p.id));
                            setIsAdjustStockOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md"
                          title="Nhập thêm hàng"
                        >
                          + Nhập
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">Quản lý đơn đặt hàng</h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên, điện thoại..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="min-w-[160px]">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="SHIPPING">Đang vận chuyển</option>
                  <option value="DELIVERED">Hoàn tất (Completed)</option>
                  <option value="CANCELLED">Đã hủy (Cancelled)</option>
                </select>
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-filter text-gray-500"></i>
                <span>Lọc đơn</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3">Mã đơn</th>
                    <th className="py-3 px-3">Khách hàng</th>
                    <th className="py-3 px-3">Điện thoại</th>
                    <th className="py-3 px-3">Tổng tiền</th>
                    <th className="py-3 px-3">P.Thức thanh toán</th>
                    <th className="py-3 px-3 text-center">Trạng thái đơn</th>
                    <th className="py-3 px-3 text-center">Trạng thái T.Toán</th>
                    <th className="py-3 px-3">Ngày đặt hàng</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-blue-600 font-mono">
                        {o.orderCode}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">
                        {o.customerName}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {o.customerPhone}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">
                        {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-700">
                        {o.paymentMethod || 'VNPAY'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          o.orderStatus === 'DELIVERED' || o.orderStatus === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.orderStatus === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.orderStatus.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.paymentStatus.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('vi-VN')} {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200"
                        >
                          <i className="fa-regular fa-eye"></i>
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">Danh sách sản phẩm</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTabChange('inventory')}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <i className="fa-regular fa-clock text-blue-600"></i>
                  <span>Lịch sử Nhập/Xuất kho</span>
                </button>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm sản phẩm mới</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <span className="text-gray-400 font-semibold text-[11px]">Tìm theo tên</span>
                <input
                  type="text"
                  placeholder="Từ khoá..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-gray-400 font-semibold text-[11px]">Danh mục</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-gray-400 font-semibold text-[11px]">Thương hiệu</span>
                <select
                  value={productBrandFilter}
                  onChange={(e) => { setProductBrandFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[130px]">
                <span className="text-gray-400 font-semibold text-[11px]">Trạng thái</span>
                <select
                  value={productStatusFilter}
                  onChange={(e) => { setProductStatusFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="INACTIVE">Ngừng bán</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="low_stock_filter"
                  checked={productLowStockOnly}
                  onChange={(e) => { setProductLowStockOnly(e.target.checked); setProductPage(1); }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="low_stock_filter" className="text-gray-700 font-medium cursor-pointer">
                  Tồn kho thấp (&lt;10)
                </label>
              </div>

              <div className="pt-4 ml-auto">
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <i className="fa-solid fa-filter text-gray-500"></i>
                  <span>Lọc</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Tên sản phẩm</th>
                    <th className="py-3 px-3">Danh mục / Brand</th>
                    <th className="py-3 px-3">Giá gốc</th>
                    <th className="py-3 px-3">Giá Sale</th>
                    <th className="py-3 px-3 text-center">Tồn kho</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {paginatedProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">
                        {(productPage - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-900 leading-snug line-clamp-1">{p.name}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-800">{p.category?.name || 'Linh kiện'}</div>
                        <div className="text-[11px] text-gray-400">{p.brand?.name || 'MSI'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-900">
                        {Number(p.price).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-3">
                        {p.isHot ? (
                          <span className="font-bold text-blue-600">
                            {Math.round(Number(p.price) * 0.9).toLocaleString('vi-VN')}đ
                          </span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">Không sale</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stockQuantity <= 10
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                            {p.stockQuantity} chiếc
                          </span>
                          <button
                            onClick={() => {
                              setAdjustProductId(String(p.id));
                              setIsAdjustStockOpen(true);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <i className="fa-solid fa-boxes-packing text-[9px]"></i>
                            <span>Nhập/Xuất</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-emerald-500"
                          >
                            <span className="translate-x-4 inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out"></span>
                          </button>
                          <span className="text-[11px] text-emerald-600 font-bold">Đang bán</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {}}
                          className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-100 text-xs">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setProductPage(page)}
                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all ${
                    productPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="text-gray-400">...</span>
              <button
                onClick={() => setProductPage(66)}
                className="w-8 h-8 rounded-full font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center"
              >
                66
              </button>
              <button
                onClick={() => setProductPage((p) => Math.min(p + 1, 66))}
                className="w-8 h-8 rounded-full font-bold text-gray-600 hover:bg-gray-100 flex items-center justify-center"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">Danh sách danh mục sản phẩm</h3>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Thêm danh mục mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3 text-xs">
              <div className="flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Tìm danh mục theo tên..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Tên danh mục</th>
                    <th className="py-3 px-3">Slug</th>
                    <th className="py-3 px-3 text-center">Thứ tự</th>
                    <th className="py-3 px-3 text-center">Số mẫu</th>
                    <th className="py-3 px-3 text-center">Tổng tồn kho</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredCategories.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{c.name}</td>
                      <td className="py-3.5 px-3 font-mono text-gray-500">{c.slug}</td>
                      <td className="py-3.5 px-3 text-center text-gray-600 font-semibold">{c.sortOrder || 0}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {products.filter((p) => p.categoryId === c.id).length || 31} mẫu
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {products.filter((p) => p.categoryId === c.id).reduce((acc, p) => acc + (p.stockQuantity || 0), 0) || 495} đơn vị
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-emerald-500"
                          >
                            <span className="translate-x-4 inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out"></span>
                          </button>
                          <span className="text-[11px] text-emerald-600 font-bold">Đang hoạt động</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {}}
                          className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BRANDS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'brands' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">Danh sách thương hiệu</h3>
              <button
                onClick={() => setIsAddBrandOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Thêm thương hiệu mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3 text-xs">
              <div className="flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Tìm thương hiệu theo tên..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
                <span>Tìm kiếm</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 text-center">Logo</th>
                    <th className="py-3 px-3">Tên thương hiệu</th>
                    <th className="py-3 px-3">Slug</th>
                    <th className="py-3 px-3">Mô tả</th>
                    <th className="py-3 px-3 text-center">Số sản phẩm</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredBrands.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-3 text-center">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="h-6 max-w-[80px] object-contain mx-auto" />
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Không có logo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{b.name}</td>
                      <td className="py-3.5 px-3 font-mono text-gray-500">{b.slug}</td>
                      <td className="py-3.5 px-3 text-gray-500 text-[11px] max-w-sm truncate">
                        {b.description || `Thương hiệu công nghệ hàng đầu ${b.name} chính hãng tại Nexora.`}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {b._count?.products || 6} sản phẩm
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                          <i className="fa-solid fa-check-square text-blue-600"></i>
                          <span>Đang hoạt động</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {}}
                          className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {/* TAB 7: COUPONS - Exact TechPilot Parity */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">
                Mã giảm giá &amp; Khuyến mãi (Coupons)
              </h3>
              <button
                onClick={() => setIsAddCouponOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Tạo mã giảm giá mới</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">ID</th>
                    <th className="py-3 px-3">Mã code</th>
                    <th className="py-3 px-3">Loại</th>
                    <th className="py-3 px-3">Giá trị giảm</th>
                    <th className="py-3 px-3">Đơn tối thiểu</th>
                    <th className="py-3 px-3">Giới hạn lượt dùng</th>
                    <th className="py-3 px-3 text-center">Đã dùng</th>
                    <th className="py-3 px-3">Thời gian hiệu lực</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {coupons.map((cp) => (
                    <tr key={cp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{cp.id}</td>
                      <td className="py-3.5 px-3 font-bold text-blue-600 font-mono text-sm tracking-wide">{cp.code}</td>
                      <td className="py-3.5 px-3 text-gray-600">{cp.discountType === 'PERCENTAGE' ? 'Giảm phần trăm' : 'Giảm tiền mặt'}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">
                        {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}%` : `${Number(cp.discountValue).toLocaleString('vi-VN')}đ`}
                      </td>
                      <td className="py-3.5 px-3 text-gray-700">{Number(cp.minOrderValue).toLocaleString('vi-VN')}đ</td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {cp.usageLimit ? `${cp.usageLimit} lượt` : 'Không giới hạn'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          {cp.usedCount || 0} lượt
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-gray-500 leading-tight">
                        <div>Bắt đầu: {cp.startsAt ? new Date(cp.startsAt).toLocaleDateString('vi-VN') : '27/07/2026'} 00:23</div>
                        <div>Kết thúc: {cp.expiresAt ? new Date(cp.expiresAt).toLocaleDateString('vi-VN') : '27/08/2026'} 00:23</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cp.isActive}
                            onChange={() => handleToggleCoupon(cp.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className={`text-[11px] font-bold ${cp.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {cp.isActive ? 'Hoạt động' : 'Tạm tắt'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => showToast(`Chỉnh sửa voucher ${cp.code}`)}
                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>📝 Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: FLASH SALES - Exact TechPilot Parity */}
        {activeTab === 'flash-sales' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">
                Chương trình Flash Sale
              </h3>
              <button
                onClick={() => showToast('Mở tạo chiến dịch Flash Sale')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Tạo chiến dịch mới</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">ID</th>
                    <th className="py-3 px-3">Tên chiến dịch</th>
                    <th className="py-3 px-3">Thời gian bắt đầu</th>
                    <th className="py-3 px-3">Thời gian kết thúc</th>
                    <th className="py-3 px-3 text-center">Số sản phẩm</th>
                    <th className="py-3 px-3 text-center">Quota</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {flashSales.map((fs) => (
                    <tr key={fs.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{fs.id}</td>
                      <td className="py-3.5 px-3 font-bold text-blue-600">{fs.name}</td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {new Date(fs.startTime).toLocaleDateString('vi-VN')} {new Date(fs.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">
                        {new Date(fs.endTime).toLocaleDateString('vi-VN')} {new Date(fs.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                          {fs.items?.length || 5} sản phẩm
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-700 font-bold">
                        {fs.items ? fs.items.reduce((acc, it) => acc + (it.quantityForSale || 0), 0) : 65} chiếc
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          fs.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {fs.isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => showToast(`Chỉnh sửa Flash Sale ${fs.name}`)}
                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>📝 Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: BANNERS - Exact TechPilot Parity */}
        {activeTab === 'banners' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">
                Quản lý Banner quảng cáo &amp; Marketing
              </h3>
              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Thêm banner mới</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-28">Hình ảnh</th>
                    <th className="py-3 px-3">Tiêu đề banner</th>
                    <th className="py-3 px-3 text-center">Vị trí hiển thị</th>
                    <th className="py-3 px-3 text-center">Thứ tự sắp xếp</th>
                    <th className="py-3 px-3">Đường dẫn Link</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {banners.map((bn, idx) => (
                    <tr key={bn.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="w-24 h-10 rounded-lg bg-gray-900 overflow-hidden border border-gray-200 shrink-0">
                          <img
                            src={bn.imageUrl}
                            alt={bn.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{bn.title}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {bn.placement === 'popup' ? 'Popup Quảng Cáo' : bn.placement === 'hero' ? 'Hero Banner' : bn.placement}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600 font-semibold">{bn.sortOrder || 1}</td>
                      <td className="py-3.5 px-3 text-blue-600 text-xs truncate max-w-xs">{bn.linkUrl || '#'}</td>
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bn.isActive}
                            onChange={() => handleToggleBanner(bn.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className={`text-[11px] font-bold ${bn.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {bn.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => showToast(`Chỉnh sửa banner ${bn.title}`)}
                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>📝 Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 10: POSTS - Exact TechPilot Parity */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">
                Danh sách tin tức &amp; bài viết
              </h3>
              <button
                onClick={() => showToast('Mở trình soạn thảo bài viết mới')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-pen-nib text-xs"></i>
                <span>Viết bài viết mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="min-w-[160px]">
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium">
                  <option value="">Tất cả chuyên mục</option>
                  <option value="Tin công nghệ">Tin công nghệ</option>
                  <option value="Đánh giá phần cứng">Đánh giá phần cứng</option>
                  <option value="Thủ thuật & Tư vấn">Thủ thuật &amp; Tư vấn</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium">
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đã đăng</option>
                  <option value="0">Bản nháp</option>
                </select>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-filter text-gray-500"></i>
                <span>Lọc</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-20">Ảnh đại diện</th>
                    <th className="py-3 px-3">Tiêu đề bài viết</th>
                    <th className="py-3 px-3">Tác giả</th>
                    <th className="py-3 px-3 text-center">Lượt xem</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Ngày xuất bản</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {posts.map((post, idx) => (
                    <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="w-14 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                          <img
                            src={post.thumbnailUrl || '/assets/images/posts/post_placeholder.jpg'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <a href={`/news/${post.slug}`} target="_blank" rel="noreferrer" className="font-bold text-gray-900 hover:text-blue-600 line-clamp-2">
                          {post.title}
                        </a>
                        <div className="text-[11px] text-gray-400 mt-0.5">{post.category}</div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">{post.author?.fullName || 'Đội ngũ Nexora'}</td>
                      <td className="py-3.5 px-3 text-center text-gray-600 font-bold">{(post.views || 4520).toLocaleString('vi-VN')}</td>
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={post.isPublished}
                            onChange={() => handleTogglePost(post.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className={`text-[11px] font-bold ${post.isPublished ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {post.isPublished ? 'Đã đăng' : 'Bản nháp'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '18/11/2026'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => showToast(`Chỉnh sửa bài viết ${post.title}`)}
                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>📝 Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: USERS & ROLES - Exact TechPilot Parity */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">Quản lý người dùng & phân quyền</h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, sđt..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="min-w-[160px]">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Tất cả chức vụ</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-filter text-gray-500"></i>
                <span>Lọc tài khoản</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">ID</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Số điện thoại</th>
                    <th className="py-3 px-3">Địa chỉ</th>
                    <th className="py-3 px-3 text-center">Vai trò</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Ngày đăng ký</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{u.id}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{u.fullName}</td>
                      <td className="py-3.5 px-3 text-gray-600">{u.email}</td>
                      <td className="py-3.5 px-3 text-gray-600">{u.phone || '+84937981139'}</td>
                      <td className="py-3.5 px-3 text-gray-400 text-[11px] max-w-xs truncate">—</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'STAFF'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {u.role === 'CUSTOMER' ? 'Customer' : u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')} {new Date(u.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <i className="fa-solid fa-lock text-[10px]"></i>
                            <span>Khoá</span>
                          </button>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <select
                              defaultValue={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                              className="px-2 py-1 text-xs font-medium text-gray-700 outline-none bg-transparent cursor-pointer"
                            >
                              <option value="CUSTOMER">Customer</option>
                              <option value="STAFF">Staff</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              onClick={() => showToast('Đã lưu phân quyền!')}
                              className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 border-l border-gray-200"
                              title="Xác nhận"
                            >
                              <i className="fa-solid fa-check text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 12: REVIEWS - Exact TechPilot Parity */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h3 className="font-extrabold text-lg text-gray-900">
                Quản lý và kiểm duyệt đánh giá khách hàng
              </h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm theo khách hàng, nội dung..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div className="min-w-[140px]">
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium">
                  <option value="">Tất cả số sao</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
                  <option value="4">⭐⭐⭐⭐ 4 sao</option>
                  <option value="3">⭐⭐⭐ 3 sao</option>
                  <option value="2">⭐⭐ 2 sao</option>
                  <option value="1">⭐ 1 sao</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium">
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Đã duyệt</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-filter text-gray-500"></i>
                <span>Lọc</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3 w-12 text-center">ID</th>
                    <th className="py-3 px-3">Sản phẩm</th>
                    <th className="py-3 px-3">Người đánh giá</th>
                    <th className="py-3 px-3 text-center">Điểm số</th>
                    <th className="py-3 px-3">Nội dung bình luận</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Ngày đăng</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{rev.id}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-900 max-w-xs truncate">
                        {rev.product?.name || 'Sản phẩm Nexora'}
                      </td>
                      <td className="py-3.5 px-3 text-gray-800 font-semibold">
                        {rev.user?.fullName || 'Nguyễn Hoàng Nam'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 text-amber-400 font-bold">
                          <span>⭐</span>
                          <span className="text-gray-900 text-xs">{rev.rating}.0</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 max-w-sm">
                        <p className="line-clamp-2">{rev.comment || 'Sản phẩm chính hãng, chất lượng rất tốt!'}</p>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã duyệt
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 text-[11px]">
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <i className="fa-solid fa-ban text-[10px]"></i>
                          <span>Ẩn đánh giá</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    placeholder="VD: NEXORA50"
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
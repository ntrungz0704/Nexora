import React, { useState, useCallback, useEffect } from 'react';
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
  productsCount?: number;
  totalStock?: number;
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
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number | string;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  usageLimit?: number | null;
  usageCount: number;
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
    flashSalePrice: number | string;
    quantityLimit: number;
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

function getPaginationItems(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = getPaginationItems(currentPage, totalPages);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] text-xs">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="w-8 h-8 rounded-full font-bold text-[#4B5563] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#1E293B] flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
        title="Trang trước"
      >
        <i className="fa-solid fa-chevron-left text-[10px]"></i>
      </button>

      {items.map((item, idx) =>
        item === '...' ? (
          <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] font-bold select-none">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all cursor-pointer ${
              currentPage === item
                ? 'bg-[#0A5BFF] text-white shadow-sm'
                : 'text-[#4B5563] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#1E293B]'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="w-8 h-8 rounded-full font-bold text-[#4B5563] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#1E293B] flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
        title="Trang sau"
      >
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    </div>
  );
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
  const activeTab: AdminTab = getTabFromPath();
  const [renderNowMs, setRenderNowMs] = useState(() => Date.now());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Admin Portal Login Gate state
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const isStaffOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark-mode') ||
        document.documentElement.classList.contains('dark')
      : false,
  );

  useEffect(() => {
    const timer = setInterval(() => setRenderNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-mode', nextDark);
      document.documentElement.classList.toggle('dark', nextDark);
    }
    localStorage.setItem('techpilot-theme', nextDark ? 'dark' : 'light');
    localStorage.setItem('nexora-theme', nextDark ? 'dark' : 'light');
  };

  const handleTabChange = (tabId: AdminTab) => {
    setEditingBrand(null);
    setEditingCoupon(null);
    setEditingFlashSale(null);
    setEditingProduct(null);
    setEditingCategory(null);
    setIsNotificationOpen(false);
    navigate(tabId === 'dashboard' ? '/admin' : `/admin/${tabId}`);
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = useCallback(() => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }, []);

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

  // Universal Cache Sync: keeps Admin Portal & Storefront 100% synchronized with MySQL
  const syncAllCaches = useCallback(() => {
    const keys = [
      ['admin-data'],
      ['admin-brands'],
      ['admin-coupons'],
      ['admin-flash-sales'],
      ['admin-banners'],
      ['admin-posts'],
      ['admin-users'],
      ['admin-reviews'],
      ['products'],
      ['categories'],
      ['brands'],
      ['banners'],
      ['active-flash-sale'],
      ['posts'],
      ['reviews'],
    ];
    for (const queryKey of keys) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);

  // Core Data Query (gated by Admin/Staff auth so unauthorized calls never fall back to fake numbers)
  const { data: adminData, isLoading: isCoreLoading } = useQuery({
    queryKey: ['admin-data', currentUser?.id, currentUser?.role],
    enabled: isStaffOrAdmin,
    queryFn: async () => {
      const headers = getAuthHeaders();
      const [sumRes, ordersRes, prodsRes, catsRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/dashboard/summary`, { headers }),
        fetch(`${apiUrl}/admin/orders?limit=100`, { headers }),
        fetch(`${apiUrl}/admin/products?limit=1000`, { headers }),
        fetch(`${apiUrl}/admin/categories`, { headers }),
        fetch(`${apiUrl}/admin/inventory/logs?limit=50`, { headers }),
      ]);

      if (sumRes.status === 401 || sumRes.status === 403) {
        authService.logout();
        setCurrentUser(null);
        throw new Error('Phiên đăng nhập quản trị đã hết hạn.');
      }

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
    enabled: isStaffOrAdmin && (activeTab === 'brands' || activeTab === 'products'),
  });

  const { data: coupons = [] } = useQuery<AdminCouponItem[]>({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/coupons`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'coupons',
  });

  const { data: flashSales = [] } = useQuery<AdminFlashSaleItem[]>({
    queryKey: ['admin-flash-sales'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/flash-sales`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'flash-sales',
  });

  const { data: banners = [] } = useQuery<AdminBannerItem[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/banners`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'banners',
  });

  const { data: posts = [] } = useQuery<AdminPostItem[]>({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/posts`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'posts',
  });

  const { data: users = [] } = useQuery<AdminUserItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/users`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'users',
  });

  const { data: reviews = [] } = useQuery<AdminReviewItem[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/admin/reviews`, { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    },
    enabled: isStaffOrAdmin && activeTab === 'reviews',
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

  // Stock Adjustment Modal (TechPilot Parity: IMPORT/EXPORT + 7 Reasons)
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustType, setAdjustType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [adjustQuantity, setAdjustQuantity] = useState('1');
  const [adjustReasonType, setAdjustReasonType] = useState('Nhập hàng từ nhà cung cấp');
  const [adjustNote, setAdjustNote] = useState('');

  // Add Coupon Modal
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponType, setNewCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('500000');

  // Add Banner Modal
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('/assets/images/banners/banner-hero-1.webp');
  const [newBannerLink, setNewBannerLink] = useState('/search');
  const [newBannerPlacement, setNewBannerPlacement] = useState('hero');

  // Edit Product Modal States
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductSalePrice, setEditProductSalePrice] = useState('');
  const [editProductStock, setEditProductStock] = useState('0');
  const [editProductCategory, setEditProductCategory] = useState('1');
  const [editProductBrand, setEditProductBrand] = useState('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductStatus, setEditProductStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Edit Category Modal States
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategorySlug, setEditCategorySlug] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState('fa-solid fa-layer-group');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [editCategorySort, setEditCategorySort] = useState('0');

  // Edit Brand Modal States
  const [editingBrand, setEditingBrand] = useState<AdminBrandItem | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandSlug, setEditBrandSlug] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');

  // Edit Coupon Modal States
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponItem | null>(null);
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editCouponDiscount, setEditCouponDiscount] = useState('10');
  const [editCouponType, setEditCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [editCouponMinOrder, setEditCouponMinOrder] = useState('500000');
  const [editCouponMaxDiscount, setEditCouponMaxDiscount] = useState('200000');
  const [editCouponUsageLimit, setEditCouponUsageLimit] = useState('');
  const [editCouponUserLimit, setEditCouponUserLimit] = useState('1');
  const [editCouponStartsAt, setEditCouponStartsAt] = useState('');
  const [editCouponExpiresAt, setEditCouponExpiresAt] = useState('');
  const [editCouponDesc, setEditCouponDesc] = useState('');

  // Flash Sale Modal States
  const [isAddFlashSaleOpen, setIsAddFlashSaleOpen] = useState(false);
  const [newFsName, setNewFsName] = useState('Flash Sale Bùng Nổ Nexora');
  const [newFsStart, setNewFsStart] = useState(() => new Date().toISOString().slice(0, 16));
  const [newFsEnd, setNewFsEnd] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  );

  const [editingFlashSale, setEditingFlashSale] = useState<AdminFlashSaleItem | null>(null);
  const [editFsName, setEditFsName] = useState('');
  const [editFsStart, setEditFsStart] = useState('');
  const [editFsEnd, setEditFsEnd] = useState('');
  const [editFsIsActive, setEditFsIsActive] = useState(true);
  const [editFsProductIds, setEditFsProductIds] = useState<number[]>([]);
  const [editFsItemConfig, setEditFsItemConfig] = useState<
    Record<number, { flashSalePrice: number; quantityLimit: number; quantitySold: number }>
  >({});

  // Post Modal States
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Tin công nghệ');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostThumb, setNewPostThumb] = useState('/assets/images/posts/post-1.jpg');

  const [editingPost, setEditingPost] = useState<AdminPostItem | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('Tin công nghệ');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostThumb, setEditPostThumb] = useState('');

  // Edit Banner Modal States
  const [editingBanner, setEditingBanner] = useState<AdminBannerItem | null>(null);
  const [editBannerTitle, setEditBannerTitle] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editBannerLink, setEditBannerLink] = useState('');
  const [editBannerPlacement, setEditBannerPlacement] = useState('hero');
  const [editBannerSort, setEditBannerSort] = useState('1');

  // Filter States for Exact TechPilot Parity
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('');
  const [productLowStockOnly, setProductLowStockOnly] = useState(false);
  const [productZeroStockOnly, setProductZeroStockOnly] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [couponPage, setCouponPage] = useState(1);
  const [bannerPage, setBannerPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('');

  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [orderNextStatus, setOrderNextStatus] = useState<string>('PENDING');
  const [orderNextPaymentStatus, setOrderNextPaymentStatus] = useState<string>('PENDING');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Helper utilities
  const normalizeImgUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `/${url}`;
  };

  const getUserInitials = (fullName?: string | null): string => {
    if (!fullName) return 'AD';
    const cleaned = fullName.replace(/\([^)]*\)/g, '').trim();
    const parts = cleaned.split(/\s+/).filter((p) => /[A-Za-zÀ-ỹ]/.test(p));
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (!first) return 'AD';
    if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const getApiErrorMessage = async (res: Response, fallback: string): Promise<string> => {
    try {
      const json = await res.json();
      return json?.error?.message || json?.message || fallback;
    } catch {
      return fallback;
    }
  };

  // Admin Login Gate Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    try {
      const session = await authService.login({
        email: adminLoginEmail.trim(),
        password: adminLoginPassword,
      });
      if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        authService.logout();
        setCurrentUser(null);
        setAdminLoginError('Tài khoản này không có quyền Quản trị viên (ADMIN/STAFF).');
        return;
      }
      setCurrentUser(session.user);
      setAdminLoginPassword('');
      syncAllCaches();
      showToast(`Chào mừng ${session.user.fullName} quay trở lại!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Email hoặc mật khẩu quản trị không chính xác.';
      setAdminLoginError(msg);
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // Global Header Search Handler
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (activeTab === 'orders') {
      setOrderSearch(q);
      setOrderPage(1);
    } else if (activeTab === 'users') {
      setUserSearch(q);
      setUserPage(1);
    } else if (activeTab === 'categories') {
      setCategorySearch(q);
      setCategoryPage(1);
    } else if (activeTab === 'brands') {
      setBrandSearch(q);
      setBrandPage(1);
    } else if (activeTab === 'posts') {
      setPostSearch(q);
      setPostPage(1);
    } else if (activeTab === 'reviews') {
      setReviewSearch(q);
      setReviewPage(1);
    } else {
      setProductSearch(q);
      setProductPage(1);
      if (activeTab !== 'products') {
        handleTabChange('products');
      }
    }
  };

  // Order Detail Loader (fetches fresh items & thumbnails from MySQL)
  const handleOpenOrderDetail = async (order: OrderDto) => {
    setSelectedOrder(order);
    setOrderNextStatus(order.orderStatus);
    setOrderNextPaymentStatus(order.paymentStatus);
    setIsNotificationOpen(false);
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${order.id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSelectedOrder(json.data as OrderDto);
          setOrderNextStatus(json.data.orderStatus);
          setOrderNextPaymentStatus(json.data.paymentStatus);
        }
      }
    } catch {
      // Keep initial order snapshot if detail refresh fails
    }
  };

  // Status Handlers
  const handleUpdateOrderStatus = async (
    orderId: string | number,
    newStatus: string,
    newPaymentStatus?: string,
  ) => {
    setIsUpdatingOrder(true);
    try {
      const bodyPayload: Record<string, string> = { status: newStatus };
      if (newPaymentStatus) bodyPayload.paymentStatus = newPaymentStatus;
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedOrder = json.data as OrderDto | undefined;
        showToast('Đã cập nhật trạng thái đơn hàng thành công!');
        syncAllCaches();
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  orderStatus: (updatedOrder?.orderStatus || newStatus) as OrderDto['orderStatus'],
                  paymentStatus: (updatedOrder?.paymentStatus ||
                    newPaymentStatus ||
                    prev.paymentStatus) as OrderDto['paymentStatus'],
                }
              : null,
          );
          if (updatedOrder) {
            setOrderNextStatus(updatedOrder.orderStatus);
            setOrderNextPaymentStatus(updatedOrder.paymentStatus);
          }
        }
      } else {
        const msg = await getApiErrorMessage(res, 'Không thể cập nhật trạng thái đơn.');
        showToast(msg, 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleToggleProductStatus = async (id: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`${apiUrl}/admin/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(
          `Đã chuyển trạng thái sản phẩm sang ${nextStatus === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}!`,
        );
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật trạng thái sản phẩm.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenEditProduct = (p: ProductDto) => {
    setEditingProduct(p);
    setEditProductName(p.name);
    setEditProductPrice(String(p.price));
    setEditProductSalePrice(p.salePrice ? String(p.salePrice) : '');
    setEditProductStock(String(p.stockQuantity));
    setEditProductCategory(p.categoryId ? String(p.categoryId) : '1');
    setEditProductBrand(p.brandId ? String(p.brandId) : '');
    setEditProductDesc(p.shortDescription || '');
    setEditProductStatus(p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`${apiUrl}/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editProductName,
          price: editProductPrice,
          salePrice: editProductSalePrice ? editProductSalePrice : null,
          stockQuantity: parseInt(editProductStock, 10),
          categoryId: parseInt(editProductCategory, 10),
          brandId: editProductBrand ? parseInt(editProductBrand, 10) : null,
          shortDescription: editProductDesc,
          status: editProductStatus,
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật sản phẩm thành công!');
        setEditingProduct(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật sản phẩm.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenEditCategory = (c: AdminCategoryItem) => {
    setEditingCategory(c);
    setEditCategoryName(c.name);
    setEditCategorySlug(c.slug);
    setEditCategoryIcon(c.icon || 'fa-solid fa-layer-group');
    setEditCategoryDesc(c.description || '');
    setEditCategorySort(String(c.sortOrder || 0));
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch(`${apiUrl}/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editCategoryName,
          slug: editCategorySlug,
          icon: editCategoryIcon,
          description: editCategoryDesc,
          sortOrder: parseInt(editCategorySort, 10),
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật danh mục!');
        setEditingCategory(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật danh mục.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleToggleCategoryStatus = async (id: number, currentActive: boolean = true) => {
    try {
      const res = await fetch(`${apiUrl}/admin/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        showToast('Đã đổi trạng thái danh mục!');
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể đổi trạng thái danh mục.'), 'error');
      }
    } catch {
      showToast('Lỗi khi đổi trạng thái danh mục.', 'error');
    }
  };

  const handleOpenEditBrand = (b: AdminBrandItem) => {
    setEditingBrand(b);
    setEditBrandName(b.name);
    setEditBrandSlug(b.slug);
    setEditBrandLogo(b.logoUrl || '');
    setEditBrandDesc(b.description || '');
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    try {
      const res = await fetch(`${apiUrl}/admin/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editBrandName,
          slug: editBrandSlug,
          logoUrl: editBrandLogo || null,
          description: editBrandDesc,
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật thương hiệu!');
        setEditingBrand(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật thương hiệu.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleToggleBrandStatus = async (id: number, currentActive: boolean = true) => {
    try {
      const res = await fetch(`${apiUrl}/admin/brands/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        showToast('Đã đổi trạng thái thương hiệu!');
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể đổi trạng thái thương hiệu.'), 'error');
      }
    } catch {
      showToast('Lỗi khi đổi trạng thái thương hiệu.', 'error');
    }
  };

  const handleOpenEditCoupon = (c: AdminCouponItem) => {
    setEditingCoupon(c);
    setEditCouponCode(c.code);
    setEditCouponType(c.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE');
    setEditCouponDiscount(String(c.discountValue));
    setEditCouponMinOrder(String(c.minOrderValue));
    setEditCouponMaxDiscount(c.maxDiscount ? String(c.maxDiscount) : '');
    setEditCouponUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setEditCouponUserLimit('1');
    setEditCouponStartsAt(c.startsAt ? c.startsAt.slice(0, 16) : '');
    setEditCouponExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 16) : '');
    setEditCouponDesc(c.description || 'Mã ưu đãi chiết khấu trực tiếp cho đơn hàng công nghệ tại Nexora.');
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const res = await fetch(`${apiUrl}/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: editCouponCode,
          discountType: editCouponType,
          discountValue: Number(editCouponDiscount),
          minOrderValue: Number(editCouponMinOrder),
          maxDiscount: editCouponMaxDiscount ? Number(editCouponMaxDiscount) : null,
          usageLimit: editCouponUsageLimit ? Number(editCouponUsageLimit) : null,
          description: editCouponDesc,
          ...(editCouponStartsAt ? { startsAt: editCouponStartsAt } : {}),
          ...(editCouponExpiresAt ? { expiresAt: editCouponExpiresAt } : {}),
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật mã giảm giá!');
        setEditingCoupon(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật mã giảm giá.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleCreateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/admin/flash-sales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newFsName,
          startTime: newFsStart,
          endTime: newFsEnd,
          productIds: products.slice(0, 5).map((p) => p.id),
        }),
      });
      if (res.ok) {
        showToast('Đã tạo chiến dịch Flash Sale mới!');
        setIsAddFlashSaleOpen(false);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo Flash Sale.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenEditFlashSale = (fs: AdminFlashSaleItem) => {
    setEditingFlashSale(fs);
    setEditFsName(fs.name);
    setEditFsStart(fs.startTime ? fs.startTime.slice(0, 16) : '');
    setEditFsEnd(fs.endTime ? fs.endTime.slice(0, 16) : '');
    setEditFsIsActive(fs.isActive);
    const configMap: Record<
      number,
      { flashSalePrice: number; quantityLimit: number; quantitySold: number }
    > = {};
    if (fs.items && fs.items.length > 0) {
      setEditFsProductIds(fs.items.map((it) => it.productId));
      for (const it of fs.items) {
        configMap[it.productId] = {
          flashSalePrice: Number(it.flashSalePrice),
          quantityLimit: it.quantityLimit,
          quantitySold: it.quantitySold || 0,
        };
      }
    } else {
      setEditFsProductIds(products.slice(0, 4).map((p) => p.id));
    }
    setEditFsItemConfig(configMap);
  };

  const handleUpdateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashSale) return;
    try {
      const itemsPayload = editFsProductIds.map((pid) => {
        const cfg = editFsItemConfig[pid];
        const prod = products.find((p) => p.id === pid);
        return {
          productId: pid,
          flashSalePrice: cfg?.flashSalePrice ?? Math.round(Number(prod?.price || 0) * 0.85),
          quantityLimit: cfg?.quantityLimit ?? 10,
        };
      });
      const res = await fetch(`${apiUrl}/admin/flash-sales/${editingFlashSale.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editFsName,
          startTime: editFsStart,
          endTime: editFsEnd,
          isActive: editFsIsActive,
          items: itemsPayload,
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật chiến dịch Flash Sale & đồng bộ Storefront!');
        setEditingFlashSale(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật Flash Sale.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle) {
      showToast('Vui lòng nhập tiêu đề bài viết.', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newPostTitle,
          category: newPostCategory,
          content: newPostContent || newPostTitle,
          thumbnailUrl: newPostThumb,
          isPublished: true,
        }),
      });
      if (res.ok) {
        showToast('Đã đăng bài viết mới thành công!');
        setIsAddPostOpen(false);
        setNewPostTitle('');
        setNewPostContent('');
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo bài viết.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenEditPost = (post: AdminPostItem) => {
    setEditingPost(post);
    setEditPostTitle(post.title);
    setEditPostCategory(post.category);
    setEditPostContent(post.content);
    setEditPostThumb(post.thumbnailUrl || '');
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      const res = await fetch(`${apiUrl}/admin/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editPostTitle,
          category: editPostCategory,
          content: editPostContent,
          thumbnailUrl: editPostThumb,
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật bài viết!');
        setEditingPost(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật bài viết.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenEditBanner = (bn: AdminBannerItem) => {
    setEditingBanner(bn);
    setEditBannerTitle(bn.title);
    setEditBannerImage(bn.imageUrl);
    setEditBannerLink(bn.linkUrl || '');
    setEditBannerPlacement(bn.placement);
    setEditBannerSort(String(bn.sortOrder || 1));
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    try {
      const res = await fetch(`${apiUrl}/admin/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editBannerTitle,
          imageUrl: editBannerImage,
          linkUrl: editBannerLink,
          placement: editBannerPlacement,
          sortOrder: parseInt(editBannerSort, 10),
        }),
      });
      if (res.ok) {
        showToast('Đã cập nhật banner & đồng bộ Storefront!');
        setEditingBanner(null);
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể cập nhật banner.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể đổi trạng thái tài khoản.'), 'error');
      }
    } catch {
      showToast('Lỗi khi đổi trạng thái.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể thay đổi vai trò.'), 'error');
      }
    } catch {
      showToast('Lỗi khi phân quyền.', 'error');
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
        syncAllCaches();
      }
    } catch {
      showToast('Lỗi kết nối.', 'error');
    }
  };

  const handleToggleFlashSale = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/admin/flash-sales/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast('Đã chuyển đổi trạng thái Flash Sale!');
        syncAllCaches();
      }
    } catch {
      showToast('Lỗi kết nối.', 'error');
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
        syncAllCaches();
      }
    } catch {
      showToast('Lỗi kết nối.', 'error');
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
        syncAllCaches();
      }
    } catch {
      showToast('Lỗi kết nối.', 'error');
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
        syncAllCaches();
      }
    } catch {
      showToast('Lỗi khi gỡ đánh giá.', 'error');
    }
  };

  const handleAiGenerateDesc = async () => {
    if (!newProductName) {
      showToast('Vui lòng nhập tên sản phẩm trước khi tạo mô tả.', 'error');
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
      showToast('Lỗi khi tạo mô tả AI.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) {
      showToast('Vui lòng nhập đầy đủ tên và giá sản phẩm.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo sản phẩm.'), 'error');
      }
    } catch {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      showToast('Vui lòng nhập tên danh mục.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo danh mục.'), 'error');
      }
    } catch {
      showToast('Lỗi khi tạo danh mục.', 'error');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) {
      showToast('Vui lòng nhập tên thương hiệu.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo thương hiệu.'), 'error');
      }
    } catch {
      showToast('Lỗi khi tạo thương hiệu.', 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) {
      showToast('Vui lòng nhập mã giảm giá.', 'error');
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
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể tạo mã giảm giá.'), 'error');
      }
    } catch {
      showToast('Lỗi khi tạo mã giảm giá.', 'error');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerImage) {
      showToast('Vui lòng nhập tiêu đề và link ảnh.', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/admin/banners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newBannerTitle,
          imageUrl: newBannerImage,
          linkUrl: newBannerLink || '/search',
          placement: newBannerPlacement,
          sortOrder: banners.length + 1,
        }),
      });
      if (res.ok) {
        showToast('Thêm banner thành công!');
        setIsAddBannerOpen(false);
        setNewBannerTitle('');
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể thêm banner.'), 'error');
      }
    } catch {
      showToast('Lỗi khi thêm banner.', 'error');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      showToast('Vui lòng chọn sản phẩm.', 'error');
      return;
    }
    const qtyAbs = Math.abs(parseInt(adjustQuantity, 10) || 0);
    if (qtyAbs <= 0) {
      showToast('Số lượng thay đổi phải lớn hơn 0.', 'error');
      return;
    }
    const signedDelta = adjustType === 'EXPORT' ? -qtyAbs : qtyAbs;
    const composedReason = adjustNote.trim()
      ? `${adjustReasonType}: ${adjustNote.trim()}`
      : adjustReasonType;

    try {
      const res = await fetch(`${apiUrl}/admin/inventory/adjust`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: Number(adjustProductId),
          quantity: signedDelta,
          reason: composedReason,
        }),
      });
      if (res.ok) {
        showToast(
          adjustType === 'IMPORT'
            ? `Đã nhập thêm +${qtyAbs} sản phẩm vào kho!`
            : `Đã xuất -${qtyAbs} sản phẩm khỏi kho!`,
        );
        setIsAdjustStockOpen(false);
        setAdjustNote('');
        syncAllCaches();
      } else {
        showToast(await getApiErrorMessage(res, 'Không thể điều chỉnh tồn kho.'), 'error');
      }
    } catch {
      showToast('Lỗi khi điều chỉnh tồn kho.', 'error');
    }
  };

  const navMenuItems: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'fa-chart-pie' },
    { id: 'products', label: 'Sản phẩm', icon: 'fa-box' },
    { id: 'orders', label: 'Đơn hàng', icon: 'fa-cart-shopping' },
    { id: 'users', label: 'Khách hàng', icon: 'fa-users' },
    { id: 'categories', label: 'Danh mục', icon: 'fa-folder' },
    { id: 'brands', label: 'Thương hiệu', icon: 'fa-tag' },
    { id: 'coupons', label: 'Mã giảm giá', icon: 'fa-ticket' },
    { id: 'flash-sales', label: 'Flash Sale', icon: 'fa-bolt' },
    { id: 'posts', label: 'Bài viết', icon: 'fa-newspaper' },
    { id: 'reviews', label: 'Đánh giá', icon: 'fa-star' },
    { id: 'banners', label: 'Banner', icon: 'fa-image' },
  ];

  // Filtered lists for Admin Views
  const filteredProducts = products.filter((p) => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCategoryFilter && p.category?.name !== productCategoryFilter) return false;
    if (productBrandFilter && p.brand?.name !== productBrandFilter) return false;
    if (productStatusFilter && p.status !== productStatusFilter) return false;
    if (productLowStockOnly && (p.stockQuantity >= 10 || p.stockQuantity <= 0)) return false;
    if (productZeroStockOnly && p.stockQuantity > 0) return false;
    return true;
  });
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / 10));
  const paginatedProducts = filteredProducts.slice((productPage - 1) * 10, productPage * 10);

  const filteredOrders = orders.filter((o) => {
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      if (
        !o.orderCode.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q) &&
        !(o.customerPhone || '').includes(q)
      ) {
        return false;
      }
    }
    if (orderStatusFilter && o.orderStatus !== orderStatusFilter) return false;
    return true;
  });
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / 10));
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * 10, orderPage * 10);

  const filteredUsers = users.filter((u) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (
        !u.fullName.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.phone || '').includes(q)
      ) {
        return false;
      }
    }
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    return true;
  });
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / 10));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * 10, userPage * 10);

  const filteredCategories = categories.filter((c) => {
    if (categorySearch && !c.name.toLowerCase().includes(categorySearch.toLowerCase())) return false;
    return true;
  });
  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / 10));
  const paginatedCategories = filteredCategories.slice((categoryPage - 1) * 10, categoryPage * 10);

  const filteredBrands = brands.filter((b) => {
    if (brandSearch && !b.name.toLowerCase().includes(brandSearch.toLowerCase())) return false;
    return true;
  });
  const totalBrandPages = Math.max(1, Math.ceil(filteredBrands.length / 10));
  const paginatedBrands = filteredBrands.slice((brandPage - 1) * 10, brandPage * 10);

  const filteredPosts = posts.filter((post) => {
    if (postSearch && !post.title.toLowerCase().includes(postSearch.toLowerCase())) return false;
    if (postCategoryFilter && post.category !== postCategoryFilter) return false;
    if (postStatusFilter === '1' && !post.isPublished) return false;
    if (postStatusFilter === '0' && post.isPublished) return false;
    return true;
  });
  const totalPostPages = Math.max(1, Math.ceil(filteredPosts.length / 10));
  const paginatedPosts = filteredPosts.slice((postPage - 1) * 10, postPage * 10);

  const filteredReviews = reviews.filter((rev) => {
    if (reviewSearch) {
      const q = reviewSearch.toLowerCase();
      const matchUser = (rev.user?.fullName || '').toLowerCase().includes(q);
      const matchProd = (rev.product?.name || '').toLowerCase().includes(q);
      const matchComment = (rev.comment || '').toLowerCase().includes(q);
      if (!matchUser && !matchProd && !matchComment) return false;
    }
    if (reviewRatingFilter && String(rev.rating) !== reviewRatingFilter) return false;
    return true;
  });
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / 10));
  const paginatedReviews = filteredReviews.slice((reviewPage - 1) * 10, reviewPage * 10);

  const totalInventoryPages = Math.max(1, Math.ceil(inventoryLogs.length / 10));
  const paginatedInventory = inventoryLogs.slice((inventoryPage - 1) * 10, inventoryPage * 10);

  const totalCouponPages = Math.max(1, Math.ceil(coupons.length / 10));
  const paginatedCoupons = coupons.slice((couponPage - 1) * 10, couponPage * 10);

  const totalBannerPages = Math.max(1, Math.ceil(banners.length / 10));
  const paginatedBanners = banners.slice((bannerPage - 1) * 10, bannerPage * 10);

  const pendingOrdersList = orders.filter((o) => o.orderStatus === 'PENDING').slice(0, 6);
  const selectedAdjustProduct = products.find((p) => String(p.id) === String(adjustProductId)) || null;
  const adjustQtyAbs = Math.abs(parseInt(adjustQuantity, 10) || 0);
  const projectedStock = selectedAdjustProduct
    ? selectedAdjustProduct.stockQuantity + (adjustType === 'EXPORT' ? -adjustQtyAbs : adjustQtyAbs)
    : 0;

  // Compute real chart geometry for Dashboard Tab 1
  const revenueDays =
    summary?.revenueLast7Days && summary.revenueLast7Days.length > 0
      ? summary.revenueLast7Days
      : Array.from({ length: 7 }, (_, idx) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - idx));
          return {
            date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            isoDate: d.toISOString().slice(0, 10),
            revenue: 0,
            orders: 0,
          };
        });
  const maxDayRevenue = Math.max(1, ...revenueDays.map((d) => d.revenue));
  const maxDayOrders = Math.max(1, ...revenueDays.map((d) => d.orders));

  const breakdown = summary?.orderStatusBreakdown || {
    pending: orders.filter((o) => o.orderStatus === 'PENDING').length,
    shipping: orders.filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(o.orderStatus)).length,
    completed: orders.filter((o) => o.orderStatus === 'DELIVERED').length,
    cancelled: orders.filter((o) => ['CANCELLED', 'RETURNED'].includes(o.orderStatus)).length,
    total: orders.length,
  };
  const donutTotal = breakdown.total;
  const donutCirc = 2 * Math.PI * 36;
  const donutPct = (n: number) => (donutTotal > 0 ? Math.round((n / donutTotal) * 1000) / 10 : 0);
  const segPending = donutTotal > 0 ? (breakdown.pending / donutTotal) * donutCirc : 0;
  const segShipping = donutTotal > 0 ? (breakdown.shipping / donutTotal) * donutCirc : 0;
  const segCompleted = donutTotal > 0 ? (breakdown.completed / donutTotal) * donutCirc : 0;
  const segCancelled = donutTotal > 0 ? (breakdown.cancelled / donutTotal) * donutCirc : 0;

  // AUTH GATE: Require authenticated ADMIN or STAFF account before exposing Admin Portal
  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] dark:bg-[#0B0F19] flex items-center justify-center p-4 font-sans text-[#1F2937] dark:text-[#F9FAFB] admin-page-wrapper">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-2xl overflow-hidden admin-card-surface">
          <div className="bg-[#091830] px-8 py-7 text-center relative">
            <button
              type="button"
              onClick={toggleTheme}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title={isDarkMode ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-slate-200'} text-xs`}></i>
            </button>
            <Link to="/" className="inline-flex items-center justify-center gap-3 mb-2">
              <img
                src="/assets/images/nexora-icon-128.png"
                alt="Nexora"
                className="w-11 h-11 object-contain drop-shadow-[0_2px_10px_rgba(10,91,255,0.45)]"
              />
              <span className="text-2xl font-black tracking-tight text-white">
                Nex<span className="text-[#38BDF8]">ora</span>
              </span>
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Hệ Thống Quản Trị Cửa Hàng
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-8 space-y-5">
            {currentUser && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium leading-relaxed">
                <i className="fa-solid fa-shield-exclamation mr-1.5"></i>
                Tài khoản hiện tại (<strong>{currentUser.email}</strong> — vai trò{' '}
                <strong>{currentUser.role}</strong>) không có quyền truy cập trang Quản trị. Vui
                lòng đăng nhập bằng tài khoản Quản trị viên hoặc Nhân viên.
              </div>
            )}

            {adminLoginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <i className="fa-solid fa-circle-xmark mr-1.5"></i>
                {adminLoginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                Email quản trị
              </label>
              <input
                type="email"
                required
                autoFocus
                value={adminLoginEmail}
                onChange={(e) => setAdminLoginEmail(e.target.value)}
                placeholder="admin@nexora.local"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-medium focus:outline-none focus:border-[#0A5BFF] admin-input-control"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={adminLoginPassword}
                onChange={(e) => setAdminLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm font-medium focus:outline-none focus:border-[#0A5BFF] admin-input-control"
              />
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3 bg-[#0A5BFF] hover:bg-[#084AD1] disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
            >
              <i className={`fa-solid ${isAdminLoggingIn ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'}`}></i>
              <span>{isAdminLoggingIn ? 'Đang xác thực...' : 'Đăng nhập Quản trị'}</span>
            </button>

            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between text-xs">
              <Link
                to="/"
                className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A5BFF] font-semibold inline-flex items-center gap-1.5"
              >
                <i className="fa-solid fa-arrow-left text-[11px]"></i>
                <span>Quay lại Website</span>
              </Link>
              <span className="text-[#9CA3AF] dark:text-[#64748B] font-mono text-[11px]">
                Nexora Admin v2
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] dark:bg-[#0B0F19] flex font-sans text-[#1F2937] dark:text-[#F9FAFB] admin-page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm text-white ${
            toastType === 'error' ? 'bg-[#EF4444]' : 'bg-[#0A5BFF]'
          }`}
        >
          <i
            className={`fa-solid ${
              toastType === 'error'
                ? 'fa-circle-exclamation text-amber-200'
                : 'fa-circle-check text-cyan-300'
            } text-lg`}
          ></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation — Official Nexora Brand + TechPilot Exact Structure */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-[76px]' : 'w-[250px]'
        } bg-[#091830] text-white flex flex-col justify-between shrink-0 shadow-2xl z-30 min-h-screen sticky top-0 h-screen transition-all duration-200 border-r border-white/[0.06] admin-sidebar`}
      >
        <div className="pt-5 px-3.5 overflow-y-auto flex-1">
          {/* Official Nexora Brand Logo */}
          <Link
            to="/admin"
            onClick={() => handleTabChange('dashboard')}
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-2'
            } mb-7 group`}
          >
            <img
              src="/assets/images/nexora-icon-128.png"
              alt="Nexora"
              className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(10,91,255,0.45)] group-hover:scale-105 transition-transform"
            />
            {!sidebarCollapsed && (
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-[20px] font-black tracking-tight text-white leading-none">
                  Nex<span className="text-[#38BDF8]">ora</span>
                </span>
              </div>
            )}
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3.5 px-4 py-2.5'
                } rounded-xl text-[13px] transition-all ${
                  activeTab === item.id
                    ? 'bg-[#0A5BFF] text-white font-bold shadow-[0_6px_18px_rgba(10,91,255,0.35)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06] font-medium'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center text-[14px] shrink-0`}></i>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 mt-auto border-t border-white/[0.06]">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center' : 'justify-between px-1.5'
            } mb-3 text-slate-400`}
          >
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
              title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              <i
                className={`fa-solid ${
                  sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'
                } text-xs`}
              ></i>
            </button>
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Thông tin cửa hàng"
              >
                <i className="fa-solid fa-gear mr-1"></i>Cài đặt
              </button>
            )}
          </div>

          <button
            onClick={() => {
              authService.logout();
              setCurrentUser(null);
              navigate('/admin');
            }}
            title={sidebarCollapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center justify-center gap-2 py-2.5 ${
              sidebarCollapsed ? 'px-0' : 'px-4'
            } text-[13px] font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-xl transition-all shadow-md`}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F19]">
        {/* Full-Width Sticky 70px Top Header — Exact TechPilot Parity */}
        <header className="sticky top-0 z-20 h-[70px] shrink-0 bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B] px-6 lg:px-8 flex items-center justify-between gap-4 admin-header-bar">
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-[#1F2937] dark:text-[#F9FAFB] truncate admin-text-title">
              Xin chào, {currentUser?.fullName || 'Quản trị viên'}
            </h1>
          </div>

          {/* Center Global Search Pill */}
          <form onSubmit={handleGlobalSearchSubmit} className="relative w-72 lg:w-80 hidden md:block">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#64748B] text-xs pointer-events-none"></i>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 bg-[#F3F4F6] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-full text-xs text-[#1F2937] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0A5BFF] transition-colors admin-input-control"
            />
          </form>

          <div className="flex items-center gap-3">
            {/* Quick Website View */}
            <Link
              to="/"
              target="_blank"
              className="px-4 py-2 bg-white dark:bg-transparent border border-[#0A5BFF] text-[#0A5BFF] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              title="Mở website khách hàng"
            >
              <i className="fa-solid fa-globe text-xs"></i>
              <span className="hidden sm:inline">Xem Website</span>
            </Link>

            {/* Dark/Light Mode Circle Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#4B5563] dark:text-[#CBD5E1] hover:border-[#0A5BFF] transition-colors"
              title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              <i
                className={`fa-solid ${
                  isDarkMode ? 'fa-sun text-amber-400 text-sm' : 'fa-moon text-[#4B5563] text-xs'
                }`}
              ></i>
            </button>

            {/* Notification Bell with Real Pending Orders Badge & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#4B5563] dark:text-[#CBD5E1] hover:border-[#0A5BFF] transition-colors"
                title="Thông báo đơn hàng chờ xử lý"
              >
                <i className="fa-solid fa-bell text-xs"></i>
              </button>
              {(summary?.pendingOrdersCount ?? pendingOrdersList.length) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                  {summary?.pendingOrdersCount ?? pendingOrdersList.length}
                </span>
              )}

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden admin-modal-surface">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                      Đơn hàng chờ xác nhận ({summary?.pendingOrdersCount ?? pendingOrdersList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setOrderStatusFilter('PENDING');
                        handleTabChange('orders');
                      }}
                      className="text-[11px] font-bold text-[#0A5BFF] hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
                    {pendingOrdersList.length === 0 ? (
                      <div className="p-5 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
                        Không có đơn hàng nào đang chờ xử lý.
                      </div>
                    ) : (
                      pendingOrdersList.map((po) => (
                        <button
                          key={po.id}
                          type="button"
                          onClick={() => handleOpenOrderDetail(po)}
                          className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0A5BFF] font-mono truncate">
                              {po.orderCode}
                            </div>
                            <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] truncate">
                              {po.customerName}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                              {Number(po.totalAmount).toLocaleString('vi-VN')}đ
                            </div>
                            <div className="text-[10px] text-[#9CA3AF]">
                              {new Date(po.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Real User Initials Avatar */}
            <div
              className="w-9 h-9 rounded-full bg-[#0A5BFF] text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0"
              title={`${currentUser?.fullName} (${currentUser?.role})`}
            >
              {getUserInitials(currentUser?.fullName)}
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="p-6 lg:p-[30px] flex-1">
        {/* TAB 1: DASHBOARD SUMMARY — 100% REAL MYSQL DATA */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 5 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Card 1: Doanh thu */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between admin-stat-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                    Doanh thu <i className="fa-solid fa-circle-info text-[11px] opacity-60" title="Tổng doanh thu từ đơn đã thanh toán hoặc hoàn thành"></i>
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-[#0A5BFF] dark:text-[#60A5FA] flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-chart-line"></i>
                  </div>
                </div>
                <div className="text-[22px] font-black text-[#1F2937] dark:text-[#F9FAFB] my-2.5 tracking-tight">
                  {isCoreLoading && !summary
                    ? '...'
                    : `${Number(summary?.totalRevenue ?? 0).toLocaleString('vi-VN')}đ`}
                </div>
                <div className="text-xs font-semibold text-[#10B981] flex items-center gap-1">
                  <i className="fa-solid fa-check text-[10px]"></i> Đã hoàn thành
                </div>
              </div>

              {/* Card 2: Tổng mẫu sản phẩm */}
              <div
                onClick={() => {
                  setProductLowStockOnly(false);
                  setProductZeroStockOnly(false);
                  handleTabChange('products');
                }}
                className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between cursor-pointer hover:border-[#0A5BFF]/50 transition-all admin-stat-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                    Tổng mẫu sản phẩm <i className="fa-solid fa-circle-info text-[11px] opacity-60"></i>
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-boxes-stacked"></i>
                  </div>
                </div>
                <div className="text-[22px] font-black text-[#1F2937] dark:text-[#F9FAFB] my-2.5 tracking-tight">
                  {(summary?.productsCount ?? products.length).toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  Đang bán:{' '}
                  <span className="text-[#0A5BFF] dark:text-[#60A5FA] font-bold">
                    {(
                      summary?.activeProductsCount ??
                      products.filter((p) => p.status === 'ACTIVE').length
                    ).toLocaleString('vi-VN')}{' '}
                    mẫu
                  </span>
                </div>
              </div>

              {/* Card 3: Tổng đơn vị tồn kho */}
              <div
                onClick={() => handleTabChange('inventory')}
                className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between cursor-pointer hover:border-[#0A5BFF]/50 transition-all admin-stat-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                    Tổng đơn vị tồn kho <i className="fa-solid fa-circle-info text-[11px] opacity-60"></i>
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-[#10B981] flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-warehouse"></i>
                  </div>
                </div>
                <div className="text-[22px] font-black text-[#0A5BFF] dark:text-[#60A5FA] my-2.5 tracking-tight">
                  {(summary?.totalUnitsInStock ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                  Đã bán:{' '}
                  <span className="text-[#10B981] font-bold">
                    {(summary?.totalUnitsSold ?? 0).toLocaleString('vi-VN')}
                  </span>{' '}
                  đơn vị
                </div>
              </div>

              {/* Card 4: Sắp hết hàng */}
              <div
                onClick={() => {
                  setProductLowStockOnly(true);
                  setProductZeroStockOnly(false);
                  handleTabChange('products');
                }}
                className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between cursor-pointer hover:border-amber-400/60 transition-all admin-stat-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                    Sắp hết hàng <i className="fa-solid fa-circle-info text-[11px] opacity-60"></i>
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-[#F59E0B] flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                </div>
                <div className="text-[22px] font-black text-[#F59E0B] my-2.5 tracking-tight">
                  {(summary?.lowStockCount ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-[#D97706] dark:text-amber-400 font-medium">
                  Tồn từ 1 - 9 sản phẩm
                </div>
              </div>

              {/* Card 5: Hết hàng */}
              <div
                onClick={() => {
                  setProductZeroStockOnly(true);
                  setProductLowStockOnly(false);
                  handleTabChange('products');
                }}
                className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between cursor-pointer hover:border-rose-400/60 transition-all admin-stat-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-[#6B7280] dark:text-[#94A3B8] flex items-center gap-1.5">
                    Hết hàng <i className="fa-solid fa-circle-info text-[11px] opacity-60"></i>
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-[#EF4444] flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-ban"></i>
                  </div>
                </div>
                <div className="text-[22px] font-black text-[#EF4444] my-2.5 tracking-tight">
                  {(summary?.outOfStockCount ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="text-xs text-[#EF4444] font-semibold">
                  Cần nhập thêm hàng
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Real 7-Day Revenue & Orders Combo Chart */}
              <div className="lg:col-span-3 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between admin-card-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-chart-simple text-purple-600 dark:text-purple-400 text-sm"></i>
                    <h3 className="font-bold text-sm md:text-[15px] text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                      Doanh thu 7 ngày gần nhất (Realtime)
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]"></span>
                      <span>Doanh thu (VND)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span>
                      <span>Số đơn hàng</span>
                    </span>
                  </div>
                </div>

                {/* Proportional SVG + Bar Combo Chart */}
                <div className="relative h-64 pt-6 pb-8">
                  {/* Horizontal Grid Lines */}
                  <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-dashed border-[#E5E7EB] dark:border-[#1E293B]"></div>
                    <div className="border-b border-dashed border-[#E5E7EB] dark:border-[#1E293B]"></div>
                    <div className="border-b border-dashed border-[#E5E7EB] dark:border-[#1E293B]"></div>
                    <div className="border-b border-[#E5E7EB] dark:border-[#1E293B]"></div>
                  </div>

                  {/* Cyan Orders Trend Polyline */}
                  <svg
                    className="absolute inset-x-0 top-6 bottom-10 w-full h-[calc(100%-64px)] pointer-events-none z-20 overflow-visible"
                    viewBox="0 0 700 160"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={revenueDays
                        .map((d, i) => {
                          const x = 50 + i * 100;
                          const y = 130 - Math.round((d.orders / maxDayOrders) * 95);
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {revenueDays.map((d, i) => {
                      const x = 50 + i * 100;
                      const y = 130 - Math.round((d.orders / maxDayOrders) * 95);
                      return (
                        <circle
                          key={d.isoDate}
                          cx={x}
                          cy={y}
                          r="4.5"
                          fill="#06B6D4"
                          stroke={isDarkMode ? '#111827' : '#FFFFFF'}
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>

                  {/* 7 Proportional Purple Revenue Bars + Interactive Tooltips */}
                  <div className="h-full grid grid-cols-7 items-end relative z-30">
                    {revenueDays.map((col) => {
                      const barHeightPx =
                        col.revenue > 0
                          ? Math.max(24, Math.round((col.revenue / maxDayRevenue) * 145))
                          : 14;
                      return (
                        <div
                          key={col.isoDate}
                          className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 bg-[#0F172A] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-40 border border-slate-700">
                            <div className="text-slate-300 text-[10px]">{col.date}</div>
                            <div>Doanh thu: {col.revenue.toLocaleString('vi-VN')}đ</div>
                            <div className="text-cyan-300">Đơn hàng: {col.orders}</div>
                          </div>

                          <div
                            style={{ height: `${barHeightPx}px` }}
                            className={`w-6 rounded-t-md transition-all duration-300 shadow-sm ${
                              col.revenue > 0
                                ? 'bg-[#7C3AED] group-hover:bg-[#6D28D9]'
                                : 'bg-[#7C3AED]/70 group-hover:bg-[#7C3AED]'
                            }`}
                          ></div>

                          <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mt-2.5">
                            {col.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real Order Status Donut Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between admin-card-surface">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-[#0A5BFF] text-sm"></i>
                    <h3 className="font-bold text-sm md:text-[15px] text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                      Trạng thái đơn hàng
                    </h3>
                  </div>
                </div>

                {/* Dynamic Donut SVG */}
                <div className="flex items-center justify-center my-3 relative">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke={isDarkMode ? '#1E293B' : '#F1F5F9'}
                      strokeWidth="14"
                    />
                    {segPending > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="#0A5BFF"
                        strokeWidth="14"
                        strokeDasharray={`${segPending} ${donutCirc}`}
                        strokeDashoffset="0"
                      />
                    )}
                    {segShipping > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="#06B6D4"
                        strokeWidth="14"
                        strokeDasharray={`${segShipping} ${donutCirc}`}
                        strokeDashoffset={`${-segPending}`}
                      />
                    )}
                    {segCompleted > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="14"
                        strokeDasharray={`${segCompleted} ${donutCirc}`}
                        strokeDashoffset={`${-(segPending + segShipping)}`}
                      />
                    )}
                    {segCancelled > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="transparent"
                        stroke="#EF4444"
                        strokeWidth="14"
                        strokeDasharray={`${segCancelled} ${donutCirc}`}
                        strokeDashoffset={`${-(segPending + segShipping + segCompleted)}`}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">
                      TỔNG ĐƠN
                    </span>
                    <span className="text-2xl font-black text-[#1F2937] dark:text-[#F9FAFB] leading-none mt-1">
                      {donutTotal}
                    </span>
                  </div>
                </div>

                {/* Real Legend Items */}
                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#4B5563] dark:text-[#CBD5E1]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A5BFF]"></span>
                      <span>Chờ xác nhận ({breakdown.pending})</span>
                    </span>
                    <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                      {donutPct(breakdown.pending)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#4B5563] dark:text-[#CBD5E1]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span>
                      <span>Đang giao ({breakdown.shipping})</span>
                    </span>
                    <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                      {donutPct(breakdown.shipping)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#4B5563] dark:text-[#CBD5E1]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      <span>Hoàn thành ({breakdown.completed})</span>
                    </span>
                    <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                      {donutPct(breakdown.completed)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#4B5563] dark:text-[#CBD5E1]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
                      <span>Đã hủy ({breakdown.cancelled})</span>
                    </span>
                    <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                      {donutPct(breakdown.cancelled)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Section: Real Recent Orders & Real Low Stock Alert */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Recent Orders Table (Col span 3) */}
              <div className="lg:col-span-3 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-[#0A5BFF] text-sm"></i>
                    <h3 className="font-bold text-sm md:text-[15px] text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                      Đơn hàng mới
                    </h3>
                  </div>
                  <button
                    onClick={() => handleTabChange('orders')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] text-[#4B5563] dark:text-[#CBD5E1] hover:text-[#0A5BFF] transition-colors font-semibold admin-btn-outline"
                  >
                    Xem tất cả
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
                        <th className="py-2.5 px-3">Mã đơn</th>
                        <th className="py-2.5 px-3">Khách hàng</th>
                        <th className="py-2.5 px-3">Tổng tiền</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                      {!summary?.recentOrders || summary.recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-[#6B7280] dark:text-[#94A3B8]"
                          >
                            Chưa có đơn hàng nào trong hệ thống.
                          </td>
                        </tr>
                      ) : (
                        summary.recentOrders.slice(0, 6).map((o) => (
                          <tr
                            key={o.id}
                            onClick={() => handleOpenOrderDetail(o)}
                            className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors cursor-pointer admin-table-row"
                          >
                            <td className="py-3 px-3 font-semibold text-[#0A5BFF] dark:text-[#60A5FA] font-mono">
                              <span className="hover:underline">{o.orderCode}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                              {o.customerName}
                            </td>
                            <td className="py-3 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                              {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                  o.orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                    : o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED'
                                      ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                      : o.orderStatus === 'SHIPPING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING'
                                        ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30'
                                        : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                }`}
                              >
                                {o.orderStatus === 'DELIVERED'
                                  ? 'Hoàn thành'
                                  : o.orderStatus === 'CANCELLED'
                                    ? 'Đã hủy'
                                    : o.orderStatus === 'SHIPPING'
                                      ? 'Đang giao'
                                      : o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING'
                                        ? 'Đang xử lý'
                                        : 'Chờ xác nhận'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-[#6B7280] dark:text-[#94A3B8] text-[11px]">
                              <div>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div>
                                {new Date(o.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alert List (Col span 2) */}
              <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between admin-card-surface">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-[#F59E0B] text-sm"></i>
                      <h3 className="font-bold text-sm md:text-[15px] text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                        Sản phẩm sắp hết hàng
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setProductLowStockOnly(true);
                        setProductZeroStockOnly(false);
                        handleTabChange('products');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#334155] text-[#4B5563] dark:text-[#CBD5E1] hover:text-[#0A5BFF] transition-colors font-semibold admin-btn-outline"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
                    {!summary?.lowStockProducts || summary.lowStockProducts.length === 0 ? (
                      <div className="py-10 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <i className="fa-solid fa-circle-check text-lg block mb-2"></i>
                        Tất cả sản phẩm đều đang có tồn kho an toàn!
                      </div>
                    ) : (
                      summary.lowStockProducts.slice(0, 6).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setAdjustProductId(String(p.id));
                            setAdjustType('IMPORT');
                            setAdjustQuantity('10');
                            setIsAdjustStockOpen(true);
                          }}
                          className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/50 px-2 -mx-2 rounded-xl transition-colors"
                          title="Bấm để nhập thêm tồn kho nhanh"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={normalizeImgUrl(p.thumbnailUrl) || '/assets/images/placeholder.jpg'}
                              alt={p.name}
                              className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-[#E5E7EB] dark:border-[#334155] shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/images/nexora-icon-128.png';
                              }}
                            />
                            <div className="min-w-0">
                              <div
                                className="text-xs font-bold text-[#1F2937] dark:text-[#F9FAFB] truncate hover:text-[#0A5BFF]"
                                title={p.name}
                              >
                                {p.name}
                              </div>
                              <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                                Giá: {Number(p.price).toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-500/15 text-[#EF4444] dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shrink-0">
                            Còn {p.stockQuantity}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                Quản lý đơn đặt hàng
              </h3>
              <span className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">
                Tổng: {filteredOrders.length} đơn hàng
              </span>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] mb-6 flex flex-wrap items-center gap-3 text-xs admin-filter-surface">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên, điện thoại..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                />
              </div>

              <div className="min-w-[180px]">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setOrderPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý (Pending)</option>
                  <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                  <option value="PROCESSING">Đang đóng gói (Processing)</option>
                  <option value="SHIPPING">Đang vận chuyển (Shipping)</option>
                  <option value="DELIVERED">Hoàn tất (Delivered)</option>
                  <option value="CANCELLED">Đã hủy (Cancelled)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderSearch('');
                  setOrderStatusFilter('');
                  setOrderPage(1);
                }}
                className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-200 font-bold rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 transition-colors admin-btn-outline"
              >
                <i className="fa-solid fa-rotate-left text-gray-500"></i>
                <span>Đặt lại</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
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
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#6B7280] dark:text-[#94A3B8]">
                        Không tìm thấy đơn hàng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                      >
                        <td className="py-3.5 px-3 font-bold text-[#0A5BFF] dark:text-[#60A5FA] font-mono">
                          {o.orderCode}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                          {o.customerName}
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] admin-text-muted">
                          {o.customerPhone}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                          {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#374151] dark:text-[#CBD5E1]">
                          {o.paymentMethod || 'COD'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                              o.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED'
                                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                  : o.orderStatus === 'SHIPPING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING'
                                    ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30'
                                    : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {o.orderStatus.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : o.paymentStatus === 'FAILED'
                                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {o.paymentStatus.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString('vi-VN')}{' '}
                          {new Date(o.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenOrderDetail(o)}
                            className="px-3 py-1.5 text-gray-700 dark:text-slate-200 hover:text-[#0A5BFF] rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-[#E5E7EB] dark:border-[#334155] admin-btn-outline"
                          >
                            <i className="fa-regular fa-eye"></i>
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Orders */}
            <AdminPagination
              currentPage={orderPage}
              totalPages={totalOrderPages}
              onPageChange={setOrderPage}
            />
          </div>
        )}

        {/* TAB 3: PRODUCTS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'products' && (
          editingProduct ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="font-extrabold text-xl text-gray-900 admin-text-title">Chỉnh sửa sản phẩm</h3>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Giá niêm yết (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Giá khuyến mãi (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={editProductSalePrice}
                      onChange={(e) => setEditProductSalePrice(e.target.value)}
                      placeholder="Để trống nếu không giảm giá"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Tồn kho (đơn vị)
                    </label>
                    <input
                      type="number"
                      required
                      value={editProductStock}
                      onChange={(e) => setEditProductStock(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Danh mục
                    </label>
                    <select
                      value={editProductCategory}
                      onChange={(e) => setEditProductCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Thương hiệu
                    </label>
                    <select
                      value={editProductBrand}
                      onChange={(e) => setEditProductBrand(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Trạng thái kinh doanh
                  </label>
                  <select
                    value={editProductStatus}
                    onChange={(e) => setEditProductStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  >
                    <option value="ACTIVE">Đang bán (ACTIVE)</option>
                    <option value="INACTIVE">Ngừng bán (INACTIVE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    rows={4}
                    value={editProductDesc}
                    onChange={(e) => setEditProductDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    placeholder="Mô tả thông số chi tiết sản phẩm..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Cập nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Quay lại</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
              {/* Top Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                  Danh sách sản phẩm
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Hiển thị {filteredProducts.length} / {products.length} sản phẩm trong kho Nexora
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTabChange('inventory')}
                  className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-50 text-gray-700 dark:text-slate-200 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 admin-btn-outline"
                >
                  <i className="fa-regular fa-clock text-[#0A5BFF]"></i>
                  <span>Lịch sử Nhập/Xuất kho</span>
                </button>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm sản phẩm mới</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] mb-6 flex flex-wrap items-center gap-3 text-xs admin-filter-surface">
              <div className="flex flex-col gap-1 min-w-[160px] flex-1">
                <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold text-[11px]">Tìm theo tên</span>
                <input
                  type="text"
                  placeholder="Từ khoá..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                />
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold text-[11px]">Danh mục</span>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold text-[11px]">Thương hiệu</span>
                <select
                  value={productBrandFilter}
                  onChange={(e) => { setProductBrandFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[130px]">
                <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold text-[11px]">Trạng thái</span>
                <select
                  value={productStatusFilter}
                  onChange={(e) => { setProductStatusFilter(e.target.value); setProductPage(1); }}
                  className="px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="INACTIVE">Ngừng bán</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="low_stock_filter"
                  checked={productLowStockOnly}
                  onChange={(e) => {
                    setProductLowStockOnly(e.target.checked);
                    if (e.target.checked) setProductZeroStockOnly(false);
                    setProductPage(1);
                  }}
                  className="w-4 h-4 rounded text-[#0A5BFF] focus:ring-[#0A5BFF] border-gray-300"
                />
                <label htmlFor="low_stock_filter" className="text-[#374151] dark:text-[#CBD5E1] font-medium cursor-pointer">
                  Tồn kho thấp (&lt;10)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="zero_stock_filter"
                  checked={productZeroStockOnly}
                  onChange={(e) => {
                    setProductZeroStockOnly(e.target.checked);
                    if (e.target.checked) setProductLowStockOnly(false);
                    setProductPage(1);
                  }}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                />
                <label htmlFor="zero_stock_filter" className="text-[#374151] dark:text-[#CBD5E1] font-medium cursor-pointer">
                  Hết hàng (0)
                </label>
              </div>

              <div className="pt-4 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('');
                    setProductBrandFilter('');
                    setProductStatusFilter('');
                    setProductLowStockOnly(false);
                    setProductZeroStockOnly(false);
                    setProductPage(1);
                  }}
                  className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-200 font-bold rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 transition-colors admin-btn-outline"
                >
                  <i className="fa-solid fa-rotate-left text-gray-500"></i>
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
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
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {paginatedProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row">
                      <td className="py-3.5 px-3 text-center text-[#9CA3AF] font-semibold">
                        {(productPage - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#1F2937] dark:text-[#F9FAFB] leading-snug line-clamp-1 admin-text-title">{p.name}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#374151] dark:text-[#E2E8F0]">{p.category?.name || 'Linh kiện'}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{p.brand?.name || '—'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#1F2937] dark:text-[#F9FAFB]">
                        {Number(p.price).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-3">
                        {p.salePrice && Number(p.salePrice) > 0 && Number(p.salePrice) < Number(p.price) ? (
                          <span className="font-bold text-[#0A5BFF] dark:text-[#60A5FA]">
                            {Number(p.salePrice).toLocaleString('vi-VN')}đ
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] italic font-normal">Không sale</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stockQuantity <= 9
                              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                              : 'bg-blue-50 dark:bg-blue-500/15 text-[#0A5BFF] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-500/30'
                          }`}>
                            {p.stockQuantity} chiếc
                          </span>
                          <button
                            onClick={() => {
                              setAdjustProductId(String(p.id));
                              setAdjustType('IMPORT');
                              setAdjustQuantity('1');
                              setAdjustNote('');
                              setIsAdjustStockOpen(true);
                            }}
                            className="px-2 py-0.5 rounded-md border border-[#0A5BFF]/40 text-[10px] text-[#0A5BFF] dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-blue-500/15 font-semibold flex items-center gap-1"
                          >
                            <i className="fa-solid fa-boxes-packing text-[9px]"></i>
                            <span>Nhập/Xuất</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(p.id, p.status || 'ACTIVE')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              p.status === 'INACTIVE' || p.status === 'OUT_OF_STOCK' ? 'bg-gray-300 dark:bg-slate-600' : 'bg-[#10B981]'
                            }`}
                            title="Bấm để bật/tắt bán"
                          >
                            <span
                              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                                p.status === 'INACTIVE' || p.status === 'OUT_OF_STOCK' ? 'translate-x-0' : 'translate-x-4'
                              }`}
                            ></span>
                          </button>
                          <span
                            className={`text-[10px] font-bold ${
                              p.status === 'INACTIVE'
                                ? 'text-[#9CA3AF]'
                                : p.status === 'OUT_OF_STOCK'
                                  ? 'text-rose-500'
                                  : 'text-[#10B981]'
                            }`}
                          >
                            {p.status === 'INACTIVE'
                              ? 'Ngừng bán'
                              : p.status === 'OUT_OF_STOCK'
                                ? 'Hết hàng'
                                : 'Đang bán'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3 py-1 bg-white dark:bg-transparent hover:bg-gray-50 text-gray-700 dark:text-slate-200 border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs font-semibold inline-flex items-center gap-1 admin-btn-outline"
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
            <AdminPagination
              currentPage={productPage}
              totalPages={totalProductPages}
              onPageChange={setProductPage}
            />
          </div>
          )
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'categories' && (
          editingCategory ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="font-extrabold text-xl text-gray-900 admin-text-title">Chỉnh sửa danh mục</h3>
              </div>
              <form onSubmit={handleUpdateCategory} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editCategorySlug}
                      onChange={(e) => setEditCategorySlug(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm font-mono admin-input-control"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={editCategorySort}
                      onChange={(e) => setEditCategorySort(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Icon FontAwesome
                  </label>
                  <input
                    type="text"
                    value={editCategoryIcon}
                    onChange={(e) => setEditCategoryIcon(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm font-mono admin-input-control"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    value={editCategoryDesc}
                    onChange={(e) => setEditCategoryDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Cập nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Quay lại</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-extrabold text-lg text-gray-900 admin-text-title">Danh sách danh mục sản phẩm</h3>
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm danh mục mới</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3 text-xs admin-filter-surface">
                <div className="flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Tìm danh mục theo tên..."
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setCategoryPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium admin-input-control"
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer admin-input-control"
                >
                  <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
                  <span>Tìm kiếm</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50 admin-table-head">
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
                    {paginatedCategories.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors admin-table-row">
                        <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">
                          {(categoryPage - 1) * 10 + idx + 1}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-gray-900 admin-text-title">{c.name}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-500 admin-text-muted">{c.slug}</td>
                        <td className="py-3.5 px-3 text-center text-gray-600 font-semibold admin-text-muted">{c.sortOrder || 0}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            {(c.productsCount ?? products.filter((p) => p.categoryId === c.id).length).toLocaleString('vi-VN')} mẫu
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            {(c.totalStock ?? products.filter((p) => p.categoryId === c.id).reduce((acc, p) => acc + (p.stockQuantity || 0), 0)).toLocaleString('vi-VN')} đơn vị
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryStatus(c.id, c.isActive !== false)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                c.isActive === false ? 'bg-gray-300' : 'bg-emerald-500'
                              }`}
                              title="Bấm để bật/tắt hoạt động"
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                                  c.isActive === false ? 'translate-x-0' : 'translate-x-4'
                                }`}
                              ></span>
                            </button>
                            <span
                              className={`text-[11px] font-bold ${
                                c.isActive === false ? 'text-gray-400 admin-text-muted' : 'text-emerald-600'
                              }`}
                            >
                              {c.isActive === false ? 'Tạm ẩn' : 'Đang hoạt động'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditCategory(c)}
                            className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200 cursor-pointer admin-input-control"
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

              {/* Pagination for Categories */}
              <AdminPagination
                currentPage={categoryPage}
                totalPages={totalCategoryPages}
                onPageChange={setCategoryPage}
              />
            </div>
          )
        )}

        {/* TAB 5: BRANDS MANAGEMENT - Exact TechPilot Parity */}
        {activeTab === 'brands' && (
          editingBrand ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="font-extrabold text-xl text-gray-900 admin-text-title">Chỉnh sửa thương hiệu</h3>
              </div>
              <form onSubmit={handleUpdateBrand} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Tên thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Slug (Tự sinh nếu để trống)
                  </label>
                  <input
                    type="text"
                    value={editBrandSlug}
                    onChange={(e) => setEditBrandSlug(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm font-mono admin-input-control"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Thay đổi hình ảnh Logo
                  </label>
                  {editBrandLogo && (
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block admin-filter-surface">
                      <img src={editBrandLogo} alt="Logo preview" className="h-10 max-w-[140px] object-contain" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditBrandLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 admin-text-muted mt-2">
                    Định dạng hỗ trợ: JPG, PNG, WEBP, GIF, SVG. Dung lượng tối đa: 2MB. Khuyến nghị ảnh vuông hoặc chữ nhật ngang tỷ lệ chuẩn.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Mô tả thương hiệu
                  </label>
                  <textarea
                    rows={4}
                    value={editBrandDesc}
                    onChange={(e) => setEditBrandDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    placeholder="Thương hiệu công nghệ hàng đầu..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Cập nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBrand(null)}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Quay lại</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-extrabold text-lg text-gray-900 admin-text-title">Danh sách thương hiệu</h3>
                <button
                  onClick={() => setIsAddBrandOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Thêm thương hiệu mới</span>
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3 text-xs admin-filter-surface">
                <div className="flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Tìm thương hiệu theo tên..."
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrandPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium admin-input-control"
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer admin-input-control"
                >
                  <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
                  <span>Tìm kiếm</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50 admin-table-head">
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
                    {paginatedBrands.map((b, idx) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors admin-table-row">
                        <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">
                          {(brandPage - 1) * 10 + idx + 1}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {b.logoUrl ? (
                            <div className="inline-flex items-center justify-center bg-white rounded-lg px-2.5 py-1.5 border border-[#E5E7EB] dark:border-[#334155]">
                              <img
                                src={normalizeImgUrl(b.logoUrl)}
                                alt={b.name}
                                className="h-5 max-w-[76px] object-contain"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px] admin-text-muted">Không có logo</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-gray-900 admin-text-title">{b.name}</td>
                        <td className="py-3.5 px-3 font-mono text-gray-500 admin-text-muted">{b.slug}</td>
                        <td className="py-3.5 px-3 text-gray-500 text-[11px] max-w-sm truncate admin-text-muted">
                          {b.description || `Thương hiệu công nghệ chính hãng ${b.name} phân phối tại Nexora.`}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            {b._count?.products ?? 0} sản phẩm
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleBrandStatus(b.id, b.isActive !== false)}
                            className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            title="Bấm để bật/tắt hoạt động"
                          >
                            <i
                              className={`fa-solid ${
                                b.isActive === false ? 'fa-square text-gray-300' : 'fa-check-square text-blue-600'
                              }`}
                            ></i>
                            <span className={b.isActive === false ? 'text-gray-400 admin-text-muted' : 'text-emerald-600'}>
                              {b.isActive === false ? 'Tạm ẩn' : 'Đang hoạt động'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditBrand(b)}
                            className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-gray-200 cursor-pointer admin-input-control"
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

              {/* Pagination for Brands */}
              <AdminPagination
                currentPage={brandPage}
                totalPages={totalBrandPages}
                onPageChange={setBrandPage}
              />
            </div>
          )
        )}

        {/* TAB 6: INVENTORY LOGS */}
        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                  Lịch sử Nhập/Xuất kho
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Theo dõi chi tiết mọi biến động tồn kho từ đơn hàng và điều chỉnh thủ công
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTabChange('products')}
                  className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-50 text-gray-700 dark:text-slate-200 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 admin-btn-outline"
                >
                  <i className="fa-solid fa-arrow-left text-xs"></i>
                  <span>Quay lại Sản phẩm</span>
                </button>
                <button
                  onClick={() => {
                    setAdjustType('IMPORT');
                    setAdjustQuantity('1');
                    setAdjustNote('');
                    setIsAdjustStockOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-boxes-packing"></i>
                  <span>Điều chỉnh tồn kho</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
                    <th className="p-3.5">Thời gian</th>
                    <th className="p-3.5">Sản phẩm</th>
                    <th className="p-3.5 text-center">Loại thay đổi</th>
                    <th className="p-3.5 text-center">Số lượng</th>
                    <th className="p-3.5 text-center">Trước / Sau</th>
                    <th className="p-3.5">Người thực hiện</th>
                    <th className="p-3.5">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
                  {inventoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#6B7280] dark:text-[#94A3B8]">
                        Chưa có bản ghi nhập/xuất kho nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                      >
                        <td className="p-3.5 text-xs text-[#6B7280] dark:text-[#94A3B8] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3.5 font-bold text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                          {log.product?.name || 'Sản phẩm'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              log.changeType === 'IMPORT' || log.changeType === 'RESTORE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : log.changeType === 'EXPORT'
                                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                  : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                            }`}
                          >
                            {log.changeType}
                          </span>
                        </td>
                        <td
                          className={`p-3.5 text-center font-bold ${
                            log.quantity > 0
                              ? 'text-[#10B981]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </td>
                        <td className="p-3.5 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
                          {log.balanceBefore} →{' '}
                          <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                            {log.balanceAfter}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-[#374151] dark:text-[#CBD5E1] font-semibold">
                          {log.actor?.fullName || 'Hệ thống'}
                        </td>
                        <td className="p-3.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                          {log.note || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Inventory */}
            <AdminPagination
              currentPage={inventoryPage}
              totalPages={totalInventoryPages}
              onPageChange={setInventoryPage}
            />
          </div>
        )}

        {/* TAB 7: COUPONS - Exact TechPilot Parity */}
        {activeTab === 'coupons' && (
          editingCoupon ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="font-extrabold text-xl text-gray-900 admin-text-title">Chỉnh sửa mã giảm giá</h3>
              </div>

              {/* Policy alert banner */}
              <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200 text-xs flex items-start gap-3">
                <i className="fa-solid fa-circle-info text-blue-600 dark:text-blue-400 text-base mt-0.5 shrink-0"></i>
                <div>
                  <span className="font-bold">Chính sách hệ thống:</span> Để đảm bảo quyền lợi và biên lợi nhuận kinh doanh, mức chiết khấu tối đa được phép thiết lập không vượt quá 20% cho mỗi mã giảm giá.
                </div>
              </div>

              <form onSubmit={handleUpdateCoupon} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Mã Code Giảm Giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editCouponCode}
                      onChange={(e) => setEditCouponCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-mono font-bold text-sm text-blue-600 admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Loại hình giảm giá
                    </label>
                    <select
                      value={editCouponType}
                      onChange={(e) => setEditCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    >
                      <option value="PERCENTAGE">% Phần trăm</option>
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Giá trị giảm <span className="text-red-500">* (Tối đa 20%)</span>
                    </label>
                    <input
                      type="number"
                      required
                      max={editCouponType === 'PERCENTAGE' ? 20 : undefined}
                      value={editCouponDiscount}
                      onChange={(e) => setEditCouponDiscount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Giá trị đơn hàng tối thiểu (đ)
                    </label>
                    <input
                      type="number"
                      value={editCouponMinOrder}
                      onChange={(e) => setEditCouponMinOrder(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Mức giảm tối đa (đ)
                    </label>
                    <input
                      type="number"
                      value={editCouponMaxDiscount}
                      onChange={(e) => setEditCouponMaxDiscount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Tổng giới hạn lượt sử dụng
                    </label>
                    <input
                      type="number"
                      value={editCouponUsageLimit}
                      onChange={(e) => setEditCouponUsageLimit(e.target.value)}
                      placeholder="Không giới hạn nếu để trống"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Giới hạn sử dụng mỗi tài khoản
                    </label>
                    <input
                      type="number"
                      value={editCouponUserLimit}
                      onChange={(e) => setEditCouponUserLimit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Ngày bắt đầu hiệu lực
                    </label>
                    <input
                      type="datetime-local"
                      value={editCouponStartsAt}
                      onChange={(e) => setEditCouponStartsAt(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Ngày kết thúc hiệu lực
                    </label>
                    <input
                      type="datetime-local"
                      value={editCouponExpiresAt}
                      onChange={(e) => setEditCouponExpiresAt(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                    Mô tả mã giảm giá
                  </label>
                  <textarea
                    rows={3}
                    value={editCouponDesc}
                    onChange={(e) => setEditCouponDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Cập nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Quay lại</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-lg text-gray-900 admin-text-title">
                  Mã giảm giá &amp; Khuyến mãi (Coupons)
                </h3>
                <button
                  onClick={() => setIsAddCouponOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Tạo mã giảm giá mới</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50 admin-table-head">
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
                    {paginatedCoupons.map((cp) => (
                      <tr key={cp.id} className="hover:bg-slate-50/60 transition-colors admin-table-row">
                        <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{cp.id}</td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 font-mono text-sm tracking-wide">{cp.code}</td>
                        <td className="py-3.5 px-3 text-gray-600 admin-text-muted">{cp.discountType === 'PERCENTAGE' ? 'Giảm phần trăm' : 'Giảm tiền mặt'}</td>
                        <td className="py-3.5 px-3 font-bold text-gray-900 admin-text-title">
                          {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}%` : `${Number(cp.discountValue).toLocaleString('vi-VN')}đ`}
                        </td>
                        <td className="py-3.5 px-3 text-gray-700 admin-text-muted">{Number(cp.minOrderValue).toLocaleString('vi-VN')}đ</td>
                        <td className="py-3.5 px-3 text-gray-600 admin-text-muted">
                          {cp.usageLimit ? `${cp.usageLimit} lượt` : 'Không giới hạn'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            {cp.usageCount ?? 0} lượt
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-gray-500 leading-tight admin-text-muted">
                          <div>
                            Bắt đầu:{' '}
                            {cp.startsAt
                              ? `${new Date(cp.startsAt).toLocaleDateString('vi-VN')} ${new Date(cp.startsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Ngay lập tức'}
                          </div>
                          <div>
                            Kết thúc:{' '}
                            {cp.expiresAt
                              ? `${new Date(cp.expiresAt).toLocaleDateString('vi-VN')} ${new Date(cp.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Không giới hạn'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cp.isActive}
                              onChange={() => handleToggleCoupon(cp.id)}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className={`text-[11px] font-bold ${cp.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 admin-text-muted'}`}>
                              {cp.isActive ? 'Hoạt động' : 'Tạm tắt'}
                            </span>
                          </label>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditCoupon(cp)}
                            className="px-2.5 py-1 bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 hover:bg-gray-50 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer admin-btn-outline"
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

              {/* Pagination for Coupons */}
              <AdminPagination
                currentPage={couponPage}
                totalPages={totalCouponPages}
                onPageChange={setCouponPage}
              />
            </div>
          )
        )}

        {/* TAB 8: FLASH SALES - Exact TechPilot Parity */}
        {activeTab === 'flash-sales' && (
          editingFlashSale ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="font-extrabold text-xl text-gray-900 admin-text-title">Chỉnh sửa chiến dịch Flash Sale</h3>
              </div>

              <form onSubmit={handleUpdateFlashSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Tiêu đề chiến dịch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFsName}
                      onChange={(e) => setEditFsName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Trạng thái chiến dịch
                    </label>
                    <select
                      value={editFsIsActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setEditFsIsActive(e.target.value === 'ACTIVE')}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Tạm dừng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Thời gian bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editFsStart}
                      onChange={(e) => setEditFsStart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 admin-text-title mb-1.5">
                      Thời gian kết thúc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editFsEnd}
                      onChange={(e) => setEditFsEnd(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 font-medium text-sm admin-input-control"
                    />
                  </div>
                </div>

                {/* Rule Warning Banner */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                  <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0"></i>
                  <div>
                    <span className="font-bold">Quy tắc Flash Sale:</span> Sản phẩm được chọn sẽ hiển thị trong khung giờ khuyến mãi với giá ưu đãi đặc biệt. Vui lòng kiểm tra kỹ giá bán và số lượng phân bổ để tránh thất thoát.
                  </div>
                </div>

                {/* Product Table in Flash Sale */}
                <div>
                  <h4 className="font-bold text-sm text-gray-800 admin-text-title mb-3">
                    Sản phẩm tham gia Flash Sale ({editFsProductIds.length} đã chọn)
                  </h4>
                  <div className="overflow-x-auto border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl admin-filter-surface">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-gray-400 font-bold uppercase tracking-wider bg-slate-50/70 admin-table-head">
                          <th className="py-3 px-3 w-10 text-center">Chọn</th>
                          <th className="py-3 px-3">Tên sản phẩm</th>
                          <th className="py-3 px-3">Giá bán hiện tại (đ)</th>
                          <th className="py-3 px-3">Giá Flash Sale (đ)</th>
                          <th className="py-3 px-3 text-center">Mở bán</th>
                          <th className="py-3 px-3 text-center">Đã bán</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                        {products.slice(0, 12).map((p) => {
                          const isSelected = editFsProductIds.includes(p.id);
                          const cfg = editFsItemConfig[p.id] || {
                            flashSalePrice: Math.round(Number(p.price) * 0.85),
                            quantityLimit: 10,
                            quantitySold: 0,
                          };
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors admin-table-row">
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setEditFsProductIds((prev) =>
                                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                                    );
                                    if (!editFsItemConfig[p.id]) {
                                      setEditFsItemConfig((prev) => ({
                                        ...prev,
                                        [p.id]: cfg,
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                              </td>
                              <td className="py-3 px-3 font-bold text-gray-900 admin-text-title">{p.name}</td>
                              <td className="py-3 px-3 text-gray-600 admin-text-muted">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  value={cfg.flashSalePrice}
                                  onChange={(e) =>
                                    setEditFsItemConfig((prev) => ({
                                      ...prev,
                                      [p.id]: { ...cfg, flashSalePrice: Number(e.target.value) || 0 },
                                    }))
                                  }
                                  className="w-32 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-blue-600 admin-input-control"
                                />
                              </td>
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={cfg.quantityLimit}
                                  onChange={(e) =>
                                    setEditFsItemConfig((prev) => ({
                                      ...prev,
                                      [p.id]: { ...cfg, quantityLimit: Math.max(1, Number(e.target.value) || 1) },
                                    }))
                                  }
                                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center admin-input-control"
                                />
                              </td>
                              <td className="py-3 px-3 text-center text-gray-400 font-semibold admin-text-muted">
                                {cfg.quantitySold}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Cập nhật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFlashSale(null)}
                    className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Quay lại</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 admin-card-surface">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-lg text-gray-900 admin-text-title">
                  Chương trình Flash Sale
                </h3>
                <button
                  onClick={() => setIsAddFlashSaleOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                  <span>Tạo chiến dịch mới</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50 admin-table-head">
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
                  <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                    {flashSales.map((fs) => {
                      const nowMs = renderNowMs;
                      const startMs = new Date(fs.startTime).getTime();
                      const endMs = new Date(fs.endTime).getTime();
                      const totalQuota = (fs.items || []).reduce(
                        (acc, it) => acc + (it.quantityLimit || 0),
                        0,
                      );
                      const statusLabel = !fs.isActive
                        ? 'Tạm dừng'
                        : nowMs < startMs
                          ? 'Sắp diễn ra'
                          : nowMs > endMs
                            ? 'Đã kết thúc'
                            : 'Đang diễn ra';
                      const statusStyle = !fs.isActive
                        ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        : nowMs < startMs
                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          : nowMs > endMs
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30';
                      return (
                        <tr key={fs.id} className="hover:bg-slate-50/60 transition-colors admin-table-row">
                          <td className="py-3.5 px-3 text-center text-gray-400 font-semibold">{fs.id}</td>
                          <td className="py-3.5 px-3 font-bold text-[#0A5BFF] dark:text-[#60A5FA]">{fs.name}</td>
                          <td className="py-3.5 px-3 text-gray-600 admin-text-muted">
                            {new Date(fs.startTime).toLocaleDateString('vi-VN')}{' '}
                            {new Date(fs.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-3 text-gray-600 admin-text-muted">
                            {new Date(fs.endTime).toLocaleDateString('vi-VN')}{' '}
                            {new Date(fs.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                              {fs.items?.length ?? 0} sản phẩm
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              {totalQuota > 0 ? `${totalQuota} chiếc` : 'Chưa có quota'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${statusStyle}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <label className="inline-flex items-center cursor-pointer" title="Bật / Tắt chiến dịch">
                                <input
                                  type="checkbox"
                                  checked={fs.isActive}
                                  onChange={() => handleToggleFlashSale(fs.id)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                              </label>
                              <button
                                onClick={() => handleOpenEditFlashSale(fs)}
                                className="px-3 py-1 bg-white dark:bg-transparent hover:bg-gray-50 text-gray-700 dark:text-slate-200 border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer admin-btn-outline"
                              >
                                <i className="fa-regular fa-pen-to-square"></i>
                                <span>Sửa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* TAB 9: BANNERS - Exact TechPilot Parity (Dark/Light + Synced with Storefront) */}
        {activeTab === 'banners' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                  Quản lý Banner quảng cáo &amp; Marketing
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                  Đồng bộ trực tiếp với Hero Slider, Sidebar Promo và Popup trên trang chủ Nexora
                </p>
              </div>
              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="px-4 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span>Thêm banner mới</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#1E293B]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-28">Hình ảnh</th>
                    <th className="py-3 px-3">Tiêu đề banner</th>
                    <th className="py-3 px-3 text-center">Vị trí hiển thị (Type)</th>
                    <th className="py-3 px-3 text-center">Thứ tự sắp xếp</th>
                    <th className="py-3 px-3">Đường dẫn Link</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {paginatedBanners.map((bn, idx) => (
                    <tr
                      key={bn.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                    >
                      <td className="py-3.5 px-3 text-center text-[#9CA3AF] font-semibold">
                        {(bannerPage - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="w-24 h-11 rounded-lg bg-[#0F172A] overflow-hidden border border-[#E5E7EB] dark:border-[#334155] shrink-0">
                          <img
                            src={normalizeImgUrl(bn.imageUrl)}
                            alt={bn.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                        {bn.title}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            bn.placement === 'popup'
                              ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/40'
                              : bn.placement === 'sidebar'
                                ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                                : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                          }`}
                        >
                          {bn.placement === 'popup'
                            ? '🔥 Popup Quảng Cáo'
                            : bn.placement === 'sidebar'
                              ? 'Sidebar Promo'
                              : bn.placement}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#6B7280] dark:text-[#94A3B8] font-semibold">
                        {bn.sortOrder || 1}
                      </td>
                      <td className="py-3.5 px-3 text-[#0A5BFF] dark:text-[#60A5FA] text-xs truncate max-w-xs font-mono">
                        {bn.linkUrl || '#'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex flex-col items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bn.isActive}
                            onChange={() => handleToggleBanner(bn.id)}
                            className="w-3.5 h-3.5 rounded text-[#0A5BFF] focus:ring-[#0A5BFF] border-gray-300"
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              bn.isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {bn.isActive ? 'Hiển thị' : 'Ẩn'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditBanner(bn)}
                          className="px-3 py-1 bg-white dark:bg-transparent hover:bg-gray-50 text-gray-700 dark:text-slate-200 border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 admin-btn-outline"
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

            {/* Pagination for Banners */}
            <AdminPagination
              currentPage={bannerPage}
              totalPages={totalBannerPages}
              onPageChange={setBannerPage}
            />
          </div>
        )}

        {/* TAB 10: POSTS - Exact TechPilot Parity */}
        {activeTab === 'posts' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                Danh sách tin tức &amp; bài viết
              </h3>
              <button
                onClick={() => setIsAddPostOpen(true)}
                className="px-4 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <i className="fa-solid fa-pen-nib text-xs"></i>
                <span>Viết bài viết mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] mb-6 flex flex-wrap items-center gap-3 text-xs admin-filter-surface">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => { setPostSearch(e.target.value); setPostPage(1); }}
                  placeholder="Tìm kiếm bài viết..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                />
              </div>
              <div className="min-w-[160px]">
                <select
                  value={postCategoryFilter}
                  onChange={(e) => {
                    setPostCategoryFilter(e.target.value);
                    setPostPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả chuyên mục</option>
                  <option value="Tin công nghệ">Tin công nghệ</option>
                  <option value="Đánh giá phần cứng">Đánh giá phần cứng</option>
                  <option value="Thủ thuật & Tư vấn">Thủ thuật &amp; Tư vấn</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <select
                  value={postStatusFilter}
                  onChange={(e) => {
                    setPostStatusFilter(e.target.value);
                    setPostPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đã đăng</option>
                  <option value="0">Bản nháp</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPostSearch('');
                  setPostCategoryFilter('');
                  setPostStatusFilter('');
                  setPostPage(1);
                }}
                className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-200 font-bold rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 transition-colors admin-btn-outline"
              >
                <i className="fa-solid fa-rotate-left text-gray-500"></i>
                <span>Đặt lại</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
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
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {paginatedPosts.map((post, idx) => (
                    <tr
                      key={post.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                    >
                      <td className="py-3.5 px-3 text-center text-[#9CA3AF] font-semibold">
                        {(postPage - 1) * 10 + idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="w-14 h-10 rounded-lg bg-[#F3F4F6] dark:bg-[#1E293B] overflow-hidden border border-[#E5E7EB] dark:border-[#334155] shrink-0">
                          <img
                            src={normalizeImgUrl(post.thumbnailUrl) || '/assets/images/banners/banner-hero-1.webp'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <a
                          href={`/news/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#1F2937] dark:text-[#F9FAFB] hover:text-[#0A5BFF] line-clamp-2 admin-text-title"
                        >
                          {post.title}
                        </a>
                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">{post.category}</div>
                      </td>
                      <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8]">
                        {post.author?.fullName || 'Đội ngũ Nexora'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[#374151] dark:text-[#CBD5E1] font-bold">
                        {(post.views ?? 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={post.isPublished}
                            onChange={() => handleTogglePost(post.id)}
                            className="w-3.5 h-3.5 rounded text-[#0A5BFF] focus:ring-[#0A5BFF] border-gray-300"
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              post.isPublished
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {post.isPublished ? 'Đã đăng' : 'Bản nháp'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] text-[11px]">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditPost(post)}
                          className="px-2.5 py-1 bg-white dark:bg-transparent border border-[#E5E7EB] dark:border-[#334155] hover:bg-gray-50 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 admin-btn-outline"
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

            {/* Pagination for Posts */}
            <AdminPagination
              currentPage={postPage}
              totalPages={totalPostPages}
              onPageChange={setPostPage}
            />
          </div>
        )}

        {/* TAB 11: USERS & ROLES - Exact TechPilot Parity */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="mb-6">
              <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                Quản lý người dùng &amp; phân quyền
              </h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] mb-6 flex flex-wrap items-center gap-3 text-xs admin-filter-surface">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, sđt..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                />
              </div>

              <div className="min-w-[160px]">
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả chức vụ</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserSearch('');
                  setUserRoleFilter('');
                  setUserPage(1);
                }}
                className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-200 font-bold rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 transition-colors admin-btn-outline"
              >
                <i className="fa-solid fa-rotate-left text-gray-500"></i>
                <span>Đặt lại</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
                    <th className="py-3 px-3 w-12 text-center">ID</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Số điện thoại</th>
                    <th className="py-3 px-3 text-center">Vai trò</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Ngày đăng ký</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {paginatedUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                      >
                        <td className="py-3.5 px-3 text-center text-[#9CA3AF] font-semibold">
                          {u.id}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                          {u.fullName}
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] admin-text-muted">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] admin-text-muted">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                                : u.role === 'STAFF'
                                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                            }`}
                          >
                            {u.role === 'CUSTOMER' ? 'Customer' : u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] text-[11px] admin-text-muted">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}{' '}
                          {new Date(u.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {u.id === 1 ? (
                            <span className="text-xs text-[#6B7280] dark:text-[#94A3B8] font-semibold inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-shield-halved text-[#0A5BFF] text-xs"></i>
                              <span>Quản trị tối cao</span>
                            </span>
                          ) : isSelf ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
                              <i className="fa-solid fa-user-check text-xs"></i>
                              <span>Đang đăng nhập</span>
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`px-2.5 py-1 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                                    : 'bg-[#10B981] hover:bg-[#059669]'
                                }`}
                              >
                                <i
                                  className={`fa-solid ${
                                    u.status === 'ACTIVE' ? 'fa-lock' : 'fa-lock-open'
                                  } text-[10px]`}
                                ></i>
                                <span>{u.status === 'ACTIVE' ? 'Khoá' : 'Mở khoá'}</span>
                              </button>
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1F2937] dark:text-[#F8FAFC] outline-none admin-input-control"
                              >
                                <option value="CUSTOMER">Customer</option>
                                <option value="STAFF">Staff</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users */}
            <AdminPagination
              currentPage={userPage}
              totalPages={totalUserPages}
              onPageChange={setUserPage}
            />
          </div>
        )}

        {/* TAB 12: REVIEWS - Exact TechPilot Parity */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] admin-card-surface">
            <div className="mb-6">
              <h3 className="font-extrabold text-lg text-[#1F2937] dark:text-[#F9FAFB] admin-text-title">
                Quản lý và kiểm duyệt đánh giá khách hàng
              </h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F9FAFB] dark:bg-[#0F172A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] mb-6 flex flex-wrap items-center gap-3 text-xs admin-filter-surface">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={(e) => {
                    setReviewSearch(e.target.value);
                    setReviewPage(1);
                  }}
                  placeholder="Tìm theo khách hàng, sản phẩm, nội dung..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                />
              </div>
              <div className="min-w-[150px]">
                <select
                  value={reviewRatingFilter}
                  onChange={(e) => {
                    setReviewRatingFilter(e.target.value);
                    setReviewPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg outline-none focus:border-[#0A5BFF] font-medium admin-input-control"
                >
                  <option value="">Tất cả số sao</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
                  <option value="4">⭐⭐⭐⭐ 4 sao</option>
                  <option value="3">⭐⭐⭐ 3 sao</option>
                  <option value="2">⭐⭐ 2 sao</option>
                  <option value="1">⭐ 1 sao</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewSearch('');
                  setReviewRatingFilter('');
                  setReviewPage(1);
                }}
                className="px-4 py-2 bg-white dark:bg-transparent hover:bg-gray-100 text-gray-700 dark:text-slate-200 font-bold rounded-lg border border-[#E5E7EB] dark:border-[#334155] flex items-center gap-1.5 transition-colors admin-btn-outline"
              >
                <i className="fa-solid fa-rotate-left text-gray-500"></i>
                <span>Đặt lại</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] font-bold uppercase tracking-wider bg-[#F9FAFB] dark:bg-[#1E293B] admin-table-head">
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
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B] font-medium">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#6B7280] dark:text-[#94A3B8]">
                        Chưa có đánh giá nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedReviews.map((rev) => (
                      <tr
                        key={rev.id}
                        className="hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]/60 transition-colors admin-table-row"
                      >
                        <td className="py-3.5 px-3 text-center text-[#9CA3AF] font-semibold">
                          {rev.id}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB] max-w-xs truncate admin-text-title">
                          {rev.product?.name || 'Sản phẩm Nexora'}
                        </td>
                        <td className="py-3.5 px-3 text-[#374151] dark:text-[#CBD5E1] font-semibold">
                          {rev.user?.fullName || 'Khách hàng'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1 text-amber-400 font-bold">
                            <span>⭐</span>
                            <span className="text-[#1F2937] dark:text-[#F9FAFB] text-xs">
                              {rev.rating}.0
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] max-w-sm">
                          <p className="line-clamp-2">{rev.comment || '—'}</p>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            Đã duyệt
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#94A3B8] text-[11px]">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <i className="fa-solid fa-trash text-[10px]"></i>
                            <span>Gỡ đánh giá</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Reviews */}
            <AdminPagination
              currentPage={reviewPage}
              totalPages={totalReviewPages}
              onPageChange={setReviewPage}
            />
          </div>
        )}

        {/* TAB 13: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-[#E5E7EB] dark:border-[#1E293B] max-w-2xl space-y-6 admin-card-surface">
            <h3 className="font-extrabold text-xl text-[#1F2937] dark:text-[#F9FAFB] border-b border-[#E5E7EB] dark:border-[#1E293B] pb-4 admin-text-title">
              Thông Tin Cửa Hàng Single-Vendor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">
                  Tên thương hiệu
                </label>
                <input
                  type="text"
                  readOnly
                  value="Nexora Technology Hardware"
                  className="mt-1 w-full p-3 bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">
                  Hotline kỹ thuật 24/7
                </label>
                <input
                  type="text"
                  readOnly
                  value="1800 2097 (Miễn phí)"
                  className="mt-1 w-full p-3 bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold text-[#0A5BFF] dark:text-[#60A5FA] admin-input-control"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">
                  Email hỗ trợ
                </label>
                <input
                  type="text"
                  readOnly
                  value="hotro@nexora.local"
                  className="mt-1 w-full p-3 bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase">
                  Cơ chế bán hàng
                </label>
                <input
                  type="text"
                  readOnly
                  value="Single-Vendor (1 Cửa hàng duy nhất)"
                  className="mt-1 w-full p-3 bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 admin-input-control"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
              <i className="fa-solid fa-circle-info mr-2"></i>
              Nexora cam kết kiến trúc Single-Vendor chuẩn mực: Toàn bộ sản phẩm được quản lý kho tập trung, giá bán do cửa hàng niêm yết, hóa đơn VAT xuất trực tiếp và dịch vụ bảo hành được thực hiện bởi đội ngũ kỹ sư nội bộ.
            </div>
          </div>
        )}

        {/* ORDER DETAIL MODAL — Exact TechPilot 2-Column Layout Parity */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#F9FAFB] dark:bg-[#0B0F19] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Top Bar */}
              <div className="px-6 py-4 bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#1F2937] dark:text-[#F9FAFB]">
                    Đơn hàng: <span className="font-mono text-[#0A5BFF] dark:text-[#60A5FA]">{selectedOrder.orderCode}</span>
                  </h3>
                  <div className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                    Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}Phương thức: <strong className="text-[#1F2937] dark:text-[#F9FAFB]">{selectedOrder.paymentMethod}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1F2937] dark:hover:text-white admin-btn-outline"
                >
                  <i className="fa-solid fa-xmark text-base"></i>
                </button>
              </div>

              {/* 2-Column Content Grid */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Left Column: Products Table & Totals */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col justify-between admin-card-surface">
                  <div>
                    <h4 className="font-bold text-sm text-[#1F2937] dark:text-[#F9FAFB] mb-4">
                      Sản phẩm đặt mua
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#1E293B]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F9FAFB] dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8] font-bold">
                            <th className="py-2.5 px-3 w-16">Ảnh</th>
                            <th className="py-2.5 px-3">Tên sản phẩm</th>
                            <th className="py-2.5 px-3 text-right">Giá bán</th>
                            <th className="py-2.5 px-3 text-center">Số lượng</th>
                            <th className="py-2.5 px-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#1E293B]">
                          {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-[#6B7280] dark:text-[#94A3B8]">
                                Đang tải danh sách sản phẩm...
                              </td>
                            </tr>
                          ) : (
                            selectedOrder.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-3 px-3">
                                  <img
                                    src={normalizeImgUrl(item.thumbnailUrl) || '/assets/images/nexora-icon-128.png'}
                                    alt={item.productName}
                                    className="w-11 h-11 rounded-lg object-contain bg-white p-1 border border-[#E5E7EB] dark:border-[#334155]"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/images/nexora-icon-128.png';
                                    }}
                                  />
                                </td>
                                <td className="py-3 px-3 font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                                  {item.productName}
                                </td>
                                <td className="py-3 px-3 text-right text-[#6B7280] dark:text-[#94A3B8]">
                                  {Number(item.unitPrice || 0).toLocaleString('vi-VN')}đ
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-[#374151] dark:text-[#CBD5E1]">
                                  x{item.quantity}
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                                  {(Number(item.unitPrice || 0) * item.quantity).toLocaleString('vi-VN')}đ
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B] space-y-2 text-xs max-w-xs ml-auto w-full">
                    <div className="flex items-center justify-between text-[#6B7280] dark:text-[#94A3B8]">
                      <span>Tạm tính:</span>
                      <span className="font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                        {Number(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {Number(selectedOrder.discountAmount || 0) > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Giảm giá {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}:</span>
                        <span className="font-bold">
                          -{Number(selectedOrder.discountAmount).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[#6B7280] dark:text-[#94A3B8]">
                      <span>Phí vận chuyển:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(selectedOrder.shippingFee || 0) > 0
                          ? `${Number(selectedOrder.shippingFee).toLocaleString('vi-VN')}đ`
                          : 'Miễn phí'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B] text-sm font-black">
                      <span className="text-[#0A5BFF] dark:text-[#60A5FA]">Tổng cộng:</span>
                      <span className="text-[#0A5BFF] dark:text-[#60A5FA] text-base">
                        {Number(selectedOrder.totalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Shipping Info + Status Update Card */}
                <div className="space-y-5">
                  {/* Shipping Card */}
                  <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] space-y-2.5 text-xs admin-card-surface">
                    <h4 className="font-extrabold text-sm text-[#1F2937] dark:text-[#F9FAFB] mb-3">
                      Thông tin giao hàng
                    </h4>
                    <div className="text-[#374151] dark:text-[#CBD5E1]">
                      <strong className="text-[#1F2937] dark:text-[#F9FAFB]">Người nhận:</strong>{' '}
                      {selectedOrder.customerName}
                    </div>
                    <div className="text-[#374151] dark:text-[#CBD5E1]">
                      <strong className="text-[#1F2937] dark:text-[#F9FAFB]">Số điện thoại:</strong>{' '}
                      {selectedOrder.customerPhone}
                    </div>
                    <div className="text-[#374151] dark:text-[#CBD5E1]">
                      <strong className="text-[#1F2937] dark:text-[#F9FAFB]">Địa chỉ giao:</strong>{' '}
                      {selectedOrder.shippingAddress}
                    </div>
                    {selectedOrder.customerNotes && (
                      <div className="mt-3 p-3 rounded-lg bg-[#F3F4F6] dark:bg-[#1E293B] border-l-4 border-[#0A5BFF] italic text-[#4B5563] dark:text-[#CBD5E1]">
                        Ghi chú: {selectedOrder.customerNotes}
                      </div>
                    )}
                  </div>

                  {/* Order Status Card */}
                  <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#1E293B] space-y-4 text-xs admin-card-surface">
                    <h4 className="font-extrabold text-sm text-[#1F2937] dark:text-[#F9FAFB]">
                      Trạng thái đơn hàng
                    </h4>

                    <div
                      className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs ${
                        selectedOrder.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : selectedOrder.paymentStatus === 'FAILED'
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      Thanh toán:{' '}
                      <strong>
                        {selectedOrder.paymentStatus === 'PAID'
                          ? 'Đã thanh toán'
                          : selectedOrder.paymentStatus === 'FAILED'
                            ? 'Thất bại'
                            : 'Chưa thanh toán'}
                      </strong>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                        Thay đổi trạng thái đơn
                      </label>
                      <select
                        value={orderNextStatus}
                        onChange={(e) => setOrderNextStatus(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-bold bg-white dark:bg-[#1E293B] text-[#1F2937] dark:text-[#F8FAFC] admin-input-control"
                      >
                        <option value="PENDING">Chờ xác nhận (Pending)</option>
                        <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                        <option value="PROCESSING">Đang đóng gói (Processing)</option>
                        <option value="SHIPPING">Đang giao hàng (Shipping)</option>
                        <option value="DELIVERED">Hoàn thành (Delivered)</option>
                        <option value="CANCELLED">Đã huỷ (Cancelled)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                        Trạng thái thanh toán
                      </label>
                      <select
                        value={orderNextPaymentStatus}
                        onChange={(e) => setOrderNextPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-bold bg-white dark:bg-[#1E293B] text-[#1F2937] dark:text-[#F8FAFC] admin-input-control"
                      >
                        <option value="PENDING">Chưa thanh toán (PENDING)</option>
                        <option value="PAID">Đã thanh toán (PAID)</option>
                        <option value="FAILED">Thất bại (FAILED)</option>
                      </select>
                    </div>

                    {/* TechPilot Exact Policy Notice Box */}
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-[11px] leading-relaxed">
                      <i className="fa-solid fa-circle-info mr-1.5 text-amber-600 dark:text-amber-400"></i>
                      Đơn VNPay phải thanh toán thành công mới được xác nhận. Với COD, thanh toán tự chuyển thành <strong>Paid</strong> khi đơn hoàn thành. Đơn bị hủy sẽ được hoàn lại tồn kho.
                    </div>

                    <button
                      type="button"
                      disabled={isUpdatingOrder}
                      onClick={() =>
                        handleUpdateOrderStatus(
                          selectedOrder.id,
                          orderNextStatus,
                          orderNextPaymentStatus,
                        )
                      }
                      className="w-full py-2.5 bg-[#0A5BFF] hover:bg-[#084AD1] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                    >
                      <i className={`fa-solid ${isUpdatingOrder ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                      <span>{isUpdatingOrder ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT MODAL */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Thêm Sản Phẩm Mới</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="VD: Card đồ họa ASUS ROG Strix GeForce RTX 4080..."
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm focus:border-[#0A5BFF] focus:outline-none admin-input-control"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Giá bán (VND) *</label>
                    <input
                      type="number"
                      required
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="VD: 25000000"
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm focus:border-[#0A5BFF] focus:outline-none admin-input-control"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tồn kho ban đầu</label>
                    <input
                      type="number"
                      required
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm focus:border-[#0A5BFF] focus:outline-none admin-input-control"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Danh mục</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm focus:border-[#0A5BFF] focus:outline-none bg-white dark:bg-[#1E293B] admin-input-control"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Mô tả sản phẩm</label>
                    <button
                      type="button"
                      onClick={handleAiGenerateDesc}
                      disabled={isAiGenerating}
                      className="text-xs text-[#0A5BFF] dark:text-[#60A5FA] hover:underline font-bold flex items-center gap-1"
                    >
                      <i className={`fa-solid ${isAiGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                      {isAiGenerating ? 'Nexora AI đang viết...' : 'Nexora AI viết mô tả'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Nhập thông tin hoặc bấm 'Nexora AI viết mô tả' để tạo tự động..."
                    className="w-full p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm focus:border-[#0A5BFF] focus:outline-none admin-input-control"
                  ></textarea>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] text-sm font-bold admin-btn-outline"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold shadow-md transition-all"
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
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Thêm Danh Mục Mới</h3>
                <button onClick={() => setIsAddCategoryOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tên danh mục *</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="VD: Tản nhiệt nước Custom"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Icon FontAwesome</label>
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Mô tả danh mục</label>
                  <textarea
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Mô tả tóm tắt..."
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold">Lưu danh mục</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD BRAND MODAL */}
        {isAddBrandOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Thêm Thương Hiệu</h3>
                <button onClick={() => setIsAddBrandOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateBrand} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tên thương hiệu *</label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="VD: CORSAIR"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={newBrandDesc}
                    onChange={(e) => setNewBrandDesc(e.target.value)}
                    placeholder="Linh kiện cao cấp chính hãng"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsAddBrandOpen(false)} className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold">Lưu thương hiệu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADJUST STOCK MODAL — Exact TechPilot Parity (step_46_shot_1_stock_modal.png) */}
        {isAdjustStockOpen && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              {/* Deep Navy Header */}
              <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-boxes-stacked text-[#38BDF8] text-base"></i>
                  <h3 className="font-extrabold text-[15px] tracking-tight">
                    Điều chỉnh tồn kho sản phẩm
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
                {/* Selected Product Card / Picker */}
                {selectedAdjustProduct ? (
                  <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#94A3B8]">
                        SẢN PHẨM ĐÃ CHỌN
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdjustProductId('')}
                        className="text-[11px] font-bold text-[#0A5BFF] hover:underline"
                      >
                        Đổi sản phẩm
                      </button>
                    </div>
                    <div className="text-sm font-extrabold text-[#1F2937] dark:text-[#F9FAFB]">
                      {selectedAdjustProduct.name}
                    </div>
                    <div className="text-xs text-[#4B5563] dark:text-[#94A3B8] flex flex-wrap items-center gap-4 pt-0.5">
                      <span>
                        Tồn hiện tại:{' '}
                        <strong className="text-[#0A5BFF] dark:text-[#60A5FA]">
                          {selectedAdjustProduct.stockQuantity}
                        </strong>{' '}
                        đơn vị
                      </span>
                      <span>
                        Dự kiến sau thao tác:{' '}
                        <strong
                          className={
                            projectedStock < 0
                              ? 'text-[#EF4444]'
                              : adjustType === 'IMPORT'
                                ? 'text-[#10B981]'
                                : 'text-[#F59E0B]'
                          }
                        >
                          {projectedStock}
                        </strong>{' '}
                        đơn vị
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">
                      Chọn sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={adjustProductId}
                      onChange={(e) => setAdjustProductId(e.target.value)}
                      required
                      className="w-full mt-1.5 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                    >
                      <option value="">-- Chọn sản phẩm cần chỉnh tồn kho --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Hiện có: {p.stockQuantity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Operation Type Radio Cards */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-2">
                    Loại thao tác <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${
                        adjustType === 'IMPORT'
                          ? 'border-[#10B981] bg-emerald-50/70 dark:bg-emerald-500/15 text-[#059669] dark:text-emerald-300'
                          : 'border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="adjustType"
                        checked={adjustType === 'IMPORT'}
                        onChange={() => setAdjustType('IMPORT')}
                        className="accent-[#10B981]"
                      />
                      <i className="fa-solid fa-square-plus text-[#10B981]"></i>
                      <span>Nhập kho (+)</span>
                    </label>
                    <label
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${
                        adjustType === 'EXPORT'
                          ? 'border-[#EF4444] bg-rose-50/70 dark:bg-rose-500/15 text-[#DC2626] dark:text-rose-300'
                          : 'border-[#E5E7EB] dark:border-[#334155] text-[#6B7280] dark:text-[#94A3B8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="adjustType"
                        checked={adjustType === 'EXPORT'}
                        onChange={() => setAdjustType('EXPORT')}
                        className="accent-[#EF4444]"
                      />
                      <i className="fa-solid fa-square-minus text-[#EF4444]"></i>
                      <span>Xuất kho (-)</span>
                    </label>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                    Số lượng thay đổi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    className="w-full p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                  />
                  {selectedAdjustProduct && projectedStock < 0 && (
                    <p className="text-[11px] font-semibold text-[#EF4444] mt-1">
                      Không thể xuất vượt quá số lượng tồn kho hiện tại ({selectedAdjustProduct.stockQuantity}).
                    </p>
                  )}
                </div>

                {/* Reason Type (7 TechPilot Standard Options) */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                    Loại lý do <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adjustReasonType}
                    onChange={(e) => setAdjustReasonType(e.target.value)}
                    className="w-full p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                  >
                    <option value="Nhập hàng từ nhà cung cấp">Nhập hàng từ nhà cung cấp</option>
                    <option value="Khách hàng hoàn trả">Khách hàng hoàn trả</option>
                    <option value="Kiểm kê kho - thừa">Kiểm kê kho - thừa</option>
                    <option value="Kiểm kê kho - thiếu">Kiểm kê kho - thiếu</option>
                    <option value="Xuất mẫu / Trưng bày">Xuất mẫu / Trưng bày</option>
                    <option value="Hàng lỗi / Hư hỏng">Hàng lỗi / Hư hỏng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Detail Note */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                    Ghi chú / Chi tiết
                  </label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Ví dụ: Xuất mẫu cho phòng kỹ thuật / Kiểm kê phát hiện chênh lệch..."
                    className="w-full p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs admin-input-control"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsAdjustStockOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-xs admin-btn-outline"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(selectedAdjustProduct && projectedStock < 0)}
                    className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 ${
                      adjustType === 'IMPORT'
                        ? 'bg-[#10B981] hover:bg-[#059669]'
                        : 'bg-[#EF4444] hover:bg-[#DC2626]'
                    }`}
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>
                      {adjustType === 'IMPORT' ? 'Xác nhận Nhập kho' : 'Xác nhận Xuất kho'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD COUPON MODAL */}
        {isAddCouponOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Tạo Mã Giảm Giá Mới</h3>
                <button onClick={() => setIsAddCouponOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="VD: NEXORA15"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-mono font-bold admin-input-control"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Loại giảm</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">
                      Mức giảm * {newCouponType === 'PERCENTAGE' ? '(≤ 20%)' : ''}
                    </label>
                    <input
                      type="number"
                      required
                      max={newCouponType === 'PERCENTAGE' ? 20 : undefined}
                      value={newCouponDiscount}
                      onChange={(e) => setNewCouponDiscount(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsAddCouponOpen(false)} className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold">Kích hoạt Voucher</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD BANNER MODAL */}
        {isAddBannerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Thêm Banner Mới</h3>
                <button onClick={() => setIsAddBannerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateBanner} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tiêu đề Banner *</label>
                  <input
                    type="text"
                    required
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="VD: Siêu khuyến mãi Mùa Hè 2026"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Đường dẫn ảnh (Image URL) *</label>
                  <input
                    type="text"
                    required
                    value={newBannerImage}
                    onChange={(e) => setNewBannerImage(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Đường dẫn đích (Link URL)</label>
                  <input
                    type="text"
                    value={newBannerLink}
                    onChange={(e) => setNewBannerLink(e.target.value)}
                    placeholder="/search hoặc /category/laptop"
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Vị trí hiển thị (Placement)</label>
                  <select
                    value={newBannerPlacement}
                    onChange={(e) => setNewBannerPlacement(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                  >
                    <option value="hero">Hero Slider (Trang chủ)</option>
                    <option value="sidebar">Sidebar Promo (3 thẻ phụ)</option>
                    <option value="popup">Popup Quảng Cáo</option>
                    <option value="mid-page">Mid-page Banner</option>
                    <option value="footer">Footer Banner</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button type="button" onClick={() => setIsAddBannerOpen(false)} className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold">Lưu Banner</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD FLASH SALE MODAL */}
        {isAddFlashSaleOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">
                  Tạo Chiến Dịch Flash Sale Mới
                </h3>
                <button
                  onClick={() => setIsAddFlashSaleOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreateFlashSale} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tên chiến dịch *</label>
                  <input
                    type="text"
                    required
                    value={newFsName}
                    onChange={(e) => setNewFsName(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFsStart}
                    onChange={(e) => setNewFsStart(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFsEnd}
                    onChange={(e) => setNewFsEnd(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                  <i className="fa-solid fa-bolt mr-1"></i>
                  Chiến dịch sẽ tự động gắn 5 sản phẩm nổi bật với giá ưu đãi giảm 15%.
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsAddFlashSaleOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold"
                  >
                    Tạo chiến dịch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD POST MODAL */}
        {isAddPostOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] max-h-[90vh] flex flex-col admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">Viết Bài Viết Mới</h3>
                <button
                  onClick={() => setIsAddPostOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleCreatePost} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="VD: Đánh giá chi tiết Intel Core Ultra 9 285K..."
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Chuyên mục</label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                    >
                      <option value="Tin công nghệ">Tin công nghệ</option>
                      <option value="Đánh giá phần cứng">Đánh giá phần cứng</option>
                      <option value="Thủ thuật & Tư vấn">Thủ thuật &amp; Tư vấn</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Ảnh đại diện (URL)</label>
                    <input
                      type="text"
                      value={newPostThumb}
                      onChange={(e) => setNewPostThumb(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Nội dung bài viết *</label>
                  <textarea
                    rows={6}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết chi tiết tại đây..."
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsAddPostOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold shadow-md"
                  >
                    Đăng bài viết
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT POST MODAL */}
        {editingPost && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] max-h-[90vh] flex flex-col admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">
                  Chỉnh Sửa Bài Viết #{editingPost.id}
                </h3>
                <button
                  onClick={() => setEditingPost(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleUpdatePost} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    required
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm font-bold admin-input-control"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Chuyên mục</label>
                    <select
                      value={editPostCategory}
                      onChange={(e) => setEditPostCategory(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                    >
                      <option value="Tin công nghệ">Tin công nghệ</option>
                      <option value="Đánh giá phần cứng">Đánh giá phần cứng</option>
                      <option value="Thủ thuật & Tư vấn">Thủ thuật &amp; Tư vấn</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Ảnh đại diện (URL)</label>
                    <input
                      type="text"
                      value={editPostThumb}
                      onChange={(e) => setEditPostThumb(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Nội dung bài viết *</label>
                  <textarea
                    rows={6}
                    required
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold shadow-md"
                  >
                    Lưu cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT BANNER MODAL */}
        {editingBanner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E5E7EB] dark:border-[#1E293B] admin-modal-surface">
              <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between bg-[#F9FAFB] dark:bg-[#0F172A]">
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#F9FAFB]">
                  Chỉnh Sửa Banner #{editingBanner.id}
                </h3>
                <button
                  onClick={() => setEditingBanner(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              <form onSubmit={handleUpdateBanner} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Tiêu đề Banner *</label>
                  <input
                    type="text"
                    required
                    value={editBannerTitle}
                    onChange={(e) => setEditBannerTitle(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Đường dẫn ảnh (URL) *</label>
                  <input
                    type="text"
                    required
                    value={editBannerImage}
                    onChange={(e) => setEditBannerImage(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-xs font-mono admin-input-control"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Vị trí (Placement)</label>
                    <select
                      value={editBannerPlacement}
                      onChange={(e) => setEditBannerPlacement(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm bg-white dark:bg-[#1E293B] admin-input-control"
                    >
                      <option value="hero">Hero Slider</option>
                      <option value="sidebar">Sidebar Promo</option>
                      <option value="popup">Popup Quảng Cáo</option>
                      <option value="mid-page">Mid-page Banner</option>
                      <option value="footer">Footer Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Thứ tự sắp xếp</label>
                    <input
                      type="number"
                      value={editBannerSort}
                      onChange={(e) => setEditBannerSort(e.target.value)}
                      className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#374151] dark:text-[#CBD5E1]">Đường dẫn Link</label>
                  <input
                    type="text"
                    value={editBannerLink}
                    onChange={(e) => setEditBannerLink(e.target.value)}
                    className="w-full mt-1 p-3 border border-[#E5E7EB] dark:border-[#334155] rounded-xl text-sm admin-input-control"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] font-bold text-sm admin-btn-outline"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0A5BFF] hover:bg-[#084AD1] text-white rounded-xl text-sm font-bold"
                  >
                    Lưu Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};
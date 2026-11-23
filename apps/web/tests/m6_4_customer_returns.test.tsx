// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/apiClient';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import type { AuthUser, OrderDto, ReturnRequestDto } from '@nexora/shared';

const mockUser: AuthUser = {
  id: 33,
  email: 'customer33@nexora.local',
  fullName: 'Trần Minh Khôi',
  phone: '0901234567',
  avatarUrl: null,
  role: 'CUSTOMER',
};

const nowMs = Date.now();
const twoDaysAgoIso = new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString();
const tenDaysAgoIso = new Date(nowMs - 10 * 24 * 60 * 60 * 1000).toISOString();

const eligibleOrder: OrderDto = {
  id: '9001',
  orderCode: 'NX-2026-9001',
  customerName: 'Trần Minh Khôi',
  customerEmail: 'customer33@nexora.local',
  customerPhone: '0901234567',
  shippingAddress: '123 Nguyễn Huệ',
  subtotal: '15000000',
  shippingFee: '0',
  discountAmount: '0',
  totalAmount: '15000000',
  paymentMethod: 'COD',
  paymentStatus: 'PAID',
  orderStatus: 'DELIVERED',
  deliveredAt: twoDaysAgoIso,
  createdAt: new Date(nowMs - 4 * 24 * 60 * 60 * 1000).toISOString(),
  items: [
    {
      id: '701',
      productId: 101,
      productName: 'Bàn phím cơ Keychron Q1 Pro',
      productSku: 'KB-Q1P',
      thumbnailUrl: null,
      unitPrice: '4500000',
      quantity: 3,
      discountAmount: '0',
      subtotal: '13500000',
    },
    {
      id: '702',
      productId: 102,
      productName: 'Chuột Logitech G Pro X Superlight 2',
      productSku: 'MS-GPX2',
      thumbnailUrl: null,
      unitPrice: '3500000',
      quantity: 2,
      discountAmount: '0',
      subtotal: '7000000',
    },
  ],
};

const pendingOrder: OrderDto = {
  ...eligibleOrder,
  id: '9002',
  orderCode: 'NX-2026-9002',
  orderStatus: 'PENDING',
  deliveredAt: null,
};

const missingDeliveredAtOrder: OrderDto = {
  ...eligibleOrder,
  id: '9003',
  orderCode: 'NX-2026-9003',
  orderStatus: 'DELIVERED',
  deliveredAt: null,
};

const expiredOrder: OrderDto = {
  ...eligibleOrder,
  id: '9004',
  orderCode: 'NX-2026-9004',
  orderStatus: 'DELIVERED',
  deliveredAt: tenDaysAgoIso,
};

const mockReturnList: ReturnRequestDto[] = [
  {
    id: 501,
    returnCode: 'RET-20261122-AB12',
    orderId: '9001',
    orderCode: 'NX-2026-9001',
    userId: 33,
    reason: 'Phím Space bị kẹt sau 1 ngày sử dụng',
    rejectionReason: null,
    handledBy: null,
    handlerName: null,
    status: 'PENDING',
    notes: 'Đã kiểm tra trên 2 máy tính khác nhau.',
    images: null,
    resolvedAt: null,
    createdAt: new Date(nowMs - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(nowMs - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 801,
        returnRequestId: 501,
        orderItemId: '701',
        productId: 101,
        productName: 'Bàn phím cơ Keychron Q1 Pro',
        productSku: 'KB-Q1P',
        thumbnailUrl: null,
        quantity: 1,
        resolution: 'REPLACE',
        isResellable: false,
        createdAt: new Date(nowMs - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 901,
        returnRequestId: 501,
        fromStatus: 'PENDING',
        toStatus: 'PENDING',
        actorId: 33,
        actorRole: 'CUSTOMER',
        actorName: 'Trần Minh Khôi',
        notes: 'Khách hàng tạo yêu cầu đổi/trả mới.',
        createdAt: new Date(nowMs - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 502,
    returnCode: 'RET-20261121-CD34',
    orderId: '9001',
    orderCode: 'NX-2026-9001',
    userId: 33,
    reason: 'Yêu cầu cũ đã bị từ chối không trừ hạn mức',
    rejectionReason: 'Thiếu hộp phụ kiện nguyên vẹn',
    handledBy: 2,
    handlerName: 'Nhân viên hỗ trợ',
    status: 'REJECTED',
    notes: null,
    images: null,
    resolvedAt: new Date(nowMs - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(nowMs - 12 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 802,
        returnRequestId: 502,
        orderItemId: '701',
        productId: 101,
        productName: 'Bàn phím cơ Keychron Q1 Pro',
        productSku: 'KB-Q1P',
        thumbnailUrl: null,
        quantity: 2,
        resolution: 'REFUND',
        isResellable: false,
        createdAt: new Date(nowMs - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    auditLogs: [],
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function setLoggedIn(user: AuthUser = mockUser) {
  localStorage.setItem('nexora_token', 'mock-customer-jwt');
  localStorage.setItem('nexora_user', JSON.stringify(user));
}

function renderProfileRoute(
  initialPath = '/profile/return',
  queryClient = createTestQueryClient(),
) {
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/orders" element={<ProfilePage />} />
          <Route path="/profile/return" element={<ProfilePage />} />
          <Route path="/profile/return/:id" element={<ProfilePage />} />
          <Route path="/auth/login" element={<div>Trang Đăng Nhập</div>} />
          <Route path="/" element={<div>Trang Chủ</div>} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

function setupApiMocks(options?: {
  returnsResponse?: unknown | (() => Promise<unknown>);
  detailResponse?: ReturnRequestDto | Error | (() => Promise<unknown>);
  orders?: OrderDto[];
}) {
  const orders = options?.orders ?? [
    eligibleOrder,
    pendingOrder,
    missingDeliveredAtOrder,
    expiredOrder,
  ];

  const getSpy = vi.spyOn(apiClient, 'get').mockImplementation((url, config) => {
    if (url === '/profile') {
      return Promise.resolve({ data: { success: true, data: mockUser } });
    }
    if (url === '/profile/addresses') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/profile/notifications') {
      return Promise.resolve({
        data: { success: true, data: { unreadCount: 0, notifications: [] } },
      });
    }
    if (url === '/orders/my-orders') {
      return Promise.resolve({ data: { success: true, data: orders } });
    }
    if (url === '/catalog/categories') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/cart') {
      return Promise.resolve({
        data: { success: true, data: { items: [], totalItems: 0, subtotal: '0' } },
      });
    }
    if (url === '/wishlist') {
      return Promise.resolve({ data: { success: true, data: [] } });
    }
    if (url === '/profile/returns') {
      if (typeof options?.returnsResponse === 'function') {
        return (options.returnsResponse as () => Promise<unknown>)();
      }
      if (options?.returnsResponse instanceof Error) {
        return Promise.reject(options.returnsResponse);
      }
      const requestedPage = (config?.params as { page?: number } | undefined)?.page ?? 1;
      if (options?.returnsResponse) {
        return Promise.resolve({ data: options.returnsResponse });
      }
      return Promise.resolve({
        data: {
          success: true,
          returns: mockReturnList,
          total: mockReturnList.length,
          page: requestedPage,
          limit: 10,
        },
      });
    }
    if (url.startsWith('/profile/returns/')) {
      if (typeof options?.detailResponse === 'function') {
        return (options.detailResponse as () => Promise<unknown>)();
      }
      if (options?.detailResponse instanceof Error) {
        return Promise.reject(options.detailResponse);
      }
      const requestedId = Number(url.replace('/profile/returns/', ''));
      const matched =
        (options?.detailResponse as ReturnRequestDto | undefined) ??
        mockReturnList.find((r) => r.id === requestedId) ??
        mockReturnList[0];
      return Promise.resolve({ data: { success: true, data: matched } });
    }
    return Promise.resolve({ data: { success: true, data: [] } });
  });

  return { getSpy };
}

async function openCreateReturnModal() {
  const openBtn = await screen.findByRole('button', { name: /\+ Tạo Yêu Cầu Đổi Trả/i });
  await waitFor(() => {
    expect(openBtn).not.toBeDisabled();
  });
  fireEvent.click(openBtn);
  return screen.findByRole('dialog');
}

describe('M6.4 Customer Returns — Frontend Integration Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('1. Displays customer return history from top-level { returns, total, page, limit } envelope', async () => {
    setLoggedIn();
    setupApiMocks();
    renderProfileRoute('/profile/return');

    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();
    expect(screen.getByText('RET-20261121-CD34')).toBeInTheDocument();
    expect(screen.getByText(/Phím Space bị kẹt sau 1 ngày sử dụng/i)).toBeInTheDocument();
    expect(screen.getByText(/Tổng cộng 2 yêu cầu đổi\/trả/i)).toBeInTheDocument();
    expect(screen.getByText(/Chờ duyệt \(PENDING\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ chối \(REJECTED\)/i)).toBeInTheDocument();
  });

  it('2. Displays loading state while return list query is pending', async () => {
    setLoggedIn();
    setupApiMocks({
      returnsResponse: () => new Promise(() => {}),
    });
    renderProfileRoute('/profile/return');

    expect(await screen.findByText('Đang tải danh sách yêu cầu đổi/trả...')).toBeInTheDocument();
  });

  it('3. Displays empty state when customer has 0 return requests', async () => {
    setLoggedIn();
    setupApiMocks({
      returnsResponse: {
        success: true,
        returns: [],
        total: 0,
        page: 1,
        limit: 10,
      },
    });
    renderProfileRoute('/profile/return');

    expect(await screen.findByText('Bạn chưa có yêu cầu đổi/trả nào.')).toBeInTheDocument();
  });

  it('4. Displays error state on API failure and retries cleanly when clicking Thử lại', async () => {
    setLoggedIn();
    let failFirst = true;
    setupApiMocks({
      returnsResponse: () =>
        failFirst
          ? Promise.reject(new Error('Lỗi kết nối máy chủ'))
          : Promise.resolve({
              data: {
                success: true,
                returns: mockReturnList,
                total: 2,
                page: 1,
                limit: 10,
              },
            }),
    });
    renderProfileRoute('/profile/return');

    expect(await screen.findByText('Lỗi kết nối máy chủ')).toBeInTheDocument();

    failFirst = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();
  });

  it('5. Supports pagination and passes page/limit parameters to GET /profile/returns', async () => {
    setLoggedIn();
    const { getSpy } = setupApiMocks({
      returnsResponse: {
        success: true,
        returns: mockReturnList,
        total: 15,
        page: 1,
        limit: 10,
      },
    });
    renderProfileRoute('/profile/return');

    expect(await screen.findByText('Trang 1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/profile/returns', {
        params: { page: 2, limit: 10 },
      });
    });
  });

  it('6. Opens detail modal via GET /profile/returns/:id and renders audit timeline only when provided', async () => {
    setLoggedIn();
    const { getSpy } = setupApiMocks();
    renderProfileRoute('/profile/return');

    const detailButtons = await screen.findAllByRole('button', { name: 'Xem chi tiết' });
    fireEvent.click(detailButtons[0]!);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Chi Tiết Yêu Cầu Đổi \/ Trả #501/i)).toBeInTheDocument();
    expect(
      await within(dialog).findByText('Khách hàng tạo yêu cầu đổi/trả mới.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Bàn phím cơ Keychron Q1 Pro')).toBeInTheDocument();
    expect(within(dialog).getByText(/SL: 1 • Đổi sản phẩm mới/i)).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith('/profile/returns/501');

    // Close and inspect item #502 (REJECTED with rejectionReason and empty auditLogs)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng' }));
    fireEvent.click(detailButtons[1]!);

    const dialog2 = await screen.findByRole('dialog');
    expect(await within(dialog2).findByText(/Thiếu hộp phụ kiện nguyên vẹn/i)).toBeInTheDocument();
    expect(within(dialog2).queryByText('Lịch sử xử lý yêu cầu')).not.toBeInTheDocument();
  });

  it('7. Creates a valid return request and invalidates returns + notifications caches', async () => {
    setLoggedIn();
    setupApiMocks();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        message: 'Gửi yêu cầu đổi/trả thành công.',
        data: mockReturnList[0],
      },
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderProfileRoute('/profile/return', queryClient);

    const dialog = await openCreateReturnModal();

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });
    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: '  Switch bị double click khi gõ nhanh  ' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Mô tả chi tiết bổ sung/i), {
      target: { value: 'Đã quay video minh chứng.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/profile/returns', {
        orderId: '9001',
        orderCode: 'NX-2026-9001',
        reason: 'Switch bị double click khi gõ nhanh',
        notes: 'Đã quay video minh chứng.',
        items: [
          {
            orderItemId: '701',
            productId: 101,
            quantity: 1,
            resolution: 'REFUND',
          },
        ],
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['customer-returns'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });

  it('8-10. Blocks non-DELIVERED, missing deliveredAt (no updatedAt fallback), and >7-day expired orders', async () => {
    setLoggedIn();
    setupApiMocks();
    const postSpy = vi.spyOn(apiClient, 'post');
    renderProfileRoute('/profile/return');

    const dialog = await openCreateReturnModal();
    const orderSelect = within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i);

    // Non-DELIVERED (PENDING)
    fireEvent.change(orderSelect, { target: { value: '9002' } });
    expect(
      within(dialog).getByText(/Chỉ những đơn hàng đã giao thành công \(DELIVERED\)/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' })).toBeDisabled();

    // Missing deliveredAt
    fireEvent.change(orderSelect, { target: { value: '9003' } });
    expect(
      within(dialog).getByText(/chưa có mốc thời gian giao hàng xác thực \(deliveredAt\)/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' })).toBeDisabled();

    // Past 7-day window from deliveredAt
    fireEvent.change(orderSelect, { target: { value: '9004' } });
    expect(
      within(dialog).getByText(
        /Thời hạn gửi yêu cầu đổi\/trả \(7 ngày kể từ ngày nhận hàng\) đã hết/i,
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' })).toBeDisabled();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('11. Calculates remainingEligible ignoring REJECTED requests and rejects quantity exceeding remaining limit', async () => {
    setLoggedIn();
    setupApiMocks();
    const postSpy = vi.spyOn(apiClient, 'post');
    renderProfileRoute('/profile/return');

    // Wait for mockReturnList to load so eligibility calculation knows about #501 (qty 1 PENDING) & #502 (qty 2 REJECTED)
    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();

    const dialog = await openCreateReturnModal();

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });

    // Ordered 3, 1 in PENDING, 2 in REJECTED (ignored) => remainingEligible MUST be 2
    const keychronRow = within(dialog)
      .getByText('Bàn phím cơ Keychron Q1 Pro')
      .closest('div')?.parentElement;
    expect(keychronRow).toHaveTextContent('Đã mua: 3');
    expect(keychronRow).toHaveTextContent('Còn đủ điều kiện: 2');

    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(
      within(dialog).getByLabelText(/Số lượng trả cho Bàn phím cơ Keychron Q1 Pro/i),
      {
        target: { value: '3' },
      },
    );
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: 'Lỗi mạch bàn phím' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    expect(
      await within(dialog).findByText(/vượt quá số lượng còn đủ điều kiện \(2\)/i),
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('12. Validates required items selection and reason min length (rejects whitespace-only reason)', async () => {
    setLoggedIn();
    setupApiMocks();
    const postSpy = vi.spyOn(apiClient, 'post');
    renderProfileRoute('/profile/return');

    const dialog = await openCreateReturnModal();

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });

    // Submit without selecting any product
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));
    expect(
      await within(dialog).findByText('Vui lòng chọn ít nhất 1 sản phẩm để đổi trả.'),
    ).toBeInTheDocument();

    // Select product but enter whitespace-only reason
    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: '     ' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    expect(await within(dialog).findByText('Lý do đổi trả tối thiểu 3 ký tự.')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('13-14. Supports multiple items with independent uppercase resolutions (REPLACE & REPAIR)', async () => {
    setLoggedIn();
    setupApiMocks();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        message: 'Gửi yêu cầu đổi/trả thành công.',
        data: mockReturnList[0],
      },
    });
    renderProfileRoute('/profile/return');
    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+ Tạo Yêu Cầu Đổi Trả/i }));
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });

    // Select both products
    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(
      within(dialog).getByLabelText(/Số lượng trả cho Bàn phím cơ Keychron Q1 Pro/i),
      {
        target: { value: '2' },
      },
    );
    fireEvent.change(
      within(dialog).getByLabelText(/Hình thức xử lý cho Bàn phím cơ Keychron Q1 Pro/i),
      { target: { value: 'REPLACE' } },
    );

    fireEvent.click(
      within(dialog).getByLabelText(/Chọn sản phẩm Chuột Logitech G Pro X Superlight 2/i),
    );
    fireEvent.change(
      within(dialog).getByLabelText(/Hình thức xử lý cho Chuột Logitech G Pro X Superlight 2/i),
      { target: { value: 'REPAIR' } },
    );

    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: 'Cả hai thiết bị đều lỗi kết nối wireless' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/profile/returns', {
        orderId: '9001',
        orderCode: 'NX-2026-9001',
        reason: 'Cả hai thiết bị đều lỗi kết nối wireless',
        items: [
          { orderItemId: '701', productId: 101, quantity: 2, resolution: 'REPLACE' },
          { orderItemId: '702', productId: 102, quantity: 1, resolution: 'REPAIR' },
        ],
      });
    });
  });

  it('15. Prevents duplicate POST submission on synchronous double-click while in flight', async () => {
    setLoggedIn();
    setupApiMocks();
    let resolvePost!: (val: unknown) => void;
    const postSpy = vi.spyOn(apiClient, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    renderProfileRoute('/profile/return');
    const dialog = await openCreateReturnModal();

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });
    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: 'Lỗi phần cứng nghiêm trọng' },
    });

    const submitBtn = within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' });
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
    expect(within(dialog).getByRole('button', { name: 'Đang gửi yêu cầu...' })).toBeDisabled();

    resolvePost({
      data: { success: true, message: 'OK', data: mockReturnList[0] },
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('16. Displays backend validation/eligibility error message without hiding it', async () => {
    setLoggedIn();
    setupApiMocks();
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'RETURN_QUANTITY_EXCEEDED',
            message: 'Số lượng yêu cầu vượt quá số lượng còn đủ điều kiện từ máy chủ.',
          },
        },
      },
    });

    renderProfileRoute('/profile/return');
    const dialog = await openCreateReturnModal();

    fireEvent.change(within(dialog).getByLabelText(/Chọn đơn hàng cần đổi\/trả/i), {
      target: { value: '9001' },
    });
    fireEvent.click(within(dialog).getByLabelText(/Chọn sản phẩm Bàn phím cơ Keychron Q1 Pro/i));
    fireEvent.change(within(dialog).getByLabelText(/Lý do đổi\/trả/i), {
      target: { value: 'Lỗi không nhận phím' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi Yêu Cầu Đổi Trả' }));

    expect(
      await within(dialog).findByText(
        'Số lượng yêu cầu vượt quá số lượng còn đủ điều kiện từ máy chủ.',
      ),
    ).toBeInTheDocument();
  });

  it('17-18. Exposes zero Admin actions, zero Edit/Cancel buttons, zero file uploads, and Guest does not call /profile/returns', async () => {
    // Part A: Guest
    const { getSpy } = setupApiMocks();
    renderProfileRoute('/profile/return');

    expect(
      await screen.findByText(/Vui lòng đăng nhập để xem lịch sử và gửi yêu cầu đổi\/trả hàng/i),
    ).toBeInTheDocument();
    expect(getSpy.mock.calls.map((c) => c[0])).not.toContain('/profile/returns');

    cleanup();
    vi.restoreAllMocks();

    // Part B: Logged-in Customer
    setLoggedIn();
    setupApiMocks();
    renderProfileRoute('/profile/return');
    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /Duyệt|Từ chối|Hoàn tất/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Hủy yêu cầu|Chỉnh sửa yêu cầu/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\+ Tạo Yêu Cầu Đổi Trả/i }));
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('19. Deep link /profile/return/:id opens Return Detail directly & tab click navigates to canonical /profile/return', async () => {
    setLoggedIn();
    const { getSpy } = setupApiMocks();
    renderProfileRoute('/profile/return/501');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Chi Tiết Yêu Cầu Đổi \/ Trả #501/i)).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledWith('/profile/returns/501');

    cleanup();
    vi.restoreAllMocks();

    // Clicking 'Yêu cầu đổi trả' tab from /profile must NOT hit 404 Not Found
    setLoggedIn();
    setupApiMocks();
    renderProfileRoute('/profile');

    fireEvent.click(await screen.findByRole('button', { name: /Yêu cầu đổi trả/i }));
    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();
    expect(screen.queryByText('404 Not Found')).not.toBeInTheDocument();
  });

  it('20. Logout removes cached customer-returns, detail, and orders queries to prevent leakage', async () => {
    setLoggedIn();
    setupApiMocks();
    const queryClient = createTestQueryClient();
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    renderProfileRoute('/profile/return', queryClient);
    expect(await screen.findByText('RET-20261122-AB12')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['customer-returns'] });
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['customer-return-detail'] });
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['my-orders'] });
    });
  });
});

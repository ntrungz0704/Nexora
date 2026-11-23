import { apiClient } from '../lib/apiClient';
import type {
  ApiSuccessEnvelope,
  CreateReturnRequestInput,
  OrderDto,
  ReturnRequestDto,
} from '@nexora/shared';

export interface PaginatedReturnsResponse {
  returns: ReturnRequestDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RawOwnReturnsEnvelope {
  success: true;
  returns: ReturnRequestDto[];
  total: number;
  page: number;
  limit: number;
}

interface RawCreateReturnEnvelope {
  success: true;
  message: string;
  data: ReturnRequestDto;
}

export interface CreateReturnResponse {
  message: string;
  data: ReturnRequestDto;
}

export type OrderIneligibilityCode =
  'ORDER_NOT_DELIVERED' | 'ORDER_MISSING_DELIVERED_DATE' | 'RETURN_WINDOW_EXPIRED';

export interface OrderReturnEligibility {
  eligible: boolean;
  code?: OrderIneligibilityCode;
  reason?: string;
  daysRemaining?: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const RETURN_WINDOW_DAYS = 7;

export function extractReturnErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as
    | {
        response?: {
          data?: {
            error?: {
              message?: string;
              details?: Array<{ field?: string; message?: string }>;
            };
          };
        };
      }
    | undefined;

  const firstDetail = errObj?.response?.data?.error?.details?.[0]?.message;
  if (firstDetail) {
    return firstDetail;
  }
  const apiMessage = errObj?.response?.data?.error?.message;
  if (apiMessage) {
    return apiMessage;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

/**
 * Kiểm tra điều kiện đổi/trả phía client phục vụ UX.
 * Backend luôn là nguồn xác thực cuối cùng. Không fallback sang updatedAt khi thiếu deliveredAt.
 */
export function checkOrderReturnEligibility(
  order: OrderDto,
  now: Date = new Date(),
): OrderReturnEligibility {
  if (order.orderStatus !== 'DELIVERED') {
    return {
      eligible: false,
      code: 'ORDER_NOT_DELIVERED',
      reason: 'Chỉ những đơn hàng đã giao thành công (DELIVERED) mới đủ điều kiện đổi/trả.',
    };
  }

  if (!order.deliveredAt) {
    return {
      eligible: false,
      code: 'ORDER_MISSING_DELIVERED_DATE',
      reason:
        'Đơn hàng chưa có mốc thời gian giao hàng xác thực (deliveredAt) để đối soát thời hạn 7 ngày.',
    };
  }

  const deliveredDate = new Date(order.deliveredAt);
  if (Number.isNaN(deliveredDate.getTime())) {
    return {
      eligible: false,
      code: 'ORDER_MISSING_DELIVERED_DATE',
      reason: 'Mốc thời gian giao hàng (deliveredAt) không hợp lệ.',
    };
  }

  const diffDays = (now.getTime() - deliveredDate.getTime()) / MS_PER_DAY;
  if (diffDays < 0) {
    return {
      eligible: false,
      code: 'ORDER_MISSING_DELIVERED_DATE',
      reason: 'Mốc thời gian giao hàng không hợp lệ.',
    };
  }

  if (diffDays > RETURN_WINDOW_DAYS) {
    return {
      eligible: false,
      code: 'RETURN_WINDOW_EXPIRED',
      reason: 'Thời hạn gửi yêu cầu đổi/trả (7 ngày kể từ ngày nhận hàng) đã hết.',
    };
  }

  return {
    eligible: true,
    daysRemaining: Math.max(0, Math.ceil(RETURN_WINDOW_DAYS - diffDays)),
  };
}

/**
 * Tính số lượng còn đủ điều kiện đổi/trả theo đúng công thức Backend:
 * remainingEligible = orderedQuantity - totalQuantityInPreviousNonRejectedRequests
 */
export function calculateRemainingReturnQuantity(
  orderedQuantity: number,
  orderItemId: string,
  existingReturns: ReturnRequestDto[],
): number {
  const targetId = String(orderItemId);
  let alreadyRequested = 0;

  for (const ret of existingReturns) {
    if (ret.status === 'REJECTED') {
      continue;
    }
    for (const item of ret.items ?? []) {
      if (String(item.orderItemId) === targetId) {
        alreadyRequested += item.quantity;
      }
    }
  }

  return Math.max(0, orderedQuantity - alreadyRequested);
}

function assertPositiveInt(value: number, errorMessage: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(errorMessage);
  }
}

export const returnService = {
  /**
   * Lấy danh sách yêu cầu đổi/trả của chính khách hàng hiện tại.
   * Backend trả { success: true, returns, total, page, limit } ở top-level (không có data wrapper).
   */
  async getOwnReturns(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedReturnsResponse> {
    const res = await apiClient.get<RawOwnReturnsEnvelope>('/profile/returns', { params });
    const returns = Array.isArray(res.data.returns) ? res.data.returns : [];
    const total = Number(res.data.total ?? 0);
    const page = Number(res.data.page ?? params?.page ?? 1);
    const limit = Number(res.data.limit ?? params?.limit ?? 10);
    return {
      returns,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
    };
  },

  /**
   * Lấy chi tiết một yêu cầu đổi/trả thuộc chính khách hàng hiện tại.
   */
  async getOwnReturnDetail(returnId: number): Promise<ReturnRequestDto> {
    assertPositiveInt(returnId, 'ID yêu cầu đổi/trả không hợp lệ.');
    const res = await apiClient.get<ApiSuccessEnvelope<ReturnRequestDto>>(
      `/profile/returns/${returnId}`,
    );
    return res.data.data;
  },

  /**
   * Tạo yêu cầu đổi/trả mới.
   */
  async createReturnRequest(input: CreateReturnRequestInput): Promise<CreateReturnResponse> {
    const res = await apiClient.post<RawCreateReturnEnvelope>('/profile/returns', input);
    return {
      message: res.data.message,
      data: res.data.data,
    };
  },

  /**
   * Lấy danh sách đơn hàng của khách hàng hiện tại (bao gồm deliveredAt và items[]).
   */
  async getMyOrders(): Promise<OrderDto[]> {
    const res = await apiClient.get<ApiSuccessEnvelope<OrderDto[]>>('/orders/my-orders');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};

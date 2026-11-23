import { apiClient } from '../lib/apiClient';
import type {
  ApiSuccessEnvelope,
  CreateReviewInput,
  ProductReviewsSummary,
  ReviewDto,
  UpdateReviewInput,
} from '@nexora/shared';

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedReviewsResponse {
  reviews: ReviewDto[];
  pagination: ReviewPagination;
  stats: ProductReviewsSummary;
}

interface RawPaginatedReviewsEnvelope {
  success: true;
  data: ReviewDto[];
  pagination: ReviewPagination;
  stats: ProductReviewsSummary;
}

export interface ReviewEligibilityDto {
  canReview: boolean;
  existingReview: ReviewDto | null;
}

export interface DeleteReviewResponse {
  success: true;
  message: string;
}

export function extractReviewErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as { response?: { data?: { error?: { message?: string } } } } | undefined;
  if (errObj?.response?.data?.error?.message) {
    return errObj.response.data.error.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

function assertPositiveInt(value: number, errorMessage: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(errorMessage);
  }
}

export const reviewService = {
  /**
   * Lấy danh sách đánh giá công khai (APPROVED) kèm phân trang và thống kê sao.
   * Backend trả data, pagination và stats ở cùng cấp top-level.
   */
  async getProductReviews(
    productIdOrSlug: number | string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedReviewsResponse> {
    const res = await apiClient.get<RawPaginatedReviewsEnvelope>(
      `/catalog/products/${productIdOrSlug}/reviews`,
      { params },
    );
    return {
      reviews: res.data.data,
      pagination: res.data.pagination,
      stats: res.data.stats,
    };
  },

  /**
   * Kiểm tra điều kiện đánh giá (Verified Purchase) và đánh giá hiện có của người dùng.
   */
  async getReviewEligibility(productIdOrSlug: number | string): Promise<ReviewEligibilityDto> {
    const res = await apiClient.get<ApiSuccessEnvelope<ReviewEligibilityDto>>(
      `/catalog/products/${productIdOrSlug}/reviews/eligibility`,
    );
    return res.data.data;
  },

  /**
   * Gửi đánh giá mới cho sản phẩm.
   * Endpoint POST yêu cầu productId dạng số nguyên dương.
   */
  async createReview(productId: number, input: CreateReviewInput): Promise<ReviewDto> {
    assertPositiveInt(productId, 'ID sản phẩm không hợp lệ.');
    const res = await apiClient.post<ApiSuccessEnvelope<ReviewDto>>(
      `/catalog/products/${productId}/reviews`,
      input,
    );
    return res.data.data;
  },

  /**
   * Chỉnh sửa đánh giá hiện có của chính người dùng.
   */
  async updateReview(reviewId: number, input: UpdateReviewInput): Promise<ReviewDto> {
    assertPositiveInt(reviewId, 'ID đánh giá không hợp lệ.');
    const res = await apiClient.put<ApiSuccessEnvelope<ReviewDto>>(
      `/catalog/reviews/${reviewId}`,
      input,
    );
    return res.data.data;
  },

  /**
   * Xóa đánh giá hiện có của chính người dùng.
   * Backend trả { success: true, message } ở top-level (không có thuộc tính data).
   */
  async deleteReview(reviewId: number): Promise<DeleteReviewResponse> {
    assertPositiveInt(reviewId, 'ID đánh giá không hợp lệ.');
    const res = await apiClient.delete<DeleteReviewResponse>(`/catalog/reviews/${reviewId}`);
    return {
      success: res.data.success,
      message: res.data.message,
    };
  },
};

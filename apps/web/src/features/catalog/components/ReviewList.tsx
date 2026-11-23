import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser, ReviewDto } from '@nexora/shared';
import type {
  PaginatedReviewsResponse,
  ReviewEligibilityDto,
} from '../../../services/reviewService';

export interface ReviewListProps {
  currentUser: AuthUser | null;
  reviewsData?: PaginatedReviewsResponse;
  isLoadingReviews: boolean;
  isErrorReviews: boolean;
  onRetryReviews: () => void;
  page: number;
  onPageChange: (nextPage: number) => void;
  eligibility?: ReviewEligibilityDto;
  isLoadingEligibility: boolean;
  isErrorEligibility: boolean;
  onRetryEligibility: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (review: ReviewDto) => void;
  onConfirmDelete: (reviewId: number) => Promise<void> | void;
  isDeleting: boolean;
  deleteError?: string | null;
}

const STAR_LEVELS: Array<5 | 4 | 3 | 2 | 1> = [5, 4, 3, 2, 1];

function formatReviewDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function renderStars(rating: number, size = '13px') {
  const rounded = Math.round(rating);
  return (
    <span
      aria-label={`${rating} trên 5 sao`}
      style={{ color: '#FACC15', fontSize: size, display: 'inline-flex', gap: '2px' }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rounded ? 'fa-solid fa-star' : 'fa-regular fa-star'}
          style={{ color: star <= rounded ? '#FACC15' : '#D1D5DB' }}
        ></i>
      ))}
    </span>
  );
}

export const ReviewList: React.FC<ReviewListProps> = ({
  currentUser,
  reviewsData,
  isLoadingReviews,
  isErrorReviews,
  onRetryReviews,
  page,
  onPageChange,
  eligibility,
  isLoadingEligibility,
  isErrorEligibility,
  onRetryEligibility,
  onOpenCreateModal,
  onOpenEditModal,
  onConfirmDelete,
  isDeleting,
  deleteError,
}) => {
  const [pendingDeleteReview, setPendingDeleteReview] = useState<ReviewDto | null>(null);

  const stats = reviewsData?.stats ?? {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  const reviews = reviewsData?.reviews ?? [];
  const pagination = reviewsData?.pagination ?? {
    page,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const existingReview = eligibility?.existingReview ?? null;

  const handleConfirmDeleteClick = async () => {
    if (!pendingDeleteReview || isDeleting) {
      return;
    }
    try {
      await onConfirmDelete(pendingDeleteReview.id);
      setPendingDeleteReview(null);
    } catch {
      // Lỗi đã được hiển thị qua deleteError prop, giữ dialog mở để người dùng biết
    }
  };

  return (
    <div>
      {/* 1. Rating Overview & 1-5 Star Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          alignItems: 'center',
          padding: '20px',
          borderRadius: '14px',
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border, #E5E7EB)',
          marginBottom: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            data-testid="reviews-average-rating"
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: 'var(--primary, #0A5BFF)',
              lineHeight: 1.1,
            }}
          >
            {stats.averageRating.toFixed(1)}
          </div>
          <div style={{ margin: '8px 0' }}>{renderStars(stats.averageRating, '16px')}</div>
          <div
            data-testid="reviews-total-count"
            style={{ fontSize: '13px', color: 'var(--text-secondary, #6B7280)', fontWeight: 600 }}
          >
            Dựa trên {stats.totalReviews} đánh giá
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STAR_LEVELS.map((star) => {
            const count = stats.ratingBreakdown[star] ?? 0;
            const percent =
              stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <div
                key={star}
                data-testid={`rating-distribution-${star}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <span
                  style={{
                    minWidth: '46px',
                    fontWeight: 700,
                    color: 'var(--text-primary, #111827)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {star}{' '}
                  <i
                    className="fa-solid fa-star"
                    style={{ color: '#FACC15', fontSize: '11px' }}
                  ></i>
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '999px',
                    backgroundColor: '#E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: '#FACC15',
                      borderRadius: '999px',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    minWidth: '64px',
                    textAlign: 'right',
                    color: 'var(--text-secondary, #6B7280)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {count} đánh giá
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Customer Auth & Eligibility Action Area */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border, #E5E7EB)',
          backgroundColor: '#FFFFFF',
          marginBottom: '24px',
        }}
      >
        {!currentUser ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-secondary, #4B5563)' }}>
              Vui lòng đăng nhập để kiểm tra điều kiện và gửi đánh giá cho sản phẩm này.
            </span>
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #0A5BFF)',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              Đăng nhập để đánh giá
            </Link>
          </div>
        ) : isLoadingEligibility ? (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #6B7280)' }}>
            Đang kiểm tra điều kiện đánh giá...
          </div>
        ) : isErrorEligibility ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#B91C1C' }}>
              Không thể kiểm tra điều kiện đánh giá. Vui lòng thử lại.
            </span>
            <button
              type="button"
              onClick={onRetryEligibility}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border, #D1D5DB)',
                backgroundColor: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        ) : existingReview ? (
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #111827)' }}>
                  Đánh giá của bạn
                </strong>
                {existingReview.isVerifiedPurchase && (
                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                    <i className="fa-solid fa-circle-check"></i> Đã mua hàng
                  </span>
                )}
                {existingReview.status === 'HIDDEN' && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#B45309',
                      backgroundColor: '#FEF3C7',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700,
                    }}
                  >
                    Đang bị ẩn bởi quản trị viên
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onOpenEditModal(existingReview)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--primary, #0A5BFF)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--primary, #0A5BFF)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Chỉnh sửa đánh giá
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteReview(existingReview)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Xóa đánh giá
                </button>
              </div>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}
            >
              {renderStars(existingReview.rating, '12px')}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #6B7280)' }}>
                {formatReviewDate(existingReview.createdAt)}
              </span>
            </div>

            {existingReview.comment ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--text-primary, #1F2937)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {existingReview.comment}
              </p>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary, #6B7280)',
                }}
              >
                Bạn đã chấm điểm số sao mà không kèm nhận xét văn bản.
              </p>
            )}
          </div>
        ) : eligibility?.canReview ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-primary, #1F2937)' }}>
              Bạn đã mua và nhận sản phẩm này. Hãy chia sẻ cảm nhận của bạn!
            </span>
            <button
              type="button"
              onClick={onOpenCreateModal}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #0A5BFF)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Viết đánh giá sản phẩm
            </button>
          </div>
        ) : (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #4B5563)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary, #0A5BFF)' }}></i>
            <span>Chỉ khách hàng đã mua và nhận sản phẩm thành công mới có thể gửi đánh giá.</span>
          </div>
        )}
      </div>

      {/* 3. Public Approved Reviews Listing */}
      <div style={{ borderTop: '1px solid var(--border, #E5E7EB)', paddingTop: '20px' }}>
        {isLoadingReviews ? (
          <div
            role="status"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-secondary, #6B7280)',
              fontSize: '14px',
            }}
          >
            Đang tải đánh giá sản phẩm...
          </div>
        ) : isErrorReviews ? (
          <div
            role="alert"
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              backgroundColor: '#FEF2F2',
              borderRadius: '12px',
              border: '1px solid #FECACA',
            }}
          >
            <p
              style={{ margin: '0 0 12px 0', color: '#B91C1C', fontSize: '14px', fontWeight: 600 }}
            >
              Không thể tải danh sách đánh giá. Vui lòng thử lại sau.
            </p>
            <button
              type="button"
              onClick={onRetryReviews}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #FCA5A5',
                backgroundColor: '#FFFFFF',
                color: '#B91C1C',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 16px',
              color: 'var(--text-secondary, #6B7280)',
              fontSize: '14px',
            }}
          >
            Chưa có đánh giá nào cho sản phẩm này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border, #F1F5F9)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {review.userAvatar ? (
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border, #E5E7EB)',
                        }}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: '#E0EAFF',
                          color: 'var(--primary, #0A5BFF)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '13px',
                        }}
                      >
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary, #111827)' }}>
                          {review.userName}
                        </strong>
                        {review.isVerifiedPurchase && (
                          <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                            <i className="fa-solid fa-circle-check"></i> Đã mua hàng
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '2px',
                        }}
                      >
                        {renderStars(review.rating, '11px')}
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary, #6B7280)' }}>
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p
                    style={{
                      margin: '10px 0 0 44px',
                      fontSize: '13px',
                      lineHeight: 1.65,
                      color: 'var(--text-primary, #1F2937)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {review.comment}
                  </p>
                )}
              </article>
            ))}

            {/* 4. Pagination */}
            {pagination.totalPages > 1 && (
              <nav
                aria-label="Phân trang đánh giá"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #D1D5DB)',
                    backgroundColor: '#FFFFFF',
                    color: pagination.page <= 1 ? '#9CA3AF' : 'var(--text-primary, #111827)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Trang trước
                </button>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #4B5563)',
                  }}
                >
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #D1D5DB)',
                    backgroundColor: '#FFFFFF',
                    color:
                      pagination.page >= pagination.totalPages
                        ? '#9CA3AF'
                        : 'var(--text-primary, #111827)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Trang sau
                </button>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* 5. Delete Confirmation Modal */}
      {pendingDeleteReview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-review-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            <h3
              id="delete-review-modal-title"
              style={{
                margin: '0 0 10px 0',
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--text-primary, #111827)',
              }}
            >
              Xác nhận xóa đánh giá
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-secondary, #4B5563)',
              }}
            >
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </p>

            {deleteError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '14px',
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPendingDeleteReview(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #D1D5DB)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary, #111827)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteClick}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isDeleting ? '#FCA5A5' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { CreateReviewInputSchema, type CreateReviewInput, type ReviewDto } from '@nexora/shared';

const RATING_LABELS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

export interface ReviewFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productName?: string;
  existingReview?: ReviewDto | null;
  isSubmitting: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateReviewInput) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  mode,
  productName,
  existingReview,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(() =>
    mode === 'edit' && existingReview ? existingReview.rating : 5,
  );
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(() =>
    mode === 'edit' && existingReview ? (existingReview.comment ?? '') : '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const submitGuardRef = useRef(false);

  useEffect(() => {
    if (!isSubmitting) {
      submitGuardRef.current = false;
    }
  }, [isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const activeRating = hoveredRating ?? rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitGuardRef.current) {
      return;
    }

    // Chặn chuỗi chỉ gồm khoảng trắng — không để vượt qua như nhận xét có nghĩa
    if (comment.length > 0 && comment.trim().length === 0) {
      setValidationError('Nhận xét không được chỉ chứa khoảng trắng.');
      return;
    }

    const parsed = CreateReviewInputSchema.safeParse({
      rating,
      comment,
    });

    if (!parsed.success) {
      const firstMsg = parsed.error.issues[0]?.message || 'Dữ liệu đánh giá không hợp lệ.';
      setValidationError(firstMsg);
      return;
    }

    setValidationError(null);
    submitGuardRef.current = true;
    const trimmedComment = parsed.data.comment ?? '';
    onSubmit({
      rating: parsed.data.rating,
      comment: trimmedComment,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-form-modal-title"
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
          maxWidth: '520px',
          padding: '24px 28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h3
            id="review-form-modal-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-primary, #111827)',
            }}
          >
            {mode === 'edit' ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá sản phẩm'}
          </h3>
          <button
            type="button"
            aria-label="Đóng hộp thoại đánh giá"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: 'var(--text-secondary, #6B7280)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {productName && (
          <p
            style={{
              margin: '0 0 18px 0',
              fontSize: '13px',
              color: 'var(--text-secondary, #6B7280)',
              lineHeight: 1.5,
            }}
          >
            Sản phẩm:{' '}
            <strong style={{ color: 'var(--text-primary, #111827)' }}>{productName}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-primary, #111827)',
              }}
            >
              Mức độ hài lòng của bạn <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Chọn ${star} sao`}
                    aria-pressed={star === rating}
                    disabled={isSubmitting}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => {
                      setRating(star);
                      setValidationError(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '26px',
                      color: isSelected ? '#FACC15' : '#D1D5DB',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    <i className={isSelected ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                  </button>
                );
              })}
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--primary, #0A5BFF)',
                }}
              >
                {rating}/5 — {RATING_LABELS[rating]}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="review-comment-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-primary, #111827)',
              }}
            >
              Nhận xét chi tiết (tùy chọn, 5–1000 ký tự nếu nhập)
            </label>
            <textarea
              id="review-comment-input"
              rows={4}
              value={comment}
              disabled={isSubmitting}
              onChange={(e) => {
                setComment(e.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              placeholder="Chia sẻ trải nghiệm thực tế của bạn về hiệu năng, thiết kế, chất lượng đóng gói..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border, #D1D5DB)',
                fontSize: '13px',
                lineHeight: 1.6,
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary, #6B7280)',
              }}
            >
              <span>Để trống nếu bạn chỉ muốn chấm điểm số sao.</span>
              <span>{comment.trim().length}/1000</span>
            </div>
          </div>

          {validationError && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              {validationError}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              {serverError}
            </div>
          )}

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border, #D1D5DB)',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-primary, #111827)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isSubmitting ? '#93C5FD' : 'var(--primary, #0A5BFF)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Đang gửi...' : mode === 'edit' ? 'Lưu thay đổi' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

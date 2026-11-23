import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateReturnRequestInputSchema,
  type AuthUser,
  type CreateReturnRequestInput,
  type OrderDto,
  type ReturnRequestDto,
  type ReturnRequestStatus,
  type ReturnResolution,
} from '@nexora/shared';
import {
  calculateRemainingReturnQuantity,
  checkOrderReturnEligibility,
  extractReturnErrorMessage,
  returnService,
} from '../../../services/returnService';

const RETURNS_PAGE_LIMIT = 10;

const STATUS_META: Record<
  ReturnRequestStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  PENDING: { label: 'Chờ duyệt', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  APPROVED: { label: 'Đã duyệt', bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  PROCESSING: { label: 'Đang xử lý', bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  COMPLETED: { label: 'Hoàn tất', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  REJECTED: { label: 'Từ chối', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
};

const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  REFUND: 'Hoàn tiền',
  REPLACE: 'Đổi sản phẩm mới',
  REPAIR: 'Bảo hành sửa chữa',
};

const VALID_RESOLUTIONS: ReturnResolution[] = ['REFUND', 'REPLACE', 'REPAIR'];

interface ItemSelectionState {
  selected: boolean;
  quantity: number;
  resolution: ReturnResolution;
}

export interface CustomerReturnsTabProps {
  currentUser: AuthUser | null;
  orders: OrderDto[];
  isLoadingOrders?: boolean;
  initialReturnId?: number | null;
  preselectedOrderId?: string | null;
  onClearPreselectedOrder?: () => void;
  onNavigateReturnDetail?: (returnId: number | null) => void;
  onNotify: (msg: string) => void;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function renderStatusBadge(status: ReturnRequestStatus) {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11.5px',
        fontWeight: 700,
        backgroundColor: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    >
      {meta.label} ({status})
    </span>
  );
}

interface CreateReturnFormModalProps {
  isOpen: boolean;
  orders: OrderDto[];
  existingReturns: ReturnRequestDto[];
  initialOrderId: string;
  isSubmitting: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateReturnRequestInput) => void;
}

const CreateReturnFormModal: React.FC<CreateReturnFormModalProps> = ({
  isOpen,
  orders,
  existingReturns,
  initialOrderId,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [itemSelections, setItemSelections] = useState<Record<string, ItemSelectionState>>({});
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const submitGuardRef = useRef(false);

  useEffect(() => {
    if (!isSubmitting) {
      submitGuardRef.current = false;
    }
  }, [isSubmitting]);

  const selectedOrder = useMemo(
    () => orders.find((o) => String(o.id) === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectedOrderEligibility = useMemo(
    () => (selectedOrder ? checkOrderReturnEligibility(selectedOrder) : null),
    [selectedOrder],
  );

  const orderExistingReturns = useMemo(() => {
    if (!selectedOrder) return [];
    return existingReturns.filter((r) => String(r.orderId) === String(selectedOrder.id));
  }, [existingReturns, selectedOrder]);

  if (!isOpen) {
    return null;
  }

  const handleOrderChange = (nextOrderId: string) => {
    setSelectedOrderId(nextOrderId);
    setItemSelections({});
    setValidationError(null);
  };

  const getSelection = (orderItemId: string): ItemSelectionState => {
    return (
      itemSelections[orderItemId] ?? {
        selected: false,
        quantity: 1,
        resolution: 'REFUND',
      }
    );
  };

  const updateItemSelection = (orderItemId: string, patch: Partial<ItemSelectionState>) => {
    setItemSelections((prev) => {
      const current = prev[orderItemId] ?? {
        selected: false,
        quantity: 1,
        resolution: 'REFUND' as ReturnResolution,
      };
      return {
        ...prev,
        [orderItemId]: { ...current, ...patch },
      };
    });
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitGuardRef.current) {
      return;
    }

    if (!selectedOrder) {
      setValidationError('Vui lòng chọn đơn hàng cần đổi/trả.');
      return;
    }

    if (selectedOrderEligibility && !selectedOrderEligibility.eligible) {
      setValidationError(
        selectedOrderEligibility.reason || 'Đơn hàng không đủ điều kiện gửi yêu cầu đổi/trả.',
      );
      return;
    }

    const orderItems = selectedOrder.items ?? [];
    const chosenItems: Array<{
      orderItemId: string;
      productId?: number;
      quantity: number;
      resolution: ReturnResolution;
    }> = [];

    for (const orderItem of orderItems) {
      const sel = itemSelections[String(orderItem.id)];
      if (!sel?.selected) {
        continue;
      }

      const remaining = calculateRemainingReturnQuantity(
        orderItem.quantity,
        String(orderItem.id),
        orderExistingReturns,
      );

      if (remaining <= 0) {
        setValidationError(
          `Sản phẩm "${orderItem.productName}" đã được yêu cầu đổi/trả toàn bộ số lượng.`,
        );
        return;
      }

      if (!Number.isInteger(sel.quantity) || sel.quantity < 1) {
        setValidationError(`Số lượng đổi/trả cho "${orderItem.productName}" phải lớn hơn 0.`);
        return;
      }

      if (sel.quantity > remaining) {
        setValidationError(
          `Số lượng yêu cầu (${sel.quantity}) vượt quá số lượng còn đủ điều kiện (${remaining}) cho "${orderItem.productName}".`,
        );
        return;
      }

      if (!VALID_RESOLUTIONS.includes(sel.resolution)) {
        setValidationError('Hình thức xử lý phải là REFUND, REPLACE hoặc REPAIR.');
        return;
      }

      chosenItems.push({
        orderItemId: String(orderItem.id),
        ...(orderItem.productId ? { productId: orderItem.productId } : {}),
        quantity: sel.quantity,
        resolution: sel.resolution,
      });
    }

    if (chosenItems.length === 0) {
      setValidationError('Vui lòng chọn ít nhất 1 sản phẩm để đổi trả.');
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      setValidationError('Lý do đổi trả tối thiểu 3 ký tự.');
      return;
    }

    const trimmedNotes = notes.trim();
    const candidatePayload = {
      orderId: String(selectedOrder.id),
      orderCode: selectedOrder.orderCode,
      reason: trimmedReason,
      ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
      items: chosenItems,
    };

    const parsed = CreateReturnRequestInputSchema.safeParse(candidatePayload);
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message || 'Dữ liệu yêu cầu đổi/trả không hợp lệ.',
      );
      return;
    }

    setValidationError(null);
    submitGuardRef.current = true;
    onSubmit(parsed.data);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-return-modal-title"
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
          maxWidth: '660px',
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
            id="create-return-modal-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}
          >
            Tạo Yêu Cầu Đổi / Trả Hàng
          </h3>
          <button
            type="button"
            aria-label="Đóng hộp thoại tạo yêu cầu đổi trả"
            disabled={isSubmitting}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#64748B',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* 1. Chọn đơn hàng */}
          <div>
            <label
              htmlFor="return-order-select"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Chọn đơn hàng cần đổi/trả <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id="return-order-select"
              value={selectedOrderId}
              disabled={isSubmitting}
              onChange={(e) => handleOrderChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="">-- Chọn đơn hàng của bạn --</option>
              {orders.map((order) => {
                const eligibility = checkOrderReturnEligibility(order);
                const badgeText = eligibility.eligible
                  ? `Đủ điều kiện (còn ${eligibility.daysRemaining ?? 0} ngày)`
                  : order.orderStatus !== 'DELIVERED'
                    ? `Chưa giao (${order.orderStatus})`
                    : !order.deliveredAt
                      ? 'Thiếu ngày giao hàng'
                      : 'Quá hạn 7 ngày';
                return (
                  <option key={order.id} value={String(order.id)}>
                    {order.orderCode} • {formatDateOnly(order.createdAt)} • {badgeText}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Cảnh báo nếu đơn hàng được chọn không đủ điều kiện */}
          {selectedOrder && selectedOrderEligibility && !selectedOrderEligibility.eligible && (
            <div
              role="alert"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {selectedOrderEligibility.reason}
            </div>
          )}

          {/* 2. Danh sách sản phẩm thuộc đơn hàng đủ điều kiện */}
          {selectedOrder && selectedOrderEligibility?.eligible && (
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                Chọn sản phẩm, số lượng và hình thức xử lý{' '}
                <span style={{ color: '#EF4444' }}>*</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(selectedOrder.items ?? []).map((item) => {
                  const itemIdStr = String(item.id);
                  const remaining = calculateRemainingReturnQuantity(
                    item.quantity,
                    itemIdStr,
                    orderExistingReturns,
                  );
                  const sel = getSelection(itemIdStr);
                  const isExhausted = remaining <= 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        border: sel.selected ? '1.5px solid #0A5BFF' : '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        backgroundColor: isExhausted ? '#F8FAFC' : '#FFFFFF',
                        opacity: isExhausted ? 0.7 : 1,
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          cursor: isExhausted ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Chọn sản phẩm ${item.productName}`}
                          checked={sel.selected}
                          disabled={isSubmitting || isExhausted}
                          onChange={(e) =>
                            updateItemSelection(itemIdStr, {
                              selected: e.target.checked,
                              quantity: Math.min(Math.max(1, sel.quantity), Math.max(1, remaining)),
                            })
                          }
                          style={{ marginTop: '3px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            SKU: {item.productSku} • Đã mua: {item.quantity} •{' '}
                            {isExhausted ? (
                              <span style={{ color: '#DC2626', fontWeight: 700 }}>
                                Đã yêu cầu toàn bộ số lượng
                              </span>
                            ) : (
                              <span style={{ color: '#15803D', fontWeight: 700 }}>
                                Còn đủ điều kiện: {remaining}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>

                      {sel.selected && !isExhausted && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '10px',
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid #F1F5F9',
                          }}
                        >
                          <div>
                            <label
                              htmlFor={`return-qty-${itemIdStr}`}
                              style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#475569',
                                marginBottom: '4px',
                              }}
                            >
                              Số lượng trả (tối đa {remaining})
                            </label>
                            <input
                              id={`return-qty-${itemIdStr}`}
                              aria-label={`Số lượng trả cho ${item.productName}`}
                              type="number"
                              min={1}
                              max={remaining}
                              value={sel.quantity}
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateItemSelection(itemIdStr, {
                                  quantity: Number(e.target.value),
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`return-res-${itemIdStr}`}
                              style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#475569',
                                marginBottom: '4px',
                              }}
                            >
                              Hình thức xử lý
                            </label>
                            <select
                              id={`return-res-${itemIdStr}`}
                              aria-label={`Hình thức xử lý cho ${item.productName}`}
                              value={sel.resolution}
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateItemSelection(itemIdStr, {
                                  resolution: e.target.value as ReturnResolution,
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                                backgroundColor: '#FFFFFF',
                                boxSizing: 'border-box',
                              }}
                            >
                              <option value="REFUND">Hoàn tiền (REFUND)</option>
                              <option value="REPLACE">Đổi sản phẩm mới (REPLACE)</option>
                              <option value="REPAIR">Bảo hành sửa chữa (REPAIR)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Lý do đổi/trả */}
          <div>
            <label
              htmlFor="return-reason-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Lý do đổi/trả (3–255 ký tự) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="return-reason-input"
              type="text"
              value={reason}
              disabled={isSubmitting}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ví dụ: Sản phẩm lỗi kết nối, màn hình bị sọc, giao sai mẫu..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', textAlign: 'right' }}
            >
              {reason.trim().length}/255
            </div>
          </div>

          {/* 4. Mô tả chi tiết (tùy chọn) */}
          <div>
            <label
              htmlFor="return-notes-input"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Mô tả chi tiết bổ sung (tùy chọn, tối đa 2000 ký tự)
            </label>
            <textarea
              id="return-notes-input"
              rows={3}
              value={notes}
              disabled={isSubmitting}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Mô tả cụ thể hiện tượng lỗi hoặc tình trạng đóng gói khi nhận hàng..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', textAlign: 'right' }}
            >
              {notes.trim().length}/2000
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
              }}
            >
              {serverError}
            </div>
          )}

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}
          >
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || Boolean(selectedOrder && !selectedOrderEligibility?.eligible)
              }
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor:
                  isSubmitting || Boolean(selectedOrder && !selectedOrderEligibility?.eligible)
                    ? '#93C5FD'
                    : '#0A5BFF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor:
                  isSubmitting || Boolean(selectedOrder && !selectedOrderEligibility?.eligible)
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Đổi Trả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CustomerReturnsTab: React.FC<CustomerReturnsTabProps> = ({
  currentUser,
  orders,
  isLoadingOrders = false,
  initialReturnId = null,
  preselectedOrderId = null,
  onClearPreselectedOrder,
  onNavigateReturnDetail,
  onNotify,
}) => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [manualSelectedReturnId, setManualSelectedReturnId] = useState<number | null>(null);
  const [dismissedInitialId, setDismissedInitialId] = useState<number | null>(null);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [createModalVersion, setCreateModalVersion] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const activeDetailId =
    manualSelectedReturnId ??
    (initialReturnId && initialReturnId !== dismissedInitialId ? initialReturnId : null);

  const isCreateModalOpen = isManualCreateOpen || Boolean(preselectedOrderId);

  const {
    data: returnsData,
    isLoading: isLoadingReturns,
    isError: isErrorReturns,
    error: returnsError,
    refetch: refetchReturns,
  } = useQuery({
    queryKey: ['customer-returns', currentUser?.id, page, RETURNS_PAGE_LIMIT],
    queryFn: () => returnService.getOwnReturns({ page, limit: RETURNS_PAGE_LIMIT }),
    enabled: Boolean(currentUser),
  });

  const {
    data: detailData,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError,
    refetch: refetchDetail,
  } = useQuery<ReturnRequestDto>({
    queryKey: ['customer-return-detail', currentUser?.id, activeDetailId],
    queryFn: () => returnService.getOwnReturnDetail(activeDetailId!),
    enabled: Boolean(currentUser && activeDetailId),
  });

  const createReturnMutation = useMutation({
    mutationFn: (payload: CreateReturnRequestInput) => returnService.createReturnRequest(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setPage(1);
      setIsManualCreateOpen(false);
      onClearPreselectedOrder?.();
      setServerError(null);
      onNotify(res.message || 'Gửi yêu cầu đổi/trả thành công.');
    },
    onError: (err: unknown) => {
      setServerError(
        extractReturnErrorMessage(err, 'Gửi yêu cầu đổi/trả thất bại. Vui lòng thử lại.'),
      );
    },
  });

  const handleOpenCreateModal = () => {
    setServerError(null);
    setCreateModalVersion((v) => v + 1);
    setIsManualCreateOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (createReturnMutation.isPending) {
      return;
    }
    setIsManualCreateOpen(false);
    onClearPreselectedOrder?.();
    setServerError(null);
  };

  const handleOpenDetail = (returnId: number) => {
    setManualSelectedReturnId(returnId);
    onNavigateReturnDetail?.(returnId);
  };

  const handleCloseDetail = () => {
    if (initialReturnId) {
      setDismissedInitialId(initialReturnId);
    }
    setManualSelectedReturnId(null);
    onNavigateReturnDetail?.(null);
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
        <p style={{ marginBottom: '12px' }}>
          Vui lòng đăng nhập để xem lịch sử và gửi yêu cầu đổi/trả hàng.
        </p>
        <Link
          to="/auth/login"
          style={{
            display: 'inline-block',
            padding: '9px 18px',
            borderRadius: '8px',
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '13.5px',
          }}
        >
          Đăng nhập tài khoản
        </Link>
      </div>
    );
  }

  const returnsList = returnsData?.returns ?? [];
  const totalPages = returnsData?.totalPages ?? 1;
  const totalReturns = returnsData?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '18px',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: '12px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Yêu Cầu Đổi Trả &amp; Hoàn Tiền
        </h3>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          disabled={isLoadingOrders}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
          }}
        >
          + Tạo Yêu Cầu Đổi Trả
        </button>
      </div>

      {/* Policy Notice */}
      <div
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          Nexora hỗ trợ gửi yêu cầu đổi/trả trong vòng <strong>7 ngày</strong> kể từ ngày giao hàng
          thành công (<strong>DELIVERED</strong>). Yêu cầu sẽ được bộ phận chăm sóc khách hàng tiếp
          nhận và xử lý theo quy trình duyệt.
        </p>
      </div>

      {/* Returns History */}
      {isLoadingReturns ? (
        <div
          role="status"
          style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}
        >
          Đang tải danh sách yêu cầu đổi/trả...
        </div>
      ) : isErrorReturns ? (
        <div
          role="alert"
          style={{
            padding: '24px 18px',
            borderRadius: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            textAlign: 'center',
          }}
        >
          <p
            style={{ margin: '0 0 12px 0', color: '#B91C1C', fontSize: '13.5px', fontWeight: 600 }}
          >
            {extractReturnErrorMessage(
              returnsError,
              'Không thể tải danh sách yêu cầu đổi/trả. Vui lòng thử lại.',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              void refetchReturns();
            }}
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
      ) : returnsList.length === 0 ? (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: '#64748B',
            border: '1px dashed #CBD5E1',
            borderRadius: '12px',
          }}
        >
          <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#334155', fontSize: '14px' }}>
            Bạn chưa có yêu cầu đổi/trả nào.
          </p>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Nếu đơn hàng đã giao gặp sự cố trong vòng 7 ngày, bạn có thể nhấn &ldquo;Tạo Yêu Cầu Đổi
            Trả&rdquo; ở góc trên.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
            Tổng cộng {totalReturns} yêu cầu đổi/trả
          </div>

          {returnsList.map((ret) => {
            const totalUnits = (ret.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
            const itemCount = ret.items?.length ?? 0;

            return (
              <article
                key={ret.id}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}
                  >
                    <strong style={{ color: '#0A5BFF', fontSize: '14.5px' }}>
                      {ret.returnCode}
                    </strong>
                    {ret.orderCode && (
                      <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                        Đơn hàng: {ret.orderCode}
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      • {formatDateOnly(ret.createdAt)}
                    </span>
                  </div>
                  {renderStatusBadge(ret.status)}
                </div>

                <div style={{ fontSize: '13.5px', color: '#1E293B' }}>
                  <strong>Lý do:</strong> {ret.reason}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                    {itemCount} mặt hàng ({totalUnits} sản phẩm)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(ret.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid #0A5BFF',
                      backgroundColor: '#FFFFFF',
                      color: '#0A5BFF',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            );
          })}

          {totalPages > 1 && (
            <nav
              aria-label="Phân trang yêu cầu đổi trả"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: page <= 1 ? '#94A3B8' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Trang trước
              </button>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: page >= totalPages ? '#94A3B8' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Trang sau
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Create Return Request Modal */}
      <CreateReturnFormModal
        key={`create-return-${createModalVersion}-${preselectedOrderId ?? 'none'}-${isCreateModalOpen ? 'open' : 'closed'}`}
        isOpen={isCreateModalOpen}
        orders={orders}
        existingReturns={returnsList}
        initialOrderId={preselectedOrderId ?? ''}
        isSubmitting={createReturnMutation.isPending}
        serverError={serverError}
        onClose={handleCloseCreateModal}
        onSubmit={(payload) => createReturnMutation.mutate(payload)}
      />

      {/* Return Detail Modal */}
      {activeDetailId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-detail-modal-title"
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
              maxWidth: '640px',
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
                borderBottom: '1px solid #F1F5F9',
                paddingBottom: '12px',
              }}
            >
              <h3
                id="return-detail-modal-title"
                style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}
              >
                Chi Tiết Yêu Cầu Đổi / Trả #{activeDetailId}
              </h3>
              <button
                type="button"
                aria-label="Đóng chi tiết yêu cầu đổi trả"
                onClick={handleCloseDetail}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {isLoadingDetail ? (
              <div
                role="status"
                style={{ padding: '28px 16px', textAlign: 'center', color: '#64748B' }}
              >
                Đang tải chi tiết yêu cầu đổi/trả...
              </div>
            ) : isErrorDetail ? (
              <div
                role="alert"
                style={{
                  padding: '20px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: '0 0 12px 0', color: '#B91C1C', fontWeight: 600 }}>
                  {extractReturnErrorMessage(
                    detailError,
                    'Không thể tải chi tiết yêu cầu đổi/trả.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void refetchDetail();
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FFFFFF',
                    color: '#B91C1C',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Thử lại
                </button>
              </div>
            ) : detailData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    backgroundColor: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0A5BFF' }}>
                      {detailData.returnCode}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      Mã yêu cầu: #{detailData.id}
                      {detailData.orderCode ? ` • Đơn hàng: ${detailData.orderCode}` : ''}
                    </div>
                  </div>
                  {renderStatusBadge(detailData.status)}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#334155',
                  }}
                >
                  <div>
                    <strong>Thời điểm tạo:</strong> {formatDateTime(detailData.createdAt)}
                  </div>
                  {detailData.resolvedAt && (
                    <div>
                      <strong>Thời điểm xử lý xong:</strong> {formatDateTime(detailData.resolvedAt)}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '13.5px', color: '#1E293B', lineHeight: 1.6 }}>
                  <div>
                    <strong>Lý do đổi/trả:</strong> {detailData.reason}
                  </div>
                  {detailData.notes && (
                    <div style={{ marginTop: '6px' }}>
                      <strong>Mô tả chi tiết:</strong> {detailData.notes}
                    </div>
                  )}
                </div>

                {detailData.status === 'REJECTED' && detailData.rejectionReason && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      fontSize: '13px',
                    }}
                  >
                    <strong>Lý do từ chối:</strong> {detailData.rejectionReason}
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0F172A',
                    }}
                  >
                    Sản phẩm yêu cầu đổi/trả
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(detailData.items ?? []).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          gap: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {item.productName || `Sản phẩm #${item.productId}`}
                          </div>
                          {item.productSku && (
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              SKU: {item.productSku}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            SL: {item.quantity} • {RESOLUTION_LABELS[item.resolution]}
                          </div>
                          {detailData.status === 'COMPLETED' && (
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                              {item.isResellable
                                ? 'Đạt điều kiện nhập kho bán lại'
                                : 'Không nhập kho bán lại'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Timeline — CHỈ hiển thị khi API detail thực sự cung cấp auditLogs */}
                {Array.isArray(detailData.auditLogs) && detailData.auditLogs.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      Lịch sử xử lý yêu cầu
                    </h4>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: '#334155',
                      }}
                    >
                      {detailData.auditLogs.map((log) => (
                        <li key={log.id}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            {log.fromStatus === log.toStatus
                              ? `Khởi tạo (${log.toStatus})`
                              : `${log.fromStatus} → ${log.toStatus}`}{' '}
                            <span style={{ fontWeight: 500, color: '#64748B' }}>
                              • {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          {log.notes && (
                            <div style={{ color: '#475569', marginTop: '2px' }}>{log.notes}</div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import { getProductImage } from '../../lib/productImage';
import {
  clampQuantity,
  extractQuantityErrorMessage,
  normalizeStockLimit,
  resolveCommittedQuantity,
} from '../../lib/quantity';
import type { AuthUser, CartItemDto } from '@nexora/shared';

export const CartPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    authService.getCurrentUser(),
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [pendingItemIds, setPendingItemIds] = useState<Record<string, boolean>>({});
  const [cartActionError, setCartActionError] = useState<string | null>(null);

  const passiveAttemptedRef = useRef(false);
  const isMountedRef = useRef(true);
  const inFlightTargetRef = useRef<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lifecycle: Reset deduplication guard khi rời khỏi trang (unmount) để cho phép thử lại khi quay lại /cart
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cartService.resetPassiveMergeGuard();
    };
  }, []);

  // Passive Retry: Tự động gộp giỏ hàng khách khi user đã đăng nhập mở CartPage
  useEffect(() => {
    const token = authService.getToken();
    if (!token || !cartService.hasGuestSession()) return;
    if (passiveAttemptedRef.current) return;

    passiveAttemptedRef.current = true;

    cartService.attemptPassiveCartMerge(token).then((merged) => {
      if (isMountedRef.current && merged) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        showToast('Đã tự động đồng bộ giỏ hàng trước đó của bạn.');
      }
    });
  }, [currentUser, queryClient]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartService.updateItem(id, quantity),
    onMutate: ({ id, quantity }) => {
      inFlightTargetRef.current[id] = quantity;
      setPendingItemIds((prev) => ({ ...prev, [id]: true }));
      setCartActionError(null);
    },
    onSuccess: (updatedCart, { id }) => {
      delete inFlightTargetRef.current[id];
      setPendingItemIds((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDraftQuantities((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (updatedCart) {
        queryClient.setQueryData(['cart'], updatedCart);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: unknown, { id }) => {
      delete inFlightTargetRef.current[id];
      setPendingItemIds((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Revert back to last server-confirmed quantity on API failure
      setDraftQuantities((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      const msg = extractQuantityErrorMessage(err, 'Không thể cập nhật số lượng sản phẩm.');
      setCartActionError(msg);
      showToast(msg);
    },
  });

  const clearItemDraft = (itemId: string) => {
    setDraftQuantities((prev) => {
      if (!(itemId in prev)) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const commitCartItemQuantity = (item: CartItemDto, rawDraft: string) => {
    const stockLimit = normalizeStockLimit(item.product.stockQuantity);
    if (stockLimit <= 0 || pendingItemIds[item.id]) {
      clearItemDraft(item.id);
      return;
    }

    const trimmed = rawDraft.trim();
    const parsedRaw = trimmed !== '' ? Number(trimmed) : NaN;
    const targetQty = resolveCommittedQuantity(rawDraft, stockLimit, item.quantity);

    if (Number.isFinite(parsedRaw) && Math.trunc(parsedRaw) > stockLimit) {
      showToast(`Số lượng tối đa còn lại trong kho là ${stockLimit}.`);
    }

    if (targetQty === item.quantity) {
      clearItemDraft(item.id);
      return;
    }

    if (inFlightTargetRef.current[item.id] === targetQty) {
      return;
    }

    setDraftQuantities((prev) => ({ ...prev, [item.id]: String(targetQty) }));
    updateQuantityMutation.mutate({ id: item.id, quantity: targetQty });
  };

  const stepCartItemQuantity = (item: CartItemDto, delta: number) => {
    const stockLimit = normalizeStockLimit(item.product.stockQuantity);
    if (stockLimit <= 0 || pendingItemIds[item.id]) {
      return;
    }

    const currentDraft = draftQuantities[item.id] ?? String(item.quantity);
    const baseQty = resolveCommittedQuantity(currentDraft, stockLimit, item.quantity);
    const nextQty = clampQuantity(baseQty + delta, stockLimit);

    if (nextQty === item.quantity) {
      clearItemDraft(item.id);
      return;
    }

    setDraftQuantities((prev) => ({ ...prev, [item.id]: String(nextQty) }));
    updateQuantityMutation.mutate({ id: item.id, quantity: nextQty });
  };

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      showToast('Đã xóa sản phẩm khỏi giỏ hàng.');
    },
  });

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: () => storefrontService.getActiveCoupons(),
  });

  const applySpecificCoupon = async (code: string) => {
    setCouponCode(code);
    setCouponError(null);
    try {
      const result = await storefrontService.validateCoupon(code, rawTotal);
      setCouponApplied(true);
      setAppliedDiscount(result.discountAmount);
      setCouponError(null);
      showToast(
        `Áp dụng mã ${result.coupon.code} thành công! Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
      );
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setCouponApplied(false);
      setAppliedDiscount(0);
      const msg = errorResponse.response?.data?.error?.message || 'Mã giảm giá không hợp lệ.';
      setCouponError(msg);
      showToast(msg);
    }
  };

  const items = cart?.items || [];
  const rawTotal = cart?.subtotal ? Number(cart.subtotal) : 0;
  const discountAmount = couponApplied ? appliedDiscount : 0;
  const shippingFee = rawTotal >= 500000 || rawTotal === 0 ? 0 : 30000;
  const finalTotal = Math.max(0, rawTotal - discountAmount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      return;
    }

    setCouponError(null);
    try {
      const result = await storefrontService.validateCoupon(couponCode.trim(), rawTotal);
      setCouponApplied(true);
      setAppliedDiscount(result.discountAmount);
      setCouponError(null);
      showToast(
        `Áp dụng mã ${result.coupon.code} thành công! Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
      );
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setCouponApplied(false);
      setAppliedDiscount(0);
      const msg = errorResponse.response?.data?.error?.message || 'Mã giảm giá không hợp lệ.';
      setCouponError(msg);
      showToast(msg);
    }
  };

  return (
    <div className="home-page-wrapper">
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(10, 91, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={currentUser ? wishlistCount : 0}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
        }}
      />

      <main style={{ minHeight: '600px', paddingBottom: '80px' }}>
        <div className="container" style={{ padding: '16px 0' }}>
          <nav
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #6B7280)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Link to="/" style={{ color: 'var(--primary, #0A5BFF)', textDecoration: 'none' }}>
              Trang chủ
            </Link>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            <span style={{ fontWeight: 600, color: 'var(--text-primary, #111827)' }}>Giỏ hàng</span>
          </nav>
        </div>

        <section className="container">
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              marginBottom: '20px',
              color: 'var(--text-primary)',
            }}
          >
            Giỏ hàng của bạn ({cart?.totalItems || 0} sản phẩm)
          </h1>

          {items.length > 0 ? (
            <div className="nexora-cart-layout">
              {/* Left Column: Items Table */}
              <div
                style={{
                  backgroundColor: 'var(--surface-card, #FFFFFF)',
                  borderRadius: '16px',
                  border: '1px solid var(--border, #E5E7EB)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
              >
                {/* Free Shipping Bar */}
                <div
                  style={{
                    backgroundColor: rawTotal >= 500000 ? '#F0FDF4' : '#EFF6FF',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: rawTotal >= 500000 ? '#166534' : '#1E40AF',
                    fontWeight: 600,
                  }}
                >
                  <i
                    className={
                      rawTotal >= 500000 ? 'fa-solid fa-circle-check' : 'fa-solid fa-truck-fast'
                    }
                  ></i>
                  <span>
                    {rawTotal >= 500000
                      ? 'Đơn hàng của bạn đủ điều kiện MIỄN PHÍ VẬN CHUYỂN toàn quốc!'
                      : `Mua thêm ${formatPrice(500000 - rawTotal)} để được MIỄN PHÍ VẬN CHUYỂN!`}
                  </span>
                </div>

                {cartActionError && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: '#FEF2F2',
                      borderBottom: '1px solid #FECACA',
                      color: '#B91C1C',
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{cartActionError}</span>
                  </div>
                )}

                {/* Items List */}
                <div style={{ padding: '0 20px' }}>
                  {items.map((item) => {
                    const img = getProductImage(item.product);
                    const stockLimit = normalizeStockLimit(item.product.stockQuantity);
                    const isItemOutOfStock = stockLimit <= 0;
                    const isItemPending = Boolean(pendingItemIds[item.id]);
                    const displayedValue = draftQuantities[item.id] ?? String(item.quantity);
                    const trimmedDraft = displayedValue.trim();
                    const parsedDraftNum = trimmedDraft !== '' ? Number(trimmedDraft) : NaN;
                    const minusDisabled =
                      isItemOutOfStock ||
                      isItemPending ||
                      (Number.isFinite(parsedDraftNum) && trimmedDraft !== ''
                        ? parsedDraftNum <= 1
                        : item.quantity <= 1);
                    const plusDisabled =
                      isItemOutOfStock ||
                      isItemPending ||
                      (Number.isFinite(parsedDraftNum) && trimmedDraft !== ''
                        ? parsedDraftNum >= stockLimit
                        : item.quantity >= stockLimit);

                    return (
                      <div
                        key={item.id}
                        className="nexora-cart-item-row"
                        style={{
                          borderBottom: '1px solid var(--border, #E5E7EB)',
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="nexora-cart-thumb"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '10px',
                            backgroundColor: '#F9FAFB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <img
                            src={img}
                            alt={item.product.name}
                            style={{
                              maxWidth: '85%',
                              maxHeight: '85%',
                              objectFit: 'contain',
                            }}
                          />
                        </div>

                        {/* Name & Slug */}
                        <div className="nexora-cart-info">
                          <Link
                            to={`/product/detail/${item.product.slug}`}
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              lineHeight: 1.4,
                              display: 'block',
                              marginBottom: '4px',
                            }}
                          >
                            {item.product.name}
                          </Link>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Đơn giá:{' '}
                            {formatPrice(Number(item.product.salePrice || item.product.price))}
                          </span>
                          {isItemOutOfStock ? (
                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#EF4444',
                              }}
                            >
                              Tạm hết hàng
                            </div>
                          ) : (
                            <div
                              style={{
                                marginTop: '2px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Còn {stockLimit} sản phẩm
                            </div>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div
                          className="nexora-cart-qty"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            width: '108px',
                            height: '34px',
                            overflow: 'hidden',
                            opacity: isItemOutOfStock ? 0.5 : 1,
                          }}
                        >
                          <button
                            type="button"
                            title="Giảm số lượng"
                            disabled={minusDisabled}
                            onClick={() => stepCartItemQuantity(item, -1)}
                            style={{
                              width: '30px',
                              height: '100%',
                              border: 'none',
                              background: 'var(--surface-muted, #F3F4F6)',
                              color: 'var(--text-primary)',
                              cursor: minusDisabled ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              opacity: minusDisabled ? 0.5 : 1,
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="nexora-qty-input"
                            aria-label={`Số lượng cho ${item.product.name}`}
                            min={1}
                            max={isItemOutOfStock ? undefined : stockLimit}
                            step={1}
                            inputMode="numeric"
                            disabled={isItemOutOfStock}
                            value={displayedValue}
                            onChange={(e) => {
                              const nextVal = e.target.value;
                              setDraftQuantities((prev) => ({ ...prev, [item.id]: nextVal }));
                            }}
                            onBlur={() => commitCartItemQuantity(item, displayedValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitCartItemQuantity(item, displayedValue);
                              } else if (e.key === 'Escape') {
                                clearItemDraft(item.id);
                              }
                            }}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              textAlign: 'center',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              background: 'transparent',
                            }}
                          />
                          <button
                            type="button"
                            title="Tăng số lượng"
                            disabled={plusDisabled}
                            onClick={() => stepCartItemQuantity(item, 1)}
                            style={{
                              width: '30px',
                              height: '100%',
                              border: 'none',
                              background: 'var(--surface-muted, #F3F4F6)',
                              color: 'var(--text-primary)',
                              cursor: plusDisabled ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                              opacity: plusDisabled ? 0.5 : 1,
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="nexora-cart-subtotal" style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '15px',
                              color: 'var(--primary, #0A5BFF)',
                            }}
                          >
                            {formatPrice(
                              Number(item.product.salePrice || item.product.price) * item.quantity,
                            )}
                          </span>
                        </div>

                        {/* Delete button */}
                        <div className="nexora-cart-delete" style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            title="Xóa sản phẩm"
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#9CA3AF',
                              cursor: 'pointer',
                              fontSize: '16px',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back to shopping link */}
                <div
                  style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between' }}
                >
                  <Link
                    to="/"
                    style={{
                      fontSize: '13px',
                      color: 'var(--primary, #0A5BFF)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Tiếp tục chọn thêm sản phẩm
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary & Coupon */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Coupon Box */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    borderRadius: '16px',
                    border: '1px solid var(--border, #E5E7EB)',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0' }}>
                    <i
                      className="fa-solid fa-ticket"
                      style={{ color: '#0A5BFF', marginRight: '6px' }}
                    ></i>
                    Mã ưu đãi / Voucher
                  </h4>
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nhập mã NEXORA"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      style={{
                        flex: 1,
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        padding: '0 12px',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '0 16px',
                        height: '40px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--primary, #0A5BFF)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Áp dụng
                    </button>
                  </form>
                  {couponError && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#EF4444',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-circle-exclamation"></i>
                      <span>{couponError}</span>
                    </div>
                  )}
                  {couponApplied && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#16A34A',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <i className="fa-solid fa-check"></i> Đã áp dụng mã {couponCode} (-
                        {formatPrice(appliedDiscount)})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponApplied(false);
                          setCouponCode('');
                          setAppliedDiscount(0);
                          setCouponError(null);
                          showToast('Đã hủy áp dụng mã giảm giá.');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        Bỏ mã
                      </button>
                    </div>
                  )}

                  {/* Selectable Voucher List */}
                  {availableCoupons.length > 0 && (
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: 'var(--text-secondary, #6B7280)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i className="fa-solid fa-gift" style={{ color: '#F59E0B' }}></i>
                        <span>Mã ưu đãi có sẵn (Bấm để chọn nhanh):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {availableCoupons.map((cp) => {
                          const isCurrentActive = couponApplied && couponCode === cp.code;
                          const isEligible = rawTotal >= Number(cp.minOrderValue);
                          return (
                            <div
                              key={cp.id}
                              onClick={() => {
                                if (isCurrentActive) {
                                  setCouponApplied(false);
                                  setCouponCode('');
                                  setAppliedDiscount(0);
                                  setCouponError(null);
                                  showToast('Đã hủy áp dụng mã.');
                                } else {
                                  applySpecificCoupon(cp.code);
                                }
                              }}
                              style={{
                                border: isCurrentActive
                                  ? '1.5px solid #0A5BFF'
                                  : '1px dashed var(--border, #D1D5DB)',
                                backgroundColor: isCurrentActive
                                  ? 'rgba(10, 91, 255, 0.06)'
                                  : 'var(--bg-subtle, #F9FAFB)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 800,
                                      fontSize: '13px',
                                      color: '#0A5BFF',
                                    }}
                                  >
                                    {cp.code}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      color: 'var(--text-primary, #1F2937)',
                                    }}
                                  >
                                    {cp.discountType === 'PERCENTAGE'
                                      ? `Giảm ${cp.discountValue}%`
                                      : `Giảm ${Number(cp.discountValue).toLocaleString('vi-VN')}đ`}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: isEligible
                                      ? 'var(--text-secondary, #6B7280)'
                                      : '#EF4444',
                                    marginTop: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <span>
                                    {Number(cp.minOrderValue) > 0
                                      ? `Đơn tối thiểu ${Number(cp.minOrderValue).toLocaleString('vi-VN')}đ`
                                      : 'Áp dụng cho mọi giá trị đơn'}
                                  </span>
                                  {!isEligible && (
                                    <span style={{ fontWeight: 600 }}>· Chưa đủ điều kiện</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                {isCurrentActive ? (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      color: '#16A34A',
                                      backgroundColor: '#DCFCE7',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    ✓ Đang dùng
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: isEligible ? '#0A5BFF' : '#9CA3AF',
                                      backgroundColor: isEligible
                                        ? 'rgba(10, 91, 255, 0.08)'
                                        : '#F3F4F6',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    Áp dụng
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Card */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-card, #FFFFFF)',
                    borderRadius: '16px',
                    border: '1px solid var(--border, #E5E7EB)',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0' }}>
                    Tóm tắt đơn hàng
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Tạm tính:</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(rawTotal)}</span>
                  </div>

                  {couponApplied && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        fontSize: '13px',
                        color: '#16A34A',
                      }}
                    >
                      <span>Giảm giá (10%):</span>
                      <span style={{ fontWeight: 600 }}>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Phí vận chuyển:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: shippingFee === 0 ? '#16A34A' : 'var(--text-primary)',
                      }}
                    >
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: '1.5px dashed var(--border)',
                      paddingTop: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '20px',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800 }}>Tổng thanh toán:</span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: 'var(--primary, #0A5BFF)',
                      }}
                    >
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="auth-btn-primary"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      lineHeight: '50px',
                      textDecoration: 'none',
                    }}
                  >
                    Tiến hành đặt hàng
                  </button>

                  <div
                    style={{
                      marginTop: '16px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <i
                        className="fa-solid fa-shield-check"
                        style={{ color: '#22C55E', marginRight: '6px' }}
                      ></i>
                      Bảo mật thanh toán 100%
                    </div>
                    <div>
                      <i
                        className="fa-solid fa-truck"
                        style={{ color: '#0A5BFF', marginRight: '6px' }}
                      ></i>
                      Giao hàng nhanh toàn quốc
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                backgroundColor: 'var(--surface-card, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border, #E5E7EB)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <i
                  className="fa-solid fa-cart-shopping"
                  style={{ fontSize: '36px', color: '#9CA3AF' }}
                ></i>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Giỏ hàng của bạn đang trống
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  maxWidth: '400px',
                  margin: '0 auto 24px auto',
                }}
              >
                Không có sản phẩm nào trong giỏ. Hãy chọn những sản phẩm công nghệ tuyệt vời cho góc
                máy của bạn!
              </p>
              <Link
                to="/"
                className="auth-btn-primary"
                style={{
                  display: 'inline-block',
                  maxWidth: '220px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  textDecoration: 'none',
                }}
              >
                Mua sắm ngay
              </Link>
            </div>
          )}
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

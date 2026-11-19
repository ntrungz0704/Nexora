import React from 'react';
import type { CartSummaryDto } from '@nexora/shared';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartSummaryDto | null;
  onClose: () => void;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || 0;
  const subtotal = Number(cart?.subtotal || 0);

  const formatPrice = (val: number) => {
    return val.toLocaleString('vi-VN') + 'đ';
  };

  const freeShippingThreshold = 300000;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-cart-shopping text-blue-400"></i>
              <h2 className="text-base font-bold text-white">Giỏ Hàng Của Bạn</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400">
                {totalItems}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Free shipping bar */}
          <div className="bg-slate-950 p-3 border-b border-slate-800">
            <div className="flex justify-between text-xs mb-1.5">
              {remainingForFreeShipping > 0 ? (
                <span className="text-slate-300">
                  Mua thêm{' '}
                  <strong className="text-amber-400">
                    {formatPrice(remainingForFreeShipping)}
                  </strong>{' '}
                  để được <strong className="text-emerald-400">Miễn phí ship</strong>
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <i className="fa-solid fa-circle-check"></i> Đủ điều kiện Miễn phí giao hàng toàn
                  quốc!
                </span>
              )}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <i className="fa-solid fa-cart-arrow-down text-5xl text-slate-700 mb-3"></i>
                <p className="text-sm font-semibold text-slate-300">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy khám phá các thiết bị công nghệ hấp dẫn và thêm vào giỏ.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const p = item.product;
                const unitPrice = Number(p.salePrice || p.price);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80"
                  >
                    <img
                      src={p.thumbnailUrl || '/assets/images/placeholder.webp'}
                      alt={p.name}
                      className="w-16 h-16 object-contain rounded-lg bg-slate-900 p-1 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.webp';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={p.name}>
                        {p.name}
                      </h4>
                      <p className="text-xs font-black text-rose-400 mt-1">
                        {formatPrice(unitPrice)}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center space-x-1 border border-slate-700 rounded-lg bg-slate-900 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-xs text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Xóa khỏi giỏ"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tạm tính:</span>
                <span className="text-base font-black text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Phí vận chuyển:</span>
                <span className="text-emerald-400 font-bold">
                  {subtotal >= freeShippingThreshold ? 'Miễn phí' : '30.000đ'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Tổng thanh toán:</span>
                <span className="text-lg font-black text-rose-500">
                  {formatPrice(subtotal + (subtotal >= freeShippingThreshold ? 0 : 30000))}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert(
                    'Chức năng đặt hàng: Phương thức thanh toán COD hoặc VNPay Sandbox đang được kết nối an toàn!',
                  )
                }
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-lock"></i>
                <span>Tiến Hành Đặt Hàng (COD / VNPay)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

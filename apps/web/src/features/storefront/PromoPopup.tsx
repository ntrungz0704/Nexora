import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export const PromoPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const todayVN = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const hiddenDate = localStorage.getItem('techpilot_hide_popup_date');
    if (hiddenDate === todayVN) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      document.body.classList.add('tp-popup-locked');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      const todayVN = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      localStorage.setItem('techpilot_hide_popup_date', todayVN);
    }
    setIsVisible(false);
    document.body.classList.remove('tp-popup-locked');
  }, [dontShowAgain]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      id="tpPromoPopup"
      className="tp-popup-overlay tp-popup-active"
      role="dialog"
      aria-modal="true"
      aria-label="Quảng cáo khuyến mãi"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="tp-popup-card"
        style={{
          position: 'relative',
          width: '90vw',
          maxWidth: '820px',
          background: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Nút đóng X góc phải trên cùng Shopee Style */}
        <button
          type="button"
          id="tpClosePopupBtn"
          className="tp-popup-close-btn"
          onClick={handleClose}
          aria-label="Đóng quảng cáo"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.65)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Hình ảnh Banner Quảng Cáo (Clickable) */}
        <Link
          to="/product/detail/asus-rog-zephyrus-g16"
          onClick={handleClose}
          className="tp-popup-link"
          title="ROG Zephyrus G16"
          style={{
            display: 'block',
            width: '100%',
            background: '#0F172A',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src="/assets/images/review/unlinked/rog-zephyrus.jpg"
            alt="ROG Zephyrus G16 Khuyến Mãi Khủng"
            className="tp-popup-img"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '75vh',
              objectFit: 'contain',
              display: 'block',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/banners/popup_mega_sale.jpg';
            }}
          />
        </Link>

        {/* Thanh tùy chọn bên dưới Popup */}
        <div
          className="tp-popup-footer"
          style={{
            padding: '14px 22px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <label
            className="tp-popup-dont-show"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: '#475569',
              fontWeight: 500,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              id="tpDontShowToday"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0A5BFF' }}
            />
            <span>Không hiển thị lại ngày hôm nay</span>
          </label>
        </div>
      </div>
    </div>
  );
};

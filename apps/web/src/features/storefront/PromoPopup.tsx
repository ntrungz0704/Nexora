import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';

export const PromoPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const { data: popupBanners = [] } = useQuery({
    queryKey: ['banners', 'popup'],
    queryFn: () => storefrontService.getBanners('popup'),
  });

  const activePopup = popupBanners.find((b) => b.isActive);

  useEffect(() => {
    if (!activePopup) return;
    const todayVN = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const hiddenDate =
      localStorage.getItem('nexora_hide_popup_date') ||
      localStorage.getItem('techpilot_hide_popup_date');
    if (hiddenDate === todayVN) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      document.body.classList.add('nx-popup-locked', 'tp-popup-locked');
    }, 600);

    return () => clearTimeout(timer);
  }, [activePopup]);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      const todayVN = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      localStorage.setItem('nexora_hide_popup_date', todayVN);
      localStorage.setItem('techpilot_hide_popup_date', todayVN);
    }
    setIsVisible(false);
    document.body.classList.remove('nx-popup-locked', 'tp-popup-locked');
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

  if (!isVisible || !activePopup) return null;

  const imgSrc =
    activePopup.imageUrl.startsWith('/') || activePopup.imageUrl.startsWith('http')
      ? activePopup.imageUrl
      : `/${activePopup.imageUrl}`;

  return (
    <div
      id="tpPromoPopup"
      className="tp-popup-overlay tp-popup-active"
      role="dialog"
      aria-modal="true"
      aria-label={activePopup.title}
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
          background: 'var(--surface-card, #ffffff)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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

        <Link
          to={activePopup.linkUrl || '/search'}
          onClick={handleClose}
          className="tp-popup-link"
          title={activePopup.title}
          style={{
            display: 'block',
            width: '100%',
            background: '#0F172A',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <img
            src={imgSrc}
            alt={activePopup.title}
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
              (e.target as HTMLImageElement).src = '/assets/banners/nexora-promo-popup.jpg';
            }}
          />
        </Link>

        <div
          className="tp-popup-footer"
          style={{
            padding: '12px 18px',
            background: 'var(--surface-card, #f8fafc)',
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <label
            className="tp-popup-dont-show"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: 'var(--text-secondary, #475569)',
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

          <Link
            to={activePopup.linkUrl || '/search'}
            onClick={handleClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #0A5BFF 0%, #0040C1 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(10, 91, 255, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Khám phá ngay</span>
            <i className="fa-solid fa-arrow-right text-xs"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

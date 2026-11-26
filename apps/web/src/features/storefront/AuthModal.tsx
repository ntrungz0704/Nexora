import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { GoogleAuthUnavailableButton } from '../auth/GoogleAuthUnavailableButton';
import type { AuthUser } from '@nexora/shared';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const session = await authService.login({ email, password });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      onSuccess(session.user);
      onClose();
      if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
        navigate('/admin');
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(
        errorResponse.response?.data?.error?.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const session = await authService.register({ fullName, email, phone, password });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      onSuccess(session.user);
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(
        errorResponse.response?.data?.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Auth Card Dialog (TechPilot Exact Design System) */}
      <div
        className="auth-card"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '460px',
          padding: '32px 28px',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--surface-muted, #F3F4F6)',
            color: 'var(--text-secondary, #6B7280)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'background-color 0.15s',
          }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Head */}
        <div className="auth-card__head" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 className="auth-card__title" style={{ fontSize: '22px', fontWeight: 800 }}>
            {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="auth-card__subtitle" style={{ justifyContent: 'center', marginTop: '4px' }}>
            Chào mừng bạn đến với Nexora
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1.5px solid var(--border, #E5E7EB)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color:
                activeTab === 'login'
                  ? 'var(--primary, #0A5BFF)'
                  : 'var(--text-secondary, #6B7280)',
              borderBottom:
                activeTab === 'login'
                  ? '2.5px solid var(--primary, #0A5BFF)'
                  : '2.5px solid transparent',
              marginBottom: '-1.5px',
              transition: 'all 0.15s ease',
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color:
                activeTab === 'register'
                  ? 'var(--primary, #0A5BFF)'
                  : 'var(--text-secondary, #6B7280)',
              borderBottom:
                activeTab === 'register'
                  ? '2.5px solid var(--primary, #0A5BFF)'
                  : '2.5px solid transparent',
              marginBottom: '-1.5px',
              transition: 'all 0.15s ease',
            }}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Server / Validation Error */}
        {errorMsg && (
          <div className="auth-alert auth-alert--error" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form" noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_login_email">
                Email hoặc số điện thoại
              </label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-envelope auth-input-icon"></i>
                <input
                  type="text"
                  id="modal_login_email"
                  className="auth-input"
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_login_password">
                Mật khẩu
              </label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="modal_login_password"
                  className="auth-input auth-input--has-action"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="auth-form-row">
              <label className="auth-checkbox-label">
                <input type="checkbox" className="auth-checkbox" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <a href="#forgot" className="auth-link-accent" style={{ fontSize: '12px' }}>
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form" noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_reg_name">
                Họ và tên
              </label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-user auth-input-icon"></i>
                <input
                  type="text"
                  id="modal_reg_name"
                  className="auth-input"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_reg_email">
                Địa chỉ Email
              </label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-envelope auth-input-icon"></i>
                <input
                  type="email"
                  id="modal_reg_email"
                  className="auth-input"
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_reg_phone">
                Số điện thoại
              </label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-phone auth-input-icon"></i>
                <input
                  type="tel"
                  id="modal_reg_phone"
                  className="auth-input"
                  placeholder="0987 654 321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="modal_reg_pass">
                Mật khẩu (ít nhất 6 ký tự)
              </label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="modal_reg_pass"
                  className="auth-input auth-input--has-action"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản ngay'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider-line">
          <span>hoặc</span>
        </div>

        {/* Google OAuth Button (Disabled - Deferred) */}
        <GoogleAuthUnavailableButton />

        {/* Switch tab link */}
        <p className="auth-footer-text">
          {activeTab === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className="auth-link-accent"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                }}
                className="auth-link-accent"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Đăng nhập ngay
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

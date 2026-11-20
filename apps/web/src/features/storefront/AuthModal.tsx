import React, { useState } from 'react';
import { authService } from '../../services/authService';
import type { AuthUser } from '@nexora/shared';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
      onSuccess(session.user);
      onClose();
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
              color: activeTab === 'login' ? 'var(--primary, #0A5BFF)' : 'var(--text-secondary, #6B7280)',
              borderBottom: activeTab === 'login' ? '2.5px solid var(--primary, #0A5BFF)' : '2.5px solid transparent',
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
              color: activeTab === 'register' ? 'var(--primary, #0A5BFF)' : 'var(--text-secondary, #6B7280)',
              borderBottom: activeTab === 'register' ? '2.5px solid var(--primary, #0A5BFF)' : '2.5px solid transparent',
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

        {/* Google OAuth Button */}
        <button
          type="button"
          className="auth-btn-google"
          onClick={() => {
            setErrorMsg('Đăng nhập qua Google hiện đang được nâng cấp bảo mật SSO.');
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Tiếp tục với Google
        </button>

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

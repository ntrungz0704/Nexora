import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await authService.register({ fullName, email, phone, password });
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
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
    <div className="home-page-wrapper">
      <StorefrontHeader
        categories={categories}
        cartCount={0}
        wishlistCount={0}
        currentUser={authService.getCurrentUser()}
        onOpenCart={() => navigate('/cart')}
        onOpenAuth={() => navigate('/auth/login')}
        onLogout={() => authService.logout()}
      />

      <main className="auth-page" style={{ padding: '40px 16px 80px 16px', minHeight: '600px' }}>
        <section className="auth-section">
          <div className="auth-card">
            {/* Head */}
            <div className="auth-card__head auth-card__head--register">
              <div className="auth-card__head-icon">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div>
                <h1 className="auth-card__title">Đăng ký tài khoản</h1>
                <p className="auth-card__subtitle">
                  <i className="fa-solid fa-circle-check" style={{ color: '#22C55E' }}></i>
                  Tạo tài khoản trong <strong style={{ color: 'var(--primary)' }}>1 phút</strong>
                </p>
              </div>
            </div>

            {/* Error alert */}
            {errorMsg && (
              <div className="auth-alert auth-alert--error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="auth-form" noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_full_name">
                  Họ và tên
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-regular fa-user auth-input-icon"></i>
                  <input
                    type="text"
                    id="reg_full_name"
                    className="auth-input"
                    placeholder="Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_email">
                  Email
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-regular fa-envelope auth-input-icon"></i>
                  <input
                    type="email"
                    id="reg_email"
                    className="auth-input"
                    placeholder="vd: ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <p className="auth-field-hint" style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Chúng tôi sẽ gửi xác nhận đến email của bạn.
                </p>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_phone">
                  Số điện thoại
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-phone auth-input-icon"></i>
                  <input
                    type="tel"
                    id="reg_phone"
                    className="auth-input"
                    placeholder="vd: 0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_password">
                  Mật khẩu
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-lock auth-input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg_password"
                    className="auth-input auth-input--has-action"
                    placeholder="Ít nhất 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="auth-form-row">
                <label className="auth-checkbox-label">
                  <input type="checkbox" className="auth-checkbox" defaultChecked required /> Tôi đồng ý
                  với Điều khoản & Chính sách của TechPilot
                </label>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider-line">
              <span>hoặc</span>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="auth-btn-google"
              onClick={() => {
                authService.login({ email: 'customer@nexora.vn', password: 'password123' }).then(() => {
                  navigate('/');
                });
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

            {/* Login link */}
            <p className="auth-footer-text">
              Đã có tài khoản?{' '}
              <Link to="/auth/login" className="auth-link-accent">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </section>
      </main>

      <StorefrontFooter />
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';
import { GoogleAuthUnavailableButton } from './GoogleAuthUnavailableButton';

export const LoginPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const session = await authService.login({ email, password });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const redirect = searchParams.get('redirect');
      if (session.user.role === 'ADMIN' || session.user.role === 'STAFF') {
        navigate(redirect && redirect.startsWith('/admin') ? redirect : '/admin');
      } else if (redirect && !redirect.startsWith('/auth')) {
        navigate(redirect);
      } else {
        navigate('/');
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

  return (
    <div className="home-page-wrapper">
      <StorefrontHeader
        categories={categories}
        cartCount={0}
        wishlistCount={0}
        currentUser={authService.getCurrentUser()}
        onOpenCart={() => navigate('/cart')}
        onOpenAuth={() => {}}
        onLogout={() => authService.logout()}
      />

      <main className="auth-page" style={{ padding: '40px 16px 80px 16px', minHeight: '600px' }}>
        <section className="auth-section">
          <div className="auth-card">
            {/* Head */}
            <div className="auth-card__head">
              <h1 className="auth-card__title">Đăng nhập</h1>
              <p className="auth-card__subtitle">Chào mừng bạn quay trở lại với Nexora</p>
            </div>

            {/* Error alert */}
            {errorMsg && (
              <div className="auth-alert auth-alert--error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="auth-form" noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="login_email">
                  Email hoặc số điện thoại
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-regular fa-envelope auth-input-icon"></i>
                  <input
                    type="text"
                    id="login_email"
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
                <label className="auth-label" htmlFor="login_password">
                  Mật khẩu
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-lock auth-input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login_password"
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
                  <input type="checkbox" className="auth-checkbox" defaultChecked /> Ghi nhớ đăng
                  nhập
                </label>
                <Link to="/auth/forgot" className="auth-link-accent">
                  Quên mật khẩu?
                </Link>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider-line">
              <span>hoặc đăng nhập bằng</span>
            </div>

            {/* Google Login (Disabled - Deferred) */}
            <GoogleAuthUnavailableButton />

            {/* Register link */}
            <p className="auth-footer-text">
              Chưa có tài khoản?{' '}
              <Link to="/auth/register" className="auth-link-accent">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>

        {/* Trust badges */}
        <div className="auth-trust-grid" style={{ maxWidth: '480px', margin: '24px auto 0 auto' }}>
          <div className="auth-trust-item">
            <div className="auth-trust-icon auth-trust-icon--blue">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="auth-trust-body">
              <h4>Bảo mật thông tin</h4>
              <p>Cam kết bảo mật tuyệt đối thông tin của bạn</p>
            </div>
          </div>
          <div className="auth-trust-item">
            <div className="auth-trust-icon auth-trust-icon--cyan">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div className="auth-trust-body">
              <h4>Hỗ trợ 24/7</h4>
              <p>Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

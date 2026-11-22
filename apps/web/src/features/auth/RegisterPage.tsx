import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefrontService';

export const RegisterPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  // Password rules validation
  const ruleMinLength = password.length >= 8;
  const ruleUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const ruleNumberOrSpecial = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);

  const passedRulesCount = [ruleMinLength, ruleUpperLower, ruleNumberOrSpecial].filter(
    Boolean,
  ).length;
  let strengthLabel = 'Chưa nhập';
  let strengthColor = '#CBD5E1';
  let strengthPercent = 0;

  if (password.length > 0) {
    if (passedRulesCount === 1) {
      strengthLabel = 'Yếu';
      strengthColor = '#EF4444';
      strengthPercent = 33;
    } else if (passedRulesCount === 2) {
      strengthLabel = 'Trung bình';
      strengthColor = '#F59E0B';
      strengthPercent = 66;
    } else if (passedRulesCount === 3) {
      strengthLabel = 'Mạnh';
      strengthColor = '#22C55E';
      strengthPercent = 100;
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ fullName, email, phone, password });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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
                <h1 className="auth-card__title">Tạo tài khoản mới</h1>
                <p className="auth-card__subtitle">
                  Tham gia cùng Nexora để nhận nhiều ưu đãi hấp dẫn
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
                  Họ và tên *
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-regular fa-user auth-input-icon"></i>
                  <input
                    type="text"
                    id="reg_full_name"
                    className="auth-input"
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_email">
                  Email *
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-regular fa-envelope auth-input-icon"></i>
                  <input
                    type="email"
                    id="reg_email"
                    className="auth-input"
                    placeholder="Nhập địa chỉ email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_phone">
                  Số điện thoại *
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-phone auth-input-icon"></i>
                  <input
                    type="tel"
                    id="reg_phone"
                    className="auth-input"
                    placeholder="Nhập số điện thoại của bạn"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_password">
                  Mật khẩu *
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-lock auth-input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg_password"
                    className="auth-input auth-input--has-action"
                    placeholder="Tạo mật khẩu (tối thiểu 8 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg_confirm_password">
                  Xác nhận mật khẩu *
                </label>
                <div className="auth-input-wrap">
                  <i className="fa-solid fa-lock auth-input-icon"></i>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="reg_confirm_password"
                    className="auth-input auth-input--has-action"
                    placeholder="Nhập lại mật khẩu vừa tạo"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label="Hiện/ẩn xác nhận mật khẩu"
                  >
                    <i
                      className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                    ></i>
                  </button>
                </div>
              </div>

              {/* Password Strength Box */}
              {password.length > 0 && (
                <div className="auth-pw-strength">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span className="auth-pw-strength__label">Độ mạnh mật khẩu:</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="auth-pw-strength__bar">
                    <div
                      className="auth-pw-strength__fill"
                      style={{
                        width: `${strengthPercent}%`,
                        backgroundColor: strengthColor,
                      }}
                    />
                  </div>
                  <ul className="auth-pw-rules">
                    <li className={`auth-pw-rule ${ruleMinLength ? 'auth-pw-rule--pass' : ''}`}>
                      <i
                        className={`fa-solid ${ruleMinLength ? 'fa-circle-check' : 'fa-circle-dot'}`}
                      ></i>
                      <span>Ít nhất 8 ký tự</span>
                    </li>
                    <li className={`auth-pw-rule ${ruleUpperLower ? 'auth-pw-rule--pass' : ''}`}>
                      <i
                        className={`fa-solid ${ruleUpperLower ? 'fa-circle-check' : 'fa-circle-dot'}`}
                      ></i>
                      <span>Bao gồm chữ hoa và chữ thường</span>
                    </li>
                    <li
                      className={`auth-pw-rule ${ruleNumberOrSpecial ? 'auth-pw-rule--pass' : ''}`}
                    >
                      <i
                        className={`fa-solid ${ruleNumberOrSpecial ? 'fa-circle-check' : 'fa-circle-dot'}`}
                      ></i>
                      <span>Bao gồm số hoặc ký tự đặc biệt</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="auth-form-row">
                <label className="auth-checkbox-label auth-checkbox-label--terms">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <Link to="/policy/terms" className="auth-link-accent">
                      Điều khoản dịch vụ
                    </Link>{' '}
                    và{' '}
                    <Link to="/policy/privacy" className="auth-link-accent">
                      Chính sách bảo mật
                    </Link>{' '}
                    của Nexora *
                  </span>
                </label>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider-line">
              <span>hoặc đăng ký bằng</span>
            </div>

            {/* Google Login */}
            <button
              type="button"
              className="auth-btn-google"
              onClick={() => {
                authService
                  .login({ email: 'customer@nexora.vn', password: 'password123' })
                  .then(() => {
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

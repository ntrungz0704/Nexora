import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải chứa ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 2500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg =
        axiosErr.response?.data?.error?.message ||
        (err instanceof Error
          ? err.message
          : 'Đặt lại mật khẩu không thành công. Token có thể đã hết hạn.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}
        >
          <img
            src="/assets/images/logo.png"
            alt="Nexora"
            style={{ height: '44px', objectFit: 'contain' }}
          />
        </Link>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
          Đặt Lại Mật Khẩu
        </h1>
        <p
          style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.5', margin: '0 0 28px 0' }}
        >
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                fontSize: '20px',
              }}
            >
              <i className="fa-solid fa-check"></i>
            </div>
            <h3
              style={{ fontSize: '15px', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' }}
            >
              Đặt lại mật khẩu thành công!
            </h3>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              Mật khẩu của bạn đã được cập nhật. Đang tự động chuyển hướng đến trang đăng nhập...
            </p>
            <Link
              to="/auth/login"
              style={{
                display: 'inline-block',
                marginTop: '18px',
                color: '#0A5BFF',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Đăng nhập ngay →
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                Mật khẩu mới
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-lock"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                ></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 46px 0 44px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                Xác nhận mật khẩu mới
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-lock"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                ></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 46px 0 44px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  <i
                    className={
                      showConfirmPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'
                    }
                  ></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '10px',
                borderRadius: '12px',
                backgroundColor: '#0A5BFF',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 700,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(10, 91, 255, 0.3)',
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link
            to="/auth/login"
            style={{
              color: '#64748B',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

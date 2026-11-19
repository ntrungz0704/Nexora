import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitted(true);
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
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>
          <img
            src="/assets/images/logo.png"
            alt="TechPilot"
            style={{ height: '44px', objectFit: 'contain' }}
          />
        </Link>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
          Quên Mật Khẩu?
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.5', margin: '0 0 28px 0' }}>
          Nhập email đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu an toàn trong giây lát.
        </p>

        {isSubmitted ? (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
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
                backgroundColor: '#0A5BFF',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                fontSize: '20px',
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E40AF', margin: '0 0 6px 0' }}>
              Kiểm Tra Hộp Thư Đến
            </h3>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              Liên kết đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra cả thư mục Spam.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                marginTop: '18px',
                color: '#0A5BFF',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              Quay lại Đăng nhập →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Email tài khoản
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '8px',
                padding: '13px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0A5BFF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(10, 91, 255, 0.25)',
              }}
            >
              Gửi Liên Kết Đặt Lại Mật Khẩu
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#64748B' }}>
              Nhớ lại mật khẩu?{' '}
              <Link to="/login" style={{ color: '#0A5BFF', fontWeight: 700, textDecoration: 'none' }}>
                Đăng nhập ngay
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

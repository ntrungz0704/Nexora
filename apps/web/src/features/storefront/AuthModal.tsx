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

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 overflow-hidden z-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Brand Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
            <i className="fa-solid fa-bolt text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-extrabold text-white">Nexora Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">Hệ thống công nghệ phần cứng chính hãng</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'login'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              activeTab === 'register'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition disabled:opacity-60"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-semibold block mb-2">
                Tài khoản mẫu kiểm thử:
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer@nexora.local')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-medium"
                >
                  Customer Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff@nexora.local')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-400 font-medium"
                >
                  Staff Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@nexora.local')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-rose-400 font-medium"
                >
                  Admin Demo
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition disabled:opacity-60"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản ngay'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '../src/features/auth/RegisterPage';
import { LoginPage } from '../src/features/auth/LoginPage';
import { AuthModal } from '../src/features/storefront/AuthModal';
import { storefrontService } from '../src/services/storefrontService';
import { authService } from '../src/services/authService';
import { apiClient } from '../src/lib/apiClient';
import fs from 'node:fs';
import path from 'node:path';

function renderWithQuery(ui: React.ReactNode, initialRoute = '/register') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/register" element={ui} />
          <Route path="/login" element={ui} />
          <Route path="/" element={<div data-testid="home-landing">Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DEF-RT-03: Remove mock Google Login', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(storefrontService, 'getCategories').mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('1-4 & 8. Google area on RegisterPage, LoginPage, and AuthModal is disabled, never calls /auth/login, creates no session, and throws no unhandled rejection', () => {
    const loginSpy = vi.spyOn(authService, 'login');
    const postSpy = vi.spyOn(apiClient, 'post');

    const { unmount } = renderWithQuery(<RegisterPage />, '/register');
    const regGoogleBtn = screen.getByRole('button', { name: /Google/i });
    expect(regGoogleBtn).toBeDisabled();
    expect(regGoogleBtn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('note')).toHaveTextContent(/chưa khả dụng/i);
    fireEvent.click(regGoogleBtn);

    expect(loginSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('nexora_token')).toBeNull();
    expect(localStorage.getItem('nexora_user')).toBeNull();
    unmount();

    const { unmount: unmountLogin } = renderWithQuery(<LoginPage />, '/login');
    const loginGoogleBtn = screen.getByRole('button', { name: /Google/i });
    expect(loginGoogleBtn).toBeDisabled();
    expect(loginGoogleBtn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(loginGoogleBtn);
    expect(loginSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('nexora_token')).toBeNull();
    unmountLogin();

    renderWithQuery(<AuthModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />, '/login');
    const modalGoogleBtn = screen.getByRole('button', { name: /Google/i });
    expect(modalGoogleBtn).toBeDisabled();
    expect(modalGoogleBtn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(modalGoogleBtn);
    expect(loginSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('nexora_token')).toBeNull();
  });

  it('2. source files contain zero hardcoded customer@nexora.vn Google mock credentials', () => {
    const authFiles = [
      path.resolve(__dirname, '../src/features/auth/RegisterPage.tsx'),
      path.resolve(__dirname, '../src/features/auth/LoginPage.tsx'),
      path.resolve(__dirname, '../src/features/auth/GoogleAuthUnavailableButton.tsx'),
      path.resolve(__dirname, '../src/features/storefront/AuthModal.tsx'),
      path.resolve(__dirname, '../src/services/authService.ts'),
    ];
    for (const filePath of authFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).not.toContain('customer@nexora.vn');
    }
  });

  it('5. email/password registration on RegisterPage continues to work normally', async () => {
    const registerSpy = vi.spyOn(authService, 'register').mockResolvedValue({
      user: {
        id: 55,
        email: 'newbuyer@example.com',
        fullName: 'Nguyen Buyer',
        role: 'CUSTOMER',
      },
      token: 'jwt-real-reg',
    });

    renderWithQuery(<RegisterPage />, '/register');

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyen Buyer' } });
    fireEvent.change(screen.getByLabelText(/^Email \*/i), {
      target: { value: 'newbuyer@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0912345678' } });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu \*/i), { target: { value: 'Pass12345!' } });
    fireEvent.change(screen.getByLabelText(/^Xác nhận mật khẩu \*/i), {
      target: { value: 'Pass12345!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/i }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        fullName: 'Nguyen Buyer',
        email: 'newbuyer@example.com',
        phone: '0912345678',
        password: 'Pass12345!',
      }),
    );
    await waitFor(() => expect(screen.getByTestId('home-landing')).toBeInTheDocument());
  });

  it('6-7. email/password login and logout lifecycle work normally without interference', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: {
          user: {
            id: 77,
            email: 'buyer@nexora.local',
            fullName: 'Buyer Test',
            role: 'CUSTOMER',
          },
          token: 'jwt-login-test',
        },
      },
    } as never);

    renderWithQuery(<LoginPage />, '/login');

    fireEvent.change(screen.getByLabelText(/Email hoặc số điện thoại/i), {
      target: { value: 'buyer@nexora.local' },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }));

    await waitFor(() => expect(postSpy).toHaveBeenCalledWith('/auth/login', expect.any(Object)));
    expect(localStorage.getItem('nexora_token')).toBe('jwt-login-test');

    authService.logout();
    expect(localStorage.getItem('nexora_token')).toBeNull();
    expect(localStorage.getItem('nexora_user')).toBeNull();
  });
});

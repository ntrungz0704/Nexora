// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../src/routes/AppRoutes';
import { authService } from '../src/services/authService';

function renderAtRoute(initialUrl: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Password Reset Canonical URL & Frontend Flow (Objective C)', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('RESET-FE-1: Canonical email URL /auth/reset-password?token=... renders ResetPasswordPage (not 404) and submits token + new password', async () => {
    const spy = vi
      .spyOn(authService, 'resetPassword')
      .mockResolvedValue({ message: 'Đặt lại mật khẩu thành công!' });

    renderAtRoute('/auth/reset-password?token=valid-reset-jwt-123');

    expect(screen.getByText('Đặt Lại Mật Khẩu')).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText(/••••••••|Nhập lại mật khẩu/i);
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(inputs[0]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.change(inputs[1]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu mật khẩu mới/i }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('valid-reset-jwt-123', 'NewSecurePass123!');
    });
    expect(await screen.findByText(/Đặt lại mật khẩu thành công/i)).toBeInTheDocument();
  });

  it('RESET-FE-2: Displays backend error message when token is expired, reused, or invalid', async () => {
    vi.spyOn(authService, 'resetPassword').mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'EXPIRED_OR_INVALID_TOKEN',
            message: 'Mã đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.',
          },
        },
      },
    });

    renderAtRoute('/auth/reset-password?token=expired-token-xyz');

    const inputs = screen.getAllByPlaceholderText(/••••••••|Nhập lại mật khẩu/i);
    fireEvent.change(inputs[0]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.change(inputs[1]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu mật khẩu mới/i }));

    expect(
      await screen.findByText('Mã đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.'),
    ).toBeInTheDocument();
  });

  it('RESET-FE-3: Blocks submission when token query parameter is missing', async () => {
    const spy = vi.spyOn(authService, 'resetPassword');

    renderAtRoute('/auth/reset-password');

    const inputs = screen.getAllByPlaceholderText(/••••••••|Nhập lại mật khẩu/i);
    fireEvent.change(inputs[0]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.change(inputs[1]!, { target: { value: 'NewSecurePass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu mật khẩu mới/i }));

    expect(
      await screen.findByText('Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.'),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('RESET-FE-4: Legacy aliases /auth/reset and /reset-password continue to render ResetPasswordPage', () => {
    renderAtRoute('/auth/reset?token=legacy-1');
    expect(screen.getByText('Đặt Lại Mật Khẩu')).toBeInTheDocument();
    cleanup();

    renderAtRoute('/reset-password?token=legacy-2');
    expect(screen.getByText('Đặt Lại Mật Khẩu')).toBeInTheDocument();
  });
});

import { apiClient } from '../lib/apiClient';
import type { ApiSuccessEnvelope, LoginInput, RegisterInput, AuthUser } from '@nexora/shared';

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const res = await apiClient.post<ApiSuccessEnvelope<AuthSession>>('/auth/login', input);
    const session = res.data.data;
    localStorage.setItem('nexora_token', session.token);
    localStorage.setItem('nexora_user', JSON.stringify(session.user));
    return session;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    const res = await apiClient.post<ApiSuccessEnvelope<AuthSession>>('/auth/register', input);
    const session = res.data.data;
    localStorage.setItem('nexora_token', session.token);
    localStorage.setItem('nexora_user', JSON.stringify(session.user));
    return session;
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<ApiSuccessEnvelope<{ user: AuthUser }>>('/auth/me');
    return res.data.data.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccessEnvelope<{ message: string }>>('/auth/forgot-password', { email });
    return res.data.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccessEnvelope<{ message: string }>>('/auth/reset-password', {
      token,
      password,
    });
    return res.data.data;
  },

  logout(): void {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
  },

  getToken(): string | null {
    return localStorage.getItem('nexora_token');
  },

  getCurrentUser(): AuthUser | null {
    const stored = localStorage.getItem('nexora_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
};

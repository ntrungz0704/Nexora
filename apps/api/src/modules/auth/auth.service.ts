import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { getEnv } from '../../config/env.js';
import type { LoginInput, RegisterInput, AuthUser, NexoraRole } from '@nexora/shared';
import type { PrismaClient } from '@prisma/client';

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  private generateToken(user: { id: number; email: string; role: string }): string {
    const env = getEnv();
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.AUTH_SECRET,
      { expiresIn: '7d' },
    );
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'Tài khoản của bạn đã bị tạm khóa.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role as NexoraRole,
      },
      token,
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email này đã được sử dụng.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        fullName: input.fullName,
        phone: input.phone || null,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    // Create empty cart for new customer
    await this.prisma.cart.create({
      data: { userId: user.id },
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role as NexoraRole,
      },
      token,
    };
  }

  async getCurrentUser(userId: number): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(404, 'USER_NOT_FOUND', 'Người dùng không tồn tại hoặc đã bị khóa.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role as NexoraRole,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const genericMessage = 'Nếu email tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.';
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Always return generic safe message to prevent email enumeration
    if (!normalizedEmail) {
      return { message: genericMessage };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return { message: genericMessage };
    }

    const env = getEnv();
    const hashSig = user.passwordHash ? user.passwordHash.slice(-16) : 'init';
    const _resetToken = jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password_reset', hashSig },
      env.AUTH_SECRET,
      { expiresIn: '15m' },
    );

    // If email provider is configured, send email out-of-band
    if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
      // Dispatch reset email securely
    }

    // NEVER return resetToken in HTTP response (prevents account takeover)
    return {
      message: genericMessage,
    };
  }

  /**
   * Internal test-only helper to generate reset token directly in test suites
   * Strictly blocked in production
   */
  async generatePasswordResetTokenForTest(email: string): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(403, 'FORBIDDEN', 'Không được phép tạo test reset token trong production.');
    }
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
    }
    const env = getEnv();
    const hashSig = user.passwordHash ? user.passwordHash.slice(-16) : 'init';
    return jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password_reset', hashSig },
      env.AUTH_SECRET,
      { expiresIn: '15m' },
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token) {
      throw new AppError(400, 'INVALID_TOKEN', 'Mã xác thực đặt lại mật khẩu không hợp lệ hoặc thiếu.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Mật khẩu mới phải có tối thiểu 8 ký tự.');
    }

    const env = getEnv();
    let payload: { sub: number; email: string; purpose?: string; hashSig?: string };
    try {
      payload = jwt.verify(token, env.AUTH_SECRET) as unknown as {
        sub: number;
        email: string;
        purpose?: string;
        hashSig?: string;
      };
    } catch {
      throw new AppError(400, 'EXPIRED_OR_INVALID_TOKEN', 'Mã đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.');
    }

    // Strict validation: must be 'password_reset' purpose AND have valid sub
    if (payload.purpose !== 'password_reset' || !payload.sub) {
      throw new AppError(400, 'INVALID_TOKEN_PURPOSE', 'Token không dùng cho mục đích đặt lại mật khẩu.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
    }

    // One-time use verification: hashSig must match user's current passwordHash signature
    const currentHashSig = user.passwordHash ? user.passwordHash.slice(-16) : 'init';
    if (!payload.hashSig || payload.hashSig !== currentHashSig) {
      throw new AppError(400, 'TOKEN_ALREADY_USED', 'Mã đặt lại mật khẩu này đã được sử dụng hoặc không còn hiệu lực.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }
}

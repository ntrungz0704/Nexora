import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { getEnv } from '../../config/env.js';
import { EmailService } from '../email/email.service.js';
import type { LoginInput, RegisterInput, AuthUser, NexoraRole } from '@nexora/shared';
import type { PrismaClient } from '@prisma/client';

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient = getPrismaClient(),
    private readonly emailService: EmailService = new EmailService(),
  ) {}

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
    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password_reset', hashSig },
      env.AUTH_SECRET,
      { expiresIn: '15m' },
    );

    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Dispatch reset email out-of-band via EmailService
    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: '[Nexora] Hướng dẫn đặt lại mật khẩu tài khoản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0F172A; margin-top: 0;">Khôi phục mật khẩu Nexora</h2>
            <p>Xin chào <strong>${user.fullName || user.email}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Nexora của bạn.</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${resetUrl}" style="background-color: #0A5BFF; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Đặt lại mật khẩu
              </a>
            </div>
            <p style="font-size: 13px; color: #64748B;">Liên kết này có hiệu lực trong vòng <strong>15 phút</strong> và chỉ có thể sử dụng một lần duy nhất.</p>
            <p style="font-size: 13px; color: #64748B;">Nếu bạn không yêu cầu, vui lòng bỏ qua thư này. Mật khẩu của bạn vẫn an toàn.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94A3B8;">Nexora Hardware E-Commerce — Single-Vendor Store Management System</p>
          </div>
        `,
        text: `Xin chào ${user.fullName || user.email},\n\nBạn vừa yêu cầu đặt lại mật khẩu tại Nexora. Vui lòng truy cập liên kết sau trong vòng 15 phút để đổi mật khẩu:\n${resetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua thư này.`,
      });
    } catch (err: unknown) {
      // NEVER log resetToken or resetUrl
      console.error(`[AuthService] Không thể gửi email đặt lại mật khẩu tới user id=${user.id}:`, err instanceof Error ? err.message : err);
      throw new AppError(
        500,
        'EMAIL_DELIVERY_FAILED',
        'Không thể gửi email đặt lại mật khẩu do lỗi dịch vụ thư. Vui lòng thử lại sau.'
      );
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

    // Hash the new password before opening transaction to minimize lock holding duration
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Atomic transaction with exclusive row lock (SELECT ... FOR UPDATE)
    // Guarantees strict atomicity under concurrent requests with the same token
    await this.prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: number; password_hash: string | null }>>`
        SELECT id, password_hash FROM users WHERE id = ${Number(payload.sub)} FOR UPDATE
      `;

      const lockedUser = users && users.length > 0 ? users[0] : null;
      if (!lockedUser) {
        throw new AppError(404, 'USER_NOT_FOUND', 'Không tìm thấy tài khoản người dùng.');
      }

      // One-time use verification: hashSig must match user's current passwordHash signature
      const currentHashSig = lockedUser.password_hash ? lockedUser.password_hash.slice(-16) : 'init';
      if (!payload.hashSig || payload.hashSig !== currentHashSig) {
        throw new AppError(
          400,
          'TOKEN_ALREADY_USED',
          'Mã đặt lại mật khẩu này đã được sử dụng hoặc không còn hiệu lực.'
        );
      }

      await tx.user.update({
        where: { id: Number(lockedUser.id) },
        data: { passwordHash: newPasswordHash },
      });
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }
}

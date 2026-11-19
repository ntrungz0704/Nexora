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
}

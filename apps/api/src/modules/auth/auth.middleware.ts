import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env.js';
import { AppError } from '../../common/errors.js';
import type { NexoraRole } from '@nexora/shared';

export interface AuthenticatedUserPayload {
  sub: number;
  email: string;
  role: NexoraRole;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function optionalAuth() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const env = getEnv();
      try {
        const decoded = jwt.verify(token, env.AUTH_SECRET) as unknown as AuthenticatedUserPayload;
        req.user = decoded;
      } catch {
        // Silently treat as guest if token is invalid or expired
      }
    }
    next();
  };
}

export function requireAuth(allowedRoles?: NexoraRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Yêu cầu đăng nhập để thực hiện chức năng này.');
    }

    const token = authHeader.substring(7).trim();
    const env = getEnv();

    try {
      const decoded = jwt.verify(token, env.AUTH_SECRET) as unknown as AuthenticatedUserPayload;
      req.user = decoded;

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập tài nguyên này.');
      }

      next();
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }
  };
}

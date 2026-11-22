import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../common/http.js';
import { LoginInputSchema, RegisterInputSchema } from '@nexora/shared';

export class AuthController {
  constructor(private readonly service: AuthService = new AuthService()) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guestSessionId =
        req.body?.guestSessionId || (req.headers['x-guest-session-id'] as string) || undefined;
      const input = LoginInputSchema.parse({
        ...req.body,
        guestSessionId,
      });
      const result = await this.service.login(input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const guestSessionId =
        req.body?.guestSessionId || (req.headers['x-guest-session-id'] as string) || undefined;
      const input = RegisterInputSchema.parse({
        ...req.body,
        guestSessionId,
      });
      const result = await this.service.register(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const user = await this.service.getCurrentUser(userId);
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword(String(email || ''));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password, newPassword } = req.body;
      const targetPassword = String(password || newPassword || '');
      const result = await this.service.resetPassword(String(token || ''), targetPassword);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

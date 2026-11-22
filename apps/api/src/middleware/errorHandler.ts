import type { ApiErrorEnvelope } from '@nexora/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiErrorEnvelope = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError || (err as { name?: string })?.name === 'ZodError') {
    const zodErr = err as ZodError;
    const body: ApiErrorEnvelope = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: zodErr.issues?.[0]?.message || 'Dữ liệu không hợp lệ.',
        details: zodErr.issues,
      },
    };
    res.status(400).json(body);
    return;
  }

  console.error('[Nexora API Error]', err instanceof Error ? err.message : 'Unknown error');

  const fallback: ApiErrorEnvelope = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  };
  res.status(500).json(fallback);
}

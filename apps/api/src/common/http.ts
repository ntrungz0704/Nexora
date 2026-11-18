import type { ApiSuccessEnvelope } from '@nexora/shared';
import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const payload: ApiSuccessEnvelope<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}

import type { EchoCheckInput } from '@nexora/shared';
import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/http.js';
import type { SystemService } from './system.service.js';

export class SystemController {
  private readonly service: SystemService;

  constructor(service: SystemService) {
    this.service = service;
  }

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const health = await this.service.getHealth();
    const statusCode = health.database === 'up' ? 200 : 503;
    sendSuccess(res, health, statusCode);
  };

  getMeta = async (_req: Request, res: Response): Promise<void> => {
    const meta = await this.service.getMeta();
    sendSuccess(res, meta, 200);
  };

  postEchoCheck = (req: Request, res: Response): void => {
    const payload = req.body as EchoCheckInput;
    const result = this.service.performEchoCheck(payload.message);
    sendSuccess(res, result, 200);
  };
}

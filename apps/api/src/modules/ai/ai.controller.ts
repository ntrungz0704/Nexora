import type { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service.js';
import { sendSuccess } from '../../common/http.js';
import {
  AiChatbotQueryInputSchema,
  AiSurveyInputSchema,
  AiCompareInputSchema,
  AiProductChatInputSchema,
} from '@nexora/shared';
import { AppError } from '../../common/errors.js';

export class AiController {
  constructor(private readonly service: AiService = new AiService()) {}

  chatbotQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AiChatbotQueryInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Tin nhắn không hợp lệ.');
      }
      const result = await this.service.queryFloatingChatbot(parsed.data.message, parsed.data.history);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  runSurvey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AiSurveyInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu khảo sát không hợp lệ.');
      }
      const result = await this.service.runSurveyRecommendation(parsed.data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  compareProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AiCompareInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Danh sách sản phẩm so sánh không hợp lệ.');
      }
      const result = await this.service.compareProducts(parsed.data.productIds, parsed.data.userPersona);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  productChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AiProductChatInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu câu hỏi không hợp lệ.');
      }
      const result = await this.service.queryProductChat(
        parsed.data.productId,
        parsed.data.question,
        parsed.data.sessionId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

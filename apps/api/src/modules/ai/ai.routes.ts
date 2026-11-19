import { Router } from 'express';
import { AiController } from './ai.controller.js';

export function createAiRouter(): Router {
  const router = Router();
  const controller = new AiController();

  // 1. Floating Chatbot
  router.post('/chatbot/query', controller.chatbotQuery);

  // 2. AI Assistant (5-step survey recommendation)
  router.post('/assistant/survey', controller.runSurvey);

  // 3. AI Product Comparison (Category lock enforced)
  router.post('/compare', controller.compareProducts);

  // 4. Product-specific AI Chat
  router.post('/product-chat', controller.productChat);

  return router;
}

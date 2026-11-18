import { NEXORA_API_V1_PREFIX, NEXORA_APP_NAME } from '@nexora/config';

export function buildOpenApiSpec(serverUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: `${NEXORA_APP_NAME} API`,
      version: '0.1.0',
      description:
        'Single-vendor Hardware E-Commerce & Store Management REST API (Foundation Phase 1).',
    },
    servers: [
      {
        url: serverUrl,
        description: 'Configured Nexora API Server',
      },
    ],
    paths: {
      [`${NEXORA_API_V1_PREFIX}/health`]: {
        get: {
          tags: ['System'],
          summary: 'API and MySQL 8.4 database health check',
          responses: {
            '200': {
              description: 'Service and MySQL database are healthy',
            },
            '503': {
              description: 'Database connectivity degraded',
            },
          },
        },
      },
      [`${NEXORA_API_V1_PREFIX}/system/meta`]: {
        get: {
          tags: ['System'],
          summary: 'Get Single-Vendor platform metadata & foundation table counts',
          responses: {
            '200': {
              description: 'Platform metadata returned cleanly',
            },
          },
        },
      },
      [`${NEXORA_API_V1_PREFIX}/system/echo-check`]: {
        post: {
          tags: ['System'],
          summary: 'Validate Zod request body handling and standardized JSON response envelope',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', minLength: 2, maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Validated echo response',
            },
            '422': {
              description: 'Validation error envelope',
            },
          },
        },
      },
    },
  };
}

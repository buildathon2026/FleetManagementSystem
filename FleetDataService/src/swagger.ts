import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fleet Data Service — MCP Tools API',
      version: '1.0.0',
      description:
        'MCP Data Server for Fleet Management System. Provides typed, validated, audit-logged tools for fleet financial data, document management, and entity resolution. The LLM agent calls these tools — it never touches the database directly.',
    },
    servers: [
      {
        url: 'http://localhost:8002',
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Fleet Tools', description: 'MCP tool endpoints for the AI agent' },
      { name: 'Health', description: 'Service health and status' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

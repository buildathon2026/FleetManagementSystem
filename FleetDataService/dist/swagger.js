"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fleet Data Service — MCP Tools API',
            version: '1.0.0',
            description: 'MCP Data Server for Fleet Management System. Provides typed, validated, audit-logged tools for fleet financial data, document management, and entity resolution. The LLM agent calls these tools — it never touches the database directly.',
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
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map
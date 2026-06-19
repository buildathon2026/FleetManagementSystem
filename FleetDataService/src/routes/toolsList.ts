import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /tools/list:
 *   get:
 *     summary: List all available MCP tools
 *     description: Returns all tool definitions with names, descriptions, and input schemas. Useful for orchestrator discovery and LLM function-calling setup.
 *     tags: [Fleet Tools]
 *     responses:
 *       200:
 *         description: Array of tool definitions with input schemas
 */
router.get('/tools/list', (_req: Request, res: Response) => {
  res.json({
    tools: [
      {
        name: "get_expenses",
        description: "Query fleet expense records. Returns total spend, item count, and individual expense line items.",
        endpoint: "GET /tools/expenses",
        inputSchema: {
          type: "object",
          properties: {
            truck_id: { type: "string", description: "Truck ID (e.g., T-084). Omit for all trucks." },
            category: { type: "string", enum: ["fuel", "parts", "labor", "insurance", "registration", "tax", "toll"], description: "Expense category filter" },
            date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
            date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
          },
        },
      },
      {
        name: "get_revenue",
        description: "Query fleet revenue/income records. Returns total revenue, load count, and individual load payments.",
        endpoint: "GET /tools/revenue",
        inputSchema: {
          type: "object",
          properties: {
            truck_id: { type: "string", description: "Truck ID (e.g., T-084). Omit for all trucks." },
            date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
            date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
          },
        },
      },
      {
        name: "get_truck_profit",
        description: "Calculate net profit (revenue minus expenses) for one truck or the entire fleet over a period.",
        endpoint: "GET /tools/profit",
        inputSchema: {
          type: "object",
          properties: {
            truck_id: { type: "string", description: "Truck ID. Omit for all trucks." },
            period: { type: "string", description: "Period: Q1-2026 (quarterly) or 2026-05 (monthly)" },
          },
          required: ["period"],
        },
      },
      {
        name: "find_document",
        description: "Find documents linked to a fleet entity (truck, driver, trailer).",
        endpoint: "GET /tools/documents",
        inputSchema: {
          type: "object",
          properties: {
            entity_id: { type: "string", description: "Entity ID (e.g., T-084, DRV-001)" },
            doc_type: { type: "string", enum: ["title", "registration", "insurance", "tax_form", "fuel_receipt", "maintenance", "inspection", "settlement", "email", "toll_receipt"], description: "Document type filter" },
            date_from: { type: "string", description: "Only docs from this date onward (YYYY-MM-DD)" },
          },
          required: ["entity_id"],
        },
      },
      {
        name: "resolve_entity",
        description: "Resolve a natural language mention to a canonical fleet entity. Handles 'truck 84', 'Unit 84', VINs, driver names.",
        endpoint: "GET /tools/entity/resolve",
        inputSchema: {
          type: "object",
          properties: {
            mention: { type: "string", description: "Natural language entity mention to resolve" },
          },
          required: ["mention"],
        },
      },
      {
        name: "get_upcoming_renewals",
        description: "Find fleet documents (registrations, insurance, inspections) expiring soon.",
        endpoint: "GET /tools/renewals",
        inputSchema: {
          type: "object",
          properties: {
            days_ahead: { type: "number", description: "Number of days to look ahead. Default: 30" },
          },
        },
      },
      {
        name: "get_fleet_overview",
        description: "Dashboard summary: all trucks with drivers, doc counts, MTD revenue, and alerts.",
        endpoint: "GET /tools/fleet-overview",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  });
});

export default router;

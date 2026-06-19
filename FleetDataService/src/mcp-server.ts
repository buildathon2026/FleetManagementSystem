#!/usr/bin/env node
/**
 * Fleet Data Service — MCP Server (stdio transport)
 *
 * Exposes the same fleet data tools as the REST API, but over the
 * Model Context Protocol for direct integration with Claude Desktop,
 * Kiro, LangChain MCP clients, etc.
 *
 * Run: npx ts-node src/mcp-server.ts
 * Or via mcp.json config for auto-discovery.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDb, initializeDatabase } from "./db";
import { seedDatabase } from "./seed";

// --- Initialize DB ---
initializeDatabase();
const db = getDb();
const entityCount = (db.prepare("SELECT COUNT(*) as count FROM entities").get() as { count: number }).count;
if (entityCount === 0) {
  seedDatabase();
}

// --- Tool Definitions ---

const TOOLS = [
  {
    name: "get_expenses",
    description: "Query fleet expense records. Returns total spend, item count, and individual expense line items. Filter by truck, expense category, and/or date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        truck_id: { type: "string", description: "Truck ID (e.g., T-084). Omit for all trucks." },
        category: {
          type: "string",
          enum: ["fuel", "parts", "labor", "insurance", "registration", "tax", "toll"],
          description: "Expense category filter",
        },
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "get_revenue",
    description: "Query fleet revenue/income records. Returns total revenue, load count, and individual load payments. Filter by truck and/or date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        truck_id: { type: "string", description: "Truck ID (e.g., T-084). Omit for all trucks." },
        date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "get_truck_profit",
    description: "Calculate net profit (revenue minus expenses) for one truck or the entire fleet over a specific period. Returns profit breakdown per truck with top expense category.",
    inputSchema: {
      type: "object" as const,
      properties: {
        truck_id: { type: "string", description: "Truck ID. Omit for all trucks." },
        period: { type: "string", description: "Period: Q1-2026 (quarterly) or 2026-05 (monthly)" },
      },
      required: ["period"],
    },
  },
  {
    name: "find_document",
    description: "Find documents linked to a fleet entity (truck, driver, trailer). Returns document metadata, type, date, and content preview.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entity_id: { type: "string", description: "Entity ID (e.g., T-084, DRV-001)" },
        doc_type: {
          type: "string",
          enum: ["title", "registration", "insurance", "tax_form", "fuel_receipt", "maintenance", "inspection", "settlement", "email", "toll_receipt"],
          description: "Document type filter",
        },
        date_from: { type: "string", description: "Only docs from this date onward (YYYY-MM-DD)" },
      },
      required: ["entity_id"],
    },
  },
  {
    name: "resolve_entity",
    description: "Resolve a natural language mention to a canonical fleet entity. Handles messy references like 'truck 84', 'Unit 84', 'VIN 3AKJ...', 'John Smith'. Returns canonical ID, type, all known aliases, and confidence score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        mention: { type: "string", description: "Natural language entity mention to resolve" },
      },
      required: ["mention"],
    },
  },
  {
    name: "get_upcoming_renewals",
    description: "Find fleet documents (registrations, insurance, inspections) that are expiring soon. Returns expiry dates, days remaining, and urgency status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        days_ahead: { type: "number", description: "Number of days to look ahead. Default: 30" },
      },
    },
  },
  {
    name: "get_fleet_overview",
    description: "Get a complete dashboard summary of the fleet: all trucks with assigned drivers, document counts, month-to-date revenue, and active alerts for expiring documents.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// --- Tool Execution Logic ---

function executeGetExpenses(args: any): any {
  let sql = "SELECT * FROM expenses WHERE 1=1";
  const params: any[] = [];

  if (args.truck_id) { sql += " AND truck_id = ?"; params.push(args.truck_id); }
  if (args.category) { sql += " AND category = ?"; params.push(args.category); }
  if (args.date_from) { sql += " AND date >= ?"; params.push(args.date_from); }
  if (args.date_to) { sql += " AND date <= ?"; params.push(args.date_to); }
  sql += " ORDER BY date DESC";

  const items = db.prepare(sql).all(...params) as any[];
  const total = items.reduce((sum: number, item: any) => sum + item.amount, 0);

  return { total: parseFloat(total.toFixed(2)), count: items.length, items };
}

function executeGetRevenue(args: any): any {
  let sql = "SELECT * FROM revenue WHERE 1=1";
  const params: any[] = [];

  if (args.truck_id) { sql += " AND truck_id = ?"; params.push(args.truck_id); }
  if (args.date_from) { sql += " AND date >= ?"; params.push(args.date_from); }
  if (args.date_to) { sql += " AND date <= ?"; params.push(args.date_to); }
  sql += " ORDER BY date DESC";

  const items = db.prepare(sql).all(...params) as any[];
  const total = items.reduce((sum: number, item: any) => sum + item.amount, 0);

  return { total: parseFloat(total.toFixed(2)), load_count: items.length, items };
}

function parsePeriod(period: string): { dateFrom: string; dateTo: string } | null {
  const quarterMatch = period.match(/^Q(\d)-(\d{4})$/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = quarterMatch[2];
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(parseInt(year), endMonth, 0).getDate();
    return {
      dateFrom: `${year}-${String(startMonth).padStart(2, "0")}-01`,
      dateTo: `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`,
    };
  }
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = monthMatch[1];
    const month = parseInt(monthMatch[2]);
    const lastDay = new Date(parseInt(year), month, 0).getDate();
    return { dateFrom: `${year}-${monthMatch[2]}-01`, dateTo: `${year}-${monthMatch[2]}-${lastDay}` };
  }
  return null;
}

function executeGetTruckProfit(args: any): any {
  const dateRange = parsePeriod(args.period);
  if (!dateRange) return { error: "Invalid period format. Use Q1-2026 or 2026-05" };

  let truckIds: string[];
  if (args.truck_id) {
    truckIds = [args.truck_id];
  } else {
    truckIds = (db.prepare("SELECT id FROM entities WHERE type = 'truck'").all() as any[]).map((r) => r.id);
  }

  const trucks = truckIds.map((id) => {
    const rev = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM revenue WHERE truck_id = ? AND date >= ? AND date <= ?").get(id, dateRange.dateFrom, dateRange.dateTo) as any).total;
    const exp = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE truck_id = ? AND date >= ? AND date <= ?").get(id, dateRange.dateFrom, dateRange.dateTo) as any).total;
    const topCat = db.prepare("SELECT category, SUM(amount) as cat_total FROM expenses WHERE truck_id = ? AND date >= ? AND date <= ? GROUP BY category ORDER BY cat_total DESC LIMIT 1").get(id, dateRange.dateFrom, dateRange.dateTo) as any;

    return { id, revenue: +rev.toFixed(2), expenses: +exp.toFixed(2), net: +(rev - exp).toFixed(2), top_expense_category: topCat?.category || null };
  });

  return { period: args.period, date_range: dateRange, trucks };
}

function executeFindDocument(args: any): any {
  let sql = "SELECT * FROM documents WHERE entity_id = ?";
  const params: any[] = [args.entity_id];

  if (args.doc_type) { sql += " AND doc_type = ?"; params.push(args.doc_type); }
  if (args.date_from) { sql += " AND date >= ?"; params.push(args.date_from); }
  sql += " ORDER BY date DESC";

  const items = db.prepare(sql).all(...params) as any[];
  return {
    documents: items.map((item) => ({
      id: item.id, type: item.doc_type, date: item.date, summary: item.summary,
      content_preview: item.content ? item.content.substring(0, 200) : null, active: item.active === 1,
    })),
    count: items.length,
  };
}

function executeResolveEntity(args: any): any {
  const mention = (args.mention || "").trim().toLowerCase();
  if (!mention) return { error: "mention is required" };

  // 1. Exact match
  const exact = db.prepare(`
    SELECT a.entity_id, a.confidence, e.type, e.canonical_name
    FROM aliases a JOIN entities e ON a.entity_id = e.id
    WHERE LOWER(a.alias_text) = ? ORDER BY a.confidence DESC LIMIT 1
  `).get(mention) as any;

  if (exact) {
    const aliases = (db.prepare("SELECT alias_text FROM aliases WHERE entity_id = ?").all(exact.entity_id) as any[]).map((a) => a.alias_text);
    return { canonical_id: exact.entity_id, type: exact.type, canonical_name: exact.canonical_name, aliases, confidence: exact.confidence };
  }

  // 2. Number normalization
  const numStr = mention.replace(/[^0-9]/g, "");
  if (numStr) {
    const normalized = parseInt(numStr).toString();
    const allAliases = db.prepare("SELECT a.entity_id, a.alias_text, e.type, e.canonical_name FROM aliases a JOIN entities e ON a.entity_id = e.id").all() as any[];
    for (const alias of allAliases) {
      const aliasNum = alias.alias_text.replace(/[^0-9]/g, "");
      if (aliasNum && parseInt(aliasNum).toString() === normalized) {
        const entityAliases = (db.prepare("SELECT alias_text FROM aliases WHERE entity_id = ?").all(alias.entity_id) as any[]).map((a) => a.alias_text);
        return { canonical_id: alias.entity_id, type: alias.type, canonical_name: alias.canonical_name, aliases: entityAliases, confidence: 0.9 };
      }
    }
  }

  // 3. Partial match
  const partial = db.prepare(`
    SELECT a.entity_id, e.type, e.canonical_name FROM aliases a JOIN entities e ON a.entity_id = e.id
    WHERE LOWER(a.alias_text) LIKE ? LIMIT 1
  `).get(`%${mention}%`) as any;

  if (partial) {
    const aliases = (db.prepare("SELECT alias_text FROM aliases WHERE entity_id = ?").all(partial.entity_id) as any[]).map((a) => a.alias_text);
    return { canonical_id: partial.entity_id, type: partial.type, canonical_name: partial.canonical_name, aliases, confidence: 0.7 };
  }

  return { error: "Entity not found", mention: args.mention };
}

function executeGetUpcomingRenewals(args: any): any {
  const daysAhead = args.days_ahead || 30;
  const today = new Date().toISOString().split("T")[0];
  const future = new Date(Date.now() + daysAhead * 86400000).toISOString().split("T")[0];

  const items = db.prepare(`
    SELECT entity_id, doc_type, date, summary FROM documents
    WHERE doc_type IN ('registration','insurance','inspection') AND date >= ? AND date <= ? AND active = 1
    ORDER BY date ASC
  `).all(today, future) as any[];

  return {
    days_ahead: daysAhead,
    count: items.length,
    items: items.map((item) => {
      const days = Math.ceil((new Date(item.date).getTime() - Date.now()) / 86400000);
      return { truck_id: item.entity_id, doc_type: item.doc_type, expiry_date: item.date, days_remaining: days, status: days <= 7 ? "critical" : days <= 14 ? "urgent" : "upcoming", summary: item.summary };
    }),
  };
}

function executeGetFleetOverview(): any {
  const trucks = (db.prepare("SELECT id, canonical_name FROM entities WHERE type = 'truck'").all() as any[]);
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];
  const future30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const result = trucks.map((truck, idx) => {
    const driver = (db.prepare("SELECT canonical_name FROM entities WHERE type = 'driver' LIMIT 1 OFFSET ?").get(idx) as any);
    const docCount = (db.prepare("SELECT COUNT(*) as count FROM documents WHERE entity_id = ? AND active = 1").get(truck.id) as any).count;
    const revMtd = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM revenue WHERE truck_id = ? AND date >= ? AND date <= ?").get(truck.id, monthStart, today) as any).total;
    const expiring = (db.prepare("SELECT COUNT(*) as count FROM documents WHERE entity_id = ? AND doc_type IN ('registration','insurance','inspection') AND date >= ? AND date <= ? AND active = 1").get(truck.id, today, future30) as any).count;

    return { id: truck.id, name: truck.canonical_name, driver: driver?.canonical_name || "Unassigned", status: "active", doc_count: docCount, revenue_mtd: +revMtd.toFixed(2), expiring_docs: expiring };
  });

  return { fleet_size: result.length, trucks: result };
}

// --- MCP Server Setup ---

const server = new Server(
  { name: "fleet-data-service", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result: any;
  try {
    switch (name) {
      case "get_expenses": result = executeGetExpenses(args || {}); break;
      case "get_revenue": result = executeGetRevenue(args || {}); break;
      case "get_truck_profit": result = executeGetTruckProfit(args || {}); break;
      case "find_document": result = executeFindDocument(args || {}); break;
      case "resolve_entity": result = executeResolveEntity(args || {}); break;
      case "get_upcoming_renewals": result = executeGetUpcomingRenewals(args || {}); break;
      case "get_fleet_overview": result = executeGetFleetOverview(); break;
      default: result = { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    result = { error: err.message };
  }

  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Fleet Data MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

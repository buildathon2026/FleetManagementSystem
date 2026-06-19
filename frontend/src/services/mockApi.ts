// Mock API service - easily swappable for real backend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';
const MCP_BASE_URL = 'http://localhost:8002';

interface ToolResponse {
  tool: string;
  params: Record<string, unknown>;
  result: unknown;
  execution_time_ms: number;
}

interface AskResponse {
  answer: string;
  sources: string[];
  confidence: 'HIGH' | 'LOW' | 'MEDIUM';
  query_type: 'STRUCTURED' | 'RETRIEVAL' | 'HYBRID';
  plan_executed: {
    tools_called: ToolResponse[];
    execution_time_ms: number;
  };
}

// Mock data structures
const mockTrucks = [
  { id: 'T-084', driver: 'J. Smith', status: 'active', revenue_mtd: 12450.50, doc_count: 45 },
  { id: 'T-091', driver: 'M. Johnson', status: 'active', revenue_mtd: 11200.00, doc_count: 38 },
  { id: 'T-105', driver: 'R. Williams', status: 'active', revenue_mtd: 10800.75, doc_count: 42 },
  { id: 'T-112', driver: 'C. Brown', status: 'inactive', revenue_mtd: 8900.00, doc_count: 28 },
  { id: 'T-118', driver: 'D. Garcia', status: 'active', revenue_mtd: 13100.25, doc_count: 51 },
  { id: 'T-125', driver: 'E. Martinez', status: 'active', revenue_mtd: 9500.50, doc_count: 33 },
  { id: 'T-132', driver: 'F. Rodriguez', status: 'active', revenue_mtd: 11800.00, doc_count: 40 },
  { id: 'T-140', driver: 'G. Lee', status: 'active', revenue_mtd: 12200.75, doc_count: 44 },
  { id: 'T-151', driver: 'H. Taylor', status: 'active', revenue_mtd: 10600.00, doc_count: 36 },
  { id: 'T-168', driver: 'I. Anderson', status: 'active', revenue_mtd: 11900.50, doc_count: 46 },
];

const mockExpenses = [
  { id: 'INV-041', truck_id: 'T-084', date: '2026-05-15', amount: 287.50, category: 'parts', description: 'Engine parts' },
  { id: 'INV-043', truck_id: 'T-084', date: '2026-05-18', amount: 450.00, category: 'fuel', description: 'Fuel surcharge' },
  { id: 'INV-047', truck_id: 'T-091', date: '2026-05-20', amount: 125.00, category: 'maintenance', description: 'Oil change' },
  { id: 'INV-051', truck_id: 'T-084', date: '2026-05-22', amount: 625.00, category: 'parts', description: 'Brake pads' },
  { id: 'INV-055', truck_id: 'T-105', date: '2026-05-25', amount: 800.00, category: 'maintenance', description: 'Tire replacement' },
];

const mockDocuments = [
  { id: 'FUEL_0001', type: 'fuel_receipt', truck_id: 'T-084', date: '2026-05-18', summary: 'Pilot Travel Center #412, 142.3 gal' },
  { id: 'INV_0023', type: 'maintenance_invoice', truck_id: 'T-084', date: '2026-05-22', summary: 'ABC Brake Service - $625.00' },
  { id: 'TAX_001', type: 'tax_form', truck_id: 'T-084', date: '2026-04-15', summary: 'Form 2290 - Highway Use Tax' },
  { id: 'INS_001', type: 'insurance_cert', truck_id: 'T-084', date: '2026-03-01', summary: 'Liberty Insurance Certificate' },
  { id: 'REG_001', type: 'registration', truck_id: 'T-084', date: '2026-01-10', summary: 'Vehicle Registration - Unit 84' },
];

const mockAlerts = [
  { id: 1, truck_id: 'T-112', type: 'inactive', message: 'Truck inactive for 30 days', severity: 'warning' },
  { id: 2, truck_id: 'T-125', type: 'renewal', message: 'Insurance renewal due in 7 days', severity: 'alert' },
  { id: 3, truck_id: 'T-140', type: 'inspection', message: 'DOT inspection overdue', severity: 'critical' },
];

// API functions
export const apiService = {
  // Ask question and get AI response
  async ask(question: string, conversationId: string): Promise<AskResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        question,
        conversation_id: conversationId,
      });
      return response.data;
    } catch (error) {
      // Fallback mock response
      return {
        answer: `Analyzing: "${question}"... Based on fleet data, you have 10 active trucks with combined revenue of $113,600 MTD.`,
        sources: ['FUEL_0001', 'INV_0023', 'TAX_001'],
        confidence: 'HIGH',
        query_type: 'STRUCTURED',
        plan_executed: {
          tools_called: [
            {
              tool: 'get_expenses',
              params: { category: 'parts', date_from: '2026-05-01' },
              result: { total: 2287.50, count: 4 },
              execution_time_ms: 45,
            },
          ],
          execution_time_ms: 150,
        },
      };
    }
  },

  // Get fleet overview
  async getFleetOverview() {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/fleet-overview`);
      return response.data;
    } catch (error) {
      return {
        trucks: mockTrucks,
        total_revenue: 113600.25,
        alerts: mockAlerts,
      };
    }
  },

  // Get expenses
  async getExpenses(params: { truck_id?: string; category?: string; date_from?: string; date_to?: string }) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/expenses`, { params });
      return response.data;
    } catch (error) {
      return {
        total: 2287.50,
        count: 4,
        items: mockExpenses.filter((e) => !params.truck_id || e.truck_id === params.truck_id),
      };
    }
  },

  // Get revenue
  async getRevenue(params: { truck_id?: string; date_from?: string; date_to?: string }) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/revenue`, { params });
      return response.data;
    } catch (error) {
      return {
        total: 12450.50,
        load_count: 24,
        items: [
          { id: 1, truck_id: params.truck_id || 'T-084', date: '2026-05-15', amount: 2500.00 },
          { id: 2, truck_id: params.truck_id || 'T-084', date: '2026-05-20', amount: 2150.50 },
        ],
      };
    }
  },

  // Search documents
  async searchDocuments(query: string, entityId?: string) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/documents`, {
        params: { entity_id: entityId, search: query },
      });
      return response.data;
    } catch (error) {
      return {
        documents: mockDocuments.filter((d) => !entityId || d.truck_id === entityId),
        count: mockDocuments.length,
      };
    }
  },

  // Resolve entity
  async resolveEntity(mention: string) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/entity/resolve`, {
        params: { mention },
      });
      return response.data;
    } catch (error) {
      // Simple local resolution
      const match = mention.match(/\d{2,3}/);
      if (match) {
        const num = match[0].padStart(3, '0');
        return {
          canonical_id: `T-${num}`,
          type: 'truck',
          aliases: [mention],
          confidence: 0.85,
        };
      }
      return null;
    }
  },

  // Get truck profit
  async getTruckProfit(truckId: string, period: string) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/profit`, {
        params: { truck_id: truckId, period },
      });
      return response.data;
    } catch (error) {
      return {
        truck_id: truckId,
        revenue: 12450.50,
        expenses: 2287.50,
        net: 10163.00,
        breakdown: { fuel: 1200, maintenance: 800, parts: 287.5 },
      };
    }
  },

  // Get upcoming renewals
  async getUpcomingRenewals(daysAhead?: number) {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/renewals`, {
        params: { days_ahead: daysAhead || 30 },
      });
      return response.data;
    } catch (error) {
      return {
        items: [
          { truck_id: 'T-125', doc_type: 'insurance_cert', expiry_date: '2026-06-25', days_remaining: 6, status: 'critical' },
          { truck_id: 'T-140', doc_type: 'inspection', expiry_date: '2026-06-30', days_remaining: 11, status: 'alert' },
          { truck_id: 'T-151', doc_type: 'registration', expiry_date: '2026-07-15', days_remaining: 26, status: 'pending' },
        ],
      };
    }
  },

  // Get tools list
  async getToolsList() {
    try {
      const response = await axios.get(`${MCP_BASE_URL}/tools/list`);
      return response.data;
    } catch (error) {
      return {
        tools: [
          { name: 'get_expenses', description: 'Get expenses by truck, category, or date range' },
          { name: 'get_revenue', description: 'Get revenue data' },
          { name: 'get_truck_profit', description: 'Get profit calculations' },
          { name: 'find_document', description: 'Semantic search for documents' },
          { name: 'resolve_entity', description: 'Map truck mentions to canonical IDs' },
          { name: 'get_upcoming_renewals', description: 'Get expiry alerts' },
          { name: 'get_fleet_overview', description: 'Get dashboard summary' },
        ],
      };
    }
  },
};

export default apiService;

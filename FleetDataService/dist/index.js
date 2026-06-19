"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const db_1 = require("./db");
const seed_1 = require("./seed");
const audit_1 = require("./middleware/audit");
// Route imports
const health_1 = __importDefault(require("./routes/health"));
const toolsList_1 = __importDefault(require("./routes/toolsList"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const revenue_1 = __importDefault(require("./routes/revenue"));
const profit_1 = __importDefault(require("./routes/profit"));
const documents_1 = __importDefault(require("./routes/documents"));
const entity_1 = __importDefault(require("./routes/entity"));
const renewals_1 = __importDefault(require("./routes/renewals"));
const fleetOverview_1 = __importDefault(require("./routes/fleetOverview"));
const PORT = parseInt(process.env.PORT || '8002', 10);
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(audit_1.auditMiddleware);
// Swagger docs
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swagger_1.swaggerSpec));
// Routes
app.use(health_1.default);
app.use(toolsList_1.default);
app.use(expenses_1.default);
app.use(revenue_1.default);
app.use(profit_1.default);
app.use(documents_1.default);
app.use(entity_1.default);
app.use(renewals_1.default);
app.use(fleetOverview_1.default);
// Initialize and start
function start() {
    // Initialize database schema
    (0, db_1.initializeDatabase)();
    // Seed if database is empty
    const db = (0, db_1.getDb)();
    const row = db.prepare('SELECT COUNT(*) as count FROM entities').get();
    if (row.count === 0) {
        console.log('Empty database detected. Seeding...');
        (0, seed_1.seedDatabase)();
    }
    const server = app.listen(PORT, () => {
        console.log(`Fleet Data Service running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`Swagger docs: http://localhost:${PORT}/docs`);
        console.log(`OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
        console.log(`Tools available at: http://localhost:${PORT}/tools/*`);
    });
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down...');
        server.close();
        (0, db_1.closeDatabase)();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        server.close();
        (0, db_1.closeDatabase)();
        process.exit(0);
    });
}
start();
exports.default = app;
//# sourceMappingURL=index.js.map
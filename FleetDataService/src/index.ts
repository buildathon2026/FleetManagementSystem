import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { initializeDatabase, closeDatabase, getDb } from './db';
import { seedDatabase } from './seed';
import { auditMiddleware } from './middleware/audit';

// Route imports
import healthRouter from './routes/health';
import expensesRouter from './routes/expenses';
import revenueRouter from './routes/revenue';
import profitRouter from './routes/profit';
import documentsRouter from './routes/documents';
import entityRouter from './routes/entity';
import renewalsRouter from './routes/renewals';
import fleetOverviewRouter from './routes/fleetOverview';

const PORT = parseInt(process.env.PORT || '8002', 10);

const app = express();

// Middleware
app.use(express.json());
app.use(auditMiddleware);

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));

// Routes
app.use(healthRouter);
app.use(expensesRouter);
app.use(revenueRouter);
app.use(profitRouter);
app.use(documentsRouter);
app.use(entityRouter);
app.use(renewalsRouter);
app.use(fleetOverviewRouter);

// Initialize and start
function start(): void {
  // Initialize database schema
  initializeDatabase();

  // Seed if database is empty
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM entities').get() as { count: number };
  if (row.count === 0) {
    console.log('Empty database detected. Seeding...');
    seedDatabase();
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
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    server.close();
    closeDatabase();
    process.exit(0);
  });
}

start();

export default app;

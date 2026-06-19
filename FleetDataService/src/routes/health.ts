import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     description: Returns service status, database connectivity, and entity count.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM entities').get() as { count: number };
    res.json({
      status: 'healthy',
      service: 'fleet-data-service',
      version: '1.0.0',
      database: 'connected',
      entities: row.count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

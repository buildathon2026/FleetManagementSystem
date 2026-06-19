import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/revenue:
 *   get:
 *     summary: Get revenue records
 *     description: Query revenue/income records with optional filters by truck and date range.
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: truck_id
 *         schema:
 *           type: string
 *         description: Filter by truck ID (e.g., T-084)
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue records with total and load count
 */
router.get('/tools/revenue', (req: Request, res: Response) => {
  const { truck_id, date_from, date_to } = req.query;

  let sql = 'SELECT * FROM revenue WHERE 1=1';
  const params: any[] = [];

  if (truck_id) {
    sql += ' AND truck_id = ?';
    params.push(truck_id);
  }
  if (date_from) {
    sql += ' AND date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    sql += ' AND date <= ?';
    params.push(date_to);
  }

  sql += ' ORDER BY date DESC';

  const db = getDb();
  const items = db.prepare(sql).all(...params) as Array<{
    id: number; truck_id: string; date: string; amount: number;
    load_id: string; description: string;
  }>;

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  res.json({
    total: parseFloat(total.toFixed(2)),
    load_count: items.length,
    items: items.map(item => ({
      id: item.id,
      truck_id: item.truck_id,
      date: item.date,
      amount: item.amount,
      load_id: item.load_id,
      description: item.description
    }))
  });
});

export default router;

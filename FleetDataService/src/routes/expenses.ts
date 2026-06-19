import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/expenses:
 *   get:
 *     summary: Get expense records
 *     description: Query expense records with optional filters by truck, category, and date range.
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: truck_id
 *         schema:
 *           type: string
 *         description: Filter by truck ID (e.g., T-084)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [fuel, parts, labor, insurance, registration, tax, toll]
 *         description: Filter by expense category
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
 *         description: Expense records with total
 */
router.get('/tools/expenses', (req: Request, res: Response) => {
  const { truck_id, category, date_from, date_to } = req.query;

  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (truck_id) {
    sql += ' AND truck_id = ?';
    params.push(truck_id);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
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
    category: string; description: string; doc_ref: string;
  }>;

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  res.json({
    total: parseFloat(total.toFixed(2)),
    count: items.length,
    items: items.map(item => ({
      id: item.id,
      truck_id: item.truck_id,
      date: item.date,
      amount: item.amount,
      category: item.category,
      description: item.description,
      doc_ref: item.doc_ref
    }))
  });
});

export default router;

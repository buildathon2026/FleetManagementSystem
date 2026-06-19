import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/profit:
 *   get:
 *     summary: Calculate truck profitability
 *     description: Compute net profit (revenue minus expenses) for a truck or entire fleet over a period.
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: truck_id
 *         schema:
 *           type: string
 *         description: Filter by truck ID. If omitted, returns all trucks.
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *         description: "Period format: Q1-2026 (quarterly) or 2026-05 (monthly)"
 *     responses:
 *       200:
 *         description: Profit breakdown per truck
 *       400:
 *         description: Invalid period format
 */
function parsePeriod(period: string): { dateFrom: string; dateTo: string } | null {
  // Quarter format: Q1-2026, Q2-2026, etc.
  const quarterMatch = period.match(/^Q(\d)-(\d{4})$/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = quarterMatch[2];
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    return {
      dateFrom: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      dateTo: `${year}-${String(endMonth).padStart(2, '0')}-${endMonth === 2 ? '28' : endMonth === 12 || endMonth === 10 || endMonth === 8 || endMonth === 7 || endMonth === 5 || endMonth === 3 || endMonth === 1 ? '31' : '30'}`
    };
  }

  // Month format: 2026-05
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = monthMatch[1];
    const month = parseInt(monthMatch[2]);
    const lastDay = new Date(parseInt(year), month, 0).getDate();
    return {
      dateFrom: `${year}-${monthMatch[2]}-01`,
      dateTo: `${year}-${monthMatch[2]}-${lastDay}`
    };
  }

  return null;
}

router.get('/tools/profit', (req: Request, res: Response) => {
  const { truck_id, period } = req.query;

  if (!period || typeof period !== 'string') {
    res.status(400).json({ error: 'period parameter is required (e.g., Q1-2026 or 2026-05)' });
    return;
  }

  const dateRange = parsePeriod(period);
  if (!dateRange) {
    res.status(400).json({ error: 'Invalid period format. Use Q1-2026 or 2026-05' });
    return;
  }

  const db = getDb();

  // Determine which trucks to calculate
  let truckIds: string[];
  if (truck_id && typeof truck_id === 'string') {
    truckIds = [truck_id];
  } else {
    const rows = db.prepare("SELECT id FROM entities WHERE type = 'truck'").all() as Array<{ id: string }>;
    truckIds = rows.map(r => r.id);
  }

  const trucks = truckIds.map(id => {
    // Revenue for period
    const revRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM revenue WHERE truck_id = ? AND date >= ? AND date <= ?'
    ).get(id, dateRange.dateFrom, dateRange.dateTo) as { total: number };

    // Expenses for period
    const expRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE truck_id = ? AND date >= ? AND date <= ?'
    ).get(id, dateRange.dateFrom, dateRange.dateTo) as { total: number };

    // Top expense category
    const topCat = db.prepare(
      'SELECT category, SUM(amount) as cat_total FROM expenses WHERE truck_id = ? AND date >= ? AND date <= ? GROUP BY category ORDER BY cat_total DESC LIMIT 1'
    ).get(id, dateRange.dateFrom, dateRange.dateTo) as { category: string; cat_total: number } | undefined;

    const revenue = parseFloat(revRow.total.toFixed(2));
    const expenses = parseFloat(expRow.total.toFixed(2));

    return {
      id,
      revenue,
      expenses,
      net: parseFloat((revenue - expenses).toFixed(2)),
      top_expense_category: topCat?.category || null
    };
  });

  res.json({
    period,
    date_range: dateRange,
    trucks
  });
});

export default router;

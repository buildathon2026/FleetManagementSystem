import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/renewals:
 *   get:
 *     summary: Get upcoming document renewals
 *     description: Find fleet documents (registrations, insurance, inspections) expiring within a given number of days.
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: days_ahead
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead for expiring documents
 *     responses:
 *       200:
 *         description: List of expiring documents with status (critical/urgent/upcoming)
 */
router.get('/tools/renewals', (req: Request, res: Response) => {
  const daysAhead = parseInt(req.query.days_ahead as string) || 30;

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Find documents with dates (expiry) between today and futureDate
  // We look for registration, insurance, and inspection docs that are expiring
  const renewableTypes = ['registration', 'insurance', 'inspection'];

  const items = db.prepare(`
    SELECT d.id, d.entity_id, d.doc_type, d.date, d.summary, d.content
    FROM documents d
    WHERE d.doc_type IN (${renewableTypes.map(() => '?').join(',')})
      AND d.date >= ?
      AND d.date <= ?
      AND d.active = 1
    ORDER BY d.date ASC
  `).all(...renewableTypes, today, futureDate) as Array<{
    id: string; entity_id: string; doc_type: string; date: string;
    summary: string; content: string;
  }>;

  const result = items.map(item => {
    const expiryDate = new Date(item.date);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: string;
    if (daysRemaining <= 0) status = 'expired';
    else if (daysRemaining <= 7) status = 'critical';
    else if (daysRemaining <= 14) status = 'urgent';
    else status = 'upcoming';

    return {
      truck_id: item.entity_id,
      doc_type: item.doc_type,
      expiry_date: item.date,
      days_remaining: daysRemaining,
      status,
      summary: item.summary
    };
  });

  res.json({
    days_ahead: daysAhead,
    count: result.length,
    items: result
  });
});

export default router;

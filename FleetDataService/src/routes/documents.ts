import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/documents:
 *   get:
 *     summary: Find documents for an entity
 *     description: Retrieve documents linked to a fleet entity (truck, driver, trailer) with optional type and date filters.
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: entity_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID (e.g., T-084, DRV-001)
 *       - in: query
 *         name: doc_type
 *         schema:
 *           type: string
 *           enum: [title, registration, insurance, tax_form, fuel_receipt, maintenance, inspection, settlement, email, toll_receipt]
 *         description: Filter by document type
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Only docs from this date onward
 *     responses:
 *       200:
 *         description: List of matching documents
 *       400:
 *         description: entity_id is required
 */
router.get('/tools/documents', (req: Request, res: Response) => {
  const { entity_id, doc_type, date_from } = req.query;

  if (!entity_id) {
    res.status(400).json({ error: 'entity_id parameter is required' });
    return;
  }

  let sql = 'SELECT * FROM documents WHERE entity_id = ?';
  const params: any[] = [entity_id];

  if (doc_type) {
    sql += ' AND doc_type = ?';
    params.push(doc_type);
  }
  if (date_from) {
    sql += ' AND date >= ?';
    params.push(date_from);
  }

  sql += ' ORDER BY date DESC';

  const db = getDb();
  const items = db.prepare(sql).all(...params) as Array<{
    id: string; entity_id: string; doc_type: string; date: string;
    summary: string; content: string; active: number;
  }>;

  res.json({
    documents: items.map(item => ({
      id: item.id,
      type: item.doc_type,
      date: item.date,
      summary: item.summary,
      content_preview: item.content ? item.content.substring(0, 200) : null,
      active: item.active === 1
    })),
    count: items.length
  });
});

export default router;

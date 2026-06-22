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
const INGESTION_URL = (process.env.INGESTION_URL || process.env.VITE_INGEST_API_URL || 'http://localhost:8004').replace(/\/$/, '');

interface DocumentResult {
  id: string;
  type: string;
  date?: string;
  summary?: string;
  content_preview: string | null;
  active: boolean;
  source?: string;
  similarity?: number;
}

router.get('/tools/documents', async (req: Request, res: Response) => {
  const { entity_id, doc_type, date_from } = req.query;

  if (!entity_id) {
    res.status(400).json({ error: 'entity_id parameter is required' });
    return;
  }

  const entityId = String(entity_id);
  const docType = doc_type ? String(doc_type) : undefined;
  const dateFrom = date_from ? String(date_from) : undefined;

  const vectorDocuments = await getVectorDocuments(entityId, docType, dateFrom);
  if (vectorDocuments) {
    res.json({
      documents: vectorDocuments,
      count: vectorDocuments.length,
      retrieval_backend: 'chromadb'
    });
    return;
  }

  let sql = 'SELECT * FROM documents WHERE entity_id = ?';
  const params: any[] = [entityId];

  if (docType) {
    sql += ' AND doc_type = ?';
    params.push(docType);
  }
  if (dateFrom) {
    sql += ' AND date >= ?';
    params.push(dateFrom);
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
      active: item.active === 1,
      source: 'sqlite'
    })),
    count: items.length,
    retrieval_backend: 'sqlite'
  });
});

async function getVectorDocuments(
  entityId: string,
  docType?: string,
  dateFrom?: string
): Promise<DocumentResult[] | null> {
  const params = new URLSearchParams();
  if (docType) params.set('doc_type', docType);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const url = `${INGESTION_URL}/documents/${encodeURIComponent(entityId)}${suffix}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    const payload = await response.json() as { documents?: any[] };
    if (!Array.isArray(payload.documents)) return null;

    return payload.documents
      .map((doc) => {
        const metadata = doc.metadata || {};
        return {
          id: String(doc.id || metadata.doc_id || metadata.id || ''),
          type: String(metadata.doc_type || metadata.type || doc.type || 'document'),
          date: metadata.date || metadata.expiration_date || metadata.ingested_at,
          summary: metadata.summary || metadata.filename || 'Retrieved from document vector store',
          content_preview: doc.content ? String(doc.content).substring(0, 200) : null,
          active: metadata.active !== false,
          source: 'chromadb',
          similarity: doc.similarity,
        };
      })
      .filter((doc) => doc.id && (!dateFrom || !doc.date || String(doc.date) >= dateFrom));
  } catch (_error) {
    return null;
  }
}

export default router;

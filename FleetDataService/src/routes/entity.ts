import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * @swagger
 * /tools/entity/resolve:
 *   get:
 *     summary: Resolve entity mention
 *     description: "Resolve a natural language mention (e.g., 'truck 84', 'John Smith', 'VIN 3AKJ...') to a canonical fleet entity ID with confidence scoring."
 *     tags: [Fleet Tools]
 *     parameters:
 *       - in: query
 *         name: mention
 *         required: true
 *         schema:
 *           type: string
 *         description: "Natural language entity mention (e.g., 'truck 84', 'Unit 84', 'the white Cascadia')"
 *     responses:
 *       200:
 *         description: Resolved entity with canonical ID, aliases, and confidence
 *       404:
 *         description: Entity not found
 */

interface EntityMatch {
  canonical_id: string;
  type: string;
  canonical_name: string;
  aliases: string[];
  confidence: number;
}

/**
 * Entity resolution logic:
 * 1. Exact alias match → confidence 1.0
 * 2. Normalized unit number match (strip #, leading zeros) → confidence 0.9
 * 3. Partial/fuzzy match → confidence 0.7
 */
function resolveEntity(mention: string): EntityMatch | null {
  const db = getDb();
  const normalizedMention = mention.trim().toLowerCase();

  // 1. Exact alias match (case-insensitive)
  const exactMatch = db.prepare(`
    SELECT a.entity_id, a.confidence, e.type, e.canonical_name
    FROM aliases a
    JOIN entities e ON a.entity_id = e.id
    WHERE LOWER(a.alias_text) = ?
    ORDER BY a.confidence DESC
    LIMIT 1
  `).get(normalizedMention) as { entity_id: string; confidence: number; type: string; canonical_name: string } | undefined;

  if (exactMatch) {
    const aliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
      .all(exactMatch.entity_id) as Array<{ alias_text: string }>;
    return {
      canonical_id: exactMatch.entity_id,
      type: exactMatch.type,
      canonical_name: exactMatch.canonical_name,
      aliases: aliases.map(a => a.alias_text),
      confidence: exactMatch.confidence
    };
  }

  // 2. Normalized unit number match
  // Extract numbers from mention, strip leading zeros, #, "unit", "truck"
  const numberMatch = normalizedMention.replace(/[^0-9]/g, '');
  if (numberMatch) {
    const normalizedNum = parseInt(numberMatch).toString();

    // Search aliases that contain this number pattern
    const allAliases = db.prepare(`
      SELECT a.entity_id, a.alias_text, e.type, e.canonical_name
      FROM aliases a
      JOIN entities e ON a.entity_id = e.id
    `).all() as Array<{ entity_id: string; alias_text: string; type: string; canonical_name: string }>;

    for (const alias of allAliases) {
      const aliasNum = alias.alias_text.replace(/[^0-9]/g, '');
      if (aliasNum && parseInt(aliasNum).toString() === normalizedNum) {
        const entityAliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
          .all(alias.entity_id) as Array<{ alias_text: string }>;
        return {
          canonical_id: alias.entity_id,
          type: alias.type,
          canonical_name: alias.canonical_name,
          aliases: entityAliases.map(a => a.alias_text),
          confidence: 0.9
        };
      }
    }
  }

  // 3. Partial/fuzzy match - check if mention is contained in any alias or vice versa
  const partialMatches = db.prepare(`
    SELECT a.entity_id, a.alias_text, e.type, e.canonical_name
    FROM aliases a
    JOIN entities e ON a.entity_id = e.id
    WHERE LOWER(a.alias_text) LIKE ? OR ? LIKE '%' || LOWER(a.alias_text) || '%'
    LIMIT 1
  `).get(`%${normalizedMention}%`, normalizedMention) as { entity_id: string; alias_text: string; type: string; canonical_name: string } | undefined;

  if (partialMatches) {
    const entityAliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
      .all(partialMatches.entity_id) as Array<{ alias_text: string }>;
    return {
      canonical_id: partialMatches.entity_id,
      type: partialMatches.type,
      canonical_name: partialMatches.canonical_name,
      aliases: entityAliases.map(a => a.alias_text),
      confidence: 0.7
    };
  }

  return null;
}

router.get('/tools/entity/resolve', (req: Request, res: Response) => {
  const { mention } = req.query;

  if (!mention || typeof mention !== 'string') {
    res.status(400).json({ error: 'mention parameter is required' });
    return;
  }

  const result = resolveEntity(mention);

  if (!result) {
    res.status(404).json({
      error: 'Entity not found',
      mention,
      suggestion: 'Try using a truck ID (T-084), unit number (Unit 84), or driver name'
    });
    return;
  }

  res.json(result);
});

export default router;

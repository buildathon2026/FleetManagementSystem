"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * Entity resolution logic:
 * 1. Exact alias match → confidence 1.0
 * 2. Normalized unit number match (strip #, leading zeros) → confidence 0.9
 * 3. Partial/fuzzy match → confidence 0.7
 */
function resolveEntity(mention) {
    const db = (0, db_1.getDb)();
    const normalizedMention = mention.trim().toLowerCase();
    // 1. Exact alias match (case-insensitive)
    const exactMatch = db.prepare(`
    SELECT a.entity_id, a.confidence, e.type, e.canonical_name
    FROM aliases a
    JOIN entities e ON a.entity_id = e.id
    WHERE LOWER(a.alias_text) = ?
    ORDER BY a.confidence DESC
    LIMIT 1
  `).get(normalizedMention);
    if (exactMatch) {
        const aliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
            .all(exactMatch.entity_id);
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
    `).all();
        for (const alias of allAliases) {
            const aliasNum = alias.alias_text.replace(/[^0-9]/g, '');
            if (aliasNum && parseInt(aliasNum).toString() === normalizedNum) {
                const entityAliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
                    .all(alias.entity_id);
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
  `).get(`%${normalizedMention}%`, normalizedMention);
    if (partialMatches) {
        const entityAliases = db.prepare('SELECT alias_text FROM aliases WHERE entity_id = ?')
            .all(partialMatches.entity_id);
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
router.get('/tools/entity/resolve', (req, res) => {
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
exports.default = router;
//# sourceMappingURL=entity.js.map
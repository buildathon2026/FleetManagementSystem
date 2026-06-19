"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
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
router.get('/health', (_req, res) => {
    try {
        const db = (0, db_1.getDb)();
        const row = db.prepare('SELECT COUNT(*) as count FROM entities').get();
        res.json({
            status: 'healthy',
            service: 'fleet-data-service',
            version: '1.0.0',
            database: 'connected',
            entities: row.count,
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map
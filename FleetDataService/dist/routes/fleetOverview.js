"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /tools/fleet-overview:
 *   get:
 *     summary: Get fleet overview
 *     description: Dashboard summary showing all trucks with assigned drivers, document counts, MTD revenue, and active alerts.
 *     tags: [Fleet Tools]
 *     responses:
 *       200:
 *         description: Complete fleet overview with trucks and alerts
 */
router.get('/tools/fleet-overview', (_req, res) => {
    const db = (0, db_1.getDb)();
    // Get all trucks
    const truckEntities = db.prepare("SELECT id, canonical_name FROM entities WHERE type = 'truck'").all();
    // Current month for MTD revenue
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];
    const trucks = truckEntities.map(truck => {
        // Find assigned driver (using index mapping from seed)
        const driverRow = db.prepare(`
      SELECT e.id, e.canonical_name FROM entities e
      WHERE e.type = 'driver'
      LIMIT 1 OFFSET (SELECT COUNT(*) FROM entities WHERE type = 'truck' AND id <= ?) - 1
    `).get(truck.id);
        // Document count
        const docCount = db.prepare('SELECT COUNT(*) as count FROM documents WHERE entity_id = ? AND active = 1').get(truck.id);
        // Revenue MTD
        const revMtd = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue WHERE truck_id = ? AND date >= ? AND date <= ?').get(truck.id, monthStart, today);
        // Check for any expiring documents (next 30 days)
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const expiringDocs = db.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE entity_id = ? AND doc_type IN ('registration', 'insurance', 'inspection')
      AND date >= ? AND date <= ? AND active = 1
    `).get(truck.id, today, futureDate);
        return {
            id: truck.id,
            name: truck.canonical_name,
            driver: driverRow?.canonical_name || 'Unassigned',
            status: 'active',
            doc_count: docCount.count,
            revenue_mtd: parseFloat(revMtd.total.toFixed(2)),
            expiring_docs: expiringDocs.count
        };
    });
    // Alerts
    const alerts = [];
    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgentRenewals = db.prepare(`
    SELECT entity_id, doc_type, date FROM documents
    WHERE doc_type IN ('registration', 'insurance', 'inspection')
    AND date >= ? AND date <= ? AND active = 1
  `).all(today, futureDate);
    for (const renewal of urgentRenewals) {
        alerts.push({
            type: 'renewal_due',
            message: `${renewal.doc_type} expires on ${renewal.date}`,
            truck_id: renewal.entity_id
        });
    }
    res.json({
        fleet_size: trucks.length,
        trucks,
        alerts,
        generated_at: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=fleetOverview.js.map
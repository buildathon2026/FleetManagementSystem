"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
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
router.get('/tools/revenue', (req, res) => {
    const { truck_id, date_from, date_to } = req.query;
    let sql = 'SELECT * FROM revenue WHERE 1=1';
    const params = [];
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
    const db = (0, db_1.getDb)();
    const items = db.prepare(sql).all(...params);
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
exports.default = router;
//# sourceMappingURL=revenue.js.map
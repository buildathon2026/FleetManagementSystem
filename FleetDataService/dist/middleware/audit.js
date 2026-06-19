"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = auditMiddleware;
const db_1 = require("../db");
function auditMiddleware(req, res, next) {
    // Only audit /tools/* endpoints
    if (!req.path.startsWith('/tools/')) {
        next();
        return;
    }
    const startTime = Date.now();
    const toolName = req.path.replace('/tools/', '');
    const params = JSON.stringify(req.query);
    // Override res.json to capture result count
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const executionTime = Date.now() - startTime;
        let resultCount = 0;
        if (body) {
            if (Array.isArray(body.items))
                resultCount = body.items.length;
            else if (Array.isArray(body.documents))
                resultCount = body.documents.length;
            else if (Array.isArray(body.trucks))
                resultCount = body.trucks.length;
            else if (body.count !== undefined)
                resultCount = body.count;
            else
                resultCount = 1;
        }
        try {
            const db = (0, db_1.getDb)();
            db.prepare('INSERT INTO audit_log (tool_name, params, result_count, execution_time_ms) VALUES (?, ?, ?, ?)').run(toolName, params, resultCount, executionTime);
        }
        catch (err) {
            console.error('Audit log error:', err);
        }
        return originalJson(body);
    };
    next();
}
//# sourceMappingURL=audit.js.map
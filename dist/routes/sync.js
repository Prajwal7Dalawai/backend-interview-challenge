"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSyncRouter = createSyncRouter;
const express_1 = require("express");
const syncService_1 = require("../services/syncService");
function createSyncRouter(db) {
    const router = (0, express_1.Router)();
    const syncService = new syncService_1.SyncService(db);
    router.post('/sync', async (_req, res) => {
        const result = await syncService.sync();
        return res.json(result);
    });
    router.get('/status', async (_req, res) => {
        const queue = await db.all(`SELECT * FROM sync_queue`);
        return res.json({ pending: queue.length });
    });
    router.get('/health', async (_req, res) => {
        return res.json({ status: 'ok', timestamp: new Date() });
    });
    return router;
}
//# sourceMappingURL=sync.js.map
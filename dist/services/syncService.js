"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
class SyncService {
    db;
    apiUrl;
    constructor(db, apiUrl = process.env.API_BASE_URL || 'http://localhost:3000/api') {
        this.db = db;
        this.apiUrl = apiUrl;
    }
    mapQueue(row) {
        return {
            id: row.id,
            task_id: row.task_id,
            operation: row.operation,
            data: JSON.parse(row.data),
            created_at: new Date(row.created_at),
            retry_count: row.retry_count,
            error_message: row.error_message
        };
    }
    async sync() {
        const raw = await this.db.all(`SELECT * FROM sync_queue ORDER BY created_at`);
        const queue = raw.map(r => this.mapQueue(r));
        if (queue.length === 0) {
            return { success: true, synced_items: 0, failed_items: 0, errors: [] };
        }
        try {
            const payload = {
                items: queue,
                client_timestamp: new Date()
            };
            await axios_1.default.post(this.apiUrl, payload);
            for (const item of queue) {
                await this.db.run(`UPDATE tasks SET sync_status = 'synced', last_synced_at = CURRENT_TIMESTAMP WHERE id = ?`, [item.task_id]);
                await this.db.run(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
            }
            return {
                success: true,
                synced_items: queue.length,
                failed_items: 0,
                errors: []
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            const errors = queue.map(item => ({
                task_id: item.task_id,
                operation: item.operation,
                error: message,
                timestamp: new Date()
            }));
            return {
                success: false,
                synced_items: 0,
                failed_items: queue.length,
                errors
            };
        }
    }
    async addToSyncQueue(taskId, operation, data) {
        await this.db.run(`INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, ?, ?)`, [(0, uuid_1.v4)(), taskId, operation, JSON.stringify(data)]);
    }
    async checkConnectivity() {
        try {
            await axios_1.default.get(`${this.apiUrl}/health`, { timeout: 3000 });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.SyncService = SyncService;
//# sourceMappingURL=syncService.js.map
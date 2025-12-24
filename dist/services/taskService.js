"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const uuid_1 = require("uuid");
class TaskService {
    db;
    constructor(db) {
        this.db = db;
    }
    mapRow(row) {
        return {
            id: row.id,
            title: row.title,
            description: row.description ?? undefined,
            completed: Boolean(row.completed),
            is_deleted: Boolean(row.is_deleted),
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
            sync_status: row.sync_status,
            server_id: row.server_id,
            last_synced_at: row.last_synced_at
                ? new Date(row.last_synced_at)
                : undefined
        };
    }
    async createTask(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        await this.db.run(`INSERT INTO tasks (id, title, description, completed, is_deleted, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 'pending', ?, ?)`, [id, data.title ?? '', data.description ?? '', now, now]);
        await this.db.run(`INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'create', ?)`, [(0, uuid_1.v4)(), id, JSON.stringify(data)]);
        const row = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
        if (!row)
            throw new Error('Task creation failed');
        return this.mapRow(row);
    }
    async updateTask(id, data) {
        const existing = await this.db.get(`SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`, [id]);
        if (!existing)
            return null;
        const completed = data.completed !== undefined
            ? data.completed ? 1 : 0
            : existing.completed;
        await this.db.run(`UPDATE tasks
       SET title = ?, description = ?, completed = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`, [
            data.title ?? existing.title,
            data.description ?? existing.description,
            completed,
            new Date().toISOString(),
            id
        ]);
        await this.db.run(`INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'update', ?)`, [(0, uuid_1.v4)(), id, JSON.stringify(data)]);
        const row = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
        return row ? this.mapRow(row) : null;
    }
    async deleteTask(id) {
        const existing = await this.db.get(`SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`, [id]);
        if (!existing)
            return false;
        await this.db.run(`UPDATE tasks SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?`, [new Date().toISOString(), id]);
        await this.db.run(`INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'delete', ?)`, [(0, uuid_1.v4)(), id, JSON.stringify({ id })]);
        return true;
    }
    async getTask(id) {
        const row = await this.db.get(`SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`, [id]);
        return row ? this.mapRow(row) : null;
    }
    async getAllTasks() {
        const rows = await this.db.all(`SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC`);
        return rows.map(r => this.mapRow(r));
    }
    async getTasksNeedingSync() {
        const rows = await this.db.all(`SELECT * FROM tasks WHERE sync_status IN ('pending','error')`);
        return rows.map(r => this.mapRow(r));
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=taskService.js.map
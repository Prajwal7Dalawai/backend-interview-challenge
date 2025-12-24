"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./db/database");
const tasks_1 = require("./routes/tasks");
const sync_1 = require("./routes/sync");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const dbPath = process.env.VERCEL === '1'
    ? '/tmp/tasks.sqlite'
    : process.env.DATABASE_URL || './data/tasks.sqlite';
const db = new database_1.Database(dbPath);
db.initialize();
app.use('/tasks', (0, tasks_1.createTaskRouter)(db));
app.use('/sync', (0, sync_1.createSyncRouter)(db));
app.get('/', (_req, res) => {
    return res.json({ status: 'ok' });
});
exports.default = app;
//# sourceMappingURL=server.js.map
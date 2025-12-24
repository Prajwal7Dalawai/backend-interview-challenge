"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskRouter = createTaskRouter;
const express_1 = require("express");
const taskService_1 = require("../services/taskService");
function createTaskRouter(db) {
    const router = (0, express_1.Router)();
    const taskService = new taskService_1.TaskService(db);
    router.get('/', async (_req, res) => {
        return res.json(await taskService.getAllTasks());
    });
    router.get('/:id', async (req, res) => {
        const task = await taskService.getTask(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.json(task);
    });
    router.post('/', async (req, res) => {
        return res.status(201).json(await taskService.createTask(req.body));
    });
    router.put('/:id', async (req, res) => {
        const task = await taskService.updateTask(req.params.id, req.body);
        if (!task) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.json(task);
    });
    router.delete('/:id', async (req, res) => {
        const ok = await taskService.deleteTask(req.params.id);
        return res.json({ success: ok });
    });
    return router;
}
//# sourceMappingURL=tasks.js.map
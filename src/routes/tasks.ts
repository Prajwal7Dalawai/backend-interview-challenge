import { Router } from 'express';
import { Database } from '../db/database';
import { TaskService } from '../services/taskService';

export function createTaskRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);

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

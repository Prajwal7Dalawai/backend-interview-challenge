import { Router } from 'express';
import { Database } from '../db/database';
import { SyncService } from '../services/syncService';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const syncService = new SyncService(db);

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

import { Router, Request, Response } from 'express';
import { Database } from '../db/database';
import { SyncService } from '../services/syncService';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const syncService = new SyncService(db);

  router.post('/sync', async (_req: Request, res: Response) => {
    const result = await syncService.sync();
    return res.json(result);
  });

  router.get('/status', async (_req: Request, res: Response) => {
    const queue = await db.all('SELECT * FROM sync_queue');
    return res.json({ pending: queue.length });
  });

  router.get('/health', async (_req: Request, res: Response) => {
    return res.json({ status: 'ok', timestamp: new Date() });
  });

  return router;
}

import express, { Request, Response } from 'express';
import { Database } from './db/database';
import { createTaskRouter } from './routes/tasks';
import { createSyncRouter } from './routes/sync';

const app = express();
app.use(express.json());

const dbPath =
  process.env.VERCEL === '1'
    ? '/tmp/tasks.sqlite'
    : process.env.DATABASE_URL || './data/tasks.sqlite';

const db = new Database(dbPath);
db.initialize();

app.use('/tasks', createTaskRouter(db));
app.use('/sync', createSyncRouter(db));

app.get('/', (_req: Request, res: Response) => {
  return res.json({ status: 'ok' });
});

export default app;

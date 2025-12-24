import express from 'express';
import { Database } from './db/database';
import { createTaskRouter } from './routes/tasks';
import { createSyncRouter } from './routes/sync';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const dbPath =
  process.env.NODE_ENV === 'production'
    ? '/tmp/tasks.sqlite'
    : process.env.DATABASE_URL || ':memory:';

const db = new Database(dbPath);
db.initialize();

app.use('/tasks', createTaskRouter(db));
app.use('/sync', createSyncRouter(db));

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

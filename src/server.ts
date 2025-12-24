import express from 'express';
import { Database } from './db/database';
import { createTaskRouter } from './routes/tasks';
import { createSyncRouter } from './routes/sync';

const app = express();
app.use(express.json());

const db = new Database(process.env.DATABASE_URL);
db.initialize();

app.use('/tasks', createTaskRouter(db));
app.use('/sync', createSyncRouter(db));

app.get('/', (_req, res) => {
  res.send('OK');
});

export default app;

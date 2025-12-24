import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { Database } from '../db/database';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  completed: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status?: 'pending' | 'synced' | 'error';
  server_id?: string;
  last_synced_at?: string;
};

export class TaskService {
  constructor(private db: Database) {}

  private mapRow(row: TaskRow): Task {
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

  async createTask(data: Partial<Task>): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO tasks (id, title, description, completed, is_deleted, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 'pending', ?, ?)`,
      [id, data.title ?? '', data.description ?? '', now, now]
    );

    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'create', ?)`,
      [uuidv4(), id, JSON.stringify(data)]
    );

    const row = await this.db.get<TaskRow>(
      `SELECT * FROM tasks WHERE id = ?`,
      [id]
    );

    if (!row) throw new Error('Task creation failed');
    return this.mapRow(row);
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    const existing = await this.db.get<TaskRow>(
      `SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!existing) return null;

    const completed =
      data.completed !== undefined
        ? data.completed ? 1 : 0
        : existing.completed;

    await this.db.run(
      `UPDATE tasks
       SET title = ?, description = ?, completed = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [
        data.title ?? existing.title,
        data.description ?? existing.description,
        completed,
        new Date().toISOString(),
        id
      ]
    );

    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'update', ?)`,
      [uuidv4(), id, JSON.stringify(data)]
    );

    const row = await this.db.get<TaskRow>(
      `SELECT * FROM tasks WHERE id = ?`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async deleteTask(id: string): Promise<boolean> {
    const existing = await this.db.get<TaskRow>(
      `SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    if (!existing) return false;

    await this.db.run(
      `UPDATE tasks SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [new Date().toISOString(), id]
    );

    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, 'delete', ?)`,
      [uuidv4(), id, JSON.stringify({ id })]
    );

    return true;
  }

  async getTask(id: string): Promise<Task | null> {
    const row = await this.db.get<TaskRow>(
      `SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`,
      [id]
    );
    return row ? this.mapRow(row) : null;
  }

  async getAllTasks(): Promise<Task[]> {
    const rows = await this.db.all<TaskRow>(
      `SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY updated_at DESC`
    );
    return rows.map(r => this.mapRow(r));
  }

  async getTasksNeedingSync(): Promise<Task[]> {
    const rows = await this.db.all<TaskRow>(
      `SELECT * FROM tasks WHERE sync_status IN ('pending','error')`
    );
    return rows.map(r => this.mapRow(r));
  }
}

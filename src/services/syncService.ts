import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  SyncQueueItem,
  SyncResult,
  SyncError,
  BatchSyncRequest
} from '../types';
import { Database } from '../db/database';

type SyncQueueRow = {
  id: string;
  task_id: string;
  operation: 'create' | 'update' | 'delete';
  data: string;
  created_at: string;
  retry_count: number;
  error_message?: string;
};

export class SyncService {
  constructor(
    private db: Database,
    private apiUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api'
  ) {}

  private mapQueue(row: SyncQueueRow): SyncQueueItem {
    return {
      id: row.id,
      task_id: row.task_id,
      operation: row.operation,
      data: JSON.parse(row.data),
      created_at: new Date(row.created_at),
      retry_count: row.retry_count,
      error_message: row.error_message
    };
  }

  async sync(): Promise<SyncResult> {
    const raw = await this.db.all<SyncQueueRow>(
      `SELECT * FROM sync_queue ORDER BY created_at`
    );
    const queue = raw.map(r => this.mapQueue(r));

    if (queue.length === 0) {
      return { success: true, synced_items: 0, failed_items: 0, errors: [] };
    }

    try {
      const payload: BatchSyncRequest = {
        items: queue,
        client_timestamp: new Date()
      };

      await axios.post(this.apiUrl, payload);

      for (const item of queue) {
        await this.db.run(
          `UPDATE tasks SET sync_status = 'synced', last_synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [item.task_id]
        );
        await this.db.run(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);
      }

      return {
        success: true,
        synced_items: queue.length,
        failed_items: 0,
        errors: []
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';

      const errors: SyncError[] = queue.map(item => ({
        task_id: item.task_id,
        operation: item.operation,
        error: message,
        timestamp: new Date()
      }));

      return {
        success: false,
        synced_items: 0,
        failed_items: queue.length,
        errors
      };
    }
  }

  async addToSyncQueue(
    taskId: string,
    operation: 'create' | 'update' | 'delete',
    data: unknown
  ): Promise<void> {
    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), taskId, operation, JSON.stringify(data)]
    );
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

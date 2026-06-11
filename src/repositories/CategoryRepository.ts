import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface CategoryInsert {
  name: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  metadata: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

export class CategoryRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: CategoryInsert): Promise<Category> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO categories (id, name, metadata, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.userId ?? null,
      now,
      now,
      now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Category | null> {
    const row = await this.db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories WHERE deleted_at IS NULL AND LOWER(name) LIKE ? ORDER BY name ASC',
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<CategoryInsert>): Promise<Category> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(dto.metadata ? JSON.stringify(dto.metadata) : null);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE categories SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as cnt FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? AND deleted_at IS NULL'
      : 'SELECT COUNT(*) as cnt FROM categories WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL';
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      sql,
      name,
      ...(excludeId ? [excludeId] : []),
    );
    return (row?.cnt ?? 0) > 0;
  }

  private mapRow(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as Category['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }
}

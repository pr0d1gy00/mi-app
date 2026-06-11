import type { SQLiteDatabase } from 'expo-sqlite';
import type { Store } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface StoreInsert {
  name: string;
  location?: string | null;
  userId?: string | null;
}

interface StoreRow {
  id: string;
  name: string;
  location: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

export class StoreRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: StoreInsert): Promise<Store> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO stores (id, name, location, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.location ?? null,
      dto.userId ?? null,
      now,
      now,
      now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Store | null> {
    const row = await this.db.getFirstAsync<StoreRow>(
      'SELECT * FROM stores WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Store[]> {
    const rows = await this.db.getAllAsync<StoreRow>(
      'SELECT * FROM stores WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Store[]> {
    const rows = await this.db.getAllAsync<StoreRow>(
      `SELECT * FROM stores WHERE deleted_at IS NULL
       AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ?)
       ORDER BY name ASC`,
      `%${query.toLowerCase()}%`,
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<StoreInsert>): Promise<Store> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.location !== undefined) {
      updates.push('location = ?');
      values.push(dto.location);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE stores SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE stores SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Store[]> {
    const rows = await this.db.getAllAsync<StoreRow>(
      'SELECT * FROM stores WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  async existsByNameAndLocation(
    name: string,
    location: string | null,
    excludeId?: string,
  ): Promise<boolean> {
    const sql = excludeId
      ? "SELECT COUNT(*) as cnt FROM stores WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(location), '') = COALESCE(LOWER(?), '') AND id != ? AND deleted_at IS NULL"
      : "SELECT COUNT(*) as cnt FROM stores WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(location), '') = COALESCE(LOWER(?), '') AND deleted_at IS NULL";
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      sql,
      name,
      location ?? '',
      ...(excludeId ? [excludeId] : []),
    );
    return (row?.cnt ?? 0) > 0;
  }

  private mapRow(row: StoreRow): Store {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as Store['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }
}

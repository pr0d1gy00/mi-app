import type { SQLiteDatabase } from 'expo-sqlite';
import type { PurchaseGroup, Purchase } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';
import type { SyncStatus } from '@/types/entities';

export interface PurchaseGroupInsert {
  name: string;
  description: string | null;
  userId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

interface PurchaseGroupRow {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

interface PurchaseRow {
  id: string;
  store_id: string | null;
  user_id: string;
  total_amount: string;
  currency: string;
  notes: string | null;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

export class PurchaseGroupRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: PurchaseGroupInsert): Promise<PurchaseGroup> {
    const now = new Date().toISOString();
    const id = generateUuid();

    await this.db.runAsync(
      `INSERT INTO purchase_groups (id, name, description, user_id, start_date, end_date, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.description,
      dto.userId,
      dto.startDate,
      dto.endDate,
      now,
      now,
      now,
    );

    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<PurchaseGroup | null> {
    const row = await this.db.getFirstAsync<PurchaseGroupRow>(
      'SELECT * FROM purchase_groups WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<PurchaseGroup[]> {
    const rows = await this.db.getAllAsync<PurchaseGroupRow>(
      'SELECT * FROM purchase_groups WHERE deleted_at IS NULL ORDER BY created_at DESC',
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<PurchaseGroupInsert>): Promise<PurchaseGroup> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push('description = ?');
      values.push(dto.description);
    }
    if (dto.startDate !== undefined) {
      updates.push('start_date = ?');
      values.push(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      updates.push('end_date = ?');
      values.push(dto.endDate);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(
      `UPDATE purchase_groups SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE purchase_groups SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async assignPurchase(groupId: string, purchaseId: string): Promise<void> {
    const id = generateUuid();
    await this.db.runAsync(
      'INSERT INTO purchase_group_items (id, purchase_group_id, purchase_id) VALUES (?, ?, ?)',
      id,
      groupId,
      purchaseId,
    );
  }

  async unassignPurchase(groupId: string, purchaseId: string): Promise<void> {
    await this.db.runAsync(
      'DELETE FROM purchase_group_items WHERE purchase_group_id = ? AND purchase_id = ?',
      groupId,
      purchaseId,
    );
  }

  async getPurchasesInGroup(groupId: string): Promise<Purchase[]> {
    const rows = await this.db.getAllAsync<PurchaseRow>(
      `SELECT p.* FROM purchases p
       INNER JOIN purchase_group_items pgi ON p.id = pgi.purchase_id
       WHERE pgi.purchase_group_id = ? AND p.deleted_at IS NULL
       ORDER BY p.purchase_date DESC`,
      groupId,
    );
    return rows.map(this.mapPurchaseRow);
  }

  async getAllWithPurchases(): Promise<
    (PurchaseGroup & { purchases: Purchase[]; total: string })[]
  > {
    const groups = await this.getAll();
    const result: (PurchaseGroup & { purchases: Purchase[]; total: string })[] = [];

    for (const group of groups) {
      const purchases = await this.getPurchasesInGroup(group.id);
      const total = purchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0).toFixed(2);
      result.push({ ...group, purchases, total });
    }

    return result;
  }

  private mapRow(row: PurchaseGroupRow): PurchaseGroup {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.user_id,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as PurchaseGroup['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }

  private mapPurchaseRow(row: PurchaseRow): Purchase {
    return {
      id: row.id,
      storeId: row.store_id,
      userId: row.user_id,
      totalAmount: row.total_amount,
      currency: row.currency,
      notes: row.notes,
      purchaseDate: row.purchase_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as Purchase['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }
}

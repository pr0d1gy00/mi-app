import type { SQLiteDatabase } from 'expo-sqlite';
import type { Purchase, PurchaseItem } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';
import type { SyncStatus } from '@/types/entities';

export interface PurchaseInsert {
  storeId: string | null;
  userId: string;
  totalAmount?: string; // Optional - calculated if not provided
  currency: string;
  notes: string | null;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

export interface PurchaseItemInsert {
  productName: string;
  quantity: number;
  unitPrice: string;
  productId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
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

interface PurchaseItemRow {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

export class PurchaseRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: PurchaseInsert, items: PurchaseItemInsert[]): Promise<Purchase> {
    const now = new Date().toISOString();
    const id = generateUuid();

    // Calculate total from items
    const totalAmount = items
      .reduce((sum, item) => {
        return sum + parseFloat(item.unitPrice) * item.quantity;
      }, 0)
      .toFixed(2);

    // Insert purchase
    await this.db.runAsync(
      `INSERT INTO purchases (id, store_id, user_id, total_amount, currency, notes, purchase_date, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.storeId,
      dto.userId,
      totalAmount,
      dto.currency,
      dto.notes,
      dto.purchaseDate,
      now,
      now,
      now,
    );

    // Insert items
    for (const item of items) {
      const itemId = generateUuid();
      const itemTotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);

      await this.db.runAsync(
        `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_price, total_price, notes, created_at, updated_at, sync_status, last_synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
        itemId,
        id,
        item.productId ?? null,
        item.productName,
        item.quantity,
        item.unitPrice,
        itemTotal,
        item.notes ?? null,
        now,
        now,
        now,
      );
    }

    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Purchase | null> {
    const row = await this.db.getFirstAsync<PurchaseRow>(
      'SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Purchase[]> {
    const rows = await this.db.getAllAsync<PurchaseRow>(
      'SELECT * FROM purchases WHERE deleted_at IS NULL ORDER BY purchase_date DESC',
    );
    return rows.map(this.mapRow);
  }

  async getByStoreId(storeId: string): Promise<Purchase[]> {
    const rows = await this.db.getAllAsync<PurchaseRow>(
      'SELECT * FROM purchases WHERE store_id = ? AND deleted_at IS NULL ORDER BY purchase_date DESC',
      storeId,
    );
    return rows.map(this.mapRow);
  }

  async getBySyncStatus(status: SyncStatus): Promise<Purchase[]> {
    const rows = await this.db.getAllAsync<PurchaseRow>(
      'SELECT * FROM purchases WHERE sync_status = ? AND deleted_at IS NULL ORDER BY purchase_date DESC',
      status,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<PurchaseInsert>): Promise<Purchase> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (dto.storeId !== undefined) {
      updates.push('store_id = ?');
      values.push(dto.storeId);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = ?');
      values.push(dto.notes);
    }
    if (dto.purchaseDate !== undefined) {
      updates.push('purchase_date = ?');
      values.push(dto.purchaseDate);
    }
    if (dto.currency !== undefined) {
      updates.push('currency = ?');
      values.push(dto.currency);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE purchases SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE purchases SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
    // Items will be cascade deleted via FK
  }

  async getItemsByPurchaseId(purchaseId: string): Promise<PurchaseItem[]> {
    const rows = await this.db.getAllAsync<PurchaseItemRow>(
      'SELECT * FROM purchase_items WHERE purchase_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
      purchaseId,
    );
    return rows.map(this.mapItemRow);
  }

  private mapRow(row: PurchaseRow): Purchase {
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

  private mapItemRow(row: PurchaseItemRow): PurchaseItem {
    return {
      id: row.id,
      purchaseId: row.purchase_id,
      productId: row.product_id,
      productName: row.product_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      totalPrice: row.total_price,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as PurchaseItem['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }
}

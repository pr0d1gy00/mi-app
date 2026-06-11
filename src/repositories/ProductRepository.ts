import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface ProductInsert {
  name: string;
  brand?: string | null;
  categoryId: string;
  metadata?: Record<string, unknown> | null;
  barcode?: string | null;
  userId: string;
}

interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  category_id: string;
  metadata: string | null;
  barcode: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
}

export class ProductRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: ProductInsert): Promise<Product> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO products (id, name, brand, category_id, metadata, barcode, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.brand ?? null,
      dto.categoryId,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.barcode ?? null,
      dto.userId,
      now,
      now,
      now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Product | null> {
    const row = await this.db.getFirstAsync<ProductRow>(
      'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      'SELECT * FROM products WHERE deleted_at IS NULL AND LOWER(name) LIKE ? ORDER BY name ASC',
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async getByCategoryId(categoryId: string): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      'SELECT * FROM products WHERE category_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      categoryId,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<ProductInsert>): Promise<Product> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.brand !== undefined) {
      updates.push('brand = ?');
      values.push(dto.brand);
    }
    if (dto.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(dto.categoryId);
    }
    if (dto.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(dto.metadata ? JSON.stringify(dto.metadata) : null);
    }
    if (dto.barcode !== undefined) {
      updates.push('barcode = ?');
      values.push(dto.barcode);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE products SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      'SELECT * FROM products WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  private mapRow(row: ProductRow): Product {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      categoryId: row.category_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      barcode: row.barcode,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as Product['syncStatus'],
      lastSyncedAt: row.last_synced_at,
    };
  }
}

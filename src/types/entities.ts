export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string;
}

export interface Category extends BaseEntity {
  name: string;
  metadata: Record<string, unknown> | null;
  userId: string | null;
}

export interface Product extends BaseEntity {
  name: string;
  brand: string | null;
  categoryId: string | null;
  metadata: Record<string, unknown> | null;
  barcode: string | null;
  userId: string;
}

export interface Store extends BaseEntity {
  name: string;
  location: string | null;
  userId: string | null;
}

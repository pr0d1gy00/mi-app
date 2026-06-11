export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
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

export interface Purchase extends BaseEntity {
  storeId: string | null;
  userId: string;
  totalAmount: string;
  currency: string;
  notes: string | null;
  purchaseDate: string;
}

export interface PurchaseItem extends BaseEntity {
  purchaseId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  notes: string | null;
}

export interface PurchaseGroup extends BaseEntity {
  name: string;
  description: string | null;
  userId: string;
  startDate: string | null;
  endDate: string | null;
}

export interface PurchaseGroupItem {
  id: string;
  purchaseGroupId: string;
  purchaseId: string;
}

export type RateSource = 'BCV' | 'Paralelo' | 'Custom';

export interface ExchangeRate extends BaseEntity {
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  source: RateSource;
  rateDate: string;
  isCustom: boolean;
}

export interface SyncMetadata {
  lastPullAt: string | null;
  lastPushAt: string | null;
  isInitialSyncDone: boolean;
}

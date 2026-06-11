/// <reference types="jest" />
import type { SyncStatus, BaseEntity, Category, Product, Store } from '../entities';

describe('SyncStatus type', () => {
  it('should accept exactly the four allowed values', () => {
    const statuses: SyncStatus[] = ['synced', 'created', 'updated', 'deleted'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('synced');
    expect(statuses).toContain('created');
    expect(statuses).toContain('updated');
    expect(statuses).toContain('deleted');
  });
});

describe('BaseEntity interface', () => {
  it('should require all 6 core fields', () => {
    const entity: BaseEntity = {
      id: 'ent-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
    };

    expect(entity.id).toBe('ent-1');
    expect(entity.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(entity.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    expect(entity.deletedAt).toBeNull();
    expect(entity.syncStatus).toBe('synced');
    expect(entity.lastSyncedAt).toBe('2024-01-02T00:00:00.000Z');
  });

  it('should allow deletedAt to be a string timestamp', () => {
    const entity: BaseEntity = {
      id: 'ent-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: '2024-01-03T00:00:00.000Z',
      syncStatus: 'deleted',
      lastSyncedAt: '2024-01-03T00:00:00.000Z',
    };

    expect(entity.deletedAt).toBe('2024-01-03T00:00:00.000Z');
    expect(entity.syncStatus).toBe('deleted');
  });
});

describe('Category entity', () => {
  it('should extend BaseEntity with category fields', () => {
    const category: Category = {
      id: 'cat-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'created',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'Electronics',
      metadata: { icon: 'bolt' },
      userId: 'user-1',
    };

    expect(category.name).toBe('Electronics');
    expect(category.metadata).toEqual({ icon: 'bolt' });
    expect(category.userId).toBe('user-1');
    expect(category.syncStatus).toBe('created');
  });

  it('should allow null metadata and userId', () => {
    const category: Category = {
      id: 'cat-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'General',
      metadata: null,
      userId: null,
    };

    expect(category.metadata).toBeNull();
    expect(category.userId).toBeNull();
  });
});

describe('Product entity', () => {
  it('should extend BaseEntity with product fields', () => {
    const product: Product = {
      id: 'prod-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'created',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'Laptop',
      brand: 'Apple',
      categoryId: 'cat-1',
      metadata: { color: 'silver' },
      barcode: '123456789012',
      userId: 'user-1',
    };

    expect(product.name).toBe('Laptop');
    expect(product.brand).toBe('Apple');
    expect(product.categoryId).toBe('cat-1');
    expect(product.metadata).toEqual({ color: 'silver' });
    expect(product.barcode).toBe('123456789012');
    expect(product.userId).toBe('user-1');
  });

  it('should allow null optional fields', () => {
    const product: Product = {
      id: 'prod-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'Mystery Item',
      brand: null,
      categoryId: null,
      metadata: null,
      barcode: null,
      userId: 'user-1',
    };

    expect(product.brand).toBeNull();
    expect(product.categoryId).toBeNull();
    expect(product.metadata).toBeNull();
    expect(product.barcode).toBeNull();
  });
});

describe('Store entity', () => {
  it('should extend BaseEntity with store fields', () => {
    const store: Store = {
      id: 'store-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'created',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'Walmart',
      location: 'Downtown',
      userId: 'user-1',
    };

    expect(store.name).toBe('Walmart');
    expect(store.location).toBe('Downtown');
    expect(store.userId).toBe('user-1');
  });

  it('should allow null location and userId', () => {
    const store: Store = {
      id: 'store-2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: '2024-01-02T00:00:00.000Z',
      name: 'Generic Store',
      location: null,
      userId: null,
    };

    expect(store.location).toBeNull();
    expect(store.userId).toBeNull();
  });
});

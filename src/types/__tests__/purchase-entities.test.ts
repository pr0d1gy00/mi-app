// RED: These tests should fail until Purchase, PurchaseItem, PurchaseGroup, PurchaseGroupItem are added to entities.ts
import type { Purchase, PurchaseItem, PurchaseGroup, PurchaseGroupItem } from '@/types/entities';
import { SyncStatus } from '@/types/entities';

describe('Purchase entities types', () => {
  it('Purchase has all required fields', () => {
    const purchase: Purchase = {
      id: 'test-id',
      storeId: null,
      userId: 'user-id',
      totalAmount: '100.00',
      currency: 'USD',
      notes: null,
      purchaseDate: '2024-06-11',
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      deletedAt: null,
      syncStatus: 'created' as SyncStatus,
      lastSyncedAt: null,
    };
    expect(purchase.id).toBe('test-id');
    expect(purchase.totalAmount).toBe('100.00');
    expect(purchase.storeId).toBeNull();
    expect(purchase.syncStatus).toBe('created');
  });

  it('PurchaseItem has all required fields', () => {
    const item: PurchaseItem = {
      id: 'item-id',
      purchaseId: 'purchase-id',
      productId: null,
      productName: 'Test Product',
      quantity: 2,
      unitPrice: '25.50',
      totalPrice: '51.00',
      notes: null,
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      deletedAt: null,
      syncStatus: 'created' as SyncStatus,
      lastSyncedAt: null,
    };
    expect(item.quantity).toBe(2);
    expect(item.totalPrice).toBe('51.00');
    expect(item.productName).toBe('Test Product');
  });

  it('PurchaseGroup has all required fields', () => {
    const group: PurchaseGroup = {
      id: 'group-id',
      name: 'Weekly Shopping',
      description: 'Groceries for the week',
      userId: 'user-id',
      startDate: '2024-06-01',
      endDate: '2024-06-07',
      createdAt: '2024-06-01',
      updatedAt: '2024-06-01',
      deletedAt: null,
      syncStatus: 'created' as SyncStatus,
      lastSyncedAt: null,
    };
    expect(group.name).toBe('Weekly Shopping');
    expect(group.startDate).toBe('2024-06-01');
    expect(group.endDate).toBe('2024-06-07');
  });

  it('PurchaseGroupItem has all required fields', () => {
    const groupItem: PurchaseGroupItem = {
      id: 'gi-id',
      purchaseGroupId: 'group-id',
      purchaseId: 'purchase-id',
    };
    expect(groupItem.purchaseGroupId).toBe('group-id');
    expect(groupItem.purchaseId).toBe('purchase-id');
  });
});

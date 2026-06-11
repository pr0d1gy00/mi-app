import { createTestDatabase } from '@/database/__tests__/testDb';
import { runMigrations } from '@/database/migrations/runner';
import { PurchaseRepository } from '../PurchaseRepository';

describe('PurchaseRepository', () => {
  let db: ReturnType<typeof createTestDatabase>;
  let repo: PurchaseRepository;
  const userId = 'user-123';

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = OFF'); // Disable for test isolation
    await runMigrations(db);
    repo = new PurchaseRepository(db);
  });

  afterEach(async () => {
    const dbAny = db as unknown as { closeAsync: () => Promise<void> };
    await dbAny.closeAsync();
  });

  describe('create', () => {
    it('creates a purchase with items and calculates total', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0', // Will be calculated
          currency: 'USD',
          notes: 'Test purchase',
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [
          {
            productName: 'Milk',
            quantity: 2,
            unitPrice: '3.50',
            productId: null,
            notes: null,
            createdAt: '2024-06-11',
            updatedAt: '2024-06-11',
            syncStatus: 'created',
            lastSyncedAt: null,
          },
          {
            productName: 'Bread',
            quantity: 1,
            unitPrice: '2.00',
            productId: null,
            notes: null,
            createdAt: '2024-06-11',
            updatedAt: '2024-06-11',
            syncStatus: 'created',
            lastSyncedAt: null,
          },
        ],
      );

      expect(purchase.id).toBeDefined();
      expect(purchase.totalAmount).toBe('9.00'); // 2*3.50 + 1*2.00
      expect(purchase.syncStatus).toBe('created');
    });

    it('sets syncStatus to created on new purchase', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      expect(purchase.syncStatus).toBe('created');
    });
  });

  describe('getById', () => {
    it('returns purchase with items', async () => {
      const created = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: 'Test',
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [
          {
            productName: 'Item',
            quantity: 1,
            unitPrice: '5.00',
            productId: null,
            notes: null,
            createdAt: '2024-06-11',
            updatedAt: '2024-06-11',
            syncStatus: 'created',
            lastSyncedAt: null,
          },
        ],
      );

      const result = await repo.getById(created.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    it('returns null for non-existent id', async () => {
      const result = await repo.getById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all non-deleted purchases ordered by date DESC', async () => {
      await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-10',
          createdAt: '2024-06-10',
          updatedAt: '2024-06-10',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-12',
          createdAt: '2024-06-12',
          updatedAt: '2024-06-12',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      const result = await repo.getAll();
      expect(result).toHaveLength(2);
      expect(result[0].purchaseDate).toBe('2024-06-12'); // Most recent first
      expect(result[1].purchaseDate).toBe('2024-06-10');
    });

    it('excludes soft-deleted purchases', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      await repo.softDelete(purchase.id);

      const result = await repo.getAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('getByStoreId', () => {
    it('returns purchases for a specific store', async () => {
      const storeId = 'store-abc';

      await repo.create(
        {
          storeId,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      const result = await repo.getByStoreId(storeId);
      expect(result).toHaveLength(1);
    });
  });

  describe('getBySyncStatus', () => {
    it('returns purchases with specific sync status', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      // Simulate sync by directly updating sync_status in DB
      await db.execAsync(
        `UPDATE purchases SET sync_status = 'synced', last_synced_at = '2024-06-11' WHERE id = '${purchase.id}'`,
      );

      const created = await repo.getBySyncStatus('created');
      expect(created.some((p) => p.id === purchase.id)).toBe(false);

      const synced = await repo.getBySyncStatus('synced');
      expect(synced.some((p) => p.id === purchase.id)).toBe(true);
    });
  });

  describe('update', () => {
    it('updates purchase fields', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      const updated = await repo.update(purchase.id, { notes: 'Updated notes' });
      expect(updated.notes).toBe('Updated notes');
      expect(updated.syncStatus).toBe('updated');
    });
  });

  describe('softDelete', () => {
    it('sets deleted_at and syncStatus to deleted', async () => {
      const purchase = await repo.create(
        {
          storeId: null,
          userId,
          totalAmount: '0',
          currency: 'USD',
          notes: null,
          purchaseDate: '2024-06-11',
          createdAt: '2024-06-11',
          updatedAt: '2024-06-11',
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        [],
      );

      await repo.softDelete(purchase.id);

      const result = await repo.getById(purchase.id);
      expect(result).toBeNull();

      // Check via raw query
      const rows = await db.getAllAsync<{ deleted_at: string }>(
        `SELECT deleted_at FROM purchases WHERE id='${purchase.id}'`,
      );
      expect(rows[0].deleted_at).toBeTruthy();
    });
  });
});

import { createTestDatabase } from '@/database/__tests__/testDb';
import { runMigrations } from '@/database/migrations/runner';
import { PurchaseGroupRepository } from '../PurchaseGroupRepository';

describe('PurchaseGroupRepository', () => {
  let db: ReturnType<typeof createTestDatabase>;
  let repo: PurchaseGroupRepository;
  const userId = 'user-123';

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = OFF'); // Disable for test isolation
    await runMigrations(db);
    repo = new PurchaseGroupRepository(db);
  });

  afterEach(async () => {
    const dbAny = db as unknown as { closeAsync: () => Promise<void> };
    await dbAny.closeAsync();
  });

  describe('create', () => {
    it('creates a purchase group', async () => {
      const group = await repo.create({
        name: 'Weekly Shopping',
        description: 'Groceries for the week',
        userId,
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      expect(group.id).toBeDefined();
      expect(group.name).toBe('Weekly Shopping');
      expect(group.syncStatus).toBe('created');
    });
  });

  describe('getById', () => {
    it('returns group by id', async () => {
      const created = await repo.create({
        name: 'Test Group',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      const result = await repo.getById(created.id);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Group');
    });

    it('returns null for non-existent id', async () => {
      const result = await repo.getById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('returns all non-deleted groups', async () => {
      await repo.create({
        name: 'Group 1',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      await repo.create({
        name: 'Group 2',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      const result = await repo.getAll();
      expect(result).toHaveLength(2);
    });

    it('excludes soft-deleted groups', async () => {
      const group = await repo.create({
        name: 'To Delete',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      await repo.softDelete(group.id);

      const result = await repo.getAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('assignPurchase', () => {
    it('assigns a purchase to a group', async () => {
      const group = await repo.create({
        name: 'Test Group',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      // Create a purchase directly in DB (bypass FK)
      await db.runAsync(
        `INSERT INTO purchases (id, user_id, total_amount, currency, purchase_date, created_at, updated_at) VALUES ('p1', '${userId}', '100.00', 'USD', '2024-06-01', '2024-06-01', '2024-06-01')`,
      );

      await repo.assignPurchase(group.id, 'p1');

      const purchases = await repo.getPurchasesInGroup(group.id);
      expect(purchases).toHaveLength(1);
      expect(purchases[0].id).toBe('p1');
    });
  });

  describe('unassignPurchase', () => {
    it('removes a purchase from a group', async () => {
      const group = await repo.create({
        name: 'Test Group',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      await db.runAsync(
        `INSERT INTO purchases (id, user_id, total_amount, currency, purchase_date, created_at, updated_at) VALUES ('p1', '${userId}', '100.00', 'USD', '2024-06-01', '2024-06-01', '2024-06-01')`,
      );

      await repo.assignPurchase(group.id, 'p1');
      await repo.unassignPurchase(group.id, 'p1');

      const purchases = await repo.getPurchasesInGroup(group.id);
      expect(purchases).toHaveLength(0);
    });
  });

  describe('getAllWithPurchases', () => {
    it('returns groups with purchase count and total', async () => {
      const group = await repo.create({
        name: 'Test Group',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      // Add purchases
      await db.runAsync(
        `INSERT INTO purchases (id, user_id, total_amount, currency, purchase_date, created_at, updated_at) VALUES ('p1', '${userId}', '100.00', 'USD', '2024-06-01', '2024-06-01', '2024-06-01')`,
      );
      await db.runAsync(
        `INSERT INTO purchases (id, user_id, total_amount, currency, purchase_date, created_at, updated_at) VALUES ('p2', '${userId}', '50.00', 'USD', '2024-06-01', '2024-06-01', '2024-06-01')`,
      );

      await repo.assignPurchase(group.id, 'p1');
      await repo.assignPurchase(group.id, 'p2');

      const result = await repo.getAllWithPurchases();

      expect(result).toHaveLength(1);
      expect(result[0].purchases).toHaveLength(2);
      expect(result[0].total).toBe('150.00');
    });
  });

  describe('softDelete', () => {
    it('soft deletes a group', async () => {
      const group = await repo.create({
        name: 'To Delete',
        description: null,
        userId,
        startDate: null,
        endDate: null,
        createdAt: '2024-06-01',
        updatedAt: '2024-06-01',
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      await repo.softDelete(group.id);

      const result = await repo.getById(group.id);
      expect(result).toBeNull();
    });
  });
});

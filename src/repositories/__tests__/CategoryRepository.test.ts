import { createTestDatabase } from '@/database/__tests__/testDb';
import { runMigrations } from '@/database/migrations/runner';
import { CategoryRepository } from '../CategoryRepository';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('CategoryRepository', () => {
  let db: SQLiteDatabase;
  let repo: CategoryRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON');
    await runMigrations(db);
    repo = new CategoryRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. create() inserts and returns full Category with syncStatus created', async () => {
    const category = await repo.create({ name: 'Electronics' });
    expect(category.id).toBeTruthy();
    expect(category.name).toBe('Electronics');
    expect(category.syncStatus).toBe('created');
    expect(category.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(category.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(category.lastSyncedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(category.deletedAt).toBeNull();
  });

  test('2. getById() returns Category for existing ID', async () => {
    const created = await repo.create({ name: 'Electronics' });
    const found = await repo.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe('Electronics');
  });

  test('3. getById() returns null for non-existent ID', async () => {
    const found = await repo.getById('nonexistent');
    expect(found).toBeNull();
  });

  test('4. getById() returns null for soft-deleted category', async () => {
    const created = await repo.create({ name: 'Electronics' });
    await repo.softDelete(created.id);
    const found = await repo.getById(created.id);
    expect(found).toBeNull();
  });

  test('5. getAll() returns all non-deleted categories ordered by name', async () => {
    await repo.create({ name: 'Zebra' });
    await repo.create({ name: 'Apple' });
    await repo.create({ name: 'Banana' });
    const all = await repo.getAll();
    expect(all.map((c: { name: string }) => c.name)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  test('6. getAll() excludes soft-deleted categories', async () => {
    const cat = await repo.create({ name: 'ToDelete' });
    await repo.softDelete(cat.id);
    const all = await repo.getAll();
    expect(all.find((c: { id: string }) => c.id === cat.id)).toBeUndefined();
  });

  test('7. search() returns matching categories case-insensitive', async () => {
    await repo.create({ name: 'Electronics' });
    await repo.create({ name: 'Groceries' });
    await repo.create({ name: 'ELECTRONICS' });
    const results = await repo.search('elect');
    expect(results.map((c: { name: string }) => c.name)).toContain('Electronics');
    expect(results.map((c: { name: string }) => c.name)).toContain('ELECTRONICS');
  });

  test('8. search() excludes soft-deleted', async () => {
    const cat = await repo.create({ name: 'Electronics' });
    await repo.softDelete(cat.id);
    const results = await repo.search('elect');
    expect(results).toHaveLength(0);
  });

  test('9. update() changes name and sets syncStatus updated', async () => {
    const created = await repo.create({ name: 'Old Name' });
    const updated = await repo.update(created.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.syncStatus).toBe('updated');
  });

  test('10. update() refreshes updatedAt and lastSyncedAt', async () => {
    const created = await repo.create({ name: 'Old Name' });
    await new Promise((r) => setTimeout(r, 10));
    const updated = await repo.update(created.id, { name: 'New Name' });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
    expect(updated.lastSyncedAt).toBe(updated.updatedAt);
  });

  test('11. softDelete() sets deletedAt and syncStatus deleted', async () => {
    const created = await repo.create({ name: 'ToDelete' });
    await repo.softDelete(created.id);
    // Verify via raw query since getById excludes deleted
    const row = await db.getFirstAsync<{ deleted_at: string; sync_status: string }>(
      'SELECT deleted_at, sync_status FROM categories WHERE id = ?',
      created.id,
    );
    expect(row).not.toBeNull();
    expect(row!.deleted_at).toBeTruthy();
    expect(row!.sync_status).toBe('deleted');
  });

  test('12. softDelete() refreshes lastSyncedAt', async () => {
    const created = await repo.create({ name: 'ToDelete' });
    await new Promise((r) => setTimeout(r, 10));
    await repo.softDelete(created.id);
    const row = await db.getFirstAsync<{ last_synced_at: string }>(
      'SELECT last_synced_at FROM categories WHERE id = ?',
      created.id,
    );
    expect(new Date(row!.last_synced_at).getTime()).toBeGreaterThanOrEqual(
      new Date(created.lastSyncedAt).getTime(),
    );
  });

  test('13. getBySyncStatus() returns only matching status', async () => {
    await repo.create({ name: 'Created1' });
    await repo.create({ name: 'Created2' });
    const created = await repo.getBySyncStatus('created');
    expect(created).toHaveLength(2);
  });

  test('14. getBySyncStatus() excludes soft-deleted', async () => {
    const cat = await repo.create({ name: 'ToDelete' });
    await repo.softDelete(cat.id);
    const created = await repo.getBySyncStatus('created');
    expect(created.find((c: { id: string }) => c.id === cat.id)).toBeUndefined();
  });

  test('15. existsByName() detects duplicate case-insensitive', async () => {
    await repo.create({ name: 'Electronics' });
    const exists = await repo.existsByName('electronics');
    expect(exists).toBe(true);
  });

  test('16. existsByName() allows same name for different ID', async () => {
    const cat = await repo.create({ name: 'Electronics' });
    const exists = await repo.existsByName('electronics', cat.id);
    expect(exists).toBe(false);
  });

  test('17. create with metadata JSON round-trips correctly', async () => {
    const category = await repo.create({ name: 'Electronics', metadata: { icon: 'bolt' } });
    const found = await repo.getById(category.id);
    expect(found!.metadata).toEqual({ icon: 'bolt' });
  });

  test('18. create with null metadata stores as null', async () => {
    const category = await repo.create({ name: 'Electronics', metadata: null });
    const found = await repo.getById(category.id);
    expect(found!.metadata).toBeNull();
  });

  test('19. search with empty string returns all non-deleted', async () => {
    await repo.create({ name: 'Apple' });
    await repo.create({ name: 'Banana' });
    const results = await repo.search('');
    expect(results).toHaveLength(2);
  });
});

import { createTestDatabase } from '@/database/__tests__/testDb';
import { runMigrations } from '@/database/migrations/runner';
import { StoreRepository } from '../StoreRepository';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('StoreRepository', () => {
  let db: SQLiteDatabase;
  let repo: StoreRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON');
    await runMigrations(db);
    repo = new StoreRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. create() inserts and returns full Store with syncStatus created', async () => {
    const store = await repo.create({ name: 'Walmart', location: 'Downtown' });
    expect(store.id).toBeTruthy();
    expect(store.name).toBe('Walmart');
    expect(store.location).toBe('Downtown');
    expect(store.syncStatus).toBe('created');
    expect(store.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(store.deletedAt).toBeNull();
  });

  test('2. getById() returns Store for existing ID', async () => {
    const created = await repo.create({ name: 'Walmart' });
    const found = await repo.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe('Walmart');
  });

  test('3. getById() returns null for non-existent ID', async () => {
    const found = await repo.getById('nonexistent');
    expect(found).toBeNull();
  });

  test('4. getById() returns null for soft-deleted store', async () => {
    const created = await repo.create({ name: 'Walmart' });
    await repo.softDelete(created.id);
    const found = await repo.getById(created.id);
    expect(found).toBeNull();
  });

  test('5. getAll() returns all non-deleted stores ordered by name', async () => {
    await repo.create({ name: 'Zebra' });
    await repo.create({ name: 'Apple' });
    const all = await repo.getAll();
    expect(all.map((s: { name: string }) => s.name)).toEqual(['Apple', 'Zebra']);
  });

  test('6. search() matches on name OR location case-insensitive', async () => {
    await repo.create({ name: 'Walmart', location: 'Downtown' });
    await repo.create({ name: 'Target', location: 'Uptown' });
    const nameResults = await repo.search('wal');
    expect(nameResults).toHaveLength(1);
    expect(nameResults[0].name).toBe('Walmart');

    const locationResults = await repo.search('uptown');
    expect(locationResults).toHaveLength(1);
    expect(locationResults[0].name).toBe('Target');
  });

  test('7. update() changes name and sets syncStatus updated', async () => {
    const created = await repo.create({ name: 'Old' });
    const updated = await repo.update(created.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.syncStatus).toBe('updated');
  });

  test('8. softDelete() sets deletedAt and syncStatus deleted', async () => {
    const created = await repo.create({ name: 'Walmart' });
    await repo.softDelete(created.id);
    const row = await db.getFirstAsync<{ deleted_at: string | null; sync_status: string }>(
      'SELECT deleted_at, sync_status FROM stores WHERE id = ?',
      created.id,
    );
    expect(row!.deleted_at).toBeTruthy();
    expect(row!.sync_status).toBe('deleted');
  });

  test('9. getBySyncStatus() returns only matching status', async () => {
    await repo.create({ name: 'S1' });
    await repo.create({ name: 'S2' });
    const created = await repo.getBySyncStatus('created');
    expect(created).toHaveLength(2);
  });

  test('10. existsByNameAndLocation() detects duplicate name+location', async () => {
    await repo.create({ name: 'Walmart', location: 'Downtown' });
    const exists = await repo.existsByNameAndLocation('Walmart', 'Downtown');
    expect(exists).toBe(true);
  });

  test('11. existsByNameAndLocation() allows same name with different location', async () => {
    await repo.create({ name: 'Walmart', location: 'Downtown' });
    const exists = await repo.existsByNameAndLocation('Walmart', 'Uptown');
    expect(exists).toBe(false);
  });

  test('12. existsByNameAndLocation() with excludeId allows same entry', async () => {
    const store = await repo.create({ name: 'Walmart', location: 'Downtown' });
    const exists = await repo.existsByNameAndLocation('Walmart', 'Downtown', store.id);
    expect(exists).toBe(false);
  });

  test('13. create with null location stores as null', async () => {
    const store = await repo.create({ name: 'Walmart', location: null });
    const found = await repo.getById(store.id);
    expect(found!.location).toBeNull();
  });

  test('14. update with location changes location', async () => {
    const created = await repo.create({ name: 'Walmart' });
    const updated = await repo.update(created.id, { location: 'New Downtown' });
    expect(updated.location).toBe('New Downtown');
  });

  test('15. search matching only location (not name)', async () => {
    await repo.create({ name: 'Target', location: 'Downtown' });
    await repo.create({ name: 'Walmart', location: 'Uptown' });
    const results = await repo.search('downtown');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Target');
  });

  test('16. update location to null stores as null', async () => {
    const created = await repo.create({ name: 'Walmart', location: 'Downtown' });
    const updated = await repo.update(created.id, { location: null });
    expect(updated.location).toBeNull();
  });

  test('17. existsByNameAndLocation with null location detects duplicate', async () => {
    await repo.create({ name: 'Walmart', location: null });
    const exists = await repo.existsByNameAndLocation('Walmart', null);
    expect(exists).toBe(true);
  });
});

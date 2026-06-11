import { createTestDatabase } from '@/database/__tests__/testDb';
import { runMigrations } from '@/database/migrations/runner';
import { ProductRepository } from '../ProductRepository';
import { CategoryRepository } from '../CategoryRepository';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('ProductRepository', () => {
  let db: SQLiteDatabase;
  let repo: ProductRepository;
  let categoryRepo: CategoryRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON');
    await runMigrations(db);
    repo = new ProductRepository(db);
    categoryRepo = new CategoryRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  async function createCategory(name: string) {
    return categoryRepo.create({ name });
  }

  test('1. create() inserts and returns full Product with syncStatus created', async () => {
    const category = await createCategory('Electronics');
    const product = await repo.create({
      name: 'Laptop',
      categoryId: category.id,
      userId: 'u1',
    });
    expect(product.id).toBeTruthy();
    expect(product.name).toBe('Laptop');
    expect(product.categoryId).toBe(category.id);
    expect(product.syncStatus).toBe('created');
    expect(product.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(product.deletedAt).toBeNull();
  });

  test('2. getById() returns Product for existing ID', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    const found = await repo.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe('Laptop');
  });

  test('3. getById() returns null for non-existent ID', async () => {
    const found = await repo.getById('nonexistent');
    expect(found).toBeNull();
  });

  test('4. getById() returns null for soft-deleted product', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    await repo.softDelete(created.id);
    const found = await repo.getById(created.id);
    expect(found).toBeNull();
  });

  test('5. getAll() returns all non-deleted products ordered by name', async () => {
    const category = await createCategory('Electronics');
    await repo.create({ name: 'Zebra', categoryId: category.id, userId: 'u1' });
    await repo.create({ name: 'Apple', categoryId: category.id, userId: 'u1' });
    const all = await repo.getAll();
    expect(all.map((p: { name: string }) => p.name)).toEqual(['Apple', 'Zebra']);
  });

  test('6. search() filters by name case-insensitive', async () => {
    const category = await createCategory('Electronics');
    await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    await repo.create({ name: 'Mouse', categoryId: category.id, userId: 'u1' });
    const results = await repo.search('lap');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Laptop');
  });

  test('7. getByCategoryId() returns products for a specific category', async () => {
    const cat1 = await createCategory('Electronics');
    const cat2 = await createCategory('Furniture');
    await repo.create({ name: 'Laptop', categoryId: cat1.id, userId: 'u1' });
    await repo.create({ name: 'Chair', categoryId: cat2.id, userId: 'u1' });
    const results = await repo.getByCategoryId(cat1.id);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Laptop');
  });

  test('8. getByCategoryId() excludes soft-deleted', async () => {
    const category = await createCategory('Electronics');
    const product = await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    await repo.softDelete(product.id);
    const results = await repo.getByCategoryId(category.id);
    expect(results).toHaveLength(0);
  });

  test('9. update() changes name and sets syncStatus updated', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({ name: 'Old', categoryId: category.id, userId: 'u1' });
    const updated = await repo.update(created.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.syncStatus).toBe('updated');
  });

  test('10. softDelete() sets deletedAt and syncStatus deleted', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    await repo.softDelete(created.id);
    const row = await db.getFirstAsync<{ deleted_at: string | null; sync_status: string }>(
      'SELECT deleted_at, sync_status FROM products WHERE id = ?',
      created.id,
    );
    expect(row!.deleted_at).toBeTruthy();
    expect(row!.sync_status).toBe('deleted');
  });

  test('11. getBySyncStatus() returns only matching status', async () => {
    const category = await createCategory('Electronics');
    await repo.create({ name: 'P1', categoryId: category.id, userId: 'u1' });
    await repo.create({ name: 'P2', categoryId: category.id, userId: 'u1' });
    const created = await repo.getBySyncStatus('created');
    expect(created).toHaveLength(2);
  });

  test('12. FK violation — create product with non-existent category_id throws', async () => {
    await expect(
      repo.create({ name: 'Laptop', categoryId: 'nonexistent', userId: 'u1' }),
    ).rejects.toThrow();
  });

  test('13. create with barcode verifies unique constraint', async () => {
    const category = await createCategory('Electronics');
    await repo.create({ name: 'P1', categoryId: category.id, userId: 'u1', barcode: '123456' });
    await expect(
      repo.create({ name: 'P2', categoryId: category.id, userId: 'u1', barcode: '123456' }),
    ).rejects.toThrow();
  });

  test('14. create with null brand verifies round-trip', async () => {
    const category = await createCategory('Electronics');
    const product = await repo.create({
      name: 'Laptop',
      categoryId: category.id,
      userId: 'u1',
      brand: null,
    });
    const found = await repo.getById(product.id);
    expect(found!.brand).toBeNull();
  });

  test('15. update with brand changes brand', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({ name: 'Laptop', categoryId: category.id, userId: 'u1' });
    const updated = await repo.update(created.id, { brand: 'Apple' });
    expect(updated.brand).toBe('Apple');
  });

  test('16. update with categoryId changes category', async () => {
    const cat1 = await createCategory('Electronics');
    const cat2 = await createCategory('Furniture');
    const created = await repo.create({ name: 'Laptop', categoryId: cat1.id, userId: 'u1' });
    const updated = await repo.update(created.id, { categoryId: cat2.id });
    expect(updated.categoryId).toBe(cat2.id);
  });

  test('17. update barcode to null clears barcode', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({
      name: 'Laptop',
      categoryId: category.id,
      userId: 'u1',
      barcode: '123',
    });
    const updated = await repo.update(created.id, { barcode: null });
    expect(updated.barcode).toBeNull();
  });

  test('18. update metadata to null clears metadata', async () => {
    const category = await createCategory('Electronics');
    const created = await repo.create({
      name: 'Laptop',
      categoryId: category.id,
      userId: 'u1',
      metadata: { color: 'red' },
    });
    const updated = await repo.update(created.id, { metadata: null });
    expect(updated.metadata).toBeNull();
  });
});

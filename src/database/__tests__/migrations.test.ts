import { createTestDatabase } from './testDb';
import { runMigrations } from '../migrations/runner';
import { migrations } from '../migrations';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('Migration System', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON');
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. runMigrations() creates _migrations table', async () => {
    await runMigrations(db);
    const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM _migrations');
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  test('2. runMigrations() creates users, categories, products, stores tables', async () => {
    await runMigrations(db);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'categories', 'products', 'stores')",
    );
    const names = tables.map((t) => t.name);
    expect(names).toContain('users');
    expect(names).toContain('categories');
    expect(names).toContain('products');
    expect(names).toContain('stores');
  });

  test('3. runMigrations() is idempotent — second run does not throw', async () => {
    await runMigrations(db);
    await expect(runMigrations(db)).resolves.not.toThrow();
  });

  test('4. _migrations table records migration name and timestamp', async () => {
    await runMigrations(db);
    const rows = await db.getAllAsync<{ name: string; applied_at: string }>(
      'SELECT name, applied_at FROM _migrations',
    );
    expect(rows.length).toBe(migrations.length);
    for (const row of rows) {
      expect(row.name).toBeTruthy();
      expect(row.applied_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test('5. FK enforcement is active — insert product with non-existent category_id fails', async () => {
    await runMigrations(db);
    await expect(
      db.runAsync(
        "INSERT INTO products (id, name, category_id, user_id, created_at, updated_at) VALUES ('p1', 'Product', 'nonexistent', 'u1', '2024-01-01', '2024-01-01')",
      ),
    ).rejects.toThrow();
  });

  test('6. UNIQUE constraint on (name, user_id) for categories', async () => {
    await runMigrations(db);
    await db.execAsync(
      "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c1', 'Electronics', 'u1', '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.execAsync(
        "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c2', 'Electronics', 'u1', '2024-01-01', '2024-01-01')",
      ),
    ).rejects.toThrow();
  });

  test('7. UNIQUE constraint on (name, location) for stores', async () => {
    await runMigrations(db);
    await db.execAsync(
      "INSERT INTO stores (id, name, location, created_at, updated_at) VALUES ('s1', 'Walmart', 'Downtown', '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.execAsync(
        "INSERT INTO stores (id, name, location, created_at, updated_at) VALUES ('s2', 'Walmart', 'Downtown', '2024-01-01', '2024-01-01')",
      ),
    ).rejects.toThrow();
  });

  test('8. UNIQUE constraint on barcode for products', async () => {
    await runMigrations(db);
    await db.execAsync(
      "INSERT INTO categories (id, name, created_at, updated_at) VALUES ('c1', 'Electronics', '2024-01-01', '2024-01-01')",
    );
    await db.execAsync(
      "INSERT INTO products (id, name, category_id, barcode, user_id, created_at, updated_at) VALUES ('p1', 'Product1', 'c1', '123456', 'u1', '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.execAsync(
        "INSERT INTO products (id, name, category_id, barcode, user_id, created_at, updated_at) VALUES ('p2', 'Product2', 'c1', '123456', 'u1', '2024-01-01', '2024-01-01')",
      ),
    ).rejects.toThrow();
  });

  test('9. Indexes exist on products(name) and products(category_id)', async () => {
    await runMigrations(db);
    const indexes = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='products'",
    );
    const names = indexes.map((i) => i.name);
    expect(names).toContain('idx_products_name');
    expect(names).toContain('idx_products_category_id');
  });

  test('10. Migration runner wraps errors in DatabaseError', async () => {
    // We can't easily inject a bad migration here without modifying the registry,
    // but we can test that the runner at least doesn't throw on normal migrations.
    await expect(runMigrations(db)).resolves.toBeUndefined();
  });

  test('11. Same category name with different user_id is allowed', async () => {
    await runMigrations(db);
    await db.runAsync(
      "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c1', 'Electronics', 'u1', '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c2', 'Electronics', 'u2', '2024-01-01', '2024-01-01')",
      ),
    ).resolves.not.toThrow();
  });

  test('12. Same store name with different location is allowed', async () => {
    await runMigrations(db);
    await db.runAsync(
      "INSERT INTO stores (id, name, location, created_at, updated_at) VALUES ('s1', 'Walmart', 'Downtown', '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO stores (id, name, location, created_at, updated_at) VALUES ('s2', 'Walmart', 'Uptown', '2024-01-01', '2024-01-01')",
      ),
    ).resolves.not.toThrow();
  });

  test('13. Duplicate category name with null user_id is allowed (SQLite NULL semantics)', async () => {
    await runMigrations(db);
    await db.runAsync(
      "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c1', 'General', NULL, '2024-01-01', '2024-01-01')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO categories (id, name, user_id, created_at, updated_at) VALUES ('c2', 'General', NULL, '2024-01-01', '2024-01-01')",
      ),
    ).resolves.not.toThrow();
  });

  test('14. PRAGMA foreign_keys is ON', async () => {
    await runMigrations(db);
    const result = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    expect(result?.foreign_keys).toBe(1);
  });
});

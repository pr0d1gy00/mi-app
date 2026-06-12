import { createTestDatabase } from '@/database/__tests__/testDb';
import { SyncMetadataRepository } from '../SyncMetadataRepository';

describe('SyncMetadataRepository', () => {
  let db: any;
  let repo: SyncMetadataRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    repo = new SyncMetadataRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. get() returns null for non-existent key', async () => {
    const value = await repo.get('non-existent');
    expect(value).toBeNull();
  });

  test('2. set() and get() work for key-value', async () => {
    await repo.set('test_key', 'test_value');
    const value = await repo.get('test_key');
    expect(value).toBe('test_value');
  });

  test('3. setLastPullAt() and getLastPullAt() work', async () => {
    const ts = '2024-06-11T12:00:00.000Z';
    await repo.setLastPullAt(ts);
    const result = await repo.getLastPullAt();
    expect(result).toBe(ts);
  });

  test('4. setLastPushAt() and getLastPushAt() work', async () => {
    const ts = '2024-06-11T12:00:00.000Z';
    await repo.setLastPushAt(ts);
    const result = await repo.getLastPushAt();
    expect(result).toBe(ts);
  });

  test('5. isInitialSyncDone() returns false by default', async () => {
    const done = await repo.isInitialSyncDone();
    expect(done).toBe(false);
  });

  test('6. markInitialSyncDone() and isInitialSyncDone() work', async () => {
    await repo.markInitialSyncDone();
    const done = await repo.isInitialSyncDone();
    expect(done).toBe(true);
  });

  test('7. set() replaces existing value', async () => {
    await repo.set('key', 'value1');
    await repo.set('key', 'value2');
    const value = await repo.get('key');
    expect(value).toBe('value2');
  });
});

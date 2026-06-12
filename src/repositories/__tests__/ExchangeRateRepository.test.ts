import { createTestDatabase } from '@/database/__tests__/testDb';
import { ExchangeRateRepository } from '../ExchangeRateRepository';

describe('ExchangeRateRepository', () => {
  let db: any;
  let repo: ExchangeRateRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    await db.execAsync('PRAGMA foreign_keys = ON');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id TEXT PRIMARY KEY,
        base_currency TEXT NOT NULL DEFAULT 'USD',
        target_currency TEXT NOT NULL,
        rate TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('BCV', 'Paralelo', 'Custom')),
        rate_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'synced',
        last_synced_at TEXT,
        is_custom INTEGER NOT NULL DEFAULT 0
      );
    `);
    repo = new ExchangeRateRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. create() inserts and returns ExchangeRate', async () => {
    const rate = await repo.create({
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate: '50.00',
      source: 'BCV',
      rateDate: '2024-06-11',
      isCustom: false,
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      syncStatus: 'synced',
      lastSyncedAt: null,
    });
    expect(rate.id).toBeTruthy();
    expect(rate.baseCurrency).toBe('USD');
    expect(rate.targetCurrency).toBe('VES');
    expect(rate.rate).toBe('50.00');
    expect(rate.source).toBe('BCV');
    expect(rate.isCustom).toBe(false);
  });

  test('2. getById() returns rate for existing id', async () => {
    const created = await repo.create({
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate: '50.00',
      source: 'BCV',
      rateDate: '2024-06-11',
      isCustom: false,
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      syncStatus: 'synced',
      lastSyncedAt: null,
    });
    const rate = await repo.getById(created.id);
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBe('50.00');
  });

  test('3. getById() returns null for non-existent id', async () => {
    const rate = await repo.getById('non-existent');
    expect(rate).toBeNull();
  });

  test('4. getLatest() returns most recent rate', async () => {
    await repo.create({
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate: '49.00',
      source: 'BCV',
      rateDate: '2024-06-10',
      isCustom: false,
      createdAt: '2024-06-10',
      updatedAt: '2024-06-10',
      syncStatus: 'synced',
      lastSyncedAt: null,
    });
    await repo.create({
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate: '50.00',
      source: 'BCV',
      rateDate: '2024-06-11',
      isCustom: false,
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      syncStatus: 'synced',
      lastSyncedAt: null,
    });
    const latest = await repo.getLatest('USD', 'VES');
    expect(latest!.rate).toBe('50.00');
    expect(latest!.rateDate).toBe('2024-06-11');
  });

  test('5. softDelete() marks as deleted', async () => {
    const created = await repo.create({
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate: '50.00',
      source: 'BCV',
      rateDate: '2024-06-11',
      isCustom: false,
      createdAt: '2024-06-11',
      updatedAt: '2024-06-11',
      syncStatus: 'synced',
      lastSyncedAt: null,
    });
    await repo.softDelete(created.id);
    const rate = await repo.getById(created.id);
    expect(rate).toBeNull();
  });
});
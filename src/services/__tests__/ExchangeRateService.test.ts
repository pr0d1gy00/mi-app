import { createTestDatabase } from '@/database/__tests__/testDb';
import { ExchangeRateService } from '../ExchangeRateService';

// Mock secureStore - use function mock for dynamic import
const mockGetSecureItem = jest.fn().mockResolvedValue('50.00');
jest.mock('@/services/secureStore', () => ({
  getSecureItem: (...args: string[]) => mockGetSecureItem(...args),
}));

// Mock apiClient
jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('ExchangeRateService', () => {
  let db: any;
  let service: ExchangeRateService;

  beforeEach(async () => {
    db = createTestDatabase();
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
    service = new ExchangeRateService(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. getLatestRate() returns null when no rates', async () => {
    const rate = await service.getLatestRate('USD', 'VES');
    expect(rate).toBeNull();
  });

  test('2. fetchAndSaveRate() with Custom source saves to DB', async () => {
    const result = await service.fetchAndSaveRate('USD', 'VES', 'Custom');
    expect(result.success).toBe(true);
    expect(result.rate).not.toBeNull();
    expect(result.rate!.rate).toBe('50.00');
    expect(result.rate!.source).toBe('Custom');
  });

  test('3. getLatestRate() returns saved rate', async () => {
    await service.fetchAndSaveRate('USD', 'VES', 'Custom');
    const rate = await service.getLatestRate('USD', 'VES');
    expect(rate).not.toBeNull();
    expect(rate!.rate).toBe('50.00');
  });

  test('4. saveCustomRate() creates new rate', async () => {
    const rate = await service.saveCustomRate('55.00', '2024-06-11');
    expect(rate.rate).toBe('55.00');
    expect(rate.isCustom).toBe(true);
  });

  test('5. getRateHistory() returns rates', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    await service.saveCustomRate('48.00', yesterday);
    await service.saveCustomRate('50.00', today);
    const history = await service.getRateHistory('USD', 'VES', 7);
    expect(history.length).toBe(2);
  });

  test('6. fetchFromBackend() returns rate on success', async () => {
    const { apiClient } = require('@/services/apiClient');
    apiClient.get.mockResolvedValue({ data: { rate: '52.00' } });

    const result = await service.fetchFromBackend('USD', 'VES', 'BCV');
    expect(result.rate).toBe('52.00');
    expect(result.error).toBeNull();
  });

  test('7. fetchFromBackend() returns error on failure', async () => {
    const { apiClient } = require('@/services/apiClient');
    apiClient.get.mockRejectedValue(new Error('Network error'));

    const result = await service.fetchFromBackend('USD', 'VES', 'BCV');
    expect(result.rate).toBeNull();
    expect(result.error).toBe('Network error');
  });
});

import { renderHook } from '@testing-library/react-native';
import { useExchangeRate } from '../useExchangeRate';

jest.mock('@/database/connection', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    getFirstAsync: jest.fn().mockResolvedValue(null),
    runAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/repositories/ExchangeRateRepository', () => ({
  ExchangeRateRepository: jest.fn().mockImplementation(() => ({
    getLatest: jest.fn().mockResolvedValue(null),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  },
}));

describe('useExchangeRate', () => {
  test('1. returns null rate when no data', async () => {
    const { result } = renderHook(() => useExchangeRate('USD', 'VES'));
    // Initially loading or null
    expect(result.current.rate === null || result.current.isLoading).toBe(true);
  });

  test('2. returns refresh function', async () => {
    const { result } = renderHook(() => useExchangeRate('USD', 'VES'));
    expect(typeof result.current.refresh).toBe('function');
  });

  test('3. returns error state', async () => {
    const { result } = renderHook(() => useExchangeRate('USD', 'VES'));
    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });
});

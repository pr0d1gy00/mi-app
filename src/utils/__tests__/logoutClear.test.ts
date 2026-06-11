import { clearAllLocalData } from '../logoutClear';
import { getDatabase, resetDatabase } from '@/database/connection';

jest.mock('@/database/connection', () => ({
  getDatabase: jest.fn(),
  resetDatabase: jest.fn(),
}));

describe('clearAllLocalData', () => {
  let runAsyncMock: jest.Mock;

  beforeEach(() => {
    runAsyncMock = jest.fn(async () => ({ lastInsertRowId: 1, changes: 1 }));
    (getDatabase as jest.Mock).mockResolvedValue({
      runAsync: runAsyncMock,
    });
    jest.clearAllMocks();
  });

  test('calls DELETE FROM categories, products, stores, users', async () => {
    await clearAllLocalData();
    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM categories');
    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM products');
    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM stores');
    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM users');
  });

  test('calls resetDatabase after clearing tables', async () => {
    await clearAllLocalData();
    expect(resetDatabase).toHaveBeenCalled();
  });

  test('does not throw when database is unavailable', async () => {
    (getDatabase as jest.Mock).mockRejectedValueOnce(new Error('DB unavailable'));
    await expect(clearAllLocalData()).resolves.toBeUndefined();
  });

  test('calls delete statements in correct order', async () => {
    await clearAllLocalData();
    const calls = runAsyncMock.mock.calls.map((c: any) => c[0]);
    expect(calls[0]).toBe('DELETE FROM categories');
    expect(calls[1]).toBe('DELETE FROM products');
    expect(calls[2]).toBe('DELETE FROM stores');
    expect(calls[3]).toBe('DELETE FROM users');
  });

  test('does not throw when delete statement fails', async () => {
    runAsyncMock.mockRejectedValueOnce(new Error('delete failed'));
    await expect(clearAllLocalData()).resolves.toBeUndefined();
  });

  test('calls resetDatabase even when delete fails', async () => {
    runAsyncMock.mockRejectedValueOnce(new Error('delete failed'));
    await clearAllLocalData();
    expect(resetDatabase).toHaveBeenCalled();
  });
});

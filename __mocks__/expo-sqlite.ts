import { jest } from '@jest/globals';

export const openDatabaseAsync = jest.fn(async () => ({
  execAsync: jest.fn(async () => undefined),
  runAsync: jest.fn(async () => ({ lastInsertRowId: 1, changes: 1 })),
  getAllAsync: jest.fn(async () => []),
  getFirstAsync: jest.fn(async () => null),
}));

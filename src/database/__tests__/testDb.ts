import Database from 'better-sqlite3';
import type { SQLiteDatabase } from 'expo-sqlite';

interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export function createTestDatabase(): SQLiteDatabase {
  const db = new Database(':memory:');

  const wrapped = {
    execAsync: async (source: string): Promise<void> => {
      db.exec(source);
    },

    runAsync: async (source: string, ...params: unknown[]): Promise<RunResult> => {
      const stmt = db.prepare(source);
      const result = stmt.run(...params);
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: result.changes,
      };
    },

    getAllAsync: async <T>(source: string, ...params: unknown[]): Promise<T[]> => {
      const stmt = db.prepare(source);
      return stmt.all(...params) as T[];
    },

    getFirstAsync: async <T>(source: string, ...params: unknown[]): Promise<T | null> => {
      const stmt = db.prepare(source);
      const row = stmt.get(...params) as T | undefined;
      return row ?? null;
    },

    closeAsync: async (): Promise<void> => {
      db.close();
    },
  };

  return wrapped as unknown as SQLiteDatabase;
}

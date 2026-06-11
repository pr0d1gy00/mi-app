import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseError } from './errors';
import { runMigrations } from './migrations/runner';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('mi-purchase.db')
      .then(async (db) => {
        await db.execAsync('PRAGMA foreign_keys = ON');
        await runMigrations(db);
        return db;
      })
      .catch((error) => {
        dbPromise = null;
        const code = error?.code ?? 'UNKNOWN';
        throw new DatabaseError(error?.message ?? 'Failed to open database', code, error);
      });
  }
  return dbPromise;
}

export function resetDatabase(): void {
  dbPromise = null;
}

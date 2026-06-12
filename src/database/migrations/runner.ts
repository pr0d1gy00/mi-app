import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseError } from '../errors';
import { migration001CreateTables } from './001-create-tables';
import { migration002CreatePurchases } from './002-create-purchases';
import { migration003CreatePurchaseGroups } from './003-create-purchase-groups';
import { migration004CreateExchangeRates } from './004-create-exchange-rates';
import { migration005CreateSyncMetadata } from './005-create-sync-metadata';

export const migrations = [
  migration001CreateTables,
  migration002CreatePurchases,
  migration003CreatePurchaseGroups,
  migration004CreateExchangeRates,
  migration005CreateSyncMetadata,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure _migrations table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get already-applied migrations
  const applied = await db.getAllAsync<{ name: string }>('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    try {
      await db.execAsync(migration.up);
      await db.runAsync(
        'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
        migration.name,
        new Date().toISOString(),
      );
    } catch (error) {
      throw new DatabaseError(
        `Migration "${migration.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        'MIGRATION_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }
}

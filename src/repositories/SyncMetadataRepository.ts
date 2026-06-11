import type { SQLiteDatabase } from 'expo-sqlite';

export class SyncMetadataRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)',
      key,
      value,
    );
  }

  async getLastPullAt(): Promise<string | null> {
    return this.get('last_pull_at');
  }

  async setLastPullAt(timestamp: string): Promise<void> {
    await this.set('last_pull_at', timestamp);
  }

  async getLastPushAt(): Promise<string | null> {
    return this.get('last_push_at');
  }

  async setLastPushAt(timestamp: string): Promise<void> {
    await this.set('last_push_at', timestamp);
  }

  async isInitialSyncDone(): Promise<boolean> {
    return (await this.get('is_initial_sync_done')) === 'true';
  }

  async markInitialSyncDone(): Promise<void> {
    await this.set('is_initial_sync_done', 'true');
  }
}

import type { Migration } from './index';

export const migration005CreateSyncMetadata: Migration = {
  name: '005-create-sync-metadata',
  up: `
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
};

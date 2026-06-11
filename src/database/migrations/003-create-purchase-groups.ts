import type { Migration } from './index';

export const migration003CreatePurchaseGroups: Migration = {
  name: '003-create-purchase-groups',
  up: `
    -- Purchase groups table
    CREATE TABLE IF NOT EXISTS purchase_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'created',
      last_synced_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Indexes for purchase_groups
    CREATE INDEX IF NOT EXISTS idx_purchase_groups_user_id ON purchase_groups(user_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_groups_sync_status ON purchase_groups(sync_status);

    -- Junction table for purchase_group <-> purchase
    CREATE TABLE IF NOT EXISTS purchase_group_items (
      id TEXT PRIMARY KEY,
      purchase_group_id TEXT NOT NULL,
      purchase_id TEXT NOT NULL,
      FOREIGN KEY (purchase_group_id) REFERENCES purchase_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      UNIQUE(purchase_group_id, purchase_id)
    );

    -- Indexes for junction table
    CREATE INDEX IF NOT EXISTS idx_purchase_group_items_group_id ON purchase_group_items(purchase_group_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_group_items_purchase_id ON purchase_group_items(purchase_id);
  `,
};

import type { Migration } from './index';

export const migration002CreatePurchases: Migration = {
  name: '002-create-purchases',
  up: `
    -- Purchases table
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      store_id TEXT,
      user_id TEXT NOT NULL,
      total_amount TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      notes TEXT,
      purchase_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'created',
      last_synced_at TEXT,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON purchases(store_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
    CREATE INDEX IF NOT EXISTS idx_purchases_sync_status ON purchases(sync_status);

    -- Purchase items table
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price TEXT NOT NULL,
      total_price TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'created',
      last_synced_at TEXT,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Indexes for purchase_items
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_sync_status ON purchase_items(sync_status);
  `,
};

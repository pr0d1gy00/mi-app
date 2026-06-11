import type { Migration } from './index';

export const migration004CreateExchangeRates: Migration = {
  name: '004-create-exchange-rates',
  up: `
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY,
      base_currency TEXT NOT NULL DEFAULT 'USD',
      target_currency TEXT NOT NULL,
      rate TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('BCV', 'Paralelo', 'Custom')),
      rate_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
    CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(rate_date);
  `,
};
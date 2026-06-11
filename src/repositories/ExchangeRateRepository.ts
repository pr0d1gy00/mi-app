import type { SQLiteDatabase } from 'expo-sqlite';
import type { ExchangeRate, RateSource, SyncStatus } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface ExchangeRateInsert {
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  source: RateSource;
  rateDate: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

interface ExchangeRateRow {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string;
  source: string;
  rate_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
  last_synced_at: string;
  is_custom: number;
}

export class ExchangeRateRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: ExchangeRateInsert): Promise<ExchangeRate> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO exchange_rates (id, base_currency, target_currency, rate, source, rate_date, is_custom, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, dto.baseCurrency, dto.targetCurrency, dto.rate, dto.source, dto.rateDate, dto.isCustom ? 1 : 0,
      dto.createdAt || now, dto.updatedAt || now, dto.syncStatus || 'synced', dto.lastSyncedAt || now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<ExchangeRate | null> {
    const row = await this.db.getFirstAsync<ExchangeRateRow>(
      'SELECT * FROM exchange_rates WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getLatest(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | null> {
    const row = await this.db.getFirstAsync<ExchangeRateRow>(
      'SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND deleted_at IS NULL ORDER BY rate_date DESC LIMIT 1',
      baseCurrency,
      targetCurrency,
    );
    return row ? this.mapRow(row) : null;
  }

  async getHistory(baseCurrency: string, targetCurrency: string, days: number): Promise<ExchangeRate[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const rows = await this.db.getAllAsync<ExchangeRateRow>(
      'SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND deleted_at IS NULL AND rate_date >= ? ORDER BY rate_date DESC',
      baseCurrency,
      targetCurrency,
      cutoff.toISOString().split('T')[0],
    );
    return rows.map(this.mapRow);
  }

  async softDelete(id: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE exchange_rates SET deleted_at = ? WHERE id = ?',
      new Date().toISOString(),
      id,
    );
  }

  private mapRow(row: ExchangeRateRow): ExchangeRate {
    return {
      id: row.id,
      baseCurrency: row.base_currency,
      targetCurrency: row.target_currency,
      rate: row.rate,
      source: row.source as RateSource,
      rateDate: row.rate_date,
      isCustom: row.is_custom === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status as SyncStatus,
      lastSyncedAt: row.last_synced_at,
    };
  }
}
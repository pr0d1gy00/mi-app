import type { SQLiteDatabase } from 'expo-sqlite';
import { ExchangeRateRepository } from '@/repositories/ExchangeRateRepository';
import { apiClient } from '@/services/apiClient';
import { getSecureItem } from '@/services/secureStore';
import type { ExchangeRate, RateSource } from '@/types/entities';

export interface ExchangeRateResult {
  success: boolean;
  rate: ExchangeRate | null;
  error: string | null;
}

export class ExchangeRateService {
  constructor(db: SQLiteDatabase) {
    this.repo = new ExchangeRateRepository(db);
  }

  private repo: ExchangeRateRepository;

  /**
   * Fetch rate from backend and save to local DB
   * Falls back to custom rate from SecureStore if offline
   */
  async fetchAndSaveRate(
    baseCurrency: string,
    targetCurrency: string,
    source: RateSource = 'BCV',
  ): Promise<ExchangeRateResult> {
    try {
      let rateValue: string;

      if (source === 'Custom') {
        // Use custom rate from SecureStore
        rateValue = await this.getCustomRate();
      } else {
        // Fetch from backend
        const response = await apiClient.get(
          `/exchange-rates?base=${baseCurrency}&target=${targetCurrency}&source=${source}`,
        );
        const data = response.data as { rate?: string; value?: string };
        rateValue = data.rate || data.value || '';
      }

      if (!rateValue) {
        return { success: false, rate: null, error: 'No rate received' };
      }

      const now = new Date();
      const rate: Omit<ExchangeRate, 'id'> = {
        baseCurrency,
        targetCurrency,
        rate: rateValue,
        source,
        rateDate: now.toISOString().split('T')[0],
        isCustom: source === 'Custom',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
        syncStatus: 'synced',
        lastSyncedAt: now.toISOString(),
      };

      const saved = await this.repo.create(rate);

      return { success: true, rate: saved, error: null };
    } catch (e) {
      // On error, try to return cached rate
      const cached = await this.repo.getLatest(baseCurrency, targetCurrency);
      return {
        success: false,
        rate: cached,
        error: e instanceof Error ? e.message : 'Failed to fetch rate',
      };
    }
  }

  /**
   * Get latest rate from local DB
   */
  async getLatestRate(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | null> {
    return this.repo.getLatest(baseCurrency, targetCurrency);
  }

  /**
   * Get rate history from local DB
   */
  async getRateHistory(
    baseCurrency: string,
    targetCurrency: string,
    days: number = 7,
  ): Promise<ExchangeRate[]> {
    return this.repo.getHistory(baseCurrency, targetCurrency, days);
  }

  /**
   * Save custom rate manually
   */
  async saveCustomRate(rate: string, date: string): Promise<ExchangeRate> {
    const now = new Date();
    const exchangeRate: Omit<ExchangeRate, 'id'> = {
      baseCurrency: 'USD',
      targetCurrency: 'VES',
      rate,
      source: 'Custom',
      rateDate: date,
      isCustom: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null,
      syncStatus: 'created',
      lastSyncedAt: null,
    };

    return this.repo.create(exchangeRate);
  }

  /**
   * Get custom rate from SecureStore
   */
  private async getCustomRate(): Promise<string> {
    try {
      return (await getSecureItem('custom_rate')) || '0';
    } catch {
      return '0';
    }
  }

  /**
   * Fetch rate from backend only (no local save)
   * Used for real-time rate display when online
   */
  async fetchFromBackend(
    baseCurrency: string,
    targetCurrency: string,
    source: RateSource = 'BCV',
  ): Promise<{ rate: string | null; error: string | null }> {
    try {
      const response = await apiClient.get(
        `/exchange-rates?base=${baseCurrency}&target=${targetCurrency}&source=${source}`,
      );
      const data = response.data as { rate?: string; value?: string };
      return { rate: data.rate || data.value || null, error: null };
    } catch (e) {
      return { rate: null, error: e instanceof Error ? e.message : 'Fetch failed' };
    }
  }
}

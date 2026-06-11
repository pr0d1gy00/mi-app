import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '@/database/connection';
import { ExchangeRateRepository } from '@/repositories/ExchangeRateRepository';
import type { ExchangeRate } from '@/types/entities';
import { useConnectivity } from './useConnectivity';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useExchangeRate(baseCurrency: string, targetCurrency: string) {
  const { isOnline } = useConnectivity();
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRate = useCallback(async () => {
    if (!isOnline) return;
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new ExchangeRateRepository(db);
      const latestRate = await repo.getLatest(baseCurrency, targetCurrency);
      setRate(latestRate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate');
    } finally {
      setIsLoading(false);
    }
  }, [baseCurrency, targetCurrency, isOnline]);

  useEffect(() => {
    loadRate();
  }, [loadRate]);

  useEffect(() => {
    if (isOnline) {
      intervalRef.current = setInterval(loadRate, REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline, loadRate]);

  return { rate, isLoading, error, refresh: loadRate };
}

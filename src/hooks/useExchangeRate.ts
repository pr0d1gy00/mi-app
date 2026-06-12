import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '@/database/connection';
import { ExchangeRateService } from '@/services/ExchangeRateService';
import { getSecureItem } from '@/services/secureStore';
import type { ExchangeRate, RateSource } from '@/types/entities';
import { useConnectivity } from './useConnectivity';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useExchangeRate(baseCurrency: string, targetCurrency: string) {
  const { isOnline } = useConnectivity();
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serviceRef = useRef<ExchangeRateService | null>(null);

  const loadRate = useCallback(async () => {
    if (!isOnline) return;
    try {
      setIsLoading(true);
      setError(null);

      const db = await getDatabase();
      if (!serviceRef.current) {
        serviceRef.current = new ExchangeRateService(db);
      }

      // Get preferred source from SecureStore
      let source: RateSource = 'BCV';
      const savedSource = await getSecureItem('rate_source');
      if (savedSource && ['BCV', 'Paralelo', 'Custom'].includes(savedSource)) {
        source = savedSource as RateSource;
      }

      // Try to fetch fresh rate from backend
      const result = await serviceRef.current.fetchAndSaveRate(
        baseCurrency,
        targetCurrency,
        source,
      );

      if (result.rate) {
        setRate(result.rate);
      } else {
        // Fallback to cached rate
        const cached = await serviceRef.current.getLatestRate(baseCurrency, targetCurrency);
        setRate(cached);
        if (result.error) setError(result.error);
      }
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

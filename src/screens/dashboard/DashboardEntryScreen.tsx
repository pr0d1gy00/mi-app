import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Typography } from '@/components/Typography';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ExchangeRateDisplay } from '@/components/ExchangeRateDisplay';
import { useTheme } from '@/theme/useTheme';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getDatabase } from '@/database/connection';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { StoreRepository } from '@/repositories/StoreRepository';

export function DashboardEntryScreen() {
  const theme = useTheme();
  const { rate, isLoading: rateLoading } = useExchangeRate('USD', 'VES');
  const [counts, setCounts] = useState({ categories: 0, products: 0, stores: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const categories = await new CategoryRepository(db).getAll();
      const products = await new ProductRepository(db).getAll();
      const stores = await new StoreRepository(db).getAll();
      setCounts({
        categories: categories.length,
        products: products.length,
        stores: stores.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load counts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);
  useFocusEffect(
    useCallback(() => {
      loadCounts();
    }, [loadCounts]),
  );

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="dashboard-spinner" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Typography variant="body" color={theme.colors.error}>
          {error}
        </Typography>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        Dashboard
      </Typography>
      <View style={{ gap: theme.spacing.md }}>
        <ExchangeRateDisplay rate={rate} isLoading={rateLoading} />
        <Card pressable testID="categories-card">
          <Typography variant="h2">Categories</Typography>
          <Typography variant="h1" style={{ marginTop: theme.spacing.sm }}>
            {counts.categories}
          </Typography>
        </Card>
        <Card pressable testID="products-card">
          <Typography variant="h2">Products</Typography>
          <Typography variant="h1" style={{ marginTop: theme.spacing.sm }}>
            {counts.products}
          </Typography>
        </Card>
        <Card pressable testID="stores-card">
          <Typography variant="h2">Stores</Typography>
          <Typography variant="h1" style={{ marginTop: theme.spacing.sm }}>
            {counts.stores}
          </Typography>
        </Card>
      </View>
    </Screen>
  );
}

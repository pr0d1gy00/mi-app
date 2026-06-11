import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/theme/useTheme';
import { getDatabase } from '@/database/connection';
import { PurchaseRepository } from '@/repositories/PurchaseRepository';
import type { Purchase } from '@/types/entities';
import type { PurchaseStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<PurchaseStackParamList>;

export function PurchaseListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRef = useRef(false);
  const loadPurchases = useCallback(async () => {
    loadRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new PurchaseRepository(db);
      const data = await repo.getAll();
      setPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      loadRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loadRef.current) {
        loadPurchases();
      }
    }, [loadPurchases]),
  );

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="purchase-list-spinner" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Purchases
      </Typography>
      {error && (
        <Typography variant="bodySmall" color={theme.colors.error} style={{ marginBottom: 8 }}>
          {error}
        </Typography>
      )}
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPurchases();
            }}
          />
        }
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Card
            pressable
            testID={`purchase-item-${item.id}`}
            onPress={() => navigation.navigate('PurchaseDetail', { purchaseId: item.id })}
          >
            <Typography variant="h3">{item.purchaseDate}</Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              {item.currency} {item.totalAmount}
            </Typography>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Typography variant="body" color={theme.colors.textSecondary}>
              No purchases yet
            </Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Tap + to create one
            </Typography>
          </View>
        }
      />
      <Button
        testID="purchase-fab"
        onPress={() => navigation.navigate('PurchaseCreate')}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
        }}
      >
        +
      </Button>
    </Screen>
  );
}

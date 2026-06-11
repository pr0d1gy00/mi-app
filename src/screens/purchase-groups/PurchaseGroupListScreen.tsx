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
import { PurchaseGroupRepository } from '@/repositories/PurchaseGroupRepository';
import type { PurchaseGroup } from '@/types/entities';
import type { PurchaseGroupStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<PurchaseGroupStackParamList>;

export function PurchaseGroupListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [groups, setGroups] = useState<(PurchaseGroup & { purchases: unknown[]; total: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRef = useRef(false);
  const loadGroups = useCallback(async () => {
    loadRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new PurchaseGroupRepository(db);
      const data = await repo.getAllWithPurchases();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      loadRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loadRef.current) {
        loadGroups();
      }
    }, [loadGroups])
  );

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="group-list-spinner" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Purchase Groups
      </Typography>
      {error && (
        <Typography variant="bodySmall" color={theme.colors.error} style={{ marginBottom: 8 }}>
          {error}
        </Typography>
      )}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGroups();
            }}
          />
        }
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Card
            pressable
            testID={`group-item-${item.id}`}
            onPress={() => navigation.navigate('PurchaseGroupDetail', { groupId: item.id })}
          >
            <Typography variant="h3">{item.name}</Typography>
            {item.description && (
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                {item.description}
              </Typography>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                {item.purchases.length} purchases
              </Typography>
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                Total: ${item.total}
              </Typography>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Typography variant="body" color={theme.colors.textSecondary}>
              No groups yet
            </Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Create a group to organize your purchases
            </Typography>
          </View>
        }
      />
      <Button
        testID="group-fab"
        onPress={() => navigation.navigate('PurchaseGroupCreate')}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28 }}
      >
        +
      </Button>
    </Screen>
  );
}
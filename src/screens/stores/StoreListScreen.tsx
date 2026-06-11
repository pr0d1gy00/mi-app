import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/theme/useTheme';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { getDatabase } from '@/database/connection';
import { StoreRepository } from '@/repositories/StoreRepository';
import type { Store } from '@/types/entities';

export function StoreListScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { notify } = useNotificationStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const loadStores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new StoreRepository(db);
      const data = searchRef.current ? await repo.search(searchRef.current) : await repo.getAll();
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stores');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [search, loadStores]);
  useFocusEffect(
    useCallback(() => {
      loadStores();
    }, [loadStores]),
  );

  const handleDelete = async (id: string) => {
    try {
      const db = await getDatabase();
      const repo = new StoreRepository(db);
      await repo.softDelete(id);
      notify({ type: 'success', title: 'Deleted', message: 'Store deleted successfully' });
      loadStores();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      notify({ type: 'error', title: 'Error', message });
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="store-list-spinner" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Stores
      </Typography>
      <Input
        testID="store-search-input"
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name or location..."
      />
      {error && (
        <Typography variant="bodySmall" color={theme.colors.error} style={{ marginTop: 8 }}>
          {error}
        </Typography>
      )}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStores} />}
        contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md }}
        renderItem={({ item }) => (
          <Card pressable testID={`store-item-${item.id}`} onPress={() => handleDelete(item.id)}>
            <Typography variant="h3">{item.name}</Typography>
            {item.location && (
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                {item.location}
              </Typography>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Typography variant="body" color={theme.colors.textSecondary}>
              No stores yet
            </Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Tap + to create one
            </Typography>
          </View>
        }
      />
      <Button
        testID="store-fab"
        onPress={() => navigation.navigate('StoreForm' as never)}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, borderRadius: 28 }}
      >
        +
      </Button>
    </Screen>
  );
}

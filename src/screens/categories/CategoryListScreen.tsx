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
import { CategoryRepository } from '@/repositories/CategoryRepository';
import type { Category } from '@/types/entities';

export function CategoryListScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { notify } = useNotificationStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new CategoryRepository(db);
      const data = searchRef.current ? await repo.search(searchRef.current) : await repo.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [search, loadCategories]);
  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  const handleDelete = async (id: string) => {
    try {
      const db = await getDatabase();
      const repo = new CategoryRepository(db);
      await repo.softDelete(id);
      notify({ type: 'success', title: 'Deleted', message: 'Category deleted successfully' });
      loadCategories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      notify({ type: 'error', title: 'Error', message });
    }
  };

  const filtered = categories;

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="category-list-spinner" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Categories
      </Typography>
      <Input
        testID="category-search-input"
        value={search}
        onChangeText={setSearch}
        placeholder="Search categories..."
      />
      {error && (
        <Typography variant="bodySmall" color={theme.colors.error} style={{ marginTop: 8 }}>
          {error}
        </Typography>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCategories} />}
        contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md }}
        renderItem={({ item }) => (
          <Card pressable testID={`category-item-${item.id}`} onPress={() => handleDelete(item.id)}>
            <Typography variant="h3">{item.name}</Typography>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Typography variant="body" color={theme.colors.textSecondary}>
              No categories yet
            </Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Tap + to create one
            </Typography>
          </View>
        }
      />
      <Button
        testID="category-fab"
        onPress={() => navigation.navigate('CategoryForm' as never)}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, borderRadius: 28 }}
      >
        +
      </Button>
    </Screen>
  );
}

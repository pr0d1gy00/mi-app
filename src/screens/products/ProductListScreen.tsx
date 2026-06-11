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
import { ProductRepository } from '@/repositories/ProductRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import type { Product, Category } from '@/types/entities';

export function ProductListScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { notify } = useNotificationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store deps in refs to avoid recreation
  const searchRef = useRef(search);
  const categoryRef = useRef(selectedCategory);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);
  useEffect(() => {
    categoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // Stable loadData - no deps that cause recreation
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const db = await getDatabase();
      const productRepo = new ProductRepository(db);
      const categoryRepo = new CategoryRepository(db);
      const allCategories = await categoryRepo.getAll();
      setCategories(allCategories);
      let data = searchRef.current
        ? await productRepo.search(searchRef.current)
        : await productRepo.getAll();
      if (categoryRef.current) {
        data = data.filter((p) => p.categoryId === categoryRef.current);
      }
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []); // Empty deps - uses refs for current values

  // Filter by search/category changes
  useEffect(() => {
    loadData();
  }, [search, selectedCategory, loadData]); // loadData is now stable

  // Refresh on screen focus (no deps - stable callback)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleDelete = async (id: string) => {
    try {
      const db = await getDatabase();
      const repo = new ProductRepository(db);
      await repo.softDelete(id);
      notify({ type: 'success', title: 'Deleted', message: 'Product deleted successfully' });
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      notify({ type: 'error', title: 'Error', message });
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="product-list-spinner" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Products
      </Typography>
      <Input
        testID="product-search-input"
        value={search}
        onChangeText={setSearch}
        placeholder="Search products..."
      />
      {categories.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'primary' : 'ghost'}
              onPress={() => setSelectedCategory((prev) => (prev === cat.id ? null : cat.id))}
              testID={`category-filter-${cat.id}`}
            >
              {cat.name}
            </Button>
          ))}
        </View>
      )}
      {error && (
        <Typography variant="bodySmall" color={theme.colors.error} style={{ marginTop: 8 }}>
          {error}
        </Typography>
      )}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        contentContainerStyle={{ gap: theme.spacing.md, paddingVertical: theme.spacing.md }}
        renderItem={({ item }) => (
          <Card pressable testID={`product-item-${item.id}`} onPress={() => handleDelete(item.id)}>
            <Typography variant="h3">{item.name}</Typography>
            {item.brand && (
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                {item.brand}
              </Typography>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Typography variant="body" color={theme.colors.textSecondary}>
              No products yet
            </Typography>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Tap + to create one
            </Typography>
          </View>
        }
      />
      <Button
        testID="product-fab"
        onPress={() => navigation.navigate('ProductForm' as never)}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, borderRadius: 28 }}
      >
        +
      </Button>
    </Screen>
  );
}

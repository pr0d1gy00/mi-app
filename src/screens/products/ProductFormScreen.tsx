import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/theme/useTheme';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { getDatabase } from '@/database/connection';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { productSchema } from '@/types/validation';
import type { Category } from '@/types/entities';

export function ProductFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notify } = useNotificationStore();
  const productId = (route.params as { productId?: string } | undefined)?.productId;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const db = await getDatabase();
        const catRepo = new CategoryRepository(db);
        const cats = await catRepo.getAll();
        setCategories(cats);
        if (productId) {
          const prodRepo = new ProductRepository(db);
          const prod = await prodRepo.getById(productId);
          if (prod) {
            setName(prod.name);
            setBrand(prod.brand ?? '');
            setCategoryId(prod.categoryId);
            setBarcode(prod.barcode ?? '');
          }
        }
      } catch {
        notify({ type: 'error', title: 'Error', message: 'Failed to load data' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [productId, notify]);

  const handleSave = async () => {
    setErrors({});
    const result = productSchema.safeParse({
      name,
      brand: brand || null,
      categoryId,
      barcode: barcode || null,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsLoading(true);
      const db = await getDatabase();
      const catRepo = new CategoryRepository(db);
      const prodRepo = new ProductRepository(db);

      let finalCategoryId = categoryId;
      if (!finalCategoryId) {
        const allCats = await catRepo.getAll();
        if (allCats.length === 0) {
          const defaultCat = await catRepo.create({ name: 'Sin categoría' });
          finalCategoryId = defaultCat.id;
          setCategories([defaultCat]);
        } else {
          finalCategoryId = allCats[0].id;
        }
      }

      if (productId) {
        await prodRepo.update(productId, {
          name,
          brand: brand || null,
          categoryId: finalCategoryId!,
          barcode: barcode || null,
          userId: 'system',
        });
      } else {
        await prodRepo.create({
          name,
          brand: brand || null,
          categoryId: finalCategoryId!,
          barcode: barcode || null,
          userId: 'system',
        });
      }
      notify({
        type: 'success',
        title: 'Saved',
        message: productId ? 'Product updated' : 'Product created',
      });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setErrors({ form: message });
      notify({ type: 'error', title: 'Error', message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && productId) {
    return (
      <Screen>
        <LoadingSpinner testID="product-form-spinner" />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        {productId ? 'Edit Product' : 'New Product'}
      </Typography>
      <View style={{ gap: 16 }}>
        <Input
          testID="product-name-input"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Product name"
          error={errors.name}
        />
        <Input
          testID="product-brand-input"
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          placeholder="Brand (optional)"
        />
        <Input
          testID="product-barcode-input"
          label="Barcode"
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Barcode (optional)"
        />
        <View style={{ gap: 8 }}>
          <Typography variant="bodySmall">Category</Typography>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryId === cat.id ? 'primary' : 'ghost'}
              onPress={() => setCategoryId(cat.id)}
              testID={`product-category-option-${cat.id}`}
            >
              {cat.name}
            </Button>
          ))}
          {categories.length === 0 && (
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              No categories — “Sin categoría” will be created automatically
            </Typography>
          )}
        </View>
        {errors.form && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.form}
          </Typography>
        )}
        <Button testID="product-save-button" loading={isLoading} onPress={handleSave}>
          Save
        </Button>
        <Button testID="product-cancel-button" variant="ghost" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

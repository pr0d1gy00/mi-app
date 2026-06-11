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
import { CategoryRepository } from '@/repositories/CategoryRepository';
import { categorySchema } from '@/types/validation';

export function CategoryFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notify } = useNotificationStore();
  const categoryId = (route.params as { categoryId?: string } | undefined)?.categoryId;

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryId) {
      setIsLoading(true);
      getDatabase()
        .then((db) => new CategoryRepository(db).getById(categoryId))
        .then((cat) => {
          if (cat) setName(cat.name);
        })
        .catch(() => {
          notify({ type: 'error', title: 'Error', message: 'Failed to load category' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [categoryId, notify]);

  const handleSave = async () => {
    setErrors({});
    const result = categorySchema.safeParse({ name });
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
      const repo = new CategoryRepository(db);
      const exists = await repo.existsByName(name, categoryId);
      if (exists) {
        setErrors({ name: 'Category name already exists' });
        setIsLoading(false);
        return;
      }

      if (categoryId) {
        await repo.update(categoryId, { name });
      } else {
        await repo.create({ name });
      }
      notify({
        type: 'success',
        title: 'Saved',
        message: categoryId ? 'Category updated' : 'Category created',
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

  if (isLoading && categoryId) {
    return (
      <Screen>
        <LoadingSpinner testID="category-form-spinner" />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        {categoryId ? 'Edit Category' : 'New Category'}
      </Typography>
      <View style={{ gap: 16 }}>
        <Input
          testID="category-name-input"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          error={errors.name}
        />
        {errors.form && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.form}
          </Typography>
        )}
        <Button testID="category-save-button" loading={isLoading} onPress={handleSave}>
          Save
        </Button>
        <Button testID="category-cancel-button" variant="ghost" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

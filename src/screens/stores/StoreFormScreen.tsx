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
import { StoreRepository } from '@/repositories/StoreRepository';
import { storeSchema } from '@/types/validation';

export function StoreFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { notify } = useNotificationStore();
  const storeId = (route.params as { storeId?: string } | undefined)?.storeId;

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (storeId) {
      setIsLoading(true);
      getDatabase()
        .then((db) => new StoreRepository(db).getById(storeId))
        .then((store) => {
          if (store) {
            setName(store.name);
            setLocation(store.location ?? '');
          }
        })
        .catch(() => {
          notify({ type: 'error', title: 'Error', message: 'Failed to load store' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [storeId, notify]);

  const handleSave = async () => {
    setErrors({});
    const result = storeSchema.safeParse({ name, location: location || null });
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
      const repo = new StoreRepository(db);
      const exists = await repo.existsByNameAndLocation(name, location || null, storeId);
      if (exists) {
        setErrors({ form: 'Store with this name and location already exists' });
        setIsLoading(false);
        return;
      }

      if (storeId) {
        await repo.update(storeId, { name, location: location || null });
      } else {
        await repo.create({ name, location: location || null });
      }
      notify({
        type: 'success',
        title: 'Saved',
        message: storeId ? 'Store updated' : 'Store created',
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

  if (isLoading && storeId) {
    return (
      <Screen>
        <LoadingSpinner testID="store-form-spinner" />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        {storeId ? 'Edit Store' : 'New Store'}
      </Typography>
      <View style={{ gap: 16 }}>
        <Input
          testID="store-name-input"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Store name"
          error={errors.name}
        />
        <Input
          testID="store-location-input"
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Location (optional)"
        />
        {errors.form && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.form}
          </Typography>
        )}
        <Button testID="store-save-button" loading={isLoading} onPress={handleSave}>
          Save
        </Button>
        <Button testID="store-cancel-button" variant="ghost" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

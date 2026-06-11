import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { useTheme } from '@/theme/useTheme';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getDatabase } from '@/database/connection';
import { PurchaseGroupRepository } from '@/repositories/PurchaseGroupRepository';
import { purchaseGroupSchema } from '@/types/validation';

export function PurchaseGroupCreateScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { notify } = useNotificationStore();
  const userId = useAuthStore((state) => state.user?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setErrors({});

    const result = purchaseGroupSchema.safeParse({
      name,
      description: description || null,
      startDate: startDate || null,
      endDate: endDate || null,
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
      const repo = new PurchaseGroupRepository(db);

      await repo.create({
        name,
        description: description || null,
        userId: userId ?? 'anonymous',
        startDate: startDate || null,
        endDate: endDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'created',
        lastSyncedAt: null,
      });

      notify({ type: 'success', title: 'Saved', message: 'Group created' });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setErrors({ form: message });
      notify({ type: 'error', title: 'Error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        New Group
      </Typography>

      <View style={{ gap: 16 }}>
        <Input
          testID="group-name-input"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          error={errors.name}
        />

        <Input
          testID="group-description-input"
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group for?"
        />

        <Input
          testID="group-start-date-input"
          label="Start Date (optional)"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          error={errors.startDate}
        />

        <Input
          testID="group-end-date-input"
          label="End Date (optional)"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          error={errors.endDate}
        />

        {errors.form && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.form}
          </Typography>
        )}

        <Button testID="group-save-button" loading={isLoading} onPress={handleSave}>
          Create Group
        </Button>
        <Button testID="group-cancel-button" variant="ghost" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

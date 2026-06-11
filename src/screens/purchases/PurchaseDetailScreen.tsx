import React, { useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/theme/useTheme';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { getDatabase } from '@/database/connection';
import { PurchaseRepository } from '@/repositories/PurchaseRepository';
import type { Purchase, PurchaseItem } from '@/types/entities';
import type { PurchaseStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<PurchaseStackParamList, 'PurchaseDetail'>;

export function PurchaseDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { notify } = useNotificationStore();
  const { purchaseId } = route.params;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRef = useRef(false);
  const loadPurchase = useCallback(async () => {
    loadRef.current = true;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const repo = new PurchaseRepository(db);
      const data = await repo.getById(purchaseId);
      if (data) {
        setPurchase(data);
        const purchaseItems = await repo.getItemsByPurchaseId(purchaseId);
        setItems(purchaseItems);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load purchase',
      });
    } finally {
      setIsLoading(false);
      loadRef.current = false;
    }
  }, [purchaseId, notify]);

  useFocusEffect(
    useCallback(() => {
      if (!loadRef.current) {
        loadPurchase();
      }
    }, [loadPurchase]),
  );

  const handleDelete = async () => {
    if (!purchase) return;

    try {
      setIsDeleting(true);
      const db = await getDatabase();
      const repo = new PurchaseRepository(db);
      await repo.softDelete(purchase.id);
      notify({ type: 'success', title: 'Deleted', message: 'Purchase deleted' });
      navigation.goBack();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Delete failed',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="purchase-detail-spinner" />
      </Screen>
    );
  }

  if (!purchase) {
    return (
      <Screen>
        <Typography variant="body">Purchase not found</Typography>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        Purchase Details
      </Typography>

      <Card testID="purchase-header">
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Date
            </Typography>
            <Typography variant="body">{purchase.purchaseDate}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Currency
            </Typography>
            <Typography variant="body">{purchase.currency}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Total
            </Typography>
            <Typography variant="h3">
              {purchase.currency} {purchase.totalAmount}
            </Typography>
          </View>
          {purchase.notes && (
            <View>
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                Notes
              </Typography>
              <Typography variant="body">{purchase.notes}</Typography>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Sync Status
            </Typography>
            <Typography variant="bodySmall">{purchase.syncStatus}</Typography>
          </View>
        </View>
      </Card>

      <Typography variant="h2" style={{ marginTop: 24, marginBottom: 12 }}>
        Items ({items.length})
      </Typography>

      {items.map((item, index) => (
        <Card key={item.id} testID={`item-${index}`}>
          <View style={{ gap: 4 }}>
            <Typography variant="body">{item.productName}</Typography>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                {item.quantity} x {purchase.currency} {item.unitPrice}
              </Typography>
              <Typography variant="body">
                {purchase.currency} {item.totalPrice}
              </Typography>
            </View>
          </View>
        </Card>
      ))}

      <View style={{ marginTop: 24, gap: 12 }}>
        <Button testID="delete-button" loading={isDeleting} onPress={handleDelete}>
          Delete Purchase
        </Button>
        <Button testID="back-button" variant="ghost" onPress={() => navigation.goBack()}>
          Back
        </Button>
      </View>
    </Screen>
  );
}

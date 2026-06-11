import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, Pressable, Modal, Alert } from 'react-native';
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
import { PurchaseGroupRepository } from '@/repositories/PurchaseGroupRepository';
import { PurchaseRepository } from '@/repositories/PurchaseRepository';
import type { PurchaseGroup, Purchase } from '@/types/entities';
import type { PurchaseGroupStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<PurchaseGroupStackParamList, 'PurchaseGroupDetail'>;

export function PurchaseGroupDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { notify } = useNotificationStore();
  const { groupId } = route.params;

  const [group, setGroup] = useState<PurchaseGroup | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [unassignedPurchases, setUnassignedPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const loadRef = useRef(false);

  const loadGroup = useCallback(async () => {
    loadRef.current = true;
    try {
      setIsLoading(true);
      const db = await getDatabase();
      const groupRepo = new PurchaseGroupRepository(db);
      const purchaseRepo = new PurchaseRepository(db);

      const groupData = await groupRepo.getById(groupId);
      if (groupData) {
        setGroup(groupData);
        const groupPurchases = await groupRepo.getPurchasesInGroup(groupId);
        setPurchases(groupPurchases);

        // Get unassigned purchases for modal
        const allPurchases = await purchaseRepo.getAll();
        const assignedIds = new Set(groupPurchases.map((p) => p.id));
        const unassigned = allPurchases.filter((p) => !assignedIds.has(p.id));
        setUnassignedPurchases(unassigned);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load group',
      });
    } finally {
      setIsLoading(false);
      loadRef.current = false;
    }
  }, [groupId, notify]);

  useFocusEffect(
    useCallback(() => {
      if (!loadRef.current) {
        loadGroup();
      }
    }, [loadGroup]),
  );

  const handleAssign = async (purchaseId: string) => {
    try {
      const db = await getDatabase();
      const repo = new PurchaseGroupRepository(db);
      await repo.assignPurchase(groupId, purchaseId);
      notify({ type: 'success', title: 'Added', message: 'Purchase added to group' });
      setShowAssignModal(false);
      loadGroup();
    } catch (err) {
      notify({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to assign purchase',
      });
    }
  };

  const handleUnassign = async (purchaseId: string) => {
    Alert.alert('Remove Purchase', 'Remove this purchase from the group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = await getDatabase();
            const repo = new PurchaseGroupRepository(db);
            await repo.unassignPurchase(groupId, purchaseId);
            notify({ type: 'success', title: 'Removed', message: 'Purchase removed from group' });
            loadGroup();
          } catch (err) {
            notify({
              type: 'error',
              title: 'Error',
              message: err instanceof Error ? err.message : 'Failed to unassign purchase',
            });
          }
        },
      },
    ]);
  };

  const handleDelete = async () => {
    if (!group) return;

    Alert.alert('Delete Group', 'Delete this group? Purchases will not be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            const db = await getDatabase();
            const repo = new PurchaseGroupRepository(db);
            await repo.softDelete(group.id);
            notify({ type: 'success', title: 'Deleted', message: 'Group deleted' });
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
        },
      },
    ]);
  };

  const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner testID="group-detail-spinner" />
      </Screen>
    );
  }

  if (!group) {
    return (
      <Screen>
        <Typography variant="body">Group not found</Typography>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="h1" style={{ marginBottom: 16 }}>
        {group.name}
      </Typography>

      <Card testID="group-header" style={{ marginBottom: 16 }}>
        <View style={{ gap: 8 }}>
          {group.description && <Typography variant="body">{group.description}</Typography>}
          {(group.startDate || group.endDate) && (
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              {group.startDate} — {group.endDate}
            </Typography>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Purchases
            </Typography>
            <Typography variant="body">{purchases.length}</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="bodySmall" color={theme.colors.textSecondary}>
              Total
            </Typography>
            <Typography variant="h3">${totalAmount.toFixed(2)}</Typography>
          </View>
        </View>
      </Card>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Typography variant="h2">Purchases ({purchases.length})</Typography>
        <Button testID="assign-button" variant="ghost" onPress={() => setShowAssignModal(true)}>
          + Add
        </Button>
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <Card key={item.id} testID={`group-purchase-${index}`}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Typography variant="body">{item.purchaseDate}</Typography>
                <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                  {item.currency} {item.totalAmount}
                </Typography>
              </View>
              <Pressable testID={`unassign-${index}`} onPress={() => handleUnassign(item.id)}>
                <Typography variant="bodySmall" color={theme.colors.error}>
                  Remove
                </Typography>
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: 'center', marginTop: 24 }}
          >
            No purchases in this group yet
          </Typography>
        }
      />

      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
        <Button testID="delete-group-button" loading={isDeleting} onPress={handleDelete}>
          Delete Group
        </Button>
      </View>

      {/* Assign Purchase Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Typography variant="h2">Add Purchase</Typography>
              <Pressable onPress={() => setShowAssignModal(false)}>
                <Typography variant="body">✕</Typography>
              </Pressable>
            </View>

            <FlatList
              data={unassignedPurchases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: theme.spacing.sm }}
              renderItem={({ item, index }) => (
                <Card
                  testID={`unassigned-${index}`}
                  pressable
                  onPress={() => handleAssign(item.id)}
                >
                  <Typography variant="body">{item.purchaseDate}</Typography>
                  <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                    {item.currency} {item.totalAmount}
                  </Typography>
                </Card>
              )}
              ListEmptyComponent={
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ textAlign: 'center', paddingVertical: 24 }}
                >
                  No available purchases to add
                </Typography>
              }
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

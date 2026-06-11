import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/useTheme';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { getDatabase } from '@/database/connection';
import { PurchaseRepository } from '@/repositories/PurchaseRepository';

interface PurchaseItem {
  id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

const CURRENCIES = ['USD', 'EUR', 'ARS', 'BRL', 'MXN'];

export function PurchaseCreateScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { notify } = useNotificationStore();

  const [storeId, setStoreId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', productName: '', quantity: '1', unitPrice: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), productName: '', quantity: '1', unitPrice: '' },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSave = async () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!purchaseDate) newErrors.purchaseDate = 'Date is required';
    if (items.some((item) => !item.productName.trim())) {
      newErrors.items = 'All items must have a product name';
    }
    if (items.some((item) => !item.quantity || parseFloat(item.quantity) <= 0)) {
      newErrors.items = 'All items must have valid quantity';
    }
    if (items.some((item) => !item.unitPrice || parseFloat(item.unitPrice) < 0)) {
      newErrors.items = 'All items must have valid price';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const db = await getDatabase();
      const repo = new PurchaseRepository(db);

      await repo.create(
        {
          storeId: storeId || null,
          userId: 'current-user', // TODO: Get from auth
          totalAmount: calculateTotal().toFixed(2),
          currency,
          notes: notes || null,
          purchaseDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'created',
          lastSyncedAt: null,
        },
        items.map((item) => ({
          productName: item.productName,
          quantity: parseFloat(item.quantity),
          unitPrice: item.unitPrice,
          productId: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'created' as const,
          lastSyncedAt: null,
        })),
      );

      notify({ type: 'success', title: 'Saved', message: 'Purchase created' });
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
        New Purchase
      </Typography>

      <View style={{ gap: 16 }}>
        <Input
          testID="purchase-date-input"
          label="Date"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          error={errors.purchaseDate}
        />

        <View>
          <Typography variant="bodySmall" style={{ marginBottom: 8 }}>
            Currency
          </Typography>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                testID={`currency-${c}`}
                onPress={() => setCurrency(c)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: currency === c ? theme.colors.primary : theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Typography variant="body" color={currency === c ? '#fff' : undefined}>
                  {c}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>

        <Input
          testID="purchase-store-input"
          label="Store ID (optional)"
          value={storeId}
          onChangeText={setStoreId}
          placeholder="Store reference"
        />

        <Input
          testID="purchase-notes-input"
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes"
        />

        <Typography variant="h2" style={{ marginTop: 8 }}>
          Items
        </Typography>

        {errors.items && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.items}
          </Typography>
        )}

        {items.map((item, index) => (
          <Card key={item.id} testID={`item-${index}`}>
            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="bodySmall">Item {index + 1}</Typography>
                {items.length > 1 && (
                  <Pressable onPress={() => removeItem(item.id)} testID={`remove-item-${index}`}>
                    <Typography variant="bodySmall" color={theme.colors.error}>
                      Remove
                    </Typography>
                  </Pressable>
                )}
              </View>
              <Input
                testID={`item-name-${index}`}
                label="Product Name"
                value={item.productName}
                onChangeText={(v) => updateItem(item.id, 'productName', v)}
                placeholder="What did you buy?"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    testID={`item-qty-${index}`}
                    label="Qty"
                    value={item.quantity}
                    onChangeText={(v) => updateItem(item.id, 'quantity', v)}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Input
                    testID={`item-price-${index}`}
                    label={`Unit Price (${currency})`}
                    value={item.unitPrice}
                    onChangeText={(v) => updateItem(item.id, 'unitPrice', v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
              </View>
              <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                Subtotal: {currency}{' '}
                {((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
              </Typography>
            </View>
          </Card>
        ))}

        <Button testID="add-item-button" variant="ghost" onPress={addItem}>
          + Add Item
        </Button>

        <Card testID="purchase-total">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography variant="h3">Total</Typography>
            <Typography variant="h3">
              {currency} {calculateTotal().toFixed(2)}
            </Typography>
          </View>
        </Card>

        {errors.form && (
          <Typography variant="bodySmall" color={theme.colors.error}>
            {errors.form}
          </Typography>
        )}

        <Button testID="purchase-save-button" loading={isLoading} onPress={handleSave}>
          Save Purchase
        </Button>
        <Button testID="purchase-cancel-button" variant="ghost" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

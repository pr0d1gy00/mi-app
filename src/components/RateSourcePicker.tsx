import React, { useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { Typography } from './Typography';
import { useTheme } from '@/theme/useTheme';
import type { RateSource } from '@/types/entities';
import { setSecureItem } from '@/services/secureStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentSource: RateSource;
  onSelectSource: (source: RateSource) => void;
}

const SOURCES: { value: RateSource; label: string; description: string }[] = [
  { value: 'BCV', label: 'BCV', description: 'Banco Central de Venezuela' },
  { value: 'Paralelo', label: 'Paralelo', description: 'Mercado paralelo' },
  { value: 'Custom', label: 'Personalizado', description: 'Ingresar tasa manualmente' },
];

export function RateSourcePicker({ visible, onClose, currentSource, onSelectSource }: Props) {
  const theme = useTheme();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customRate, setCustomRate] = useState('');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSelect = async (source: RateSource) => {
    if (source === 'Custom') {
      setShowCustomForm(true);
    } else {
      await setSecureItem('rate_source', source);
      onSelectSource(source);
      onClose();
    }
  };

  const handleSaveCustom = async () => {
    if (!customRate || parseFloat(customRate) <= 0) return;
    await setSecureItem('rate_source', 'Custom');
    await setSecureItem('custom_rate', customRate);
    await setSecureItem('custom_rate_date', customDate);
    onSelectSource('Custom');
    setShowCustomForm(false);
    setCustomRate('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Typography variant="h2">Seleccionar Fuente</Typography>
            <Pressable onPress={onClose}>
              <Typography variant="body">✕</Typography>
            </Pressable>
          </View>

          {!showCustomForm ? (
            <View style={{ gap: theme.spacing.sm }}>
              {SOURCES.map((source) => (
                <Card
                  key={source.value}
                  pressable
                  testID={`rate-source-${source.value}`}
                  onPress={() => handleSelect(source.value)}
                  style={{
                    borderWidth: currentSource === source.value ? 2 : 1,
                    borderColor: currentSource === source.value ? theme.colors.primary : theme.colors.border,
                  }}
                >
                  <Typography variant="h3">{source.label}</Typography>
                  <Typography variant="bodySmall" color={theme.colors.textSecondary}>
                    {source.description}
                  </Typography>
                </Card>
              ))}
            </View>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              <Typography variant="body">Tasa personalizada (VES por USD)</Typography>
              <Input
                testID="custom-rate-input"
                label="Tasa"
                value={customRate}
                onChangeText={setCustomRate}
                placeholder="50.00"
                keyboardType="decimal-pad"
              />
              <Input
                testID="custom-rate-date"
                label="Fecha"
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="YYYY-MM-DD"
              />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Button testID="cancel-custom" variant="ghost" onPress={() => setShowCustomForm(false)}>
                  Cancelar
                </Button>
                <Button testID="save-custom" onPress={handleSaveCustom}>
                  Guardar
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
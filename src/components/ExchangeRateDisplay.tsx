import React from 'react';
import { View, Pressable } from 'react-native';
import { Card } from './Card';
import { Typography } from './Typography';
import { useTheme } from '@/theme/useTheme';
import type { ExchangeRate } from '@/types/entities';

interface Props {
  rate: ExchangeRate | null;
  isLoading?: boolean;
  onPress?: () => void;
}

export function ExchangeRateDisplay({ rate, isLoading, onPress }: Props) {
  const theme = useTheme();

  if (!rate) {
    return (
      <Card testID="exchange-rate-display">
        <Typography variant="bodySmall" color={theme.colors.textSecondary}>
          {isLoading ? 'Updating rate...' : 'No rate available'}
        </Typography>
      </Card>
    );
  }

  const Content = (
    <Card testID="exchange-rate-display">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Typography variant="h3">
            1 {rate.baseCurrency} = {rate.rate} {rate.targetCurrency}
          </Typography>
          <Typography variant="bodySmall" color={theme.colors.textSecondary}>
            {rate.source} · {rate.rateDate}
          </Typography>
        </View>
        <View
          style={{
            backgroundColor: theme.colors.primary + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Typography variant="bodySmall" color={theme.colors.primary}>
            {rate.source}
          </Typography>
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{Content}</Pressable>;
  }

  return Content;
}
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { LoadingSpinnerProps } from './types';

export function LoadingSpinner({ size = 'small', overlay, color, testID }: LoadingSpinnerProps) {
  const theme = useTheme();

  const spinnerColor = color ?? theme.colors.primary;

  const containerStyle = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...(overlay
      ? {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }
      : {}),
  };

  return (
    <View testID={testID} style={containerStyle}>
      <ActivityIndicator color={spinnerColor} size={size} />
    </View>
  );
}

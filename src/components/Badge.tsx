import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { BadgeProps } from './types';

export function Badge({ label, variant = 'default', testID }: BadgeProps) {
  const theme = useTheme();

  const colorMap: Record<string, string> = {
    default: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    info: theme.colors.info,
  };

  const backgroundColor = colorMap[variant] ?? theme.colors.primary;

  // Use dark text for all badge backgrounds to ensure WCAG AA contrast
  const textColor = theme.colors.textPrimary;

  return (
    <View
      testID={testID}
      style={{
        backgroundColor,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        alignSelf: 'flex-start' as const,
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.caption.fontSize,
          fontWeight: theme.typography.caption.fontWeight,
          lineHeight: theme.typography.caption.lineHeight,
          color: textColor,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

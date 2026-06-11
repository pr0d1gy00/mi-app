import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { TypographyProps } from './types';

export function Typography({ children, variant, color, align, style }: TypographyProps) {
  const theme = useTheme();

  const typography = theme.typography[variant];

  const textStyle = {
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    color: color ?? theme.colors.textPrimary,
    ...(align ? { textAlign: align } : {}),
    ...style,
  };

  return <Text style={textStyle}>{children}</Text>;
}

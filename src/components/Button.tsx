import React from 'react';
import { Pressable, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ButtonProps } from './types';

export function Button({
  children,
  variant = 'primary',
  loading,
  disabled,
  onPress,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();

  const isDisabled = loading || disabled;

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const textColor = variant === 'primary' ? '#FFFFFF' : theme.colors.primary;

  const buttonStyle = {
    ...variantStyles[variant],
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
    opacity: isDisabled ? 0.5 : 1,
    ...style,
  };

  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      style={buttonStyle}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          testID="button-text"
          style={{
            color: textColor,
            fontWeight: theme.typography.button.fontWeight,
            fontSize: theme.typography.button.fontSize,
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

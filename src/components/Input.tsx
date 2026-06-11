import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { InputProps } from './types';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  keyboardType,
  secureTextEntry,
  testID,
}: InputProps) {
  const theme = useTheme();

  const hasError = !!error;

  const inputStyle = {
    borderWidth: 1,
    borderColor: hasError ? theme.colors.error : theme.colors.border,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  };

  return (
    <View>
      {label && (
        <Text
          testID="input-label"
          style={{
            fontSize: theme.typography.bodySmall.fontSize,
            fontWeight: theme.typography.bodySmall.fontWeight,
            lineHeight: theme.typography.bodySmall.lineHeight,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={inputStyle}
        placeholderTextColor={theme.colors.textSecondary}
      />
      {hasError && (
        <Text
          style={{
            fontSize: theme.typography.caption.fontSize,
            fontWeight: theme.typography.caption.fontWeight,
            lineHeight: theme.typography.caption.lineHeight,
            color: theme.colors.error,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
      {!hasError && helperText && (
        <Text
          style={{
            fontSize: theme.typography.caption.fontSize,
            fontWeight: theme.typography.caption.fontWeight,
            lineHeight: theme.typography.caption.lineHeight,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing.xs,
          }}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

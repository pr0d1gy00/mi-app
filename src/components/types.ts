import type { ViewStyle, TextStyle } from 'react-native';
import type { NotificationItem } from '../types/notification';

export interface ScreenProps {
  children: React.ReactNode;
  noPadding?: boolean;
  backgroundColor?: string;
  scrollable?: boolean;
  testID?: string;
}

export type CardVariant = 'default' | 'elevated' | 'flat';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export type InputKeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'number-pad'
  | 'decimal-pad';

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  keyboardType?: InputKeyboardType;
  secureTextEntry?: boolean;
  testID?: string;
}

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button';
export type TextAlign = 'left' | 'center' | 'right';

export interface TypographyProps {
  children: React.ReactNode;
  variant: TypographyVariant;
  color?: string;
  align?: TextAlign;
  style?: TextStyle;
}

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  testID?: string;
}

export type SpinnerSize = 'small' | 'large';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  overlay?: boolean;
  color?: string;
  testID?: string;
}

export interface ToastProps {
  notification: NotificationItem;
  onDismiss: () => void;
  isVisible: boolean;
}

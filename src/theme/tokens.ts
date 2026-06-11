import type {
  ThemeColors,
  TypographyScale,
  SpacingTokens,
  BorderRadiusTokens,
  ShadowTokens,
} from '../types/theme';

export const lightColors: ThemeColors = {
  primary: '#0057FF',
  secondary: '#23DCE1',
  background: '#F5F7FA',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0284C7',
};

export const darkColors: ThemeColors = {
  primary: '#0057FF',
  secondary: '#23DCE1',
  background: '#0B0D12',
  card: '#161A22',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  border: '#2D3348',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#38BDF8',
};

export const typography: TypographyScale = {
  display: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
};

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius: BorderRadiusTokens = {
  small: 8,
  medium: 12,
  large: 20,
  xlarge: 24,
  full: 9999,
};

export const shadows: ShadowTokens = {
  none: null,
  sm: { y: 1, blur: 2, opacity: 0.05 },
  md: { y: 2, blur: 8, opacity: 0.08 },
  lg: { y: 4, blur: 16, opacity: 0.1 },
  xl: { y: 8, blur: 32, opacity: 0.12 },
};

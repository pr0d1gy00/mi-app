export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyVariant {
  fontSize: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  lineHeight: number;
  fontFamily?: string;
}

export interface TypographyScale {
  display: TypographyVariant;
  h1: TypographyVariant;
  h2: TypographyVariant;
  h3: TypographyVariant;
  body: TypographyVariant;
  bodySmall: TypographyVariant;
  caption: TypographyVariant;
  button: TypographyVariant;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
}

export interface BorderRadiusTokens {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  full: number;
}

export interface ShadowToken {
  y: number;
  blur: number;
  opacity: number;
  color?: string;
}

export interface ShadowTokens {
  none: null;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: TypographyScale;
  spacing: SpacingTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
}

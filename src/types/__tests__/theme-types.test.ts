/// <reference types="jest" />
import type {
  Theme,
  ThemeColors,
  TypographyScale,
  SpacingTokens,
  BorderRadiusTokens,
  ShadowTokens,
  User,
  NotificationType,
  NotificationItem,
} from '../index';

// Helper to assert type compatibility at runtime
const assertTheme = (theme: Theme): void => {
  expect(theme.mode).toBeDefined();
  expect(theme.colors).toBeDefined();
  expect(theme.typography).toBeDefined();
  expect(theme.spacing).toBeDefined();
  expect(theme.borderRadius).toBeDefined();
  expect(theme.shadows).toBeDefined();
};

describe('Theme types', () => {
  it('should construct a valid Theme object', () => {
    const theme: Theme = {
      mode: 'light',
      colors: {
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
      },
      typography: {
        display: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
        h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
        h2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
        h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
        body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
        bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
        caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
        button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        huge: 48,
      },
      borderRadius: {
        small: 8,
        medium: 12,
        large: 20,
        xlarge: 24,
        full: 9999,
      },
      shadows: {
        none: null,
        sm: { y: 1, blur: 2, opacity: 0.05 },
        md: { y: 2, blur: 8, opacity: 0.08 },
        lg: { y: 4, blur: 16, opacity: 0.1 },
        xl: { y: 8, blur: 32, opacity: 0.12 },
      },
    };

    assertTheme(theme);
    expect(theme.mode).toBe('light');
  });

  it('should have all 11 ThemeColors keys', () => {
    const colors: ThemeColors = {
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

    expect(Object.keys(colors)).toHaveLength(11);
    expect(colors.primary).toBe('#0057FF');
    expect(colors.info).toBe('#0284C7');
  });

  it('should have all 8 TypographyScale variants', () => {
    const typography: TypographyScale = {
      display: { fontSize: 36, fontWeight: '700', lineHeight: 44 },
      h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
      h2: { fontSize: 22, fontWeight: '600', lineHeight: 30 },
      h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
      body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
      bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
      caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
      button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
    };

    expect(Object.keys(typography)).toHaveLength(8);
    expect(typography.display.fontWeight).toBe('700');
  });

  it('should have all 8 SpacingTokens values', () => {
    const spacing: SpacingTokens = {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      huge: 48,
    };

    expect(Object.keys(spacing)).toHaveLength(8);
    expect(spacing.xs).toBe(4);
    expect(spacing.huge).toBe(48);
  });

  it('should have all 5 BorderRadiusTokens values', () => {
    const borderRadius: BorderRadiusTokens = {
      small: 8,
      medium: 12,
      large: 20,
      xlarge: 24,
      full: 9999,
    };

    expect(Object.keys(borderRadius)).toHaveLength(5);
    expect(borderRadius.full).toBe(9999);
  });

  it('should have all 5 ShadowTokens levels', () => {
    const shadows: ShadowTokens = {
      none: null,
      sm: { y: 1, blur: 2, opacity: 0.05 },
      md: { y: 2, blur: 8, opacity: 0.08 },
      lg: { y: 4, blur: 16, opacity: 0.1 },
      xl: { y: 8, blur: 32, opacity: 0.12 },
    };

    expect(Object.keys(shadows)).toHaveLength(5);
    expect(shadows.none).toBeNull();
    expect(shadows.lg).toEqual({ y: 4, blur: 16, opacity: 0.1 });
  });
});

describe('User types', () => {
  it('should have all required User fields', () => {
    const user: User = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      preferredCurrency: 'USD',
    };

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
    expect(user.username).toBe('testuser');
    expect(user.preferredCurrency).toBe('USD');
  });
});

describe('Notification types', () => {
  it('should accept valid NotificationType values', () => {
    const types: NotificationType[] = ['success', 'error', 'warning', 'info'];
    expect(types).toHaveLength(4);
  });

  it('should construct a valid NotificationItem', () => {
    const notification: NotificationItem = {
      id: 'notif-1',
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
      duration: 3000,
      createdAt: Date.now(),
    };

    expect(notification.id).toBe('notif-1');
    expect(notification.type).toBe('success');
    expect(notification.title).toBe('Success');
    expect(notification.message).toBe('Operation completed');
    expect(notification.duration).toBe(3000);
    expect(notification.createdAt).toBeDefined();
  });

  it('should allow optional duration on NotificationItem', () => {
    const notification: NotificationItem = {
      id: 'notif-2',
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      createdAt: Date.now(),
    };

    expect(notification.duration).toBeUndefined();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ProductFormScreen } from '../ProductFormScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: () => {},
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/theme/useTheme', () => ({
  useTheme: () => ({
    mode: 'light',
    colors: {
      primary: '#0057FF',
      secondary: '#23DCE1',
      background: '#F5F7FA',
      card: '#FFFFFF',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
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
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 },
    borderRadius: { small: 8, medium: 12, large: 20, xlarge: 24, full: 9999 },
    shadows: {
      none: null,
      sm: { y: 1, blur: 2, opacity: 0.05 },
      md: { y: 2, blur: 8, opacity: 0.08 },
      lg: { y: 4, blur: 16, opacity: 0.1 },
      xl: { y: 8, blur: 32, opacity: 0.12 },
    },
  }),
}));

jest.mock('@/hooks/useNotificationStore', () => ({
  useNotificationStore: () => ({ notify: jest.fn() }),
}));

jest.mock('@/database/connection', () => ({
  getDatabase: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/repositories/ProductRepository', () => ({
  ProductRepository: jest.fn().mockImplementation(() => ({
    getById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'p1' }),
  })),
}));

jest.mock('@/repositories/CategoryRepository', () => ({
  CategoryRepository: jest.fn().mockImplementation(() => ({
    getAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'c1' }),
  })),
}));

describe('ProductFormScreen', () => {
  test('1. renders create form', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProductFormScreen />
      </NavigationContainer>,
    );
    expect(getByTestId('product-name-input')).toBeTruthy();
    expect(getByTestId('product-save-button')).toBeTruthy();
  });
});

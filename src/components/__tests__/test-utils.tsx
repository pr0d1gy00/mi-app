import type React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/hooks/useThemeStore';

beforeEach(() => {
  useThemeStore.getState().initializeMode('light');
});

export function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

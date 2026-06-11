import React from 'react';
import { render, RenderResult } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { NotificationProvider } from '@/app/NotificationProvider';
import { ThemeMode } from '@/types/theme';
import { useThemeStore } from '@/hooks/useThemeStore';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    initialRoute?: string;
    themeMode?: ThemeMode;
    queryClient?: QueryClient;
  },
): RenderResult {
  const client = options?.queryClient ?? createTestQueryClient();
  // Set theme mode before rendering if provided
  if (options?.themeMode) {
    useThemeStore.getState().initializeMode(options.themeMode);
  }

  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SafeAreaProvider
          initialMetrics={{
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
            frame: { width: 320, height: 640, x: 0, y: 0 },
          }}
        >
          <NotificationProvider>
            <NavigationContainer>{ui}</NavigationContainer>
          </NotificationProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

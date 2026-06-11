import type React from 'react';
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { NotificationProvider } from '../NotificationProvider';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/hooks/useThemeStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

beforeEach(() => {
  useThemeStore.getState().initializeMode('light');
  useNotificationStore.getState().clearAll();
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );
}

describe('NotificationProvider', () => {
  test('5. NotificationProvider renders Toast when store has current', () => {
    const { getByText } = render(
      <Wrapper>
        <Text testID="content">App Content</Text>
      </Wrapper>,
    );
    act(() => {
      useNotificationStore.getState().notify({
        type: 'info',
        title: 'Hello',
        message: 'World',
      });
    });
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('World')).toBeTruthy();
  });

  test('6. NotificationProvider renders nothing when queue empty', () => {
    const { queryByText, getByTestId } = render(
      <Wrapper>
        <Text testID="content">App Content</Text>
      </Wrapper>,
    );
    expect(getByTestId('content').props.children).toBe('App Content');
    expect(queryByText('Hello')).toBeNull();
  });
});

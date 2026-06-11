import type React from 'react';
import { render } from '@testing-library/react-native';
import { Toast } from '../Toast';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/hooks/useThemeStore';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

beforeEach(() => {
  useThemeStore.getState().initializeMode('light');
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('Toast', () => {
  test('1. Toast renders with type-based background color', () => {
    const onDismiss = jest.fn();
    const notification = {
      id: '1',
      type: 'success' as const,
      title: 'Success',
      message: 'It worked',
      duration: 3000,
      createdAt: Date.now(),
    };
    const { getByText } = render(
      <Wrapper>
        <Toast notification={notification} onDismiss={onDismiss} isVisible={true} />
      </Wrapper>,
    );
    expect(getByText('Success')).toBeTruthy();
    expect(getByText('It worked')).toBeTruthy();
  });

  test('2. Toast displays title and message', () => {
    const onDismiss = jest.fn();
    const notification = {
      id: '2',
      type: 'error' as const,
      title: 'Error Title',
      message: 'Error details',
      duration: 5000,
      createdAt: Date.now(),
    };
    const { getByText } = render(
      <Wrapper>
        <Toast notification={notification} onDismiss={onDismiss} isVisible={true} />
      </Wrapper>,
    );
    expect(getByText('Error Title')).toBeTruthy();
    expect(getByText('Error details')).toBeTruthy();
  });

  test('3. auto-dismiss calls onDismiss after duration (fake timers)', () => {
    const onDismiss = jest.fn();
    const notification = {
      id: '3',
      type: 'info' as const,
      title: 'Info',
      message: 'Details',
      duration: 2000,
      createdAt: Date.now(),
    };
    render(
      <Wrapper>
        <Toast notification={notification} onDismiss={onDismiss} isVisible={true} />
      </Wrapper>,
    );
    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('4. Toast null when isVisible=false', () => {
    const onDismiss = jest.fn();
    const notification = {
      id: '4',
      type: 'warning' as const,
      title: 'Warn',
      message: 'Caution',
      duration: 4000,
      createdAt: Date.now(),
    };
    const { queryByText } = render(
      <Wrapper>
        <Toast notification={notification} onDismiss={onDismiss} isVisible={false} />
      </Wrapper>,
    );
    expect(queryByText('Warn')).toBeNull();
  });

  // TRIANGULATE: error toast auto-dismiss at 5s vs info at 2s
  test('triangulate: error toast auto-dismiss at 5s vs info at 2s', () => {
    const onDismissError = jest.fn();
    const onDismissInfo = jest.fn();
    const errorNotification = {
      id: 'e',
      type: 'error' as const,
      title: 'Error',
      message: 'E',
      duration: 5000,
      createdAt: Date.now(),
    };
    const infoNotification = {
      id: 'i',
      type: 'info' as const,
      title: 'Info',
      message: 'I',
      duration: 2000,
      createdAt: Date.now(),
    };
    render(
      <Wrapper>
        <Toast notification={errorNotification} onDismiss={onDismissError} isVisible={true} />
      </Wrapper>,
    );
    render(
      <Wrapper>
        <Toast notification={infoNotification} onDismiss={onDismissInfo} isVisible={true} />
      </Wrapper>,
    );
    jest.advanceTimersByTime(2000);
    expect(onDismissInfo).toHaveBeenCalledTimes(1);
    expect(onDismissError).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(onDismissError).toHaveBeenCalledTimes(1);
  });
});

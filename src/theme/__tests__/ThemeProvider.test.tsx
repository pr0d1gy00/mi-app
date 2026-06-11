import React from 'react';
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';
import { useThemeStore } from '@/hooks/useThemeStore';

beforeEach(() => {
  useThemeStore.getState().initializeMode('light');
});

function TestConsumer() {
  const theme = useTheme();
  return (
    <>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="bg">{theme.colors.background}</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  test('1. useTheme() throws outside provider', () => {
    function OutsideConsumer() {
      try {
        useTheme();
        return <Text testID="fail">should not render</Text>;
      } catch (e: unknown) {
        return <Text testID="error">{(e as Error).message}</Text>;
      }
    }
    const { getByTestId } = render(<OutsideConsumer />);
    expect(getByTestId('error').props.children).toContain(
      'useTheme must be used within a ThemeProvider',
    );
  });

  test("2. useTheme() returns theme with light colors when mode='light'", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('bg').props.children).toBe('#F5F7FA');
  });

  test("3. useTheme() returns theme with dark colors when mode='dark'", () => {
    useThemeStore.getState().initializeMode('dark');
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('bg').props.children).toBe('#0B0D12');
  });

  test('4. theme has all 6 top-level keys', () => {
    let capturedTheme: Record<string, unknown> | null = null;
    function CaptureTheme() {
      capturedTheme = useTheme() as unknown as Record<string, unknown>;
      return <Text testID="ok">ok</Text>;
    }
    const { getByTestId } = render(
      <ThemeProvider>
        <CaptureTheme />
      </ThemeProvider>,
    );
    expect(getByTestId('ok').props.children).toBe('ok');
    expect(capturedTheme).toHaveProperty('mode');
    expect(capturedTheme).toHaveProperty('colors');
    expect(capturedTheme).toHaveProperty('typography');
    expect(capturedTheme).toHaveProperty('spacing');
    expect(capturedTheme).toHaveProperty('borderRadius');
    expect(capturedTheme).toHaveProperty('shadows');
  });

  // TRIANGULATE: theme re-renders when mode changes
  test('triangulate: theme re-renders when mode changes', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('bg').props.children).toBe('#F5F7FA');

    act(() => {
      useThemeStore.getState().setMode('dark');
    });
    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('bg').props.children).toBe('#0B0D12');
  });
});

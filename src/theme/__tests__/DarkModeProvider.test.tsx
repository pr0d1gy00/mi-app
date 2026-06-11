import React from 'react';
import { Text, Appearance } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { DarkModeProvider } from '../DarkModeProvider';
import { useThemeStore } from '@/hooks/useThemeStore';

const mockSetItem = jest.fn((_key: string, _value: string) => Promise.resolve());
const mockGetItem = jest.fn((_key: string): Promise<string | null> => Promise.resolve(null));
const mockHideAsync = jest.fn(() => Promise.resolve());
const mockPreventAutoHideAsync = jest.fn(() => Promise.resolve());

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (key: string, value: string) => mockSetItem(key, value),
  getItem: (key: string) => mockGetItem(key),
  removeItem: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: () => mockPreventAutoHideAsync(),
  hideAsync: () => mockHideAsync(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useThemeStore.getState().initializeMode('light');
});

function ModeDisplay() {
  const mode = useThemeStore((state) => state.mode);
  return <Text testID="mode">{mode}</Text>;
}

describe('DarkModeProvider', () => {
  test("5. first launch (no AsyncStorage) → defaults to 'light'", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(null);

    const { getByTestId } = render(
      <DarkModeProvider>
        <ModeDisplay />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
    });
    spy.mockRestore();
  });

  test("6. AsyncStorage has 'dark' → initializes to 'dark'", async () => {
    mockGetItem.mockResolvedValueOnce('dark');
    const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(null);

    const { getByTestId } = render(
      <DarkModeProvider>
        <ModeDisplay />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('dark');
    });
    spy.mockRestore();
  });

  test('7. system appearance detection works (mock Appearance)', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');

    const { getByTestId } = render(
      <DarkModeProvider>
        <ModeDisplay />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('dark');
    });
    spy.mockRestore();
  });
});

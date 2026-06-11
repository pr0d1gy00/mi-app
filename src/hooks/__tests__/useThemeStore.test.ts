import { useThemeStore } from '../useThemeStore';

const mockSetItem = jest.fn((_key: string, _value: string) => Promise.resolve());
const mockGetItem = jest.fn((_key: string) => Promise.resolve(null));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (key: string, value: string) => mockSetItem(key, value),
  getItem: (key: string) => mockGetItem(key),
  removeItem: jest.fn(),
}));

beforeEach(() => {
  mockSetItem.mockClear();
  mockGetItem.mockClear();
  // Reset Zustand store state between tests
  const store = useThemeStore.getState();
  store.initializeMode('light');
});

describe('useThemeStore', () => {
  test("1. default state mode is 'light'", () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
  });

  test("2. setMode('dark') updates mode to 'dark'", () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  test("3. initializeMode('dark') sets mode without persistence side effect", () => {
    useThemeStore.getState().initializeMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  test('4. rapid toggles 5x result in final state matching last toggle', () => {
    const store = useThemeStore.getState();
    for (let i = 0; i < 5; i++) {
      store.setMode(i % 2 === 0 ? 'dark' : 'light');
    }
    // Last toggle: i=4, 4%2===0 → 'dark'
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  // TRIANGULATE: test setMode('light') after 'dark' → verify 'light'
  test("triangulate: setMode('light') after 'dark' reverts to 'light'", () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  // TRIANGULATE: setMode persists to AsyncStorage
  test('triangulate: setMode persists to AsyncStorage with correct key', () => {
    useThemeStore.getState().setMode('dark');
    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith('@mi-purchase:theme-mode', 'dark');
  });

  test('triangulate: setMode persistence catches errors silently', () => {
    mockSetItem.mockRejectedValueOnce(new Error('Storage full'));
    // Should not throw
    expect(() => useThemeStore.getState().setMode('dark')).not.toThrow();
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});

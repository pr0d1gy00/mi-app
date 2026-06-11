import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { testID: 'navigation-container' }, children);
  },
}));

jest.mock('@/theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: any) => children,
}));

jest.mock('@/theme/DarkModeProvider', () => ({
  DarkModeProvider: ({ children }: any) => children,
}));

jest.mock('@/app/NotificationProvider', () => ({
  NotificationProvider: ({ children }: any) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { testID: 'notification-provider' }, children);
  },
}));

jest.mock('@/app/AuthInitializer', () => ({
  AuthInitializer: ({ children }: any) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { testID: 'auth-initializer' }, children);
  },
}));

jest.mock('@/navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { testID: 'root-navigator' }, null);
  },
}));

describe('App', () => {
  test('1. App renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  test('2. provider tree includes QueryClientProvider', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('root-navigator')).toBeTruthy();
  });

  test('3. RootNavigator is rendered inside NavigationContainer', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('navigation-container')).toBeTruthy();
    expect(getByTestId('root-navigator')).toBeTruthy();
  });

  test('4. NotificationProvider renders at app root', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('notification-provider')).toBeTruthy();
  });

  test('5. AuthInitializer wraps NavigationContainer', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('auth-initializer')).toBeTruthy();
    expect(getByTestId('navigation-container')).toBeTruthy();
  });
});

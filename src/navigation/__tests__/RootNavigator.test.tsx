import React from 'react';
import { render } from '@testing-library/react-native';
import { useAuthStore } from '@/hooks/useAuthStore';
import { RootNavigator } from '../RootNavigator';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ component: Component }: any) => <Component />,
  }),
}));

jest.mock('../TabNavigator', () => ({
  TabNavigator: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, { testID: 'tab-navigator' }, 'MainTabs');
  },
}));

jest.mock('../AuthNavigator', () => ({
  AuthNavigator: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, { testID: 'auth-navigator' }, 'Auth');
  },
}));

jest.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('RootNavigator', () => {
  test('renders AuthNavigator when not authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(false);
    const { getByTestId } = render(<RootNavigator />);
    expect(getByTestId('auth-navigator')).toBeTruthy();
  });

  test('renders TabNavigator when authenticated', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(true);
    const { getByTestId } = render(<RootNavigator />);
    expect(getByTestId('tab-navigator')).toBeTruthy();
  });
});

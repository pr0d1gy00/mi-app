import React from 'react';
import { render, act } from '@testing-library/react-native';
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

describe('auth navigation', () => {
  test('auth state transition from Auth to MainTabs', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(false);
    const { getByTestId, queryByTestId } = render(<RootNavigator />);
    expect(getByTestId('auth-navigator')).toBeTruthy();
    expect(queryByTestId('tab-navigator')).toBeNull();

    act(() => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue(true);
    });
    const { getByTestId: getByTestId2, queryByTestId: queryByTestId2 } = render(<RootNavigator />);
    expect(getByTestId2('tab-navigator')).toBeTruthy();
    expect(queryByTestId2('auth-navigator')).toBeNull();
  });
});

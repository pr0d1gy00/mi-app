import type React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/hooks/useThemeStore';
import { TabNavigator } from '../TabNavigator';

jest.mock('@/screens/dashboard/DashboardEntryScreen', () => ({
  DashboardEntryScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Dashboard');
  },
}));

jest.mock('@/screens/categories/CategoryListScreen', () => ({
  CategoryListScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Categories');
  },
}));

jest.mock('@/screens/products/ProductListScreen', () => ({
  ProductListScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Products');
  },
}));

jest.mock('@/screens/stores/StoreListScreen', () => ({
  StoreListScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Stores');
  },
}));

jest.mock('@/screens/categories/CategoryFormScreen', () => ({
  CategoryFormScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Category Form');
  },
}));

jest.mock('@/screens/products/ProductFormScreen', () => ({
  ProductFormScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Product Form');
  },
}));

jest.mock('@/screens/stores/StoreFormScreen', () => ({
  StoreFormScreen: () => {
    const React = jest.requireActual('react');
    const { Text } = jest.requireActual('react-native');
    return React.createElement(Text, null, 'Store Form');
  },
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const mockNavigator = jest.fn();
  const mockScreen = jest.fn();
  return {
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: (props: any) => {
        mockNavigator(props);
        return React.createElement(View, { testID: 'tab-navigator' }, props.children);
      },
      Screen: (props: any) => {
        mockScreen(props);
        const Component = props.component || props.children;
        return React.createElement(
          View,
          { testID: `screen-${props.name}` },
          Component ? React.createElement(Component) : null,
        );
      },
    })),
    __mockNavigator: mockNavigator,
    __mockScreen: mockScreen,
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: (props: any) => React.createElement(View, null, props.children),
      Screen: (props: any) => {
        const Component = props.component || props.children;
        return React.createElement(
          View,
          { testID: `stack-screen-${props.name}` },
          Component ? React.createElement(Component) : null,
        );
      },
    })),
  };
});

const mockModule = jest.requireMock('@react-navigation/bottom-tabs');
const mockNavigator = mockModule.__mockNavigator;
const mockScreen = mockModule.__mockScreen;

const safeAreaMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { width: 320, height: 640, x: 0, y: 0 },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

describe('TabNavigator', () => {
  beforeEach(() => {
    mockNavigator.mockClear();
    mockScreen.mockClear();
    useThemeStore.setState({ mode: 'light' });
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByTestId('tab-navigator')).toBeTruthy();
  });

  it('has 6 tabs: Home, Categories, Products, Stores, Purchases, Settings', () => {
    render(<TabNavigator />, { wrapper: Wrapper });
    const names = mockScreen.mock.calls.map((call: any) => call[0].name);
    expect(names).toEqual(['Home', 'Categories', 'Products', 'Stores', 'Purchases', 'Settings']);
  });

  it('Home tab shows "Dashboard" heading', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('Categories tab shows "Categories" heading', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Categories')).toBeTruthy();
  });

  it('Products tab shows "Products" heading', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Products')).toBeTruthy();
  });

  it('Stores tab shows "Stores" heading', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Stores')).toBeTruthy();
  });

  it('Purchases tab shows "Purchases" heading', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Purchases')).toBeTruthy();
  });

  it('Settings tab shows "Settings" heading and toggle button', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Toggle Dark Mode')).toBeTruthy();
  });

  it('toggle button calls setMode when pressed', () => {
    const { getByText } = render(<TabNavigator />, { wrapper: Wrapper });
    const button = getByText('Toggle Dark Mode');
    fireEvent.press(button);
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('tabBarActiveTintColor is theme primary color', () => {
    render(<TabNavigator />, { wrapper: Wrapper });
    const screenOptions = mockNavigator.mock.calls[0][0].screenOptions;
    expect(screenOptions.tabBarActiveTintColor).toBe('#0057FF');
  });

  it('tabBarInactiveTintColor is theme textSecondary color', () => {
    render(<TabNavigator />, { wrapper: Wrapper });
    const screenOptions = mockNavigator.mock.calls[0][0].screenOptions;
    expect(screenOptions.tabBarInactiveTintColor).toBe('#6B7280');
  });

  it('headerShown is false on all screens', () => {
    render(<TabNavigator />, { wrapper: Wrapper });
    const screenOptions = mockNavigator.mock.calls[0][0].screenOptions;
    expect(screenOptions.headerShown).toBe(false);
  });

  it('tabBarStyle has borderTopWidth 0 and elevation 0', () => {
    render(<TabNavigator />, { wrapper: Wrapper });
    const screenOptions = mockNavigator.mock.calls[0][0].screenOptions;
    expect(screenOptions.tabBarStyle).toEqual({
      borderTopWidth: 0,
      elevation: 0,
    });
  });
});

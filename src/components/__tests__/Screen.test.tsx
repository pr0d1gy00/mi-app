import { Text, ScrollView } from 'react-native';
import { Screen } from '../Screen';
import { renderWithProviders } from './test-utils';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({
    children,
    style,
    testID,
  }: {
    children: React.ReactNode;
    style?: unknown;
    testID?: string;
  }) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { style, testID }, children);
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Screen', () => {
  test('1. renders SafeAreaView wrapping content', () => {
    const { getByText } = renderWithProviders(
      <Screen>
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  test('2. background color matches theme.colors.background', () => {
    const { getByTestId } = renderWithProviders(
      <Screen testID="screen">
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen').props.style.backgroundColor).toBe('#F5F7FA');
  });

  test('3. default padding is applied (theme.spacing.lg)', () => {
    const { getByTestId } = renderWithProviders(
      <Screen testID="screen">
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen').props.style.padding).toBe(16);
  });

  test('4. noPadding prop removes internal padding', () => {
    const { getByTestId } = renderWithProviders(
      <Screen testID="screen" noPadding>
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen').props.style.padding).toBe(0);
  });

  test('5. scrollable prop wraps content in ScrollView', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <Screen scrollable>
        <Text>Hello</Text>
      </Screen>,
    );
    expect(() => UNSAFE_getByType(ScrollView)).not.toThrow();
  });

  test('6. backgroundColor prop overrides theme background', () => {
    const { getByTestId } = renderWithProviders(
      <Screen testID="screen" backgroundColor="#FF0000">
        <Text>Hello</Text>
      </Screen>,
    );
    expect(getByTestId('screen').props.style.backgroundColor).toBe('#FF0000');
  });

  // TRIANGULATE: nested Screen doesn't double-pad
  test("triangulate: nested Screen doesn't double-pad", () => {
    const { getByTestId } = renderWithProviders(
      <Screen testID="outer">
        <Screen testID="inner" noPadding>
          <Text>Hello</Text>
        </Screen>
      </Screen>,
    );
    expect(getByTestId('outer').props.style.padding).toBe(16);
    expect(getByTestId('inner').props.style.padding).toBe(0);
  });
});

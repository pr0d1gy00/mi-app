import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { renderWithProviders } from './test-utils';

describe('Button', () => {
  test('1. primary variant: bg=primary, text=white, radius=12', () => {
    const { getByTestId } = renderWithProviders(
      <Button testID="button" variant="primary" onPress={() => {}}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(getByTestId('button').props.style.backgroundColor).toBe('#0057FF');
    expect(getByTestId('button').props.style.borderRadius).toBe(12);
    expect(getByTestId('button-text').props.style.color).toBe('#FFFFFF');
  });

  test('2. secondary variant: transparent bg, border=primary, text=primary', () => {
    const { getByTestId } = renderWithProviders(
      <Button testID="button" variant="secondary" onPress={() => {}}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(getByTestId('button').props.style.backgroundColor).toBe('transparent');
    expect(getByTestId('button').props.style.borderColor).toBe('#0057FF');
    expect(getByTestId('button-text').props.style.color).toBe('#0057FF');
  });

  test('3. ghost variant: no border, no bg, text=primary', () => {
    const { getByTestId } = renderWithProviders(
      <Button testID="button" variant="ghost" onPress={() => {}}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(getByTestId('button').props.style.backgroundColor).toBe('transparent');
    expect(getByTestId('button').props.style.borderWidth).toBe(0);
    expect(getByTestId('button-text').props.style.color).toBe('#0057FF');
  });

  test('4. loading: ActivityIndicator shown, onPress disabled', () => {
    const onPress = jest.fn();
    const { queryByText, getByTestId } = renderWithProviders(
      <Button testID="button" loading onPress={onPress}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(queryByText('Tap Me')).toBeNull();
    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('5. disabled: opacity 0.5, onPress disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Button testID="button" disabled onPress={onPress}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(getByTestId('button').props.style.opacity).toBe(0.5);
    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('6. onPress fires when enabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Button testID="button" onPress={onPress}>
        <Text>Tap Me</Text>
      </Button>,
    );
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // TRIANGULATE: loading + disabled both ignore onPress
  test('triangulate: loading and disabled both ignore onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Button testID="button" loading disabled onPress={onPress}>
        <Text>Tap Me</Text>
      </Button>,
    );
    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  // TRIANGULATE: custom style prop merges
  test('triangulate: custom style prop merges', () => {
    const { getByTestId } = renderWithProviders(
      <Button testID="button" style={{ marginTop: 10 }} onPress={() => {}}>
        <Text>Tap Me</Text>
      </Button>,
    );
    expect(getByTestId('button').props.style.marginTop).toBe(10);
    expect(getByTestId('button').props.style.backgroundColor).toBe('#0057FF');
  });
});

import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Card } from '../Card';
import { renderWithProviders } from './test-utils';

describe('Card', () => {
  test('1. default Card has borderRadius 20 (theme.borderRadius.large)', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card">
        <Text>Content</Text>
      </Card>,
    );
    expect(getByTestId('card').props.style.borderRadius).toBe(20);
  });

  test('2. default Card has theme.colors.card background', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card">
        <Text>Content</Text>
      </Card>,
    );
    expect(getByTestId('card').props.style.backgroundColor).toBe('#FFFFFF');
  });

  test('3. default Card has theme.shadows.md shadow style', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card">
        <Text>Content</Text>
      </Card>,
    );
    const style = getByTestId('card').props.style;
    expect(style.shadowOffset).toEqual({ width: 0, height: 2 });
    expect(style.shadowRadius).toBe(8);
    expect(style.shadowOpacity).toBe(0.08);
  });

  test('4. elevated variant applies theme.shadows.lg', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card" variant="elevated">
        <Text>Content</Text>
      </Card>,
    );
    const style = getByTestId('card').props.style;
    expect(style.shadowOffset).toEqual({ width: 0, height: 4 });
    expect(style.shadowRadius).toBe(16);
    expect(style.shadowOpacity).toBe(0.1);
  });

  test('5. flat variant applies no shadow and border', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card" variant="flat">
        <Text>Content</Text>
      </Card>,
    );
    const style = getByTestId('card').props.style;
    expect(style.shadowOpacity).toBe(0);
    expect(style.elevation).toBe(0);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe('#E5E7EB');
  });

  test('6. pressable prop wraps in Pressable with scale animation', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card" pressable onPress={() => {}}>
        <Text>Content</Text>
      </Card>,
    );
    expect(getByTestId('card')).toBeTruthy();
  });

  test('7. onPress callback fires on press when pressable is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Card testID="card" pressable onPress={onPress}>
        <Text>Content</Text>
      </Card>,
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // TRIANGULATE: custom style prop merges with computed styles
  test('triangulate: custom style prop merges with computed styles', () => {
    const { getByTestId } = renderWithProviders(
      <Card testID="card" style={{ marginTop: 20 }}>
        <Text>Content</Text>
      </Card>,
    );
    const style = getByTestId('card').props.style;
    expect(style.marginTop).toBe(20);
    expect(style.backgroundColor).toBe('#FFFFFF');
    expect(style.borderRadius).toBe(20);
  });
});

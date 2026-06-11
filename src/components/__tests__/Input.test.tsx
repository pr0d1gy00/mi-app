import { fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';
import { renderWithProviders } from './test-utils';

describe('Input', () => {
  test('1. renders label with bodySmall typography', () => {
    const { getByText } = renderWithProviders(
      <Input label="Email" value="" onChangeText={() => {}} />,
    );
    const label = getByText('Email');
    expect(label.props.style.fontSize).toBe(14);
    expect(label.props.style.fontWeight).toBe('400');
    expect(label.props.style.lineHeight).toBe(20);
  });

  test('2. input has border=border, radius=8, bg=card', () => {
    const { getByTestId } = renderWithProviders(
      <Input testID="input" value="" onChangeText={() => {}} />,
    );
    expect(getByTestId('input').props.style.borderColor).toBe('#E5E7EB');
    expect(getByTestId('input').props.style.borderRadius).toBe(8);
    expect(getByTestId('input').props.style.backgroundColor).toBe('#FFFFFF');
  });

  test('3. error: border becomes error color, error text shown', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <Input testID="input" value="" onChangeText={() => {}} error="Invalid" />,
    );
    expect(getByTestId('input').props.style.borderColor).toBe('#DC2626');
    const errorText = getByText('Invalid');
    expect(errorText.props.style.color).toBe('#DC2626');
    expect(errorText.props.style.fontSize).toBe(12);
  });

  test('4. helperText: shown in textSecondary with caption', () => {
    const { getByText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} helperText="Hint" />,
    );
    const helper = getByText('Hint');
    expect(helper.props.style.color).toBe('#6B7280');
    expect(helper.props.style.fontSize).toBe(12);
  });

  test('5. error supersedes helperText when both present', () => {
    const { getByText, queryByText } = renderWithProviders(
      <Input value="" onChangeText={() => {}} error="Bad" helperText="Hint" />,
    );
    expect(getByText('Bad')).toBeTruthy();
    expect(queryByText('Hint')).toBeNull();
  });

  test('6. onChangeText fires', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = renderWithProviders(
      <Input testID="input" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByTestId('input'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  test('7. secureTextEntry and keyboardType pass through', () => {
    const { getByTestId } = renderWithProviders(
      <Input
        testID="input"
        value=""
        onChangeText={() => {}}
        secureTextEntry
        keyboardType="email-address"
      />,
    );
    expect(getByTestId('input').props.secureTextEntry).toBe(true);
    expect(getByTestId('input').props.keyboardType).toBe('email-address');
  });

  // TRIANGULATE: without label prop, no label rendered
  test('triangulate: without label prop, no label rendered', () => {
    const { queryByTestId } = renderWithProviders(
      <Input testID="input" value="" onChangeText={() => {}} />,
    );
    expect(queryByTestId('input-label')).toBeNull();
  });
});

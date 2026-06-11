import { ActivityIndicator } from 'react-native';
import { LoadingSpinner } from '../LoadingSpinner';
import { renderWithProviders } from './test-utils';

describe('LoadingSpinner', () => {
  test('1. renders ActivityIndicator with primary color', () => {
    const { UNSAFE_getByType } = renderWithProviders(<LoadingSpinner testID="spinner" />);
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.color).toBe('#0057FF');
  });

  test('2. centered in container', () => {
    const { getByTestId } = renderWithProviders(<LoadingSpinner testID="spinner" />);
    const style = getByTestId('spinner').props.style;
    expect(style.alignItems).toBe('center');
    expect(style.justifyContent).toBe('center');
  });

  test('3. size=large passed through', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <LoadingSpinner testID="spinner" size="large" />,
    );
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.size).toBe('large');
  });

  test('4. overlay: semi-transparent backdrop', () => {
    const { getByTestId } = renderWithProviders(<LoadingSpinner testID="spinner" overlay />);
    const style = getByTestId('spinner').props.style;
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
    expect(style.position).toBe('absolute');
  });

  test('5. color prop overrides', () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <LoadingSpinner testID="spinner" color="#FF0000" />,
    );
    const indicator = UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.color).toBe('#FF0000');
  });
});

import { Badge } from '../Badge';
import { renderWithProviders } from './test-utils';
import { getContrastRatio } from '@/utils/contrast';

describe('Badge', () => {
  test('1. pill shape (borderRadius: 9999)', () => {
    const { getByTestId } = renderWithProviders(<Badge testID="badge" label="Badge" />);
    expect(getByTestId('badge').props.style.borderRadius).toBe(9999);
  });

  test('2. variant=success uses success bg', () => {
    const { getByTestId } = renderWithProviders(
      <Badge testID="badge" label="Badge" variant="success" />,
    );
    expect(getByTestId('badge').props.style.backgroundColor).toBe('#059669');
  });

  test('3. variant=error uses error bg', () => {
    const { getByTestId } = renderWithProviders(
      <Badge testID="badge" label="Badge" variant="error" />,
    );
    expect(getByTestId('badge').props.style.backgroundColor).toBe('#DC2626');
  });

  test('4. variant=warning uses warning bg', () => {
    const { getByTestId } = renderWithProviders(
      <Badge testID="badge" label="Badge" variant="warning" />,
    );
    expect(getByTestId('badge').props.style.backgroundColor).toBe('#D97706');
  });

  test('5. variant=info uses info bg', () => {
    const { getByTestId } = renderWithProviders(
      <Badge testID="badge" label="Badge" variant="info" />,
    );
    expect(getByTestId('badge').props.style.backgroundColor).toBe('#0284C7');
  });

  test('6. text uses caption typography', () => {
    const { getByText } = renderWithProviders(<Badge testID="badge" label="Badge" />);
    const text = getByText('Badge');
    expect(text.props.style.fontSize).toBe(12);
    expect(text.props.style.fontWeight).toBe('400');
    expect(text.props.style.lineHeight).toBe(16);
  });

  test('7. text color has WCAG AA contrast against bg', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <Badge testID="badge" label="Badge" variant="success" />,
    );
    const bg = getByTestId('badge').props.style.backgroundColor;
    const textColor = getByText('Badge').props.style.color;
    const ratio = getContrastRatio(textColor, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

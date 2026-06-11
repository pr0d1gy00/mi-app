import { Typography } from '../Typography';
import { renderWithProviders } from './test-utils';

describe('Typography', () => {
  test('1. h1: fontSize=28, fontWeight=700, lineHeight=36', () => {
    const { getByText } = renderWithProviders(<Typography variant="h1">Heading</Typography>);
    const text = getByText('Heading');
    expect(text.props.style.fontSize).toBe(28);
    expect(text.props.style.fontWeight).toBe('700');
    expect(text.props.style.lineHeight).toBe(36);
  });

  test('2. body: fontSize=16, fontWeight=400, lineHeight=24', () => {
    const { getByText } = renderWithProviders(<Typography variant="body">Body</Typography>);
    const text = getByText('Body');
    expect(text.props.style.fontSize).toBe(16);
    expect(text.props.style.fontWeight).toBe('400');
    expect(text.props.style.lineHeight).toBe(24);
  });

  test('3. caption: fontSize=12, fontWeight=400, lineHeight=16', () => {
    const { getByText } = renderWithProviders(<Typography variant="caption">Caption</Typography>);
    const text = getByText('Caption');
    expect(text.props.style.fontSize).toBe(12);
    expect(text.props.style.fontWeight).toBe('400');
    expect(text.props.style.lineHeight).toBe(16);
  });

  test('4. default color = textPrimary', () => {
    const { getByText } = renderWithProviders(<Typography variant="body">Text</Typography>);
    expect(getByText('Text').props.style.color).toBe('#111827');
  });

  test('5. color prop overrides', () => {
    const { getByText } = renderWithProviders(
      <Typography variant="body" color="#FF0000">
        Red Text
      </Typography>,
    );
    expect(getByText('Red Text').props.style.color).toBe('#FF0000');
  });

  test('6. align=center applies textAlign=center', () => {
    const { getByText } = renderWithProviders(
      <Typography variant="body" align="center">
        Centered
      </Typography>,
    );
    expect(getByText('Centered').props.style.textAlign).toBe('center');
  });

  // TRIANGULATE: test all 8 variants with correct tokens
  test('triangulate: display variant', () => {
    const { getByText } = renderWithProviders(<Typography variant="display">Display</Typography>);
    const text = getByText('Display');
    expect(text.props.style.fontSize).toBe(36);
    expect(text.props.style.fontWeight).toBe('700');
    expect(text.props.style.lineHeight).toBe(44);
  });

  test('triangulate: h2 variant', () => {
    const { getByText } = renderWithProviders(<Typography variant="h2">H2</Typography>);
    const text = getByText('H2');
    expect(text.props.style.fontSize).toBe(22);
    expect(text.props.style.fontWeight).toBe('600');
    expect(text.props.style.lineHeight).toBe(30);
  });

  test('triangulate: h3 variant', () => {
    const { getByText } = renderWithProviders(<Typography variant="h3">H3</Typography>);
    const text = getByText('H3');
    expect(text.props.style.fontSize).toBe(18);
    expect(text.props.style.fontWeight).toBe('600');
    expect(text.props.style.lineHeight).toBe(26);
  });

  test('triangulate: bodySmall variant', () => {
    const { getByText } = renderWithProviders(<Typography variant="bodySmall">Small</Typography>);
    const text = getByText('Small');
    expect(text.props.style.fontSize).toBe(14);
    expect(text.props.style.fontWeight).toBe('400');
    expect(text.props.style.lineHeight).toBe(20);
  });

  test('triangulate: button variant', () => {
    const { getByText } = renderWithProviders(<Typography variant="button">Button</Typography>);
    const text = getByText('Button');
    expect(text.props.style.fontSize).toBe(16);
    expect(text.props.style.fontWeight).toBe('600');
    expect(text.props.style.lineHeight).toBe(24);
  });
});

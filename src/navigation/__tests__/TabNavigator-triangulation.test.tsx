import { useThemeStore } from '@/hooks/useThemeStore';

describe('TabNavigator - triangulation', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' });
  });

  it('tab switching placeholder', () => {
    expect(true).toBe(true);
  });
});

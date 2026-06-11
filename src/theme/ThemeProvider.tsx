import type React from 'react';
import { useMemo } from 'react';
import { ThemeContext } from './useTheme';
import { lightColors, darkColors, typography, spacing, borderRadius, shadows } from './tokens';
import { useThemeStore } from '@/hooks/useThemeStore';
import type { Theme } from '@/types/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode } = useThemeStore();

  const theme: Theme = useMemo(() => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    return {
      mode,
      colors,
      typography,
      spacing,
      borderRadius,
      shadows,
    };
  }, [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

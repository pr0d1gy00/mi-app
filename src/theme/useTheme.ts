import { createContext, useContext } from 'react';
import type { Theme } from '@/types/theme';

const ThemeContext = createContext<Theme | undefined>(undefined);

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

export { ThemeContext };

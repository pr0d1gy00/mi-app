import type React from 'react';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '@/hooks/useThemeStore';
import { THEME_MODE_KEY } from '@/utils/constants';
import type { ThemeMode } from '@/types/theme';

interface DarkModeProviderProps {
  children: React.ReactNode;
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const initializeMode = useThemeStore((state) => state.initializeMode);

  useEffect(() => {
    async function resolveTheme() {
      try {
        const persisted = await AsyncStorage.getItem(THEME_MODE_KEY);
        let mode: ThemeMode;
        if (persisted === 'light' || persisted === 'dark') {
          mode = persisted;
        } else {
          const system = Appearance.getColorScheme();
          mode = system === 'dark' ? 'dark' : 'light';
        }
        initializeMode(mode);
      } catch {
        initializeMode('light');
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    resolveTheme();
  }, [initializeMode]);

  return <>{children}</>;
}

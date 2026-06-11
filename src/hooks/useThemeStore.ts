import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/types/theme';
import { THEME_MODE_KEY } from '@/utils/constants';

interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  initializeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  mode: 'light',
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(THEME_MODE_KEY, mode).catch(() => {});
  },
  initializeMode: (mode) => set({ mode }),
}));

import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';
import {
  saveToken,
  getToken,
  deleteToken,
  saveUser,
  getUser,
  deleteUser,
} from '@/services/secureStore';
import { clearAllLocalData } from '@/utils/logoutClear';
import type { UserEntity } from '@/types/auth';

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserEntity | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, user } = response.data as { accessToken: string; user: UserEntity };
    await saveToken(accessToken);
    await saveUser(JSON.stringify(user));
    set({ isAuthenticated: true, token: accessToken, user });
  },

  register: async (email, password, name) => {
    const response = await apiClient.post('/auth/register', { email, password, name });
    const { accessToken, user } = response.data as { accessToken: string; user: UserEntity };
    await saveToken(accessToken);
    await saveUser(JSON.stringify(user));
    set({ isAuthenticated: true, token: accessToken, user });
  },

  logout: async () => {
    await deleteToken();
    await deleteUser();
    await clearAllLocalData();
    set({ isAuthenticated: false, user: null, token: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      const userJson = await getUser();
      if (token && userJson) {
        const user = JSON.parse(userJson) as UserEntity;
        set({ isAuthenticated: true, token, user, isLoading: false });
      } else {
        set({ isAuthenticated: false, token: null, user: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, token: null, user: null, isLoading: false });
    }
  },
}));

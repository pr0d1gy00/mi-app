import { Platform } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '@/hooks/useAuthStore';

const BASE_URL =
  process.env.API_BASE_URL ??
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/purchase/api/v1'
    : 'http://localhost:3000/purchase/api/v1');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const normalizedError = {
      message: error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    };
    return Promise.reject(normalizedError);
  },
);

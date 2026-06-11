import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { AuthInitializer } from '../AuthInitializer';
import { useAuthStore } from '@/hooks/useAuthStore';
import { renderWithProviders } from './test-utils';

const mockCheckAuth = jest.fn();

jest.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: jest.fn((selector?: any) => {
    const state = {
      checkAuth: mockCheckAuth,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };
    if (selector) return selector(state);
    return state;
  }),
}));

describe('AuthInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckAuth.mockResolvedValue(undefined);
  });

  test('shows LoadingSpinner while isLoading=true', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        checkAuth: mockCheckAuth,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      };
      if (selector) return selector(state);
      return state;
    });
    const { getByTestId } = renderWithProviders(
      <AuthInitializer>
        <></>
      </AuthInitializer>,
    );
    expect(getByTestId('auth-initializer-spinner')).toBeTruthy();
  });

  test('renders children after checkAuth resolves and isLoading=false', async () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        checkAuth: mockCheckAuth,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      };
      if (selector) return selector(state);
      return state;
    });
    const { queryByTestId } = renderWithProviders(
      <AuthInitializer>
        <></>
      </AuthInitializer>,
    );
    await waitFor(() => {
      expect(queryByTestId('auth-initializer-spinner')).toBeNull();
    });
  });

  test('calls checkAuth on mount', () => {
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector?: any) => {
      const state = {
        checkAuth: mockCheckAuth,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      };
      if (selector) return selector(state);
      return state;
    });
    renderWithProviders(
      <AuthInitializer>
        <></>
      </AuthInitializer>,
    );
    expect(mockCheckAuth).toHaveBeenCalled();
  });
});

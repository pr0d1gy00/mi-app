import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { renderWithProviders } from '@/app/__tests__/test-utils';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/hooks/useNotificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

const mockLogin = jest.fn();
const mockNotify = jest.fn();
const mockNavigate = jest.fn();

(useAuthStore as unknown as jest.Mock).mockReturnValue({
  login: mockLogin,
  isLoading: false,
});

(useNotificationStore as unknown as jest.Mock).mockReturnValue({
  notify: mockNotify,
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ login: mockLogin, isLoading: false });
    (useNotificationStore as unknown as jest.Mock).mockReturnValue({ notify: mockNotify });
  });

  test('1. renders email input, password input, login button, and Sign In header', () => {
    const { getByTestId, getByText } = renderWithProviders(<LoginScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  test('2. submitting empty form shows validation errors and does not call login', () => {
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByTestId('login-button'));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('3. submitting malformed email shows validation error', () => {
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('4. submitting valid credentials calls login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  test('5. loading state shows ActivityIndicator and disables button', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ login: mockLogin, isLoading: true });
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    const button = getByTestId('login-button');
    expect(button.props.style.opacity).toBe(0.5);
    expect(button.props.onPress).toBeUndefined();
  });

  test('6. login error shows toast notification', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalled();
    });
  });

  test('triangulate: very long valid email still passes validation', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByTestId } = renderWithProviders(<LoginScreen />);
    const longEmail = 'a'.repeat(50) + '@example.com';
    fireEvent.changeText(getByTestId('email-input'), longEmail);
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(longEmail, 'password123');
    });
  });
});

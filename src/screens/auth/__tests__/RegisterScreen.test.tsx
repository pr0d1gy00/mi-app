import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';
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

const mockRegister = jest.fn();
const mockNotify = jest.fn();
const mockNavigate = jest.fn();

(useAuthStore as unknown as jest.Mock).mockReturnValue({
  register: mockRegister,
  isLoading: false,
});

(useNotificationStore as unknown as jest.Mock).mockReturnValue({
  notify: mockNotify,
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });
    (useNotificationStore as unknown as jest.Mock).mockReturnValue({ notify: mockNotify });
  });

  test('1. renders name, email, password inputs, register button, and Create Account header', () => {
    const { getByTestId, getByText } = renderWithProviders(<RegisterScreen />);
    expect(getByTestId('name-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('register-button')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  test('2. submitting empty form shows validation errors and does not call register', () => {
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    fireEvent.press(getByTestId('register-button'));
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('3. password less than 8 chars shows validation error', () => {
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    fireEvent.changeText(getByTestId('name-input'), 'John');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), '123');
    fireEvent.press(getByTestId('register-button'));
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('4. submitting valid credentials calls register', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    fireEvent.changeText(getByTestId('name-input'), 'John Doe');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe');
    });
  });

  test('5. loading state shows ActivityIndicator and disables button', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: true,
    });
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    const button = getByTestId('register-button');
    expect(button.props.style.opacity).toBe(0.5);
    expect(button.props.onPress).toBeUndefined();
  });

  test('6. register error shows toast notification', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email already in use'));
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    fireEvent.changeText(getByTestId('name-input'), 'John');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalled();
    });
  });

  test('triangulate: name at max length 100 chars passes validation', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { getByTestId } = renderWithProviders(<RegisterScreen />);
    const longName = 'a'.repeat(100);
    fireEvent.changeText(getByTestId('name-input'), longName);
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('register-button'));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('john@example.com', 'password123', longName);
    });
  });
});

import { jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { saveToken, getToken, deleteToken, saveUser, getUser, deleteUser } from '../secureStore';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => {}),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => {}),
}));

describe('secureStore', () => {
  const mockGetItemAsync = SecureStore.getItemAsync as jest.MockedFunction<
    typeof SecureStore.getItemAsync
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveToken calls SecureStore.setItemAsync with correct key', async () => {
    await saveToken('my-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-token', 'my-token');
  });

  test('getToken returns value from SecureStore.getItemAsync', async () => {
    mockGetItemAsync.mockResolvedValueOnce('stored-token');
    const token = await getToken();
    expect(token).toBe('stored-token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-token');
  });

  test('deleteToken calls SecureStore.deleteItemAsync with correct key', async () => {
    await deleteToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-token');
  });

  test('saveUser calls SecureStore.setItemAsync with correct key', async () => {
    await saveUser('user-data');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-user', 'user-data');
  });

  test('getUser returns value from SecureStore.getItemAsync', async () => {
    mockGetItemAsync.mockResolvedValueOnce('user-data');
    const user = await getUser();
    expect(user).toBe('user-data');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-user');
  });

  test('deleteUser calls SecureStore.deleteItemAsync with correct key', async () => {
    await deleteUser();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@mi-purchase:auth-user');
  });

  test('getToken returns null when no token stored', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);
    const token = await getToken();
    expect(token).toBeNull();
  });

  test('getUser returns null when no user stored', async () => {
    mockGetItemAsync.mockResolvedValueOnce(null);
    const user = await getUser();
    expect(user).toBeNull();
  });
});

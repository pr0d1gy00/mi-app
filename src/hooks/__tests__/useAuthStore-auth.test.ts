import { jest } from '@jest/globals';
import { useAuthStore } from '../useAuthStore';
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

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock('@/services/secureStore', () => ({
  saveToken: jest.fn(async () => {}),
  getToken: jest.fn(async () => null),
  deleteToken: jest.fn(async () => {}),
  saveUser: jest.fn(async () => {}),
  getUser: jest.fn(async () => null),
  deleteUser: jest.fn(async () => {}),
}));

jest.mock('@/utils/logoutClear', () => ({
  clearAllLocalData: jest.fn(async () => {}),
}));

const mockApiClientPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockSaveToken = saveToken as jest.MockedFunction<typeof saveToken>;
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockDeleteToken = deleteToken as jest.MockedFunction<typeof deleteToken>;
const mockSaveUser = saveUser as jest.MockedFunction<typeof saveUser>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;
const mockClearAllLocalData = clearAllLocalData as jest.MockedFunction<typeof clearAllLocalData>;

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  test('login success sets isAuthenticated and saves token', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'User', preferredCurrency: 'USD' };
    mockApiClientPost.mockResolvedValueOnce({
      data: { accessToken: 'tok', user },
    });

    await useAuthStore.getState().login('a@b.com', 'password');

    expect(mockApiClientPost).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'password',
    });
    expect(mockSaveToken).toHaveBeenCalledWith('tok');
    expect(mockSaveUser).toHaveBeenCalledWith(JSON.stringify(user));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().token).toBe('tok');
  });

  test('login failure rejects and does not change state', async () => {
    mockApiClientPost.mockRejectedValueOnce(new Error('401'));

    await expect(useAuthStore.getState().login('a@b.com', 'bad')).rejects.toThrow('401');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('register success sets isAuthenticated and saves token', async () => {
    const user = { id: '2', email: 'b@c.com', name: 'New', preferredCurrency: 'USD' };
    mockApiClientPost.mockResolvedValueOnce({
      data: { accessToken: 'tok2', user },
    });

    await useAuthStore.getState().register('b@c.com', 'password123', 'New');

    expect(mockApiClientPost).toHaveBeenCalledWith('/auth/register', {
      email: 'b@c.com',
      password: 'password123',
      name: 'New',
    });
    expect(mockSaveToken).toHaveBeenCalledWith('tok2');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('register failure rejects and does not change state', async () => {
    mockApiClientPost.mockRejectedValueOnce(new Error('409'));

    await expect(useAuthStore.getState().register('b@c.com', 'pw', 'New')).rejects.toThrow('409');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test('logout clears everything', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'a@b.com', name: 'U', preferredCurrency: 'USD' },
      token: 'tok',
    });
    await useAuthStore.getState().logout();
    expect(mockDeleteToken).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalled();
    expect(mockClearAllLocalData).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('checkAuth with token sets authenticated', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'U', preferredCurrency: 'USD' };
    mockGetToken.mockResolvedValueOnce('tok');
    mockGetUser.mockResolvedValueOnce(JSON.stringify(user));

    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('tok');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('checkAuth without token sets unauthenticated', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    mockGetUser.mockResolvedValueOnce(null);

    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('checkAuth on error sets unauthenticated', async () => {
    mockGetToken.mockRejectedValueOnce(new Error('fail'));

    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('isLoading starts true during checkAuth then becomes false', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    mockGetUser.mockResolvedValueOnce(null);

    const promise = useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().isLoading).toBe(true);
    await promise;
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

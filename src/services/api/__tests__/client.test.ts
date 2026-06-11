import MockAdapter from 'axios-mock-adapter';
import { useAuthStore } from '@/hooks/useAuthStore';
import { apiClient } from '../client';

jest.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ token: null, logout: jest.fn() })),
  },
}));

describe('apiClient', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter(apiClient as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  test('1. baseURL is correct (platform-dependent or env)', () => {
    expect(apiClient.defaults.baseURL).toBeTruthy();
    expect(typeof apiClient.defaults.baseURL).toBe('string');
    expect(apiClient.defaults.baseURL).toContain('/purchase/api/v1');
  });

  test('2. timeout is 15000', () => {
    expect(apiClient.defaults.timeout).toBe(15000);
  });

  test('3. request interceptor adds Bearer header when token exists', async () => {
    const getStateMock = useAuthStore.getState as jest.Mock;
    getStateMock.mockReturnValue({
      token: 'test-token-123',
      logout: jest.fn(),
    });

    mockAdapter.onGet('/test').reply(200, { ok: true });
    const response = await apiClient.get('/test');
    expect(response).toEqual({ ok: true });

    const request = mockAdapter.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer test-token-123');
  });

  test('4. request interceptor does not add header when no token', async () => {
    const getStateMock = useAuthStore.getState as jest.Mock;
    getStateMock.mockReturnValue({ token: null, logout: jest.fn() });

    mockAdapter.onGet('/test').reply(200, { ok: true });
    await apiClient.get('/test');

    const request = mockAdapter.history.get[0];
    expect(request.headers?.Authorization).toBeUndefined();
  });

  test('5. response interceptor unwraps data on success', async () => {
    mockAdapter.onGet('/test').reply(200, { foo: 'bar' });
    const response = await apiClient.get('/test');
    expect(response).toEqual({ foo: 'bar' });
  });

  test('6. 401 response calls logout', async () => {
    const logoutMock = jest.fn();
    const getStateMock = useAuthStore.getState as jest.Mock;
    getStateMock.mockReturnValue({ token: 'abc', logout: logoutMock });

    mockAdapter.onGet('/test').reply(401, { error: 'Unauthorized' });
    await expect(apiClient.get('/test')).rejects.toBeTruthy();
    expect(logoutMock).toHaveBeenCalled();
  });

  test('7a. triangulation — different token values', async () => {
    const getStateMock = useAuthStore.getState as jest.Mock;
    getStateMock.mockReturnValue({ token: 'another-token', logout: jest.fn() });

    mockAdapter.onGet('/test').reply(200, { ok: true });
    await apiClient.get('/test');

    const request = mockAdapter.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer another-token');
  });

  test('7. non-401 error propagates with status/data/message', async () => {
    const getStateMock = useAuthStore.getState as jest.Mock;
    getStateMock.mockReturnValue({ token: 'abc', logout: jest.fn() });

    mockAdapter.onGet('/test').reply(500, { error: 'server fail' });
    await expect(apiClient.get('/test')).rejects.toMatchObject({
      status: 500,
      data: { error: 'server fail' },
    });
  });
});

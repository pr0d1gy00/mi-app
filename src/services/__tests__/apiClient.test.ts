import { getToken, deleteToken, deleteUser } from '../secureStore';

jest.mock('../secureStore', () => ({
  getToken: jest.fn(),
  deleteToken: jest.fn(),
  deleteUser: jest.fn(),
}));

describe('apiClient', () => {
  let apiClient: any;
  let axiosCreateMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const axios = jest.requireActual('axios');
      axiosCreateMock = jest.fn(() => ({
        defaults: {},
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn(),
        post: jest.fn(),
      }));
      jest.doMock('axios', () => {
        return {
          ...axios,
          create: axiosCreateMock,
        };
      });
      const mod = require('../apiClient');
      apiClient = mod.apiClient;
    });
  });

  afterEach(() => {
    jest.dontMock('axios');
  });

  test('axios.create is called with baseURL containing fallback URL', () => {
    expect(axiosCreateMock).toHaveBeenCalledTimes(1);
    const config = axiosCreateMock.mock.calls[0][0];
    expect(config.baseURL).toBe('http://10.0.2.2:3000/purchase/api/v1');
    expect(config.timeout).toBe(10000);
  });

  test('request interceptor is registered', () => {
    expect(apiClient.interceptors.request.use).toHaveBeenCalled();
  });

  test('response interceptor is registered', () => {
    expect(apiClient.interceptors.response.use).toHaveBeenCalled();
  });

  test('request interceptor adds Bearer header when token exists', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('test-token-123');

    const requestUse = apiClient.interceptors.request.use as jest.Mock;
    const interceptor = requestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = await interceptor(config);
    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  test('request interceptor does not add header when no token', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);

    const requestUse = apiClient.interceptors.request.use as jest.Mock;
    const interceptor = requestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = await interceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  test('response interceptor on 401 calls deleteToken and deleteUser', async () => {
    const responseUse = apiClient.interceptors.response.use as jest.Mock;
    const errorInterceptor = responseUse.mock.calls[0][1];
    const error = { response: { status: 401 } };
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    expect(deleteToken).toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalled();
  });

  test('response interceptor passes through non-401 errors', async () => {
    const responseUse = apiClient.interceptors.response.use as jest.Mock;
    const errorInterceptor = responseUse.mock.calls[0][1];
    const error = { response: { status: 500 } };
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    expect(deleteToken).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  test('request interceptor adds different Bearer token values', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('another-token');

    const requestUse = apiClient.interceptors.request.use as jest.Mock;
    const interceptor = requestUse.mock.calls[0][0];
    const config = { headers: {} };
    const result = await interceptor(config);
    expect(result.headers.Authorization).toBe('Bearer another-token');
  });

  test('response interceptor handles 401 with no response object', async () => {
    const responseUse = apiClient.interceptors.response.use as jest.Mock;
    const errorInterceptor = responseUse.mock.calls[0][1];
    const error = { message: 'Network error' };
    await expect(errorInterceptor(error)).rejects.toEqual(error);
    expect(deleteToken).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });
});

import { queryClient } from '../providers';

describe('queryClient', () => {
  test('1. queryClient has staleTime: 60000', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60000);
  });

  test('2. queryClient has retry: false', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
  });

  test('3. queryClient has refetchOnWindowFocus: false', () => {
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});

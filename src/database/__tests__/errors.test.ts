import { DatabaseError } from '../errors';

describe('DatabaseError', () => {
  test('1. constructor sets message, code, and optional cause', () => {
    const cause = new Error('root cause');
    const error = new DatabaseError('Something failed', 'DB_001', cause);
    expect(error.message).toBe('Something failed');
    expect(error.code).toBe('DB_001');
    expect(error.cause).toBe(cause);
  });

  test('2. DatabaseError extends Error (instanceof check)', () => {
    const error = new DatabaseError('fail', 'DB_002');
    expect(error instanceof DatabaseError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  test("3. name property is 'DatabaseError'", () => {
    const error = new DatabaseError('fail', 'DB_003');
    expect(error.name).toBe('DatabaseError');
  });
});

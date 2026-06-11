jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../migrations/runner', () => ({
  runMigrations: jest.fn(),
}));

describe('getDatabase', () => {
  function getOpenDatabaseAsync() {
    const { openDatabaseAsync } = jest.requireMock('expo-sqlite');
    return openDatabaseAsync as jest.Mock;
  }

  function getDatabase() {
    const { getDatabase: fn } = jest.requireActual('../connection');
    return fn as () => Promise<any>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test("1. first getDatabase() opens 'mi-purchase.db'", async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValue(mockDb);

    const db = await getDatabase()();
    expect(db).toBe(mockDb);
    expect(openDatabaseAsync).toHaveBeenCalledWith('mi-purchase.db');
  });

  test('2. second call returns same instance (singleton)', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValue(mockDb);

    const fn = getDatabase();
    const db1 = await fn();
    const db2 = await fn();
    expect(db1).toBe(db2);
    expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  test('3. concurrent calls share same promise/instance', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb = { execAsync: jest.fn() };
    let resolveDb: (db: any) => void;
    const promise = new Promise<any>((resolve) => {
      resolveDb = resolve;
    });
    openDatabaseAsync.mockReturnValue(promise);

    const fn = getDatabase();
    const p1 = fn();
    const p2 = fn();
    resolveDb!(mockDb);

    const db1 = await p1;
    const db2 = await p2;
    expect(db1).toBe(mockDb);
    expect(db1).toBe(db2);
    expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  test('4. database is lazy (not opened until first call)', () => {
    getDatabase();
    expect(getOpenDatabaseAsync()).not.toHaveBeenCalled();
  });

  test('5. failure throws DatabaseError with code', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const sqliteError = new Error('SQLite error') as any;
    sqliteError.code = 'SQLITE_ERROR';
    openDatabaseAsync.mockRejectedValue(sqliteError);

    const fn = getDatabase();
    const error: any = await fn().catch((e: any) => e);
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('SQLite error');
    expect(error.code).toBe('SQLITE_ERROR');
    expect(error.cause).toBeInstanceOf(Error);
  });

  test('5a. triangulation — failed init resets promise so retry works', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const sqliteError = new Error('First attempt fails') as any;
    sqliteError.code = 'SQLITE_ERROR';
    openDatabaseAsync.mockRejectedValueOnce(sqliteError);

    const fn = getDatabase();
    const error1 = await fn().catch((e: any) => e);
    expect(error1.message).toBe('First attempt fails');

    const mockDb = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValue(mockDb);

    const db = await fn();
    expect(db).toBe(mockDb);
    expect(openDatabaseAsync).toHaveBeenCalledTimes(2);
  });

  test('6. getDatabase() runs PRAGMA foreign_keys and runMigrations', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValue(mockDb);

    const { runMigrations } = jest.requireMock('../migrations/runner');

    const fn = getDatabase();
    await fn();

    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
    expect(runMigrations).toHaveBeenCalledWith(mockDb);
  });

  test('7. resetDatabase() clears singleton so next call opens fresh', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb1 = { execAsync: jest.fn() };
    const mockDb2 = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValueOnce(mockDb1).mockResolvedValueOnce(mockDb2);

    const { getDatabase: getDb, resetDatabase } = jest.requireActual('../connection');

    const db1 = await getDb();
    expect(db1).toBe(mockDb1);

    resetDatabase();

    const db2 = await getDb();
    expect(db2).toBe(mockDb2);
    expect(openDatabaseAsync).toHaveBeenCalledTimes(2);
  });

  test('8. triangulation — migration failure throws DatabaseError', async () => {
    const openDatabaseAsync = getOpenDatabaseAsync();
    const mockDb = { execAsync: jest.fn() };
    openDatabaseAsync.mockResolvedValue(mockDb);

    const { runMigrations } = jest.requireMock('../migrations/runner');
    const migrationError = new Error('Migration failed');
    runMigrations.mockRejectedValueOnce(migrationError);

    const { getDatabase: getDb } = jest.requireActual('../connection');
    const error: any = await getDb().catch((e: any) => e);
    expect(error.name).toBe('DatabaseError');
    expect(error.message).toBe('Migration failed');
    expect(error.code).toBe('UNKNOWN');
  });

  test('9. triangulation — resetDatabase() is safe when already null', async () => {
    const { resetDatabase } = jest.requireActual('../connection');
    expect(() => resetDatabase()).not.toThrow();
  });
});

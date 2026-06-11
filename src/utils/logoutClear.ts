import { getDatabase, resetDatabase } from '@/database/connection';

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM products');
    await db.runAsync('DELETE FROM stores');
    await db.runAsync('DELETE FROM users');
  } catch {
    // Silently catch errors
  } finally {
    resetDatabase();
  }
}

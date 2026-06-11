# SDD Technical Design — 001-b: Auth + Categories + Products + Stores

## 1. Overview

This design adds authenticated user flows, local SQLite schema with migration tracking, repository-pattern CRUD for Categories/Products/Stores, full form/list screens with Zod validation, navigation guards, and a dashboard home tab. Chain 001-a (scaffold, theme, 8 components, navigation, Zustand stores, SQLite connection manager) is the baseline.

---

## 2. New Dependencies

| Package              | Version                        | Purpose                                           |
| -------------------- | ------------------------------ | ------------------------------------------------- |
| `expo-secure-store`  | latest compatible with Expo 56 | JWT persistence across app launches               |
| `zod`                | latest                         | Schema validation for auth forms and entity DTOs  |
| `uuid`               | latest + `@types/uuid`         | UUID v4 generation for entity IDs                 |
| `@expo/vector-icons` | bundled with Expo 56           | Tab bar and screen icons (Ionicons/MaterialIcons) |

Install command:

```bash
npx expo install expo-secure-store zod uuid @expo/vector-icons
```

No `@hookform/resolvers` — forms use manual Zod `.safeParse()` calls inside screen submit handlers. This avoids adding `react-hook-form` as a dependency and keeps form logic simple and consistent with the existing component architecture.

---

## 3. File Structure — All New & Modified Files

### 3.1 New Files

```
src/
├── types/
│   ├── auth.ts                          # Auth types (LoginInput, RegisterInput, AuthResponse)
│   ├── entities.ts                      # BaseEntity, SyncStatus, Category, Product, Store interfaces
│   └── validation.ts                    # Zod schemas (login, register, category, product, store)
│
├── database/
│   ├── migrations/
│   │   ├── index.ts                     # Migration registry barrel
│   │   ├── 001-create-tables.ts         # SQL for users, categories, products, stores, _migrations
│   │   └── runner.ts                    # Migration runner (reads _migrations, executes pending)
│   └── connection.ts                    # MODIFIED — runs migrations before returning db
│
├── repositories/
│   ├── types.ts                         # BaseRepository<T> interface
│   ├── CategoryRepository.ts            # Category CRUD + search + getBySyncStatus
│   ├── ProductRepository.ts             # Product CRUD + search + getByCategoryId + getBySyncStatus
│   └── StoreRepository.ts               # Store CRUD + search + getBySyncStatus
│
├── services/
│   ├── apiClient.ts                     # Axios instance + interceptors + auth endpoints
│   └── secureStore.ts                   # SecureStore wrappers for token/user persistence
│
├── hooks/
│   └── useAuthStore.ts                  # MODIFIED — adds login(), register(), logout(), checkAuth()
│
├── navigation/
│   ├── AuthNavigator.tsx                # AuthStack (Login, Register screens)
│   ├── RootNavigator.tsx                # MODIFIED — conditional AuthStack vs MainTabs
│   ├── types.ts                         # MODIFIED — adds AuthStackParamList + form screen params
│   └── TabNavigator.tsx                 # MODIFIED — Home becomes DashboardEntry, adds entity stacks
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx              # Email + password form, Zod validation, apiClient login
│   │   └── RegisterScreen.tsx           # Email + password + name form, Zod validation, auto-login
│   ├── categories/
│   │   ├── CategoryListScreen.tsx       # FlatList, search, FAB, empty state, pull-to-refresh
│   │   └── CategoryFormScreen.tsx       # Create/edit form, unique name validation, Zod
│   ├── products/
│   │   ├── ProductListScreen.tsx        # FlatList, search, category filter dropdown, FAB
│   │   └── ProductFormScreen.tsx        # Create/edit form, category picker, "Sin categoría" auto-create
│   ├── stores/
│   │   ├── StoreListScreen.tsx          # FlatList, search, FAB, empty state
│   │   └── StoreFormScreen.tsx          # Create/edit form, unique name+location validation
│   └── dashboard/
│       └── DashboardEntryScreen.tsx     # 3 count cards: Categories, Products, Stores
│
├── utils/
│   └── uuid.ts                          # UUID v4 wrapper (platform-agnostic for expo-secure-store env)
│
└── app/
    ├── __tests__/
    │   └── App-auth-guard.test.tsx      # RootNavigator conditional rendering tests
    ├── AuthInitializer.tsx              # Effect: checkAuth() on mount, sets auth store before render
    └── App.tsx                          # MODIFIED — wraps with AuthInitializer
```

### 3.2 Modified Files

| File                               | Change                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `src/hooks/useAuthStore.ts`        | Replace placeholder setters with `login()`, `register()`, `logout()`, `checkAuth()` |
| `src/navigation/RootNavigator.tsx` | Conditionally render AuthStack or MainTabs based on `isAuthenticated`               |
| `src/navigation/types.ts`          | Add `AuthStackParamList`, form screen params to entity stacks                       |
| `src/navigation/TabNavigator.tsx`  | Replace HomeScreen with DashboardEntryScreen; add stack navigators per tab          |
| `src/database/connection.ts`       | Run migrations inside `getDatabase()` before returning                              |
| `src/app/App.tsx`                  | Wrap with `AuthInitializer`                                                         |

---

## 4. Database Architecture

### 4.1 Migration System

**`_migrations` tracking table:**

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

**Migration interface (`src/database/migrations/index.ts`):**

```ts
export interface Migration {
  name: string;
  up: string; // raw SQL
}
```

**Migration registry (`src/database/migrations/index.ts`):**

```ts
import { Migration } from './types';
import { migration001CreateTables } from './001-create-tables';

export const migrations: Migration[] = [migration001CreateTables];
```

**`001-create-tables.ts`:**

```ts
export const migration001CreateTables: Migration = {
  name: '001-create-tables',
  up: `
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password TEXT NOT NULL,
      preferred_currency TEXT NOT NULL DEFAULT 'USD',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      metadata TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT,
      UNIQUE(name, user_id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      category_id TEXT NOT NULL,
      metadata TEXT,
      barcode TEXT UNIQUE,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced',
      last_synced_at TEXT,
      UNIQUE(name, location)
    );
  `,
};
```

**Migration runner (`src/database/migrations/runner.ts`):**

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import { migrations } from './index';
import { DatabaseError } from '../errors';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure _migrations table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get already-applied migrations
  const applied = await db.getAllAsync<{ name: string }>('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    try {
      await db.execAsync(migration.up);
      await db.runAsync(
        'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
        migration.name,
        new Date().toISOString(),
      );
    } catch (error) {
      throw new DatabaseError(
        `Migration "${migration.name}" failed: ${error instanceof Error ? error.message : String(error)}`,
        'MIGRATION_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }
}
```

### 4.2 Connection Update

**`src/database/connection.ts` — modified `getDatabase()`:**

```ts
import { openDatabaseAsync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DatabaseError } from './errors';
import { runMigrations } from './migrations/runner';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('mi-purchase.db')
      .then(async (db) => {
        // Enable foreign keys
        await db.execAsync('PRAGMA foreign_keys = ON');
        // Run migrations
        await runMigrations(db);
        return db;
      })
      .catch((error) => {
        dbPromise = null;
        const code = error?.code ?? 'UNKNOWN';
        throw new DatabaseError(error?.message ?? 'Failed to open database', code, error);
      });
  }
  return dbPromise;
}

/** Reset singleton (used for testing / logout) */
export function resetDatabase(): void {
  dbPromise = null;
}
```

Key behaviors:

- `PRAGMA foreign_keys = ON` runs on every connection open (REQ-001-b-013).
- `runMigrations()` runs before the promise resolves, so callers always get a migrated DB.
- `resetDatabase()` allows tests and logout to clear the singleton.

---

## 5. Repository Architecture

### 5.1 Types (`src/repositories/types.ts`)

```ts
export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

export interface BaseRepository<T extends BaseEntity> {
  create(dto: Omit<T, keyof BaseEntity>): Promise<T>;
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: string, dto: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  softDelete(id: string): Promise<void>;
}
```

### 5.2 Entity Interfaces (`src/types/entities.ts`)

```ts
import type { BaseEntity, SyncStatus } from '@/repositories/types';

export interface Category extends BaseEntity {
  name: string;
  metadata: Record<string, unknown> | null;
  userId: string | null;
}

export interface Product extends BaseEntity {
  name: string;
  brand: string | null;
  categoryId: string;
  metadata: Record<string, unknown> | null;
  barcode: string | null;
  userId: string;
}

export interface Store extends BaseEntity {
  name: string;
  location: string | null;
  userId: string | null;
}
```

### 5.3 CategoryRepository (`src/repositories/CategoryRepository.ts`)

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface CategoryInsert {
  name: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
}

export class CategoryRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: CategoryInsert): Promise<Category> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO categories (id, name, metadata, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.userId ?? null,
      now,
      now,
      now,
    );
    return this.getById(id) as Promise<Category>;
  }

  async getById(id: string): Promise<Category | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Category[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Category[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM categories WHERE deleted_at IS NULL AND LOWER(name) LIKE ? ORDER BY name ASC',
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<CategoryInsert>): Promise<Category> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(dto.metadata ? JSON.stringify(dto.metadata) : null);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE categories SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Category[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM categories WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) as cnt FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? AND deleted_at IS NULL'
      : 'SELECT COUNT(*) as cnt FROM categories WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL';
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      sql,
      name,
      ...(excludeId ? [excludeId] : []),
    );
    return (row?.cnt ?? 0) > 0;
  }

  private mapRow(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status,
      lastSyncedAt: row.last_synced_at,
    };
  }
}
```

### 5.4 ProductRepository (`src/repositories/ProductRepository.ts`)

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Product } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface ProductInsert {
  name: string;
  brand?: string | null;
  categoryId: string;
  metadata?: Record<string, unknown> | null;
  barcode?: string | null;
  userId: string;
}

export class ProductRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: ProductInsert): Promise<Product> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO products (id, name, brand, category_id, metadata, barcode, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.brand ?? null,
      dto.categoryId,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
      dto.barcode ?? null,
      dto.userId,
      now,
      now,
      now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Product | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Product[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Product[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM products WHERE deleted_at IS NULL AND LOWER(name) LIKE ? ORDER BY name ASC',
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async getByCategoryId(categoryId: string): Promise<Product[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM products WHERE category_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      categoryId,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<ProductInsert>): Promise<Product> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.brand !== undefined) {
      updates.push('brand = ?');
      values.push(dto.brand);
    }
    if (dto.categoryId !== undefined) {
      updates.push('category_id = ?');
      values.push(dto.categoryId);
    }
    if (dto.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(dto.metadata ? JSON.stringify(dto.metadata) : null);
    }
    if (dto.barcode !== undefined) {
      updates.push('barcode = ?');
      values.push(dto.barcode);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE products SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Product[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM products WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  private mapRow(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      categoryId: row.category_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      barcode: row.barcode,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status,
      lastSyncedAt: row.last_synced_at,
    };
  }
}
```

### 5.5 StoreRepository (`src/repositories/StoreRepository.ts`)

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Store } from '@/types/entities';
import { generateUuid } from '@/utils/uuid';

export interface StoreInsert {
  name: string;
  location?: string | null;
  userId?: string | null;
}

export class StoreRepository {
  constructor(private db: SQLiteDatabase) {}

  async create(dto: StoreInsert): Promise<Store> {
    const now = new Date().toISOString();
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO stores (id, name, location, user_id, created_at, updated_at, sync_status, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`,
      id,
      dto.name,
      dto.location ?? null,
      dto.userId ?? null,
      now,
      now,
      now,
    );
    return (await this.getById(id))!;
  }

  async getById(id: string): Promise<Store | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM stores WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? this.mapRow(row) : null;
  }

  async getAll(): Promise<Store[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM stores WHERE deleted_at IS NULL ORDER BY name ASC',
    );
    return rows.map(this.mapRow);
  }

  async search(query: string): Promise<Store[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM stores WHERE deleted_at IS NULL
       AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ?)
       ORDER BY name ASC`,
      `%${query.toLowerCase()}%`,
      `%${query.toLowerCase()}%`,
    );
    return rows.map(this.mapRow);
  }

  async update(id: string, dto: Partial<StoreInsert>): Promise<Store> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.location !== undefined) {
      updates.push('location = ?');
      values.push(dto.location);
    }
    if (dto.userId !== undefined) {
      updates.push('user_id = ?');
      values.push(dto.userId);
    }

    updates.push('updated_at = ?', 'sync_status = ?', 'last_synced_at = ?');
    values.push(now, 'updated', now);
    values.push(id);

    await this.db.runAsync(`UPDATE stores SET ${updates.join(', ')} WHERE id = ?`, ...values);
    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE stores SET deleted_at = ?, sync_status = ?, last_synced_at = ? WHERE id = ?',
      now,
      'deleted',
      now,
      id,
    );
  }

  async getBySyncStatus(status: 'created' | 'updated' | 'deleted'): Promise<Store[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM stores WHERE sync_status = ? AND deleted_at IS NULL ORDER BY name ASC',
      status,
    );
    return rows.map(this.mapRow);
  }

  async existsByNameAndLocation(
    name: string,
    location: string | null,
    excludeId?: string,
  ): Promise<boolean> {
    const sql = excludeId
      ? "SELECT COUNT(*) as cnt FROM stores WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(location), '') = COALESCE(LOWER(?), '') AND id != ? AND deleted_at IS NULL"
      : "SELECT COUNT(*) as cnt FROM stores WHERE LOWER(name) = LOWER(?) AND COALESCE(LOWER(location), '') = COALESCE(LOWER(?), '') AND deleted_at IS NULL";
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      sql,
      name,
      location ?? '',
      ...(excludeId ? [excludeId] : []),
    );
    return (row?.cnt ?? 0) > 0;
  }

  private mapRow(row: any): Store {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncStatus: row.sync_status,
      lastSyncedAt: row.last_synced_at,
    };
  }
}
```

---

## 6. Auth Architecture

### 6.1 Auth Types (`src/types/auth.ts`)

```ts
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    preferredCurrency: string;
  };
}

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  preferredCurrency: string;
}
```

### 6.2 SecureStore Service (`src/services/secureStore.ts`)

```ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = '@mi-purchase:auth-token';
const USER_KEY = '@mi-purchase:auth-user';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: string): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, user);
}

export async function getUser(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_KEY);
}

export async function deleteUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}
```

### 6.3 API Client (`src/services/apiClient.ts`)

```ts
import axios from 'axios';
import { getToken } from './secureStore';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-clear auth on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear and let the app re-authenticate
      const { deleteToken, deleteUser } = await import('./secureStore');
      await deleteToken();
      await deleteUser();
      // Note: the useAuthStore logout will be called by the screen/auth layer
    }
    return Promise.reject(error);
  },
);

export { apiClient };
```

### 6.4 Updated useAuthStore (`src/hooks/useAuthStore.ts`)

```ts
import { create } from 'zustand';
import type { UserEntity } from '@/types/auth';
import * as secureStore from '@/services/secureStore';
import { apiClient } from '@/services/apiClient';
import { clearAllLocalData } from '@/utils/logoutClear';

interface AuthStoreState {
  isAuthenticated: boolean;
  user: UserEntity | null;
  token: string | null;
  isLoading: boolean; // new: for checkAuth() pending state
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, user: userData } = response.data;
    await secureStore.saveToken(accessToken);
    await secureStore.saveUser(JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData, token: accessToken });
  },

  register: async (email: string, password: string, name: string) => {
    const response = await apiClient.post('/auth/register', { email, password, name });
    const { accessToken, user: userData } = response.data;
    await secureStore.saveToken(accessToken);
    await secureStore.saveUser(JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData, token: accessToken });
  },

  logout: async () => {
    await secureStore.deleteToken();
    await secureStore.deleteUser();
    await clearAllLocalData();
    set({ isAuthenticated: false, user: null, token: null, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const [tokenStr, userStr] = await Promise.all([
        secureStore.getToken(),
        secureStore.getUser(),
      ]);
      if (tokenStr && userStr) {
        const user = JSON.parse(userStr) as UserEntity;
        set({ isAuthenticated: true, user, token: tokenStr, isLoading: false });
      } else {
        set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
    }
  },
}));
```

### 6.5 Logout Clear Utility (`src/utils/logoutClear.ts`)

```ts
import { getDatabase, resetDatabase } from '@/database/connection';

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM categories');
    await db.execAsync('DELETE FROM products');
    await db.execAsync('DELETE FROM stores');
    await db.execAsync('DELETE FROM users');
  } catch {
    // If DB is not available, ignore — data is already gone or never existed
  }
  resetDatabase();
}
```

### 6.6 Auth Initializer (`src/app/AuthInitializer.tsx`)

```tsx
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setInitialized(true));
  }, [checkAuth]);

  if (!initialized || isLoading) {
    return <LoadingSpinner size="large" />;
  }

  return <>{children}</>;
}
```

---

## 7. Navigation Architecture

### 7.1 Navigation Types (`src/navigation/types.ts`)

```ts
// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Entity stacks (each tab gets its own stack for form screens)
export type CategoryStackParamList = {
  CategoryList: undefined;
  CategoryForm: { categoryId?: string };
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductForm: { productId?: string };
};

export type StoreStackParamList = {
  StoreList: undefined;
  StoreForm: { storeId?: string };
};

export type PurchasesStackParamList = {
  PurchasesList: undefined;
};

export type DashboardStackParamList = {
  DashboardMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

// Bottom tabs now reference stack navigators
export type BottomTabParamList = {
  Home: undefined; // DashboardEntryScreen
  Categories: undefined; // CategoryStack
  Products: undefined; // ProductStack
  Stores: undefined; // StoreStack
  Purchases: undefined; // PurchasesStack (placeholder)
  Settings: undefined; // SettingsStack
};

export type RootStackParamList = {
  Auth: undefined; // AuthStack
  MainTabs: undefined; // Bottom tab navigator
};
```

### 7.2 Auth Navigator (`src/navigation/AuthNavigator.tsx`)

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
```

### 7.3 Updated RootNavigator (`src/navigation/RootNavigator.tsx`)

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAuthStore } from '@/hooks/useAuthStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default',
        animationTypeForReplace: 'push',
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

### 7.4 Updated TabNavigator (`src/navigation/TabNavigator.tsx`)

Each tab that needs form screens becomes a native stack navigator. The bottom tab navigator references these stacks.

```tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type {
  BottomTabParamList,
  CategoryStackParamList,
  ProductStackParamList,
  StoreStackParamList,
} from './types';
import { useTheme } from '@/theme/useTheme';
import { DashboardEntryScreen } from '@/screens/dashboard/DashboardEntryScreen';
import { CategoryListScreen } from '@/screens/categories/CategoryListScreen';
import { CategoryFormScreen } from '@/screens/categories/CategoryFormScreen';
import { ProductListScreen } from '@/screens/products/ProductListScreen';
import { ProductFormScreen } from '@/screens/products/ProductFormScreen';
import { StoreListScreen } from '@/screens/stores/StoreListScreen';
import { StoreFormScreen } from '@/screens/stores/StoreFormScreen';
// Settings screen stays as-is from 001-a
import { SettingsScreen } from './TabNavigator'; // existing

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Category Stack
const CategoryStack = createNativeStackNavigator<CategoryStackParamList>();
function CategoryStackNav() {
  return (
    <CategoryStack.Navigator screenOptions={{ headerShown: false }}>
      <CategoryStack.Screen name="CategoryList" component={CategoryListScreen} />
      <CategoryStack.Screen name="CategoryForm" component={CategoryFormScreen} />
    </CategoryStack.Navigator>
  );
}

// Product Stack
const ProductStack = createNativeStackNavigator<ProductStackParamList>();
function ProductStackNav() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductListScreen} />
      <ProductStack.Screen name="ProductForm" component={ProductFormScreen} />
    </ProductStack.Navigator>
  );
}

// Store Stack
const StoreStack = createNativeStackNavigator<StoreStackParamList>();
function StoreStackNav() {
  return (
    <StoreStack.Navigator screenOptions={{ headerShown: false }}>
      <StoreStack.Screen name="StoreList" component={StoreListScreen} />
      <StoreStack.Screen name="StoreForm" component={StoreFormScreen} />
    </StoreStack.Navigator>
  );
}

export function TabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardEntryScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoryStackNav}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductStackNav}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stores"
        component={StoreStackNav}
        options={{
          tabBarLabel: 'Stores',
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={PurchasesScreen} // placeholder from 001-a
        options={{
          tabBarLabel: 'Purchases',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## 8. Screen Architecture

### 8.1 Common Screen Pattern

All screens follow this structure:

```tsx
export function XyzScreen({ navigation }: XyzScreenProps) {
  const theme = useTheme();
  const notify = useNotificationStore((s) => s.notify);

  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<X[]>([]);

  // Load data
  useEffect(() => { loadData(); }, []);

  // Error state
  if (error) return <Screen><ErrorUI onRetry={loadData} /></Screen>;

  // Loading state
  if (loading) return <Screen><LoadingSpinner /></Screen>;

  // Empty state
  if (data.length === 0) return <Screen><EmptyState onCreate={...} /></Screen>;

  // Content
  return (
    <Screen>
      <SearchBar value={search} onChangeText={setSearch} />
      <FlatList data={filtered} renderItem={...} />
      <FAB onPress={() => navigation.navigate('XyzForm')} />
    </Screen>
  );
}
```

### 8.2 LoginScreen (`src/screens/auth/LoginScreen.tsx`)

- Form: email (Input, keyboardType="email-address") + password (Input, secureTextEntry)
- Zod validation via `loginSchema.safeParse()` on submit
- Calls `useAuthStore().login(email, password)`
- Loading state disables form, shows `ActivityIndicator` in Button
- Error state shows error text below form + toast via `notify()`
- On success: navigation handled by RootNavigator re-render (isAuthenticated → true)
- Link to Register screen via `navigation.navigate('Register')`

### 8.3 RegisterScreen (`src/screens/auth/RegisterScreen.tsx`)

- Form: name + email + password
- Zod validation via `registerSchema.safeParse()`
- Calls `useAuthStore().register(email, password, name)`
- Same loading/error handling as LoginScreen
- On success: auto-login (auth store sets authenticated) → RootNavigator re-renders to MainTabs
- Link to Login screen

### 8.4 CategoryListScreen (`src/screens/categories/CategoryListScreen.tsx`)

- Uses `CategoryRepository` (instantiated from `getDatabase()` in useEffect)
- FlatList with Card items showing category name
- Search bar filters client-side via `name.toLowerCase().includes(query)`
- FAB → `navigation.navigate('CategoryForm')`
- Pull-to-refresh: `RefreshControl` reloads from repo
- Swipe or long-press delete → `repo.softDelete(id)` + success toast
- Empty state: "No categories yet. Create your first one!" + FAB prompt

### 8.5 CategoryFormScreen (`src/screens/categories/CategoryFormScreen.tsx`)

- Receives optional `categoryId` from navigation params
- If `categoryId` present → edit mode (load existing, populate fields)
- Form: name (Input)
- Zod validation via `categorySchema.safeParse()`
- On save: check unique name via `repo.existsByName()` → reject if duplicate
- Calls `repo.create()` or `repo.update()`
- Success toast → `navigation.goBack()`
- Cancel button → `navigation.goBack()`

### 8.6 ProductListScreen (`src/screens/products/ProductListScreen.tsx`)

- Uses `ProductRepository`
- FlatList with Card items showing product name, brand, category name
- Category filter: dropdown/picker populated from `CategoryRepository.getAll()`
- Search bar filters by name
- FAB → `navigation.navigate('ProductForm')`
- Swipe/long-press delete → `repo.softDelete(id)`
- Empty state: "No products yet."

### 8.7 ProductFormScreen (`src/screens/products/ProductFormScreen.tsx`)

- Receives optional `productId` from params
- Form: name, brand (optional), category picker (dropdown from `CategoryRepository.getAll()`)
- Category picker shows "Sin categoría" option if no categories exist (auto-created on save)
- Zod validation via `productSchema.safeParse()`
- On save:
  - If no category selected and no categories exist → auto-create "Sin categoría" via `CategoryRepository.create()`
  - Then `ProductRepository.create()` with that category ID
- Success toast → `navigation.goBack()`

### 8.8 StoreListScreen (`src/screens/stores/StoreListScreen.tsx`)

- Uses `StoreRepository`
- FlatList with Card items showing store name and location
- Search bar filters by name OR location (client-side)
- FAB → `navigation.navigate('StoreForm')`
- Swipe/long-press delete → `repo.softDelete(id)`
- Empty state: "No stores yet."

### 8.9 StoreFormScreen (`src/screens/stores/StoreFormScreen.tsx`)

- Receives optional `storeId` from params
- Form: name, location (optional)
- Zod validation via `storeSchema.safeParse()`
- On save: check unique name+location via `repo.existsByNameAndLocation()` → reject if duplicate
- Calls `repo.create()` or `repo.update()`
- Success toast → `navigation.goBack()`

### 8.10 DashboardEntryScreen (`src/screens/dashboard/DashboardEntryScreen.tsx`)

- Replaces the placeholder HomeScreen from 001-a
- Fetches counts from `CategoryRepository.getAll()`, `ProductRepository.getAll()`, `StoreRepository.getAll()` (or more efficient COUNT queries)
- Displays 3 Cards:
  - "Categories" with count
  - "Products" with count
  - "Stores" with count
- Counts refresh on `useFocusEffect` from `@react-navigation/native`

---

## 9. Zod Validation Schemas (`src/types/validation.ts`)

```ts
import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

// Entity schemas
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  brand: z.string().max(100, 'Brand must be 100 characters or less').nullable().optional(),
  categoryId: z.string().uuid('Invalid category').nullable().optional(),
  barcode: z.string().max(50, 'Barcode must be 50 characters or less').nullable().optional(),
});

export const storeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  location: z.string().max(200, 'Location must be 200 characters or less').nullable().optional(),
});
```

Reusable across forms and future sync DTO validation.

---

## 10. Data Flow

### 10.1 Auth Flow

```
┌─────────────┐      ┌──────────────┐      ┌───────────┐      ┌──────────────┐
│ LoginScreen │─────▶│ useAuthStore │─────▶│ apiClient │─────▶│ NestJS Backend│
│  (form)     │  .   │  .login()    │  .   │  POST     │  .   │ /auth/login  │
└─────────────┘      └──────┬───────┘      └─────┬─────┘      └──────────────┘
                            │                    │
                            ▼                    │
                     ┌──────────────┐            │
                     │ SecureStore  │◀───────────┘
                     │ saveToken()  │  JWT in response
                     │ saveUser()   │
                     └──────────────┘
                            │
                            ▼
                   ┌────────────────────┐
                   │ RootNavigator      │
                   │ isAuthenticated=true│
                   │ → renders MainTabs │
                   └────────────────────┘
```

### 10.2 Entity CRUD Flow

```
┌──────────────┐      ┌──────────────────┐      ┌───────────┐
│ CategoryForm │─────▶│ CategoryRepo     │─────▶│ SQLite    │
│ Screen       │  .   │  .create()       │  .   │ INSERT    │
│ (submit)     │      │  .update()       │      │ UPDATE    │
└──────────────┘      │  .softDelete()   │      └───────────┘
                      └──────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ notify()     │  Toast: "Category created"
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ goBack()     │  Return to list
                     └──────────────┘
```

### 10.3 Dashboard Count Flow

```
┌─────────────────────┐      ┌──────────────────────┐
│ DashboardEntryScreen│─────▶│ Repo.getAll() / COUNT │
│  on focus           │  .   │ Category/Product/Store│
└─────────────────────┘      └──────────┬───────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ 3 Card widgets │
                                  │ with counts    │
                                  └──────────────┘
```

### 10.4 Logout Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Settings     │─────▶│ useAuthStore │─────▶│ SecureStore  │
│ (logout btn) │  .   │  .logout()   │  .   │ deleteToken() │
└──────────────┘      └──────┬───────┘      │ deleteUser()  │
                             │              └──────────────┘
                             ▼
                      ┌──────────────────┐
                      │ clearAllLocalData│
                      │ DELETE FROM cats │
                      │ DELETE FROM prods│
                      │ DELETE FROM stores│
                      │ resetDatabase()  │
                      └────────┬─────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ RootNavigator │
                        │ isAuthenticated=false
                        │ → renders Auth │
                        └──────────────┘
```

---

## 11. Test Architecture

### 11.1 Repository Tests

**Location:** `src/repositories/__tests__/*.test.ts`

Each repository test file:

1. Opens an in-memory test database (`openDatabaseAsync(':memory:')`)
2. Runs migrations via `runMigrations(db)`
3. Instantiates the repository with the test `db`
4. Tests each method: create, getById, getAll, search, update, softDelete, getBySyncStatus
5. Tests entity-specific constraints (unique name, FK violations)

```ts
// Example: CategoryRepository.test.ts
describe('CategoryRepository', () => {
  let db: SQLiteDatabase;
  let repo: CategoryRepository;

  beforeEach(async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync('PRAGMA foreign_keys = ON');
    await runMigrations(db);
    repo = new CategoryRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('1. create inserts and returns full Category', async () => { ... });
  test('2. getById returns null for non-existent ID', async () => { ... });
  test('3. getAll returns all non-deleted categories', async () => { ... });
  test('4. search filters case-insensitively', async () => { ... });
  test('5. update changes sync_status to updated', async () => { ... });
  test('6. softDelete sets deleted_at and sync_status', async () => { ... });
  test('7. getBySyncStatus returns only matching status', async () => { ... });
  test('8. existsByName detects duplicates', async () => { ... });
});
```

**Test count forecast:** ~60 tests across 3 repository files (~20 each).

### 11.2 Auth Tests

**Location:** `src/hooks/__tests__/useAuthStore-auth.test.ts`, `src/services/__tests__/apiClient.test.ts`, `src/services/__tests__/secureStore.test.ts`

- **useAuthStore-auth.test.ts**: Mock `apiClient`, `SecureStore`, `clearAllLocalData`. Test `login()` success/failure, `register()` success/failure, `logout()` clears everything, `checkAuth()` reads SecureStore.
- **apiClient.test.ts**: Mock adapter tests for request interceptor (attaches token), response interceptor (401 clears token).
- **secureStore.test.ts**: Mock `expo-secure-store` methods, verify key names.

**Test count forecast:** ~25 tests.

### 11.3 Screen Tests

**Location:** `src/screens/**/__tests__/*.test.tsx`

Each screen test file uses `renderWithProviders` from `src/app/__tests__/test-utils.tsx`, extended to include `NotificationProvider`:

```ts
// Extended renderWithProviders for screens
export function renderWithAllProviders(
  ui: React.ReactElement,
  options?: { ... },
): RenderResult {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SafeAreaProvider ...>
          <NavigationContainer>
            <NotificationProvider>
              {ui}
            </NotificationProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
```

Screen tests:

- **LoginScreen**: renders form, validates Zod errors on empty submit, mocks successful login, verifies no API call on validation failure
- **RegisterScreen**: similar to Login + conflict error test
- **CategoryListScreen**: renders empty state, renders list, search filters, pull-to-refresh reloads
- **CategoryFormScreen**: create mode validates + saves, edit mode loads + updates, duplicate name error
- **ProductListScreen**: similar to CategoryList + category filter dropdown
- **ProductFormScreen**: create with category, auto-create "Sin categoría", edit mode
- **StoreListScreen**: search by name/location, empty state
- **StoreFormScreen**: create, edit, duplicate name+location error
- **DashboardEntryScreen**: displays 3 count cards, zero counts

**Test count forecast:** ~50 tests across 9 screen files.

### 11.4 Navigation Tests

**Location:** `src/navigation/__tests__/auth-nav.test.tsx`

- RootNavigator renders AuthStack when `isAuthenticated = false`
- RootNavigator renders MainTabs when `isAuthenticated = true`
- Auth state transition: login → MainTabs renders

**Test count forecast:** ~5 tests.

### 11.5 Total Test Forecast

| Area                    | Estimated Tests |
| ----------------------- | --------------- |
| Repositories            | ~60             |
| Auth (store + services) | ~25             |
| Screens                 | ~50             |
| Navigation              | ~5              |
| **Total new**           | **~140**        |
| Existing (001-a)        | 160             |
| **Grand total**         | **~300**        |

---

## 12. Migration & Rollout Plan

### Phase 1: Infrastructure (database + repos + auth services)

1. Add dependencies (`expo-secure-store`, `zod`, `uuid`)
2. Create `src/types/entities.ts`, `src/types/auth.ts`, `src/types/validation.ts`
3. Create `src/utils/uuid.ts`
4. Create `src/database/migrations/` (runner + 001-create-tables)
5. Modify `src/database/connection.ts` to run migrations
6. Create `src/repositories/types.ts`, `CategoryRepository`, `ProductRepository`, `StoreRepository`
7. Create `src/services/secureStore.ts`, `src/services/apiClient.ts`
8. Create `src/utils/logoutClear.ts`

### Phase 2: Auth Store & Navigation

9. Modify `src/hooks/useAuthStore.ts` with real methods
10. Create `src/app/AuthInitializer.tsx`
11. Modify `src/app/App.tsx` to wrap with AuthInitializer
12. Create `src/navigation/AuthNavigator.tsx`
13. Modify `src/navigation/types.ts`
14. Modify `src/navigation/RootNavigator.tsx`
15. Modify `src/navigation/TabNavigator.tsx`

### Phase 3: Screens

16. Create `src/screens/auth/LoginScreen.tsx`, `RegisterScreen.tsx`
17. Create `src/screens/dashboard/DashboardEntryScreen.tsx`
18. Create `src/screens/categories/CategoryListScreen.tsx`, `CategoryFormScreen.tsx`
19. Create `src/screens/products/ProductListScreen.tsx`, `ProductFormScreen.tsx`
20. Create `src/screens/stores/StoreListScreen.tsx`, `StoreFormScreen.tsx`

### Phase 4: Tests

21. Repository tests (3 files)
22. Auth tests (3 files)
23. Screen tests (9 files)
24. Navigation tests (1 file)

---

## 13. Risk Assessment

| Risk                                               | Impact | Mitigation                                                              |
| -------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `expo-secure-store` unavailable on web             | Medium | Web builds will use AsyncStorage fallback; guard with Platform check    |
| SQLite foreign key enforcement varies by platform  | Low    | PRAGMA runs on every open; tested in repo tests                         |
| Migration runner on large schemas                  | Low    | Only 1 migration in 001-b; runner is O(n) in migrations count           |
| NestJS backend auth endpoints path mismatch        | Medium | Configurable via `EXPO_PUBLIC_API_URL` env var; interceptor handles 401 |
| Test DB singleton contamination between test files | Medium | Each test opens `:memory:` DB; `resetDatabase()` called in afterEach    |
| Form screen navigation params not typed            | Low    | Strict param lists in `types.ts`; TypeScript compile-time enforcement   |

---

## 14. Requirements Traceability

| Requirement   | Design Element                                                          |
| ------------- | ----------------------------------------------------------------------- |
| REQ-001-b-001 | LoginScreen.tsx + loginSchema + useAuthStore.login()                    |
| REQ-001-b-002 | RegisterScreen.tsx + registerSchema + useAuthStore.register()           |
| REQ-001-b-003 | secureStore.ts (TOKEN_KEY, saveToken/getToken/deleteToken)              |
| REQ-001-b-004 | AuthInitializer.tsx + useAuthStore.checkAuth()                          |
| REQ-001-b-005 | useAuthStore.logout() + clearAllLocalData()                             |
| REQ-001-b-006 | useAuthStore.ts (login/register/logout methods)                         |
| REQ-001-b-007 | RootNavigator.tsx conditional rendering                                 |
| REQ-001-b-008 | migrations/runner.ts + \_migrations table                               |
| REQ-001-b-009 | 001-create-tables.ts → users table                                      |
| REQ-001-b-010 | 001-create-tables.ts → categories table + UNIQUE(name,user_id)          |
| REQ-001-b-011 | 001-create-tables.ts → products table + FK + indexes + UNIQUE(barcode)  |
| REQ-001-b-012 | 001-create-tables.ts → stores table + UNIQUE(name,location)             |
| REQ-001-b-013 | connection.ts PRAGMA foreign_keys = ON                                  |
| REQ-001-b-014 | All repos use `new Date().toISOString()` for date fields                |
| REQ-001-b-015 | repositories/types.ts BaseRepository<T>                                 |
| REQ-001-b-016 | CategoryRepository.ts                                                   |
| REQ-001-b-017 | ProductRepository.ts                                                    |
| REQ-001-b-018 | StoreRepository.ts                                                      |
| REQ-001-b-019 | Auto sync_status in repo create/update/softDelete                       |
| REQ-001-b-020 | types/entities.ts Category/Product/Store                                |
| REQ-001-b-021 | types/entities.ts BaseEntity + SyncStatus                               |
| REQ-001-b-022 | CategoryListScreen.tsx                                                  |
| REQ-001-b-023 | CategoryFormScreen.tsx + existsByName                                   |
| REQ-001-b-024 | CategoryRepository.softDelete                                           |
| REQ-001-b-025 | ProductListScreen.tsx + category filter                                 |
| REQ-001-b-026 | ProductFormScreen.tsx + category picker                                 |
| REQ-001-b-027 | ProductFormScreen auto-create "Sin categoría"                           |
| REQ-001-b-028 | ProductRepository.softDelete (FK check deferred to 001-c)               |
| REQ-001-b-029 | StoreListScreen.tsx                                                     |
| REQ-001-b-030 | StoreFormScreen.tsx + existsByNameAndLocation                           |
| REQ-001-b-031 | AuthNavigator.tsx + RootNavigator.tsx                                   |
| REQ-001-b-032 | TabNavigator.tsx entity stacks                                          |
| REQ-001-b-033 | DashboardEntryScreen.tsx                                                |
| REQ-001-b-034 | All screens use Screen, Card, Button, Input, Typography, LoadingSpinner |
| REQ-001-b-035 | All screens use useTheme() tokens                                       |
| REQ-001-b-036 | Loading/error/empty states in every list screen                         |
| REQ-001-b-037 | Toast via useNotificationStore.notify() on all CRUD operations          |

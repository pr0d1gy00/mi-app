# Implementation Tasks — Chain 001-b: Auth + Categories + Products + Stores

**Spec:** `openspec/changes/001-b-auth-crud/spec.md` (37 requirements)  
**Design:** `openspec/changes/001-b-auth-crud/design.md` (14 sections)  
**Strict TDD:** true — every task must produce RED → GREEN → TRIANGULATE evidence.  
**Review Budget:** 250 changed lines per PR.

---

## Review Workload Forecast

| Field                   | Value                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| Estimated changed lines | ~2400–2800 (additions) across 25 new files + 6 modified files + 16 test files |
| 400-line budget risk    | High — this chain far exceeds any single-PR budget                            |
| Chained PRs recommended | Yes                                                                           |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 → PR 5                                              |
| Delivery strategy       | auto-chain                                                                    |
| Chain strategy          | stacked-to-main                                                               |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

---

## PR Shape — 5 Stacked PRs (≤250 lines each)

| PR   | Name                             | Tasks   | Est. Lines |
| ---- | -------------------------------- | ------- | ---------- |
| PR 1 | `001-b-1-infra-types`            | T01–T05 | ~200       |
| PR 2 | `001-b-2-db-migrations-repos`    | T06–T10 | ~230       |
| PR 3 | `001-b-3-auth-services-nav`      | T11–T15 | ~220       |
| PR 4 | `001-b-4-screens-auth-dashboard` | T16–T18 | ~200       |
| PR 5 | `001-b-5-screens-crud`           | T19–T22 | ~250       |

**Tests are co-located with code** in each PR. Every PR must pass all tests from previous PRs + its own new tests.

---

## PR 1: `001-b-1-infra-types` — Dependencies, Types, Validation, UUID

**Goal:** Add dependencies, define all TypeScript interfaces, Zod schemas, and UUID utility. No runtime behavior changes.

### T01: Add Dependencies — expo-secure-store, zod, uuid

- [x] Completed

- **Files:** `package.json`, `app.json` (if needed)
- **Depends on:** None
- **Estimated lines:** ~10 (package.json additions)
- **Action:**
  ```bash
  npx expo install expo-secure-store zod uuid
  ```
  Install `@types/uuid` as devDependency if not auto-installed.
- **Acceptance criteria:**
  - `npx expo install expo-secure-store zod uuid` succeeds
  - `@types/uuid` is present in `devDependencies`
  - `npm ls expo-secure-store zod uuid @types/uuid` resolves without errors
- **TDD:** No runtime test needed — dependency installation is verified by TypeScript compilation in T02.

### T02: Create Entity Types — `src/types/entities.ts`

- [x] Completed

- **Files:** `src/types/entities.ts` (new)
- **Depends on:** None
- **Estimated lines:** ~30
- **TDD — RED first:**
  1. Create `src/types/__tests__/entities.test.ts` with compile-time assertions that `Category`, `Product`, `Store` extend `BaseEntity` and have the correct fields.
  2. Test must fail compilation if `entities.ts` does not exist or is wrong.
- **Implementation:**
  - Define `SyncStatus = 'synced' | 'created' | 'updated' | 'deleted'`
  - Define `BaseEntity` interface with `id`, `createdAt`, `updatedAt`, `deletedAt`, `syncStatus`, `lastSyncedAt`
  - Define `Category extends BaseEntity` with `name`, `metadata`, `userId`
  - Define `Product extends BaseEntity` with `name`, `brand`, `categoryId`, `metadata`, `barcode`, `userId`
  - Define `Store extends BaseEntity` with `name`, `location`, `userId`
- **TDD — GREEN:** All type tests pass. TypeScript compiles without errors.
- **TDD — TRIANGULATE:** Verify that `BaseEntity` fields cannot be omitted from entity interfaces (compile-time test).
- **Acceptance criteria:**
  - All interfaces match spec REQ-001-b-020, REQ-001-b-021
  - `SyncStatus` is exactly the 4-value union
  - `BaseEntity` includes all 6 required fields
  - All entity interfaces extend `BaseEntity`

### T03: Create Auth Types — `src/types/auth.ts`

- [x] Completed

- **Files:** `src/types/auth.ts` (new)
- **Depends on:** None
- **Estimated lines:** ~20
- **TDD — RED first:**
  1. Create `src/types/__tests__/auth.test.ts` verifying `LoginInput`, `RegisterInput`, `AuthResponse`, `UserEntity` shapes.
- **Implementation:**
  - Define `LoginInput` with `email: string`, `password: string`
  - Define `RegisterInput` with `email: string`, `password: string`, `name: string`
  - Define `AuthResponse` with `accessToken: string`, `user: UserEntity`
  - Define `UserEntity` with `id`, `email`, `name`, `preferredCurrency`
- **TDD — GREEN:** Type tests pass.
- **Acceptance criteria:**
  - Interfaces match design §6.1
  - REQ-001-b-006 satisfied

### T04: Create Zod Validation Schemas — `src/types/validation.ts`

- [x] Completed

- **Files:** `src/types/validation.ts` (new)
- **Depends on:** T01 (zod installed)
- **Estimated lines:** ~45
- **TDD — RED first:**
  1. Create `src/types/__tests__/validation.test.ts`
  2. Write tests for each schema's valid/invalid cases:
     - `loginSchema`: valid email+password passes; empty email fails; malformed email fails; empty password fails
     - `registerSchema`: valid name+email+password passes; short password (<8) fails; empty name fails; long name fails
     - `categorySchema`: valid name passes; empty name fails; whitespace-only name trims and fails if empty
     - `productSchema`: valid name passes; name too long fails; brand optional; barcode optional
     - `storeSchema`: valid name passes; empty name fails; location optional
- **TDD — GREEN:** Implement all 5 Zod schemas. All tests pass.
- **TDD — TRIANGULATE:**
  - Add tests for edge cases: `categorySchema` with max length (100), `productSchema` with max barcode length (50), `registerSchema` with password exactly 8 chars (should pass)
- **Acceptance criteria:**
  - All 5 schemas defined: `loginSchema`, `registerSchema`, `categorySchema`, `productSchema`, `storeSchema`
  - `.safeParse()` returns correct error messages for all invalid inputs
  - `.trim()` applied to string fields per design §9
  - REQ-001-b-001, REQ-001-b-002, REQ-001-b-023, REQ-001-b-026, REQ-001-b-030 satisfied

### T05: Create UUID Utility — `src/utils/uuid.ts`

- [x] Completed

- **Files:** `src/utils/uuid.ts` (new)
- **Depends on:** T01 (uuid installed)
- **Estimated lines:** ~8
- **TDD — RED first:**
  1. Create `src/utils/__tests__/uuid.test.ts`
  2. Test: `generateUuid()` returns a valid v4 UUID string (regex match `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
  3. Test: two consecutive calls return different UUIDs
- **TDD — GREEN:** Implement `generateUuid()` wrapping `uuid.v4()`
- **Acceptance criteria:**
  - Function exports `generateUuid(): string`
  - Returns valid UUID v4 format
  - Each call produces unique value

---

## PR 2: `001-b-2-db-migrations-repos` — Database Migrations & Repositories

**Goal:** Migration system, updated connection, 3 repositories with full CRUD + sync_status management.

### T06: Create Migration System — `src/database/migrations/`

- [x] Completed

- **Files:** `src/database/migrations/index.ts`, `src/database/migrations/001-create-tables.ts`, `src/database/migrations/runner.ts`
- **Depends on:** T02 (entity types for column definitions)
- **Estimated lines:** ~90
- **TDD — RED first:**
  1. Create `src/database/__tests__/migrations.test.ts`
  2. Test: `runMigrations()` on fresh in-memory DB creates `_migrations` table
  3. Test: `runMigrations()` creates `users`, `categories`, `products`, `stores` tables
  4. Test: Running `runMigrations()` twice does not throw (idempotent — skips already applied)
  5. Test: `_migrations` table records migration name and timestamp
  6. Test: FK enforcement is active (insert product with non-existent category_id fails) — this tests PRAGMA + FK together
- **TDD — GREEN:**
  - Implement `Migration` interface and registry in `index.ts`
  - Implement `001-create-tables.ts` with full SQL for all 4 tables + `_migrations` + indexes + constraints
  - Implement `runner.ts` with `_migrations` table creation, applied-check loop, and error handling with `DatabaseError`
- **TDD — TRIANGULATE:**
  - Test: UNIQUE constraint on `(name, user_id)` for categories — insert duplicate throws
  - Test: UNIQUE constraint on `(name, location)` for stores — insert duplicate throws
  - Test: UNIQUE constraint on `barcode` for products — insert duplicate throws
  - Test: Indexes exist on `products(name)` and `products(category_id)` (verify via `PRAGMA index_list`)
- **Acceptance criteria:**
  - REQ-001-b-008, REQ-001-b-009, REQ-001-b-010, REQ-001-b-011, REQ-001-b-012, REQ-001-b-013, REQ-001-b-014
  - All 4 entity tables created with correct columns
  - `_migrations` tracking table works
  - Foreign keys enabled
  - Dates stored as ISO 8601 TEXT

### T07: Update Database Connection — `src/database/connection.ts`

- [x] Completed

- **Files:** `src/database/connection.ts` (modified), `src/database/errors.ts` (existing)
- **Depends on:** T06 (migration system)
- **Estimated lines:** ~15 (modified lines in connection.ts)
- **TDD — RED first:**
  1. Create/extend `src/database/__tests__/connection.test.ts`
  2. Test: `getDatabase()` returns a migrated database (can query `_migrations`)
  3. Test: `getDatabase()` returns same promise on concurrent calls (singleton)
  4. Test: `resetDatabase()` clears the singleton (next call opens fresh)
  5. Test: `PRAGMA foreign_keys = ON` is active
- **TDD — GREEN:**
  - Wrap `openDatabaseAsync` with `PRAGMA foreign_keys = ON` and `runMigrations(db)` before resolving
  - Add `resetDatabase()` function
  - Keep existing error handling
- **Acceptance criteria:**
  - `getDatabase()` always returns a fully migrated DB
  - `resetDatabase()` allows test isolation
  - REQ-001-b-013 satisfied

### T08: Create BaseRepository Interface & Types — `src/repositories/types.ts`

- [x] Completed

- **Files:** `src/repositories/types.ts` (new), `src/repositories/index.ts` (modified — barrel)
- **Depends on:** T02 (BaseEntity, SyncStatus)
- **Estimated lines:** ~15
- **TDD — RED first:**
  1. Create `src/repositories/__tests__/types.test.ts` (compile-time verification)
  2. Test: `BaseRepository<Category>` requires all 5 methods with correct signatures
- **TDD — GREEN:**
  - Export `SyncStatus` and `BaseEntity` from `repositories/types.ts` (re-export or reference `entities.ts`)
  - Define `BaseRepository<T extends BaseEntity>` interface with `create`, `getById`, `getAll`, `update`, `softDelete`
- **Acceptance criteria:**
  - REQ-001-b-015, REQ-001-b-021
  - TypeScript enforces the contract

### T09: Create CategoryRepository — `src/repositories/CategoryRepository.ts`

- [x] Completed

- **Files:** `src/repositories/CategoryRepository.ts` (new)
- **Depends on:** T06, T07, T08, T05
- **Estimated lines:** ~100
- **TDD — RED first:**
  1. Create `src/repositories/__tests__/CategoryRepository.test.ts`
  2. `beforeEach`: open `:memory:` DB, run migrations, instantiate `CategoryRepository`
  3. `afterEach`: close DB
  4. Tests (write all RED):
     - `create()` inserts and returns full Category with `syncStatus='created'`
     - `create()` sets `lastSyncedAt` to ISO 8601
     - `getById()` returns Category for existing ID
     - `getById()` returns null for non-existent ID
     - `getById()` returns null for soft-deleted category
     - `getAll()` returns all non-deleted categories, ordered by name
     - `search('electronics')` returns matching categories (case-insensitive)
     - `search()` excludes soft-deleted
     - `update()` changes name and sets `syncStatus='updated'`
     - `update()` refreshes `updatedAt` and `lastSyncedAt`
     - `softDelete()` sets `deletedAt` and `syncStatus='deleted'`
     - `softDelete()` refreshes `lastSyncedAt`
     - `getBySyncStatus('created')` returns only created-status categories
     - `getBySyncStatus()` excludes soft-deleted
     - `existsByName()` detects duplicate (case-insensitive)
     - `existsByName(name, excludeId)` allows same name for different ID
- **TDD — GREEN:** Implement all methods per design §5.3
- **TDD — TRIANGULATE:**
  - Test: create with metadata JSON, verify round-trip parse
  - Test: create with null metadata, verify stored as null
  - Test: search with empty string returns all
- **Acceptance criteria:**
  - REQ-001-b-016, REQ-001-b-019, REQ-001-b-024
  - All CRUD + search + getBySyncStatus + existsByName working
  - sync_status auto-managed on create/update/softDelete

### T10: Create ProductRepository & StoreRepository

- [x] Completed

- **Files:** `src/repositories/ProductRepository.ts`, `src/repositories/StoreRepository.ts` (new)
- **Depends on:** T06, T07, T08, T05
- **Estimated lines:** ~130 (both combined)
- **TDD — RED first:**
  1. Create `src/repositories/__tests__/ProductRepository.test.ts`
     - Same pattern as T09, plus:
     - `getByCategoryId()` returns products for a specific category
     - `getByCategoryId()` excludes soft-deleted
     - FK violation: create product with non-existent category_id throws
  2. Create `src/repositories/__tests__/StoreRepository.test.ts`
     - Same pattern as T09, plus:
     - `search()` matches on name OR location (case-insensitive)
     - `existsByNameAndLocation()` detects duplicate name+location
     - `existsByNameAndLocation()` allows same name with different location
- **TDD — GREEN:** Implement both repositories per design §5.4, §5.5
- **TDD — TRIANGULATE:**
  - Product: create with barcode, verify unique constraint
  - Product: create with null brand, verify round-trip
  - Store: search with query matching only location (not name)
- **Acceptance criteria:**
  - REQ-001-b-017, REQ-001-b-018, REQ-001-b-019, REQ-001-b-028
  - ProductRepository: create, getById, getAll, search, getByCategoryId, update, softDelete, getBySyncStatus
  - StoreRepository: create, getById, getAll, search, update, softDelete, getBySyncStatus, existsByNameAndLocation
  - sync_status auto-managed on all CRUD operations

---

## PR 3: `001-b-3-auth-services-nav` — Auth Services, Updated Auth Store, Navigation

**Goal:** SecureStore service, API client, auth initializer, updated useAuthStore, navigation auth guard, AuthNavigator, updated TabNavigator.

### T11: Create SecureStore Service — `src/services/secureStore.ts`

- [x] Completed

- **Files:** `src/services/secureStore.ts` (new)
- **Depends on:** T01 (expo-secure-store installed)
- **Estimated lines:** ~25
- **TDD — RED first:**
  1. Create `src/services/__tests__/secureStore.test.ts`
  2. Mock `expo-secure-store` (`jest.mock('expo-secure-store')`)
  3. Test: `saveToken()` calls `SecureStore.setItemAsync` with correct key
  4. Test: `getToken()` returns value from `SecureStore.getItemAsync`
  5. Test: `deleteToken()` calls `SecureStore.deleteItemAsync`
  6. Test: `saveUser()`, `getUser()`, `deleteUser()` — same pattern
  7. Test: Key names are `@mi-purchase:auth-token` and `@mi-purchase:auth-user`
- **TDD — GREEN:** Implement all 6 functions per design §6.2
- **TDD — TRIANGULATE:**
  - Test: `getToken` returns null when no token stored
  - Test: `getUser` returns null when no user stored
  - Test: `saveToken` and `saveUser` handle empty strings
- **Acceptance criteria:**
  - REQ-001-b-003
  - Consistent key names across save/read/delete

### T12: Create API Client — `src/services/apiClient.ts`

- [x] Completed

- **Files:** `src/services/apiClient.ts` (new)
- **Depends on:** T11 (secureStore), T01 (axios already in deps from 001-a)
- **Estimated lines:** ~30
- **TDD — RED first:**
  1. Create `src/services/__tests__/apiClient.test.ts`
  2. Use `axios-mock-adapter` or manual mock
  3. Test: request interceptor attaches `Authorization: Bearer <token>` when token exists
  4. Test: request interceptor does NOT attach header when no token
  5. Test: response interceptor calls `deleteToken()` and `deleteUser()` on 401
  6. Test: baseURL uses `EXPO_PUBLIC_API_URL` env var with fallback
- **TDD — GREEN:** Implement axios instance with interceptors per design §6.3
- **TDD — TRIANGULATE:**
  - Test: request interceptor adds different Bearer token values
  - Test: response interceptor handles 401 with no response object (does not crash)
- **Acceptance criteria:**
  - JWT attached to every authenticated request
  - 401 auto-clears auth tokens
  - Configurable baseURL

### T13: Create Logout Clear Utility — `src/utils/logoutClear.ts`

- [x] Completed

- **Files:** `src/utils/logoutClear.ts` (new)
- **Depends on:** T07 (connection.ts with resetDatabase)
- **Estimated lines:** ~15
- **TDD — RED first:**
  1. Create `src/utils/__tests__/logoutClear.test.ts`
  2. Mock `getDatabase` and `resetDatabase`
  3. Test: calls DELETE FROM for categories, products, stores, users
  4. Test: calls `resetDatabase()` after clearing
  5. Test: does not throw if DB is unavailable
- **TDD — GREEN:** Implement per design §6.5
- **TDD — TRIANGULATE:**
  - Test: does not throw when delete statement fails
  - Test: calls `resetDatabase()` even when delete fails
- **Acceptance criteria:**
  - REQ-001-b-005 (data clearing portion)
  - All 4 tables cleared on logout

### T14: Update useAuthStore with Real Methods — `src/hooks/useAuthStore.ts`

- [x] Completed

- **Files:** `src/hooks/useAuthStore.ts` (modified — complete rewrite of methods)
- **Depends on:** T11 (secureStore), T12 (apiClient), T13 (logoutClear), T03 (auth types)
- **Estimated lines:** ~60 (modified)
- **TDD — RED first:**
  1. Create `src/hooks/__tests__/useAuthStore-auth.test.ts`
  2. Mock `apiClient`, `secureStore`, `clearAllLocalData`
  3. Test: `login()` success — calls POST /auth/login, saves token+user, sets isAuthenticated=true
  4. Test: `login()` failure — rejects with error, does not change store state
  5. Test: `register()` success — calls POST /auth/register, saves token+user, sets isAuthenticated=true
  6. Test: `register()` failure — rejects with error, does not change store state
  7. Test: `logout()` — deletes token, deletes user, calls clearAllLocalData, resets state
  8. Test: `checkAuth()` with token — reads SecureStore, sets isAuthenticated=true, isLoading=false
  9. Test: `checkAuth()` without token — sets isAuthenticated=false, isLoading=false
  10. Test: `checkAuth()` on error — sets isAuthenticated=false, isLoading=false
  11. Test: `isLoading` starts true, becomes false after checkAuth resolves
- **TDD — GREEN:** Replace placeholder store with real implementation per design §6.4
- **TDD — TRIANGULATE:**
  - Test: `login()` with network error (rejects)
  - Test: `checkAuth()` with valid token but invalid user JSON (catches parse error, sets false)
- **Acceptance criteria:**
  - REQ-001-b-004, REQ-001-b-005, REQ-001-b-006
  - All 4 methods (login, register, logout, checkAuth) working
  - `isLoading` state correctly managed

### T15: Navigation Auth Guard & AuthNavigator — `RootNavigator`, `AuthNavigator`, `types`, `TabNavigator`

- [x] Completed

- **Files:** `src/navigation/RootNavigator.tsx` (modified), `src/navigation/AuthNavigator.tsx` (new), `src/navigation/types.ts` (modified), `src/navigation/TabNavigator.tsx` (modified)
- **Depends on:** T14 (updated useAuthStore), T03 (auth types)
- **Estimated lines:** ~70 (combined modifications + new file)
- **TDD — RED first:**
  1. Create `src/navigation/__tests__/auth-nav.test.tsx`
  2. Mock `useAuthStore` to control `isAuthenticated`
  3. Test: when `isAuthenticated=false`, RootNavigator renders Auth stack (Login screen visible)
  4. Test: when `isAuthenticated=true`, RootNavigator renders MainTabs (Home screen visible)
  5. Test: auth state transition — render with false, update to true, verify MainTabs renders
- **Implementation:**
  - `AuthNavigator.tsx`: create AuthStack with Login + Register screens (screens are placeholders for now — will be built in T16)
  - `RootNavigator.tsx`: conditional rendering based on `useAuthStore(s => s.isAuthenticated)`
  - `types.ts`: add `AuthStackParamList`, `CategoryStackParamList`, `ProductStackParamList`, `StoreStackParamList`, `DashboardStackParamList`, update `BottomTabParamList` and `RootStackParamList`
  - `TabNavigator.tsx`: replace emoji icons with `@expo/vector-icons` Ionicons; replace HomeScreen placeholder with `DashboardEntryScreen` reference (screen built in T17); add stack navigators for Categories, Products, Stores tabs
- **TDD — GREEN:** All navigation tests pass. TypeScript compiles.
- **TDD — TRIANGULATE:**
  - Test: switches from Auth to MainTabs when auth state changes
- **Acceptance criteria:**
  - REQ-001-b-007, REQ-001-b-031, REQ-001-b-032
  - Auth stack renders when unauthenticated
  - MainTabs renders when authenticated
  - State transitions work correctly
  - All navigation types are typed

---

## PR 4: `001-b-4-screens-auth-dashboard` — Auth Screens & Dashboard

**Goal:** LoginScreen, RegisterScreen, DashboardEntryScreen, AuthInitializer, App.tsx wrap.

### T16: Create Auth Screens — LoginScreen & RegisterScreen

- [x] Completed

- **Files:** `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/RegisterScreen.tsx` (new)
- **Depends on:** T04 (validation schemas), T14 (useAuthStore), T15 (navigation types), existing components (Screen, Input, Button, Typography, LoadingSpinner)
- **Estimated lines:** ~110 (both screens)
- **TDD — RED first:**
  1. Create `src/screens/auth/__tests__/LoginScreen.test.tsx`
  2. Mock `useAuthStore.login` as jest.fn()
  3. Test: renders email input, password input, login button
  4. Test: submitting empty form shows Zod validation errors (no API call)
  5. Test: submitting malformed email shows validation error (no API call)
  6. Test: submitting valid credentials calls `login()` — mock success
  7. Test: during login API call, button shows loading and form is disabled
  8. Test: login API error (401) displays error message and toast
  9. Test: link to Register screen exists
  10. Create `src/screens/auth/__tests__/RegisterScreen.test.tsx`
  11. Same pattern + test: duplicate email (409) shows "Email already in use" error
  12. Test: password < 8 chars shows validation error (no API call)
- **TDD — GREEN:** Implement screens per design §8.2, §8.3
  - Use existing `Screen`, `Input`, `Button`, `Typography`, `LoadingSpinner` components
  - Zod `.safeParse()` on submit
  - Call `useAuthStore().login()` or `.register()`
  - Error display below form + toast via `useNotificationStore().notify()`
  - Loading state: disable form, show loading indicator in button
  - Navigation links between Login ↔ Register
- **TDD — TRIANGULATE:**
  - Login: test with very long email (still valid format)
  - Register: test name at max length (100 chars)
  - Test dark mode renders correctly (snapshot or accessibility check)
- **Acceptance criteria:**
  - REQ-001-b-001, REQ-001-b-002, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037
  - Full validation → API call → success/error flow
  - Loading states disable form
  - Uses existing shared components

### T17: Create AuthInitializer & Update App.tsx

- [x] Completed

- **Files:** `src/app/AuthInitializer.tsx` (new), `src/app/App.tsx` (modified)
- **Depends on:** T14 (useAuthStore with checkAuth)
- **Estimated lines:** ~30 (new + modified)
- **TDD — RED first:**
  1. Create `src/app/__tests__/AuthInitializer.test.tsx`
  2. Mock `useAuthStore.checkAuth` and `isLoading`
  3. Test: shows LoadingSpinner while `isLoading=true`
  4. Test: renders children after `checkAuth()` resolves and `isLoading=false`
  5. Test: calls `checkAuth()` on mount
- **TDD — GREEN:** Implement per design §6.6
  - `AuthInitializer`: useEffect calls `checkAuth()`, sets initialized flag
  - Shows `LoadingSpinner` while loading
  - Renders children when ready
  - `App.tsx`: wrap existing tree with `<AuthInitializer>` (inside SafeAreaProvider, outside NavigationContainer)
- **Acceptance criteria:**
  - REQ-001-b-004
  - App blocks rendering until auth state is resolved
  - LoadingSpinner shown during initialization

### T18: Create DashboardEntryScreen

- [x] Completed

- **Files:** `src/screens/dashboard/DashboardEntryScreen.tsx` (new)
- **Depends on:** T09 (CategoryRepository), T10 (ProductRepository, StoreRepository), T07 (connection)
- **Estimated lines:** ~40
- **TDD — RED first:**
  1. Create `src/screens/dashboard/__tests__/DashboardEntryScreen.test.tsx`
  2. Mock repositories with `getAll()` returning arrays of varying lengths
  3. Test: displays 3 cards with labels "Categories", "Products", "Stores"
  4. Test: counts match repo data (e.g., 5 categories → card shows "5")
  5. Test: zero entities → all cards show "0"
  6. Test: uses `useFocusEffect` to refresh counts on tab focus
- **TDD — GREEN:** Implement per design §8.10
  - Fetch counts via `repo.getAll().length` (or COUNT queries if preferred)
  - Display 3 Card components with entity names and counts
  - `useFocusEffect` from `@react-navigation/native` for refresh
  - Use existing `Screen`, `Card`, `Typography` components
- **TDD — TRIANGULATE:**
  - Test: error state if DB query fails (shows error message)
  - Test: loading state during initial fetch
- **Acceptance criteria:**
  - REQ-001-b-033, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036
  - 3 count cards displayed
  - Counts refresh on focus
  - Uses existing shared components

---

## PR 5: `001-b-5-screens-crud` — Category, Product, Store CRUD Screens

**Goal:** All 6 entity list/form screens with search, filter, FAB, CRUD, validation, toasts.

### T19: Create Category Screens — List & Form

- [x] Completed

- **Files:** `src/screens/categories/CategoryListScreen.tsx`, `src/screens/categories/CategoryFormScreen.tsx` (new)
- **Depends on:** T09 (CategoryRepository), T04 (categorySchema), T15 (navigation types)
- **Estimated lines:** ~130 (both screens)
- **TDD — RED first:**
  1. Create `src/screens/categories/__tests__/CategoryListScreen.test.tsx`
  2. Mock `CategoryRepository` with `getAll()`, `search()`, `softDelete()`
  3. Test: empty state when no categories
  4. Test: displays categories as Cards with names
  5. Test: search input filters list client-side (case-insensitive)
  6. Test: FAB navigates to CategoryForm screen
  7. Test: pull-to-refresh reloads from repo
  8. Test: delete action calls `softDelete()` and shows success toast
  9. Create `src/screens/categories/__tests__/CategoryFormScreen.test.tsx`
  10. Test: create mode — validates empty name, saves with valid name, shows success toast, navigates back
  11. Test: create mode — duplicate name shows inline error
  12. Test: edit mode — loads existing category, populates form, saves changes, sets syncStatus='updated'
  13. Test: cancel button navigates back without saving
- **TDD — GREEN:** Implement per design §8.4, §8.5
  - **ListScreen:** FlatList with Card items, search bar, FAB, RefreshControl, swipe/long-press delete
  - **FormScreen:** Input for name, Zod validation, `existsByName()` check, create/update via repo, success toast, goBack
  - Use existing `Screen`, `Card`, `Button`, `Input`, `Typography`, `LoadingSpinner` components
- **TDD — TRIANGULATE:**
  - List: search with special characters
  - Form: edit mode with category that has metadata (round-trip JSON)
  - Form: name at max length (100 chars)
- **Acceptance criteria:**
  - REQ-001-b-022, REQ-001-b-023, REQ-001-b-024, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037
  - Full CRUD cycle for categories
  - Unique name validation
  - Soft delete works

### T20: Create Product Screens — List & Form

- [x] Completed

- **Files:** `src/screens/products/ProductListScreen.tsx`, `src/screens/products/ProductFormScreen.tsx` (new)
- **Depends on:** T10 (ProductRepository, CategoryRepository), T04 (productSchema), T15 (navigation types), T19 (CategoryList pattern reference)
- **Estimated lines:** ~150 (both screens)
- **TDD — RED first:**
  1. Create `src/screens/products/__tests__/ProductListScreen.test.tsx`
  2. Mock `ProductRepository` and `CategoryRepository`
  3. Test: empty state when no products
  4. Test: displays products as Cards with name, brand, category name
  5. Test: category filter dropdown filters products by selected category
  6. Test: search input filters by name
  7. Test: FAB navigates to ProductForm
  8. Test: delete calls `softDelete()` with success toast
  9. Create `src/screens/products/__tests__/ProductFormScreen.test.tsx`
  10. Test: create mode with category — selects category from picker, validates, saves, toast, goBack
  11. Test: create mode without categories — auto-creates "Sin categoría", assigns product to it
  12. Test: edit mode — loads product, populates fields (name, brand, category), saves, toast, goBack
  13. Test: name required validation error on empty submit
- **TDD — GREEN:** Implement per design §8.6, §8.7
  - **ListScreen:** FlatList with Card items, category filter dropdown, search bar, FAB, delete
  - **FormScreen:** name Input, brand Input (optional), category Picker/Dropdown, Zod validation
  - Auto-create "Sin categoría" logic: if no categories exist at save time, create default category first
  - Use existing shared components
- **TDD — TRIANGULATE:**
  - Form: create with barcode field
  - Form: edit product with null brand
  - List: filter by category when only 1 category exists
- **Acceptance criteria:**
  - REQ-001-b-025, REQ-001-b-026, REQ-001-b-027, REQ-001-b-028, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037
  - Full CRUD cycle for products
  - "Sin categoría" auto-creation
  - Category filter in list

### T21: Create Store Screens — List & Form

- [x] Completed

- **Files:** `src/screens/stores/StoreListScreen.tsx`, `src/screens/stores/StoreFormScreen.tsx` (new)
- **Depends on:** T10 (StoreRepository), T04 (storeSchema), T15 (navigation types)
- **Estimated lines:** ~110 (both screens)
- **TDD — RED first:**
  1. Create `src/screens/stores/__tests__/StoreListScreen.test.tsx`
  2. Mock `StoreRepository`
  3. Test: empty state when no stores
  4. Test: displays stores as Cards with name and location
  5. Test: search filters by name OR location (case-insensitive)
  6. Test: FAB navigates to StoreForm
  7. Test: delete calls `softDelete()` with success toast
  8. Create `src/screens/stores/__tests__/StoreFormScreen.test.tsx`
  9. Test: create mode — validates empty name, saves with valid name+location, toast, goBack
  10. Test: create mode — duplicate name+location shows inline error
  11. Test: edit mode — loads store, populates fields, saves, toast, goBack
  12. Test: location is optional (can create store with name only)
- **TDD — GREEN:** Implement per design §8.8, §8.9
  - **ListScreen:** FlatList with Card items, search bar, FAB, delete
  - **FormScreen:** name Input, location Input (optional), Zod validation, `existsByNameAndLocation()` check
  - Use existing shared components
- **TDD — TRIANGULATE:**
  - Form: name at max length (200 chars)
  - Form: location at max length (200 chars)
  - List: search matching only location (not name)
- **Acceptance criteria:**
  - REQ-001-b-029, REQ-001-b-030, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037
  - Full CRUD cycle for stores
  - Unique name+location validation

### T22: Update Test Utilities & Integration Tests

- [x] Completed

- **Files:** `src/app/__tests__/test-utils.tsx` (modified), `src/app/__tests__/App-auth-guard.test.tsx` (new)
- **Depends on:** T16–T21 (all screens), T14 (auth store), T15 (navigation)
- **Estimated lines:** ~40 (modified + new)
- **TDD — RED first:**
  1. Extend `test-utils.tsx` with `renderWithAllProviders` including `NotificationProvider`
  2. Create `src/app/__tests__/App-auth-guard.test.tsx`
  3. Test: full auth flow integration — render App, mock no token → Auth stack visible
  4. Test: mock valid token → MainTabs visible (DashboardEntryScreen renders)
  5. Test: auth state transition — login from LoginScreen → MainTabs visible
- **TDD — GREEN:** Update test utilities, write integration tests
- **Acceptance criteria:**
  - `renderWithAllProviders` available for all screen tests
  - End-to-end auth guard tests pass
  - All previous test suites still pass

---

## Task Dependency Graph

```
T01 ──┬── T04 ──┬── T16 ──┐
      │         │         ├── T19 ──┬── T20 ──┬── T22
      │         │         │         │         │
      │         │         │         │         └── T21 ──┘
      │         │         │         │
      │         │         └── T17 ──┘
      │         │
      │         └── T18
      │
      ├── T02 ──┬── T06 ──┬── T07 ──┬── T09 ──┬── T13 ──┬── T14 ──┬── T15 ──┬── T16
      │         │         │         │         │         │         │         ├── T18
      │         │         │         │         │         │         │         ├── T19
      │         │         │         │         │         │         │         ├── T20
      │         │         │         │         │         │         │         └── T21
      │         │         │         │         │         │         │
      │         │         │         │         │         │         └── T17
      │         │         │         │         │         │
      │         │         │         │         │         └── T13
      │         │         │         │         │
      │         │         │         ├── T10 ──┤
      │         │         │         │
      │         │         │         └── T18
      │         │         │
      │         │         └── T07 (modified)
      │         │
      │         └── T08 ──┬── T09
      │                   └── T10
      │
      ├── T03 ──┬── T14
      │         └── T04
      │
      └── T05 ──┬── T09
                └── T10
```

---

## TDD Evidence Requirements

For every task, the following evidence must be present before marking complete:

1. **RED evidence:** Test file exists with failing tests (commit or log showing `FAIL` or test count > 0 with failures).
2. **GREEN evidence:** All tests for the task pass (`PASS` in Jest output).
3. **TRIANGULATE evidence (where specified):** Additional test cases beyond the happy path confirm robustness (edge cases, error paths, boundary values).
4. **Coverage:** Each new source file must have ≥80% line coverage. Repository tests must cover all methods. Screen tests must cover render, validation, success, and error paths.

### TDD Sequence Template

```
1. RED: Write tests first → verify they fail
2. GREEN: Implement minimum code to pass tests
3. TRIANGULATE: Add edge-case tests → verify they fail → implement fixes → verify pass
4. REFACTOR: Clean up code if needed → verify all tests still pass
```

---

## PR Merge Checklist (per PR)

Before merging each PR:

- [ ] All new tests pass (`npm test -- --testPathPattern=<PR tasks>` )
- [ ] All existing tests from previous PRs still pass
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npx expo lint`)
- [ ] Changed lines ≤ 250 (excluding test files where possible, but total must stay reasonable)
- [ ] TDD evidence present (RED → GREEN → TRIANGULATE commits or logs)
- [ ] Requirements traceable: each REQ covered by at least one test

---

## Requirements Coverage Matrix

| Task | Requirements Covered                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| T01  | (infrastructure)                                                                                                       |
| T02  | REQ-001-b-020, REQ-001-b-021                                                                                           |
| T03  | REQ-001-b-006                                                                                                          |
| T04  | REQ-001-b-001, REQ-001-b-002, REQ-001-b-023, REQ-001-b-026, REQ-001-b-030                                              |
| T05  | (utility)                                                                                                              |
| T06  | REQ-001-b-008, REQ-001-b-009, REQ-001-b-010, REQ-001-b-011, REQ-001-b-012, REQ-001-b-013, REQ-001-b-014                |
| T07  | REQ-001-b-013                                                                                                          |
| T08  | REQ-001-b-015, REQ-001-b-021                                                                                           |
| T09  | REQ-001-b-016, REQ-001-b-019, REQ-001-b-024                                                                            |
| T10  | REQ-001-b-017, REQ-001-b-018, REQ-001-b-019, REQ-001-b-028                                                             |
| T11  | REQ-001-b-003                                                                                                          |
| T12  | REQ-001-b-001, REQ-001-b-002 (API layer)                                                                               |
| T13  | REQ-001-b-005 (data clearing)                                                                                          |
| T14  | REQ-001-b-004, REQ-001-b-005, REQ-001-b-006                                                                            |
| T15  | REQ-001-b-007, REQ-001-b-031, REQ-001-b-032                                                                            |
| T16  | REQ-001-b-001, REQ-001-b-002, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037                               |
| T17  | REQ-001-b-004                                                                                                          |
| T18  | REQ-001-b-033, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036                                                             |
| T19  | REQ-001-b-022, REQ-001-b-023, REQ-001-b-024, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037                |
| T20  | REQ-001-b-025, REQ-001-b-026, REQ-001-b-027, REQ-001-b-028, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037 |
| T21  | REQ-001-b-029, REQ-001-b-030, REQ-001-b-034, REQ-001-b-035, REQ-001-b-036, REQ-001-b-037                               |
| T22  | (integration)                                                                                                          |

All 37 requirements (REQ-001-b-001 through REQ-001-b-037) are covered.

---

## Rollback Strategy

- **PR 1 rollback:** Remove new type files, revert package.json. No runtime impact.
- **PR 2 rollback:** Remove migration files and repositories. Revert `connection.ts`. DB will be empty on next open (safe — no data loss since no screens use it yet).
- **PR 3 rollback:** Revert `useAuthStore.ts`, `RootNavigator.tsx`, `types.ts`, `TabNavigator.tsx`. Remove `AuthNavigator.tsx`, `secureStore.ts`, `apiClient.ts`, `logoutClear.ts`. App reverts to 001-a state.
- **PR 4 rollback:** Remove screen files and `AuthInitializer.tsx`. Revert `App.tsx`. Navigation reverts to 001-a MainTabs-only.
- **PR 5 rollback:** Remove CRUD screen files. Entity stacks in TabNavigator will have broken references — must be reverted together with PR 3's TabNavigator changes.

Each PR is independently revertible **if** subsequent PRs are also reverted. The stacked-to-main strategy means each PR builds on the previous.

# Proposal 001-b — Auth + Categories + Products + Stores

| Field           | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| **Change Name** | `001-b-auth-crud` — Auth screens + CRUD for 3 entities + SQLite schema |
| **Status**      | Draft — awaiting review                                                |
| **Date**        | 2026-06-11                                                             |
| **Author**      | Gentle AI SDD                                                          |
| **Phase**       | Proposal (interactive)                                                 |
| **Parent**      | `001-initial-app` (umbrella proposal)                                  |
| **Chain**       | 001-b of 4 (follows 001-a-scaffold, precedes 001-c, 001-d)             |

---

## 1. Problem Statement

**User pain**: Without authentication and entity management (categories, products, stores), the app is an empty shell. Users cannot create purchases because they have no stores to buy from, no products to track, and no categories to organize them.

**What 001-a left us**: A themed, navigable skeleton with 4 placeholder tabs, shared components, a notification system, a Zustand auth store (placeholder), an HTTP client with JWT interceptors, and a SQLite connection manager. There are no login screens, no database tables, no data entry flows.

**Why this chain now**: Auth + CRUD for the 3 foundational entities (categories, products, stores) unblocks every downstream feature. Purchases (001-c) require products and stores to exist. The dashboard (001-d) requires data to visualize. This chain delivers the first user-facing data creation experience.

---

## 2. Proposed Solution

### 2.1 High-Level Approach

This chain introduces three layered concerns:

1. **Auth flow** — Login and Register screens with form validation, JWT persistence via Expo SecureStore, auto-login on startup, and logout that clears local user-scoped data.
2. **SQLite schema** — Migration system that creates `users`, `categories`, `products`, and `stores` tables mirroring the backend Prisma models, with `sync_status` and `last_synced_at` columns for future sync.
3. **CRUD modules** — Repository pattern implementations for each entity, paired with list and form screens using existing shared components (Screen, Card, Button, Input, Typography).

All data operations are local-first (SQLite). The sync engine (001-d) will later connect these repositories to the backend pull/push endpoints.

### 2.2 Architecture Changes

```
src/
  database/
    migrations/
      001-create-tables.ts              # Migration: users, categories, products, stores
    index.ts                            # Updated exports
  types/
    category.ts                         # Category entity type
    product.ts                          # Product entity type
    store.ts                            # Store entity type
    sync.ts                             # SyncStatus type + common entity base
  repositories/
    types.ts                            # BaseRepository interface
    CategoryRepository.ts               # SQLite-backed category CRUD
    ProductRepository.ts                # SQLite-backed product CRUD
    StoreRepository.ts                  # SQLite-backed store CRUD
  modules/
    auth/
      screens/
        LoginScreen.tsx                 # Email + password login form
        RegisterScreen.tsx              # Email + password + name registration form
      __tests__/
        LoginScreen.test.tsx
        RegisterScreen.test.tsx
    categories/
      screens/
        CategoryListScreen.tsx          # List with search
        CategoryFormScreen.tsx          # Create/edit form
      __tests__/
        CategoryListScreen.test.tsx
        CategoryFormScreen.test.tsx
    products/
      screens/
        ProductListScreen.tsx           # List with search + category filter
        ProductFormScreen.tsx           # Create/edit form with category picker
      __tests__/
        ProductListScreen.test.tsx
        ProductFormScreen.tsx
    stores/
      screens/
        StoreListScreen.tsx             # List with search
        StoreFormScreen.tsx             # Create/edit form
      __tests__/
        StoreListScreen.test.tsx
        StoreFormScreen.test.tsx
  hooks/
    useAuthStore.ts                     # Updated with login/register/logout methods
  navigation/
    RootNavigator.tsx                   # Updated with Auth stack before MainTabs
    TabNavigator.tsx                    # Updated tab icons and Home tab navigation
    types.ts                            # Updated param lists
```

### 2.3 Key Technical Decisions

| Decision                                  | Rationale                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Expo SecureStore for JWT**              | More secure than AsyncStorage; tokens are small enough to fit within SecureStore's limits                             |
| **Migration system (not schema-on-open)** | Allows future schema evolution without data loss; migration 001 creates initial tables                                |
| **sync_status enum**                      | Values: `'synced' \| 'created' \| 'updated' \| 'deleted'` — matches the sync engine design from the umbrella proposal |
| **Soft delete via `deletedAt`**           | Mirrors backend Prisma schema; enables sync of deletions                                                              |
| **Repository pattern**                    | Abstracts SQLite implementation from business logic; prepares for sync integration in 001-d                           |
| **User-scoped vs. global categories**     | `userId` nullable — null means global (admin-created), non-null means user-owned                                      |
| **No direct CRUD API calls**              | All entity operations are local-first; sync runs asynchronously in 001-d                                              |
| **Form validation**                       | Manual validation with error state (no external form library to keep deps minimal)                                    |
| **Navigation: Auth stack before tabs**    | When not authenticated, show Auth stack; after login, navigate to MainTabs                                            |

---

## 3. Scope Boundaries

### IN Scope

- [x] **Auth Module**
  - Login screen (email + password, form validation, loading state, error display)
  - Register screen (email + password + name, form validation, loading state, error display)
  - JWT storage via Expo SecureStore (new dependency)
  - Auto-login on app start if valid token exists
  - Logout: clear token + clear local user-scoped SQLite data (categories, products, stores where `userId` matches)
  - Update `useAuthStore` with `login()`, `register()`, `logout()` methods (replace placeholder setters)
  - Axios interceptor already reads token from store (no change needed there)

- [x] **SQLite Schema**
  - `users` table: `id` (TEXT PK), `email` (TEXT UNIQUE), `name` (TEXT), `password` (TEXT), `preferredCurrency` (TEXT DEFAULT 'USD'), `createdAt` (TEXT), `updatedAt` (TEXT), `deletedAt` (TEXT NULL), `sync_status`, `last_synced_at`
  - `categories` table: `id` (TEXT PK), `name` (TEXT), `metadata` (TEXT NULL), `userId` (TEXT NULL), `createdAt`, `updatedAt`, `deletedAt` (TEXT NULL), `sync_status`, `last_synced_at`. UNIQUE(name, userId) enforced.
  - `products` table: `id` (TEXT PK), `name` (TEXT), `brand` (TEXT NULL), `categoryId` (TEXT FK), `metadata` (TEXT NULL), `barcode` (TEXT NULL UNIQUE), `userId` (TEXT FK), `createdAt`, `updatedAt`, `deletedAt` (TEXT NULL), `sync_status`, `last_synced_at`. INDEX on name, categoryId.
  - `stores` table: `id` (TEXT PK), `name` (TEXT), `location` (TEXT NULL), `userId` (TEXT NULL FK), `createdAt`, `updatedAt`, `deletedAt` (TEXT NULL), `sync_status`, `last_synced_at`. UNIQUE(name, location) enforced.
  - Migration system with `001-create-tables.ts`
  - All dates stored as ISO 8601 TEXT (SQLite best practice)

- [x] **Categories Module**
  - `CategoryRepository`: create, getById, getAll, search, update, softDelete
  - `CategoryListScreen`: list of categories with search bar, pull-to-refresh (local), FAB to create
  - `CategoryFormScreen`: create/edit with name field, validation (required, min 2 chars)
  - Categories filter by current user's `userId` (plus global categories where `userId IS NULL`)

- [x] **Products Module**
  - `ProductRepository`: create, getById, getAll, search, getByCategoryId, update, softDelete
  - `ProductListScreen`: list with search + category filter dropdown, FAB to create
  - `ProductFormScreen`: create/edit with name, brand, category picker (dropdown from existing categories), barcode fields
  - Products are always user-scoped (`userId` required, FK to users)

- [x] **Stores Module**
  - `StoreRepository`: create, getById, getAll, search, update, softDelete
  - `StoreListScreen`: list with search, FAB to create
  - `StoreFormScreen`: create/edit with name + location fields, unique constraint validation (name + location)
  - Stores can be user-scoped or shared (`userId` nullable)

- [x] **Repository Pattern**
  - `BaseRepository` interface: `create`, `getById`, `getAll`, `search`, `update`, `softDelete`, `getBySyncStatus`
  - SQLite implementations for Category, Product, Store
  - Auto-set `sync_status` to `'created'` on insert, `'updated'` on update, `'deleted'` + `deletedAt` on softDelete
  - All repositories accept `getDatabase()` for connection

- [x] **Navigation Updates**
  - Auth stack (Login, Register) shown when `!isAuthenticated`
  - After successful login, reset to MainTabs
  - Add CategoryForm, ProductForm, StoreForm to stack navigator
  - Update tab bar icons from emoji to SF Symbols / Ionicons
  - Home tab: navigate to entity list cards (Categories, Products, Stores) instead of placeholder text

### OUT of Scope (for this chain)

- Purchases, PurchaseItems, PurchaseGroups → **001-c**
- ExchangeRates, Sync engine, Dashboard → **001-d**
- Barcode scanning (camera) → future (schema supports it, UI deferred)
- Photo attachments → future
- Category/Product import/export → future
- Biometric authentication → future
- Push notifications → future
- E2E testing (Detox) → deferred

---

## 4. User Stories

### US-001-b-01: User registers and logs in

**As** a new user, **I want** to create an account with email, password, and name, **so that** I can access my personal data.

- Acceptance: Form validates email format, password min 6 chars, name required
- Acceptance: On success, JWT is stored in SecureStore and user is navigated to MainTabs
- Acceptance: On failure, descriptive error is shown via Toast notification

### US-001-b-02: User auto-logs in on app restart

**As** a returning user, **I want** the app to remember my session, **so that** I don't need to log in every time I open the app.

- Acceptance: If a valid token exists in SecureStore, skip auth screens and go directly to MainTabs
- Acceptance: If token is missing or expired, show Login screen

### US-001-b-03: User creates a category

**As** a user, **I want** to create custom categories, **so that** I can organize my products.

- Acceptance: Category name required, min 2 characters
- Acceptance: Category is saved locally with `sync_status: 'created'`
- Acceptance: Category appears immediately in the list

### US-001-b-04: User creates a product

**As** a user, **I want** to create a product with a name, brand, category, and optional barcode, **so that** I can track its price across purchases.

- Acceptance: Product name required, category required (picker from existing categories)
- Acceptance: Brand, barcode, and metadata are optional
- Acceptance: Product is saved locally with `sync_status: 'created'`
- Acceptance: Product appears immediately in the list

### US-001-b-05: User creates a store

**As** a user, **I want** to create a store with a name and optional location, **so that** I can associate purchases with specific places.

- Acceptance: Store name required, location optional
- Acceptance: Unique constraint: name + location combination must be unique per user
- Acceptance: Store is saved locally with `sync_status: 'created'`
- Acceptance: Store appears immediately in the list

### US-001-b-06: User searches and filters entities

**As** a user, **I want** to search categories, products, and stores by name, **so that** I can find what I need quickly.

- Acceptance: Search filters list in real-time as user types
- Acceptance: Products can additionally be filtered by category

### US-001-b-07: User edits an entity

**As** a user, **I want** to edit a category, product, or store, **so that** I can correct mistakes or update information.

- Acceptance: Edit form pre-fills with existing data
- Acceptance: On save, entity is updated locally with `sync_status: 'updated'`

### US-001-b-08: User deletes an entity (soft delete)

**As** a user, **I want** to delete a category, product, or store, **so that** I can remove items I no longer need.

- Acceptance: Deletion is soft (sets `deletedAt` and `sync_status: 'deleted'`)
- Acceptance: Deleted entities are hidden from lists
- Acceptance: Foreign key constraints prevent deleting categories that have products

---

## 5. Success Criteria

### Functional

- [ ] User can register with email, password, and name
- [ ] User can login with email and password
- [ ] JWT token persists across app restarts via SecureStore
- [ ] Auto-login works: app opens directly to MainTabs when token exists
- [ ] Logout clears token and removes user-scoped local data
- [ ] SQLite tables `users`, `categories`, `products`, `stores` are created on first launch
- [ ] Category CRUD: create, read, search, update, soft-delete
- [ ] Product CRUD: create, read, search, filter by category, update, soft-delete
- [ ] Store CRUD: create, read, search, update, soft-delete
- [ ] `sync_status` is correctly set on all CRUD operations
- [ ] Category unique constraint (name + userId) is enforced
- [ ] Store unique constraint (name + location) is enforced
- [ ] Product barcode unique constraint is enforced
- [ ] Navigation: Auth stack appears when not authenticated, MainTabs when authenticated

### Quality

- [ ] All repository methods have unit tests (Jest) with TDD enforced
- [ ] All screens have snapshot and interaction tests (React Native Testing Library)
- [ ] No `any` types in production code (maintains 001-a standard)
- [ ] TypeScript strict mode passes with zero errors
- [ ] ESLint passes with zero warnings (`--max-warnings 0`)
- [ ] Test coverage ≥ 90% for new code (repositories, screens)
- [ ] Form validation logic is tested independently of UI

### Design

- [ ] All screens use existing shared components (Screen, Card, Button, Input, Typography)
- [ ] Dark mode renders correctly on all screens
- [ ] Tab bar icons use platform-appropriate icons (SF Symbols on iOS, Material on Android)
- [ ] Loading states and error states are visible on auth and form screens

---

## 6. Non-Goals

These are explicitly excluded from 001-b:

1. **Sync engine** — No pull/push to backend. All data is local-only in this chain.
2. **Purchases** — Creating purchases with line items is 001-c.
3. **Purchase groups** — Grouping purchases is 001-c.
4. **Exchange rates** — Multi-currency conversion UI is 001-d.
5. **Dashboard** — Widgets and analytics are 001-d.
6. **Barcode scanning** — Camera-based scanning is deferred; the `barcode` field exists for manual entry only.
7. **Category deletion with cascade** — Categories with products cannot be deleted (FK constraint). Cascade behavior is a future enhancement.
8. **Offline conflict resolution UI** — Sync conflicts will surface in 001-d.
9. **Biometric / Face ID login** — Email + password only for this chain.
10. **Password reset flow** — Not needed until production; handled by backend email.

---

## 7. Risks and Mitigations

| #   | Risk                                                           | Likelihood | Impact | Mitigation                                                                                                                    |
| --- | -------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Expo SecureStore not installed yet**                         | Low        | Medium | Add `expo-secure-store` as a dependency. Test on both iOS and Android during implementation.                                  |
| R2  | **SQLite foreign key constraints not enabled by default**      | High       | High   | Enable PRAGMA `foreign_keys = ON` in the database connection initialization.                                                  |
| R3  | **Migration running on every app launch**                      | Medium     | Medium | Use a migrations tracking table to track applied migrations. Only run unapplied migrations.                                   |
| R4  | **Form validation complexity without a library**               | Medium     | Low    | Keep validation simple (required, min length, email format, uniqueness). Extract into pure utility functions for testability. |
| R5  | **Category picker performance with many categories**           | Low        | Low    | Use FlatList-based dropdown. Category count will be small (typically < 50) in early usage.                                    |
| R6  | **Logout data clearing is slow for large datasets**            | Low        | Medium | Use batched DELETE with `WHERE userId = ?` instead of row-by-row. Acceptable for v1 data volumes.                             |
| R7  | **Unique constraint violations produce cryptic SQLite errors** | Medium     | Medium | Catch SQLite constraint errors and map them to user-friendly messages (e.g., "A category with this name already exists").     |
| R8  | **Date serialization: SQLite TEXT vs. backend DateTime**       | Medium     | Medium | Store all dates as ISO 8601 TEXT. Parse to Date objects in the repository layer. Consistent format simplifies future sync.    |

---

## 8. Dependencies

| Dependency                                    | Type                | Status           | Notes                                                                                                   |
| --------------------------------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| **001-a-scaffold**                            | Internal chain      | ✅ Complete      | Theme, components, navigation, HTTP client, Zustand stores, SQLite connection, tests                    |
| **expo-secure-store**                         | New npm package     | ⚠️ Needs install | Required for JWT persistence. Add via `npx expo install expo-secure-store`                              |
| **@react-native-async-storage/async-storage** | Existing dependency | ✅ Installed     | Already in package.json; not used for JWT (SecureStore preferred), but available for non-sensitive data |
| **Backend: POST /auth/login**                 | External            | ✅ Built         | Returns JWT (30d expiry)                                                                                |
| **Backend: POST /auth/register**              | External            | ✅ Built         | Creates user, returns JWT                                                                               |
| **Backend Prisma schema**                     | External reference  | ✅ Built         | Source of truth for entity fields and relationships                                                     |
| **Backend sync endpoints**                    | External            | ✅ Built         | Not used in this chain; prepared for 001-d                                                              |

---

## 9. Estimated Impact

| Metric                        | Estimate                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| **New files**                 | ~35–45                                                                                          |
| **Estimated LoC**             | ~1,200–1,500                                                                                    |
| **Screens added**             | 7 (Login, Register, CategoryList, CategoryForm, ProductList, ProductForm, StoreList, StoreForm) |
| **Repositories added**        | 3 (Category, Product, Store) + 1 base interface                                                 |
| **Types added**               | 4 (Category, Product, Store, SyncStatus/base)                                                   |
| **Database tables**           | 4 (users, categories, products, stores)                                                         |
| **Test files**                | ~14–18 (matching work-unit convention)                                                          |
| **New npm dependencies**      | 1 (`expo-secure-store`)                                                                         |
| **Files modified from 001-a** | ~5–8 (navigation types, RootNavigator, TabNavigator, useAuthStore, database/index)              |

### File Breakdown by Layer

| Layer                 | Files                                           | Est. LoC |
| --------------------- | ----------------------------------------------- | -------- |
| **Auth screens**      | LoginScreen, RegisterScreen + tests             | ~200–250 |
| **Category module**   | Repository, ListScreen, FormScreen + tests      | ~250–300 |
| **Product module**    | Repository, ListScreen, FormScreen + tests      | ~300–350 |
| **Store module**      | Repository, ListScreen, FormScreen + tests      | ~250–300 |
| **Database**          | Migration, schema types, connection update      | ~150–200 |
| **Repositories**      | Base interface + 3 implementations              | ~200–250 |
| **Navigation**        | Updated RootNavigator, TabNavigator, types      | ~100–150 |
| **Types**             | Entity type definitions                         | ~50–80   |
| **Auth store update** | Updated useAuthStore with login/register/logout | ~50–80   |

---

## 10. Open Questions

These must be resolved before the spec phase can produce actionable tasks:

| #   | Question                                                                                                                                                                                                                        | Why it matters                                                                                                              | Impact if unresolved                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Q1  | **Should the migration system track applied migrations in a separate `_migrations` table, or use a simpler approach (e.g., checking if a table exists)?**                                                                       | Affects how future schema changes (001-c, 001-d) will be handled. A `_migrations` table is more robust but adds complexity. | If we skip migration tracking, future schema migrations become harder to manage and may cause data loss.                    |
| Q2  | **When the user logs out, should we delete ALL user-scoped local data (categories, products, stores) or keep it and just hide it?**                                                                                             | Affects data recovery if the user logs back in. Deleting is cleaner for multi-user devices but loses offline work.          | Over-deletion causes user frustration; under-deletion risks data leakage between accounts on shared devices.                |
| Q3  | **Should the Home tab remain a simple screen, or become a dashboard-style entry point showing counts of categories, products, and stores?**                                                                                     | Affects navigation design and user onboarding experience.                                                                   | A richer Home tab improves UX but adds scope. A simple tab keeps focus on the 3 entity lists.                               |
| Q4  | **What validation library (if any) should we use for form validation?** The current Input component supports error display, but we need validation logic. Options: manual (no dependency), `zod` (adds ~10KB), or custom hooks. | Affects bundle size, testability, and consistency across forms.                                                             | No library = more manual code to maintain; `zod` = extra dependency but reusable schema validation; custom = middle ground. |
| Q5  | **Should product creation require the user to first create a category, or should there be a default "Uncategorized" option?**                                                                                                   | Affects the user flow for first-time product creation (chicken-and-egg problem).                                            | Requiring a category first forces a specific order; allowing "Uncategorized" is more flexible but may lead to messy data.   |

---

## 11. Rollback Plan

If this chain introduces critical issues that cannot be resolved:

1. **Database rollback**: Since migrations create new tables, dropping the database file (`mi-purchase.db`) resets to a clean state. No existing user data is lost because there is no production data yet.
2. **Navigation rollback**: If the Auth stack causes navigation issues, revert `RootNavigator.tsx` and `types.ts` to 001-a state.
3. **Dependency rollback**: If `expo-secure-store` causes issues on a platform, temporarily fall back to `@react-native-async-storage/async-storage` for JWT storage (less secure but functional).
4. **Feature flag**: No feature flags are introduced in this chain. If needed for future chains, the Auth guard in RootNavigator can be toggled.

---

## 12. Migration to Future Chains

This chain is explicitly designed to feed into subsequent chains:

- **001-c (Purchases)**: Will add `purchases`, `purchase_items`, `purchase_groups` tables and use `ProductRepository` and `StoreRepository` for product/store selection in purchase creation.
- **001-d (Sync)**: Will add a `SyncService` that reads `sync_status` from all repositories, pushes changes to `POST /sync/push`, and pulls remote changes from `GET /sync/pull`.

The repository interface (`BaseRepository`) and `sync_status` pattern established here are prerequisites for the sync engine.

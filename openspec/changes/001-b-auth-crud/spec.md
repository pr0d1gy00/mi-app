# Delta Spec — 001-b: Auth + Categories + Products + Stores

## Purpose

Define WHAT must be true after chain 001-b completes: authenticated user flows (login, register, logout, auto-login), local SQLite schema with migration tracking, repository pattern for Categories/Products/Stores, full CRUD screens with Zod validation, navigation guards, and dashboard counts. Sync to the NestJS backend remains a separate async process (001-d).

No canonical specs exist yet for any domain. These are full domain specs written as deltas; on archive they will be copied into `openspec/specs/{domain}/spec.md`.

---

## Domain: Auth

### REQ-001-b-001: Login Screen

The system MUST provide a Login screen with email + password form, Zod validation, loading/error states, and redirect to MainTabs on successful authentication.

#### Scenario: Successful login

- GIVEN the user is on the Login screen
- AND the user enters a valid email and correct password
- WHEN the user taps the "Login" button
- THEN the system calls the backend `/auth/login` endpoint
- AND on success, saves the JWT to SecureStore
- AND updates the auth store with the token and user object
- AND navigates to the MainTabs navigator

#### Scenario: Login validation failure

- GIVEN the user is on the Login screen
- AND the email field is empty or malformed
- WHEN the user taps the "Login" button
- THEN the system displays Zod-derived inline error messages
- AND does NOT call the backend

#### Scenario: Login API error

- GIVEN the user enters valid-format credentials
- AND the backend returns 401 (invalid credentials) or a network error
- WHEN the user taps the "Login" button
- THEN the system displays an error message below the form
- AND does NOT navigate away from Login

#### Scenario: Loading state during login

- GIVEN the user has submitted valid credentials
- WHEN the backend call is in-flight
- THEN the Login button shows a loading indicator and is disabled
- AND the form fields are disabled

### REQ-001-b-002: Register Screen

The system MUST provide a Register screen with email + password + name form, Zod validation, loading/error states, and auto-login on successful registration.

#### Scenario: Successful registration

- GIVEN the user is on the Register screen
- AND the user enters a valid email, password, and name
- WHEN the user taps the "Register" button
- THEN the system calls the backend `/auth/register` endpoint
- AND on success, saves the JWT to SecureStore
- AND updates the auth store with the token and user object
- AND navigates to the MainTabs navigator

#### Scenario: Registration validation failure

- GIVEN the user is on the Register screen
- AND the password is too short or the email is malformed
- WHEN the user taps the "Register" button
- THEN the system displays Zod-derived inline error messages
- AND does NOT call the backend

#### Scenario: Registration API conflict

- GIVEN the user enters an email already registered on the backend
- WHEN the user taps the "Register" button
- THEN the system displays a conflict error message (e.g., "Email already in use")
- AND does NOT navigate away from Register

### REQ-001-b-003: JWT Persistence via SecureStore

The system MUST store, read, and delete JWT tokens using Expo SecureStore for persistence across app launches.

#### Scenario: Token saved on login

- GIVEN the backend returns a JWT on successful login
- WHEN the auth store processes the response
- THEN the token is saved to SecureStore under a consistent key (e.g., `auth_token`)

#### Scenario: Token read on app start

- GIVEN a valid JWT was previously saved to SecureStore
- WHEN the app initializes the auth layer
- THEN the system reads the token from SecureStore
- AND the token is set in the auth store state

#### Scenario: Token deleted on logout

- GIVEN the user is authenticated with a token in SecureStore
- WHEN the user triggers logout
- THEN the token is deleted from SecureStore
- AND the auth store token field is set to null

### REQ-001-b-004: Auto-login on App Start

The system MUST check SecureStore for a valid JWT on app launch and skip the auth screens if a token exists.

#### Scenario: Token exists — skip auth

- GIVEN a valid JWT exists in SecureStore from a previous session
- WHEN the app finishes initialization
- THEN the system reads the token from SecureStore
- AND sets `isAuthenticated = true` in the auth store
- AND navigates directly to MainTabs

#### Scenario: No token — show auth

- GIVEN no token exists in SecureStore
- WHEN the app finishes initialization
- THEN the system sets `isAuthenticated = false` in the auth store
- AND displays the Auth stack (Login screen)

#### Scenario: Expired/invalid token on backend validation

- GIVEN a token exists in SecureStore
- AND the backend rejects the token when validated (e.g., 401 on `/auth/me`)
- WHEN the app attempts auto-login
- THEN the system deletes the token from SecureStore
- AND sets `isAuthenticated = false`
- AND displays the Auth stack

### REQ-001-b-005: Logout — Clear All User-Scoped Data

The system MUST delete the JWT from SecureStore, clear all user-scoped SQLite data (categories, products, stores, user record), and reset the auth store state when the user logs out, to support multi-user device safety.

#### Scenario: Full logout

- GIVEN the user is authenticated with local SQLite data
- WHEN the user triggers logout
- THEN the system deletes the JWT from SecureStore
- AND deletes all rows from `categories`, `products`, `stores`, and `users` tables
- AND resets the auth store to `{ isAuthenticated: false, user: null, token: null }`
- AND navigates to the Login screen

#### Scenario: Logout with no local data

- GIVEN the user is authenticated but has no local SQLite data
- WHEN the user triggers logout
- THEN the system deletes the JWT from SecureStore
- AND resets the auth store
- AND navigates to the Login screen

### REQ-001-b-006: useAuthStore with Login/Register/Logout Methods

The system MUST replace the placeholder `useAuthStore` with real `login()`, `register()`, and `logout()` methods that coordinate SecureStore, the API client, and state.

#### Scenario: login() success

- GIVEN `login(email, password)` is called with valid credentials
- WHEN the backend returns a JWT and user object
- THEN the token is saved to SecureStore
- AND the user and token are set in the store
- AND `isAuthenticated` becomes `true`

#### Scenario: login() failure

- GIVEN `login(email, password)` is called with invalid credentials
- WHEN the backend returns an error
- THEN the store state remains unchanged
- AND the method rejects with the error for the screen to display

#### Scenario: register() success

- GIVEN `register(email, password, name)` is called with valid data
- WHEN the backend returns a JWT and user object
- THEN the token is saved to SecureStore
- AND the user and token are set in the store
- AND `isAuthenticated` becomes `true`

#### Scenario: logout()

- GIVEN `logout()` is called
- WHEN it executes
- THEN the JWT is deleted from SecureStore
- AND user-scoped SQLite data is cleared
- AND the store resets to initial state

### REQ-001-b-007: Navigation Auth Guard

The system MUST conditionally render the Auth stack (Login, Register) when `isAuthenticated` is false, and the MainTabs navigator when `isAuthenticated` is true.

#### Scenario: Unauthenticated user

- GIVEN `isAuthenticated` is false in the auth store
- WHEN the RootNavigator renders
- THEN the Auth stack is displayed as the root navigator
- AND MainTabs is NOT accessible

#### Scenario: Authenticated user

- GIVEN `isAuthenticated` is true in the auth store
- WHEN the RootNavigator renders
- THEN the MainTabs navigator is displayed as the root
- AND Auth screens are NOT accessible

#### Scenario: Auth state transitions

- GIVEN the user is on the Login screen
- AND the user successfully logs in
- WHEN the auth store updates `isAuthenticated = true`
- THEN the RootNavigator re-renders and displays MainTabs

---

## Domain: Database Schema & Migrations

### REQ-001-b-008: Migration System with `_migrations` Tracking Table

The system MUST implement a migration system using a `_migrations` tracking table that records applied migration names and timestamps, rather than relying solely on table-existence checks.

#### Scenario: First run — no tables exist

- GIVEN the database has never been initialized
- WHEN `runMigrations()` is called
- THEN the system creates the `_migrations` table if it does not exist
- AND executes all pending migrations in order
- AND records each migration name and timestamp in `_migrations`

#### Scenario: Subsequent run — some migrations already applied

- GIVEN some migrations are recorded in `_migrations`
- WHEN `runMigrations()` is called
- THEN the system skips already-applied migrations
- AND executes only pending migrations
- AND records newly applied migrations in `_migrations`

#### Scenario: Migration failure

- GIVEN a migration SQL statement fails
- WHEN `runMigrations()` is executing
- THEN the system halts further migrations
- AND throws a `DatabaseError` with the failed migration name

### REQ-001-b-009: Users Table Schema

The system MUST create a `users` table containing all backend User model fields plus `sync_status` and `last_synced_at` columns.

#### Scenario: Table creation

- GIVEN migrations are running
- WHEN the users migration executes
- THEN the table is created with columns:
  - `id` TEXT PRIMARY KEY
  - `email` TEXT NOT NULL UNIQUE
  - `name` TEXT
  - `password` TEXT NOT NULL
  - `preferred_currency` TEXT NOT NULL DEFAULT 'USD'
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL
  - `deleted_at` TEXT
  - `sync_status` TEXT NOT NULL DEFAULT 'synced'
  - `last_synced_at` TEXT

#### Scenario: Date format

- GIVEN the users table exists
- WHEN a row is inserted
- THEN `created_at`, `updated_at`, `deleted_at`, and `last_synced_at` are stored as ISO 8601 TEXT

### REQ-001-b-010: Categories Table Schema

The system MUST create a `categories` table containing all backend Category model fields plus `sync_status`, `last_synced_at`, and a unique constraint on `(name, user_id)`.

#### Scenario: Table creation

- GIVEN migrations are running
- WHEN the categories migration executes
- THEN the table is created with columns:
  - `id` TEXT PRIMARY KEY
  - `name` TEXT NOT NULL
  - `metadata` TEXT (JSON)
  - `user_id` TEXT
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL
  - `deleted_at` TEXT
  - `sync_status` TEXT NOT NULL DEFAULT 'synced'
  - `last_synced_at` TEXT
- AND a UNIQUE constraint on `(name, user_id)` is enforced

### REQ-001-b-011: Products Table Schema

The system MUST create a `products` table containing all backend Product model fields plus `sync_status`, `last_synced_at`, foreign keys to categories, an index on name and category_id, and a unique constraint on barcode.

#### Scenario: Table creation

- GIVEN migrations are running
- WHEN the products migration executes
- THEN the table is created with columns:
  - `id` TEXT PRIMARY KEY
  - `name` TEXT NOT NULL
  - `brand` TEXT
  - `category_id` TEXT NOT NULL
  - `metadata` TEXT (JSON)
  - `barcode` TEXT UNIQUE
  - `user_id` TEXT NOT NULL
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL
  - `deleted_at` TEXT
  - `sync_status` TEXT NOT NULL DEFAULT 'synced'
  - `last_synced_at` TEXT
- AND a FOREIGN KEY on `category_id` references `categories(id)`
- AND indexes exist on `name` and `category_id`
- AND `barcode` is UNIQUE (allowing NULL)

### REQ-001-b-012: Stores Table Schema

The system MUST create a `stores` table containing all backend Store model fields plus `sync_status`, `last_synced_at`, and a unique constraint on `(name, location)`.

#### Scenario: Table creation

- GIVEN migrations are running
- WHEN the stores migration executes
- THEN the table is created with columns:
  - `id` TEXT PRIMARY KEY
  - `name` TEXT NOT NULL
  - `location` TEXT
  - `user_id` TEXT
  - `created_at` TEXT NOT NULL
  - `updated_at` TEXT NOT NULL
  - `deleted_at` TEXT
  - `sync_status` TEXT NOT NULL DEFAULT 'synced'
  - `last_synced_at` TEXT
- AND a UNIQUE constraint on `(name, location)` is enforced

### REQ-001-b-013: Foreign Keys Enabled via PRAGMA

The system MUST enable SQLite foreign key enforcement via `PRAGMA foreign_keys = ON` on every database connection.

#### Scenario: FK enforcement on insert

- GIVEN foreign keys are enabled
- WHEN a product is inserted with a non-existent `category_id`
- THEN the insert fails with a foreign key constraint violation

#### Scenario: FK enforcement on delete

- GIVEN foreign keys are enabled
- WHEN a category with referenced products is deleted
- THEN the delete is blocked (or cascades per FK definition)

### REQ-001-b-014: Dates Stored as ISO 8601 TEXT

The system MUST store all date-time values as ISO 8601 formatted TEXT in SQLite columns.

#### Scenario: Date insertion format

- GIVEN a record is created with `created_at`
- WHEN the value is stored
- THEN it is a valid ISO 8601 string (e.g., `2026-06-11T00:00:00.000Z`)

---

## Domain: Repository Pattern

### REQ-001-b-015: BaseRepository Interface with Typed Generics

The system MUST define a `BaseRepository<T>` interface that provides typed CRUD operations for any entity extending `BaseEntity`.

#### Scenario: BaseRepository contract

- GIVEN an entity type `T extends BaseEntity`
- WHEN a repository implements `BaseRepository<T>`
- THEN it provides methods: `create`, `getById`, `getAll`, `update`, `softDelete`

### REQ-001-b-016: CategoryRepository

The system MUST provide a `CategoryRepository` implementing `BaseRepository<Category>` with methods: `create`, `getById`, `getAll`, `search`, `update`, `softDelete`, and `getBySyncStatus`.

#### Scenario: Create category

- GIVEN a valid `CategoryInsert` DTO
- WHEN `create(dto)` is called
- THEN a new row is inserted with `sync_status = 'created'`
- AND the full `Category` object is returned with a generated UUID

#### Scenario: Search categories by name

- GIVEN categories exist in the database
- WHEN `search('electronics')` is called
- THEN only categories whose name contains 'electronics' (case-insensitive) are returned
- AND soft-deleted categories are excluded

#### Scenario: Get by sync status

- GIVEN categories with varying `sync_status` values exist
- WHEN `getBySyncStatus('created')` is called
- THEN only categories with `sync_status = 'created'` and `deleted_at IS NULL` are returned

### REQ-001-b-017: ProductRepository

The system MUST provide a `ProductRepository` implementing `BaseRepository<Product>` with methods: `create`, `getById`, `getAll`, `search`, `getByCategoryId`, `update`, `softDelete`, and `getBySyncStatus`.

#### Scenario: Create product

- GIVEN a valid `ProductInsert` DTO with an existing `category_id`
- WHEN `create(dto)` is called
- THEN a new row is inserted with `sync_status = 'created'`
- AND the full `Product` object is returned

#### Scenario: Get by category

- GIVEN products exist in the database
- WHEN `getByCategoryId('cat-uuid')` is called
- THEN only non-deleted products with `category_id = 'cat-uuid'` are returned

#### Scenario: Search products by name

- GIVEN products exist in the database
- WHEN `search('milk')` is called
- THEN only products whose name contains 'milk' (case-insensitive) are returned
- AND soft-deleted products are excluded

### REQ-001-b-018: StoreRepository

The system MUST provide a `StoreRepository` implementing `BaseRepository<Store>` with methods: `create`, `getById`, `getAll`, `search`, `update`, `softDelete`, and `getBySyncStatus`.

#### Scenario: Create store

- GIVEN a valid `StoreInsert` DTO
- WHEN `create(dto)` is called
- THEN a new row is inserted with `sync_status = 'created'`
- AND the full `Store` object is returned

#### Scenario: Search stores by name

- GIVEN stores exist in the database
- WHEN `search('walmart')` is called
- THEN only stores whose name or location contains 'walmart' (case-insensitive) are returned
- AND soft-deleted stores are excluded

### REQ-001-b-019: sync_status Auto-Management on CRUD

The system MUST automatically manage `sync_status` on every CRUD operation: `'created'` on insert, `'updated'` on update, `'deleted'` on soft-delete, and `'synced'` on read from server (future sync process).

#### Scenario: Create sets 'created'

- GIVEN a new entity is inserted via any repository
- WHEN the insert succeeds
- THEN `sync_status` is set to `'created'`
- AND `last_synced_at` is set to the current ISO 8601 timestamp

#### Scenario: Update sets 'updated'

- GIVEN an entity with `sync_status = 'synced'` is updated
- WHEN the update succeeds
- THEN `sync_status` is changed to `'updated'`
- AND `updated_at` and `last_synced_at` are refreshed

#### Scenario: Soft-delete sets 'deleted'

- GIVEN an entity with any `sync_status` is soft-deleted
- WHEN `softDelete(id)` is called
- THEN `deleted_at` is set to the current timestamp
- AND `sync_status` is changed to `'deleted'`
- AND `last_synced_at` is refreshed

---

## Domain: Entity Types

### REQ-001-b-020: Category, Product, Store TypeScript Interfaces

The system MUST define TypeScript interfaces for `Category`, `Product`, and `Store` that match the backend Prisma models plus local sync fields.

#### Scenario: Category interface

- GIVEN the `Category` interface is defined
- THEN it includes: `id`, `name`, `metadata`, `userId`, `createdAt`, `updatedAt`, `deletedAt`, `syncStatus`, `lastSyncedAt`

#### Scenario: Product interface

- GIVEN the `Product` interface is defined
- THEN it includes: `id`, `name`, `brand`, `categoryId`, `metadata`, `barcode`, `userId`, `createdAt`, `updatedAt`, `deletedAt`, `syncStatus`, `lastSyncedAt`

#### Scenario: Store interface

- GIVEN the `Store` interface is defined
- THEN it includes: `id`, `name`, `location`, `userId`, `createdAt`, `updatedAt`, `deletedAt`, `syncStatus`, `lastSyncedAt`

### REQ-001-b-021: SyncStatus Type and BaseEntity Interface

The system MUST define a `SyncStatus` union type and a `BaseEntity` interface that all entity interfaces extend.

#### Scenario: SyncStatus type

- GIVEN the `SyncStatus` type is defined
- THEN it is `'synced' | 'created' | 'updated' | 'deleted'`

#### Scenario: BaseEntity interface

- GIVEN the `BaseEntity` interface is defined
- THEN it includes: `id`, `createdAt`, `updatedAt`, `deletedAt`, `syncStatus`, `lastSyncedAt`

---

## Domain: Categories Module

### REQ-001-b-022: CategoryListScreen

The system MUST provide a CategoryListScreen displaying categories in a list with search, a FAB to create new categories, pull-to-refresh, and an empty state when no categories exist.

#### Scenario: Display categories

- GIVEN categories exist for the user
- WHEN the CategoryListScreen renders
- THEN each category is displayed as a Card with its name
- AND soft-deleted categories are NOT shown

#### Scenario: Search filter

- GIVEN categories exist in the list
- WHEN the user types in the search input
- THEN the list filters to categories whose name matches the search text (case-insensitive)

#### Scenario: Empty state

- GIVEN no categories exist
- WHEN the CategoryListScreen renders
- THEN an empty state message is displayed with a prompt to create the first category

#### Scenario: Pull-to-refresh

- GIVEN the CategoryListScreen is visible
- WHEN the user pulls down to refresh
- THEN the list reloads from the local SQLite database

### REQ-001-b-023: CategoryFormScreen

The system MUST provide a CategoryFormScreen for creating and editing categories with Zod validation and a unique name check.

#### Scenario: Create category

- GIVEN the user is on the CategoryFormScreen in create mode
- AND enters a valid, unique name
- WHEN the user taps "Save"
- THEN Zod validates the input
- AND the CategoryRepository creates the record
- AND the system navigates back to CategoryListScreen

#### Scenario: Unique name validation

- GIVEN a category named "Food" already exists
- WHEN the user tries to create another category named "Food"
- THEN Zod + repository validation rejects the duplicate
- AND an inline error is displayed

#### Scenario: Edit category

- GIVEN the user opens the form with an existing category
- WHEN the user modifies the name and taps "Save"
- THEN the CategoryRepository updates the record
- AND `sync_status` is set to `'updated'`
- AND the system navigates back to CategoryListScreen

### REQ-001-b-024: Category Soft Delete

The system MUST soft-delete categories by setting `deleted_at` and `sync_status = 'deleted'` instead of removing the row.

#### Scenario: Soft delete category

- GIVEN a category exists with `sync_status = 'synced'`
- WHEN the user triggers delete on the category
- THEN `deleted_at` is set to the current timestamp
- AND `sync_status` is set to `'deleted'`
- AND the category no longer appears in the list

---

## Domain: Products Module

### REQ-001-b-025: ProductListScreen

The system MUST provide a ProductListScreen displaying products in a list with search, optional category filter, a FAB to create new products, and an empty state.

#### Scenario: Display products

- GIVEN products exist for the user
- WHEN the ProductListScreen renders
- THEN each product is displayed as a Card with its name, brand, and category name
- AND soft-deleted products are NOT shown

#### Scenario: Category filter

- GIVEN a category filter dropdown is visible
- WHEN the user selects a category
- THEN the list filters to only products in that category

#### Scenario: Empty state

- GIVEN no products exist
- WHEN the ProductListScreen renders
- THEN an empty state message is displayed with a prompt to create the first product

### REQ-001-b-026: ProductFormScreen

The system MUST provide a ProductFormScreen for creating and editing products with a category picker and Zod validation.

#### Scenario: Create product with category

- GIVEN the user is on the ProductFormScreen in create mode
- AND categories exist in the database
- WHEN the user fills in name, selects a category, and taps "Save"
- THEN Zod validates the input
- AND the ProductRepository creates the record
- AND the system navigates back to ProductListScreen

#### Scenario: Create product without category

- GIVEN the user is on the ProductFormScreen in create mode
- AND no categories exist in the database
- WHEN the user fills in name and taps "Save"
- THEN the system auto-creates a "Sin categoría" category first
- THEN the product is created with that category

#### Scenario: Edit product

- GIVEN the user opens the form with an existing product
- WHEN the user modifies fields and taps "Save"
- THEN the ProductRepository updates the record
- AND `sync_status` is set to `'updated'`
- AND the system navigates back to ProductListScreen

### REQ-001-b-027: Auto-create "Sin categoría"

The system MUST automatically create a default category named "Sin categoría" when the first product is created and no categories exist in the database.

#### Scenario: Auto-create on first product

- GIVEN no categories exist in the database
- WHEN a product is being created without an explicit category selection
- THEN the system creates a category named "Sin categoría" first
- AND assigns the new product to that category
- AND the "Sin categoría" category has `sync_status = 'created'`

#### Scenario: Skip if category exists

- GIVEN at least one category already exists
- WHEN a product is created
- THEN no default category is auto-created

### REQ-001-b-028: Product Soft Delete

The system MUST soft-delete products by setting `deleted_at` and `sync_status = 'deleted'`. Products referenced by existing purchase items MUST NOT be deletable (future enforcement when purchases module is built).

#### Scenario: Soft delete product

- GIVEN a product exists with no purchase item references
- WHEN the user triggers delete on the product
- THEN `deleted_at` is set to the current timestamp
- AND `sync_status` is set to `'deleted'`
- AND the product no longer appears in the list

#### Scenario: Delete blocked by purchase reference (future)

- GIVEN a product is referenced by at least one purchase item
- WHEN the user triggers delete on the product
- THEN the delete is rejected with an error message
- AND the product remains in the database

---

## Domain: Stores Module

### REQ-001-b-029: StoreListScreen

The system MUST provide a StoreListScreen displaying stores in a list with search, a FAB to create new stores, and an empty state.

#### Scenario: Display stores

- GIVEN stores exist for the user
- WHEN the StoreListScreen renders
- THEN each store is displayed as a Card with its name and location
- AND soft-deleted stores are NOT shown

#### Scenario: Search filter

- GIVEN stores exist in the list
- WHEN the user types in the search input
- THEN the list filters to stores whose name or location matches the search text (case-insensitive)

#### Scenario: Empty state

- GIVEN no stores exist
- WHEN the StoreListScreen renders
- THEN an empty state message is displayed with a prompt to create the first store

### REQ-001-b-030: StoreFormScreen

The system MUST provide a StoreFormScreen for creating and editing stores with Zod validation and a unique name+location check.

#### Scenario: Create store

- GIVEN the user is on the StoreFormScreen in create mode
- AND enters a valid, unique name+location combination
- WHEN the user taps "Save"
- THEN Zod validates the input
- AND the StoreRepository creates the record
- AND the system navigates back to StoreListScreen

#### Scenario: Unique name+location validation

- GIVEN a store with name "Walmart" and location "Miami" already exists
- WHEN the user tries to create another store with the same name+location
- THEN the repository rejects the duplicate
- AND an inline error is displayed

#### Scenario: Edit store

- GIVEN the user opens the form with an existing store
- WHEN the user modifies the name or location and taps "Save"
- THEN the StoreRepository updates the record
- AND `sync_status` is set to `'updated'`
- AND the system navigates back to StoreListScreen

---

## Domain: Navigation

### REQ-001-b-031: Auth Stack in RootNavigator

The system MUST include an Auth stack (Login, Register screens) in the RootNavigator, conditionally rendered based on the auth store's `isAuthenticated` state.

#### Scenario: Auth stack rendered

- GIVEN `isAuthenticated` is false
- WHEN RootNavigator renders
- THEN an AuthStackNavigator with Login and Register screens is the root
- AND users can navigate between Login and Register

#### Scenario: MainTabs rendered

- GIVEN `isAuthenticated` is true
- WHEN RootNavigator renders
- THEN MainTabs is the root navigator
- AND Auth screens are not in the navigation tree

### REQ-001-b-032: Entity Form Screens in Navigation Stack

The system MUST add CategoryForm, ProductForm, and StoreForm screens to the MainTabs stack navigators so they can be navigated to from their respective list screens.

#### Scenario: Navigate to CategoryForm

- GIVEN the user is on CategoryListScreen
- WHEN the user taps the FAB
- THEN the CategoryFormScreen is pushed onto the stack

#### Scenario: Navigate to ProductForm

- GIVEN the user is on ProductListScreen
- WHEN the user taps the FAB
- THEN the ProductFormScreen is pushed onto the stack

#### Scenario: Navigate to StoreForm

- GIVEN the user is on StoreListScreen
- WHEN the user taps the FAB
- THEN the StoreFormScreen is pushed onto the stack

### REQ-001-b-033: Home Tab — Dashboard Entry with Entity Counts

The system MUST replace the placeholder Home tab with a dashboard-entry screen displaying 3 cards showing entity counts: Categories, Products, and Stores.

#### Scenario: Display counts

- GIVEN the user is on the Home tab
- AND the database contains 5 categories, 12 products, and 3 stores
- WHEN the Home screen renders
- THEN it displays 3 cards:
  - "Categories" with count 5
  - "Products" with count 12
  - "Stores" with count 3

#### Scenario: Zero counts

- GIVEN no entities exist in the database
- WHEN the Home screen renders
- THEN all 3 cards display count 0

#### Scenario: Counts refresh

- GIVEN the user creates a new product from the ProductListScreen
- AND navigates back to the Home tab
- WHEN the Home screen re-renders
- THEN the Products count reflects the new total

---

## Domain: Design & UX

### REQ-001-b-034: All Screens Use Existing Shared Components

The system MUST use existing shared components (Screen, Card, Button, Input, Typography, Badge, LoadingSpinner) for all new screens in 001-b.

#### Scenario: Screen layout

- GIVEN any new screen in 001-b
- WHEN it renders
- THEN it wraps content in the existing `Screen` component
- AND uses `Card`, `Button`, `Input`, and `Typography` for form elements and lists

### REQ-001-b-035: Dark Mode Correct Rendering

The system MUST ensure all new screens render correctly in dark mode using the existing theme tokens.

#### Scenario: Dark mode on auth screens

- GIVEN the theme mode is set to dark
- WHEN the Login or Register screen renders
- THEN background, text, input, and button colors use the dark theme token values

#### Scenario: Dark mode on entity screens

- GIVEN the theme mode is set to dark
- WHEN any entity list or form screen renders
- THEN all colors use the dark theme token values from `useTheme()`

### REQ-001-b-036: Loading, Error, and Empty States

The system MUST display visible loading, error, and empty states on all new screens.

#### Scenario: Loading state on list screens

- GIVEN a list screen is fetching data from SQLite
- WHEN the query is in-flight
- THEN a `LoadingSpinner` is displayed

#### Scenario: Error state

- GIVEN a database query fails
- WHEN the screen renders
- THEN an error message is displayed with a retry option

#### Scenario: Empty state

- GIVEN a list query returns zero results
- WHEN the screen renders
- THEN an empty state message with a relevant icon and action prompt is displayed

### REQ-001-b-037: Toast Notifications for Success/Error Operations

The system MUST display toast notifications for successful CRUD operations and errors.

#### Scenario: Success toast on create

- GIVEN a category is successfully created
- WHEN the operation completes
- THEN a success toast is displayed (e.g., "Category created")

#### Scenario: Error toast on failure

- GIVEN a database or API operation fails
- WHEN the error is caught
- THEN an error toast is displayed with a brief description

---

## Risks and Assumptions

1. **No existing canonical specs**: All domains (Auth, Database Schema, Repository, Entity Types, Categories, Products, Stores, Navigation, Design & UX) are written as full specs since no `openspec/specs/{domain}/spec.md` files exist. On archive, each will be copied to its canonical location.
2. **Backend auth endpoints assumed**: The spec assumes `/auth/login` and `/auth/register` endpoints exist on the NestJS backend. If endpoint paths differ, the API client layer will need adjustment.
3. **Purchase-item reference check deferred**: REQ-001-b-028 references purchase-item FK checks that cannot be enforced until the Purchases module (001-c or later) is built. The repository should guard against this at that time.
4. **`_migrations` table is app-scoped, not user-scoped**: Since SQLite is per-device, migrations run once per app installation, not per user. On logout + re-login with a different user, the schema already exists; data is cleared by REQ-001-b-005.

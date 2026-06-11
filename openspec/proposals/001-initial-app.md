# Proposal 001 — mi-purchase-app: Offline-First Purchase Tracker

| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| **Change Name** | `001-initial-app` — Greenfield React Native purchase tracker |
| **Status**      | Draft — awaiting review                                      |
| **Date**        | 2026-06-11                                                   |
| **Author**      | Gentle AI SDD                                                |
| **Phase**       | Proposal (interactive)                                       |

---

## 1. Description

Build a greenfield, offline-first React Native app (Expo SDK 56+, TypeScript) that lets users register purchases at different stores, group purchases, analyze historical prices, compare products, and handle multiple currencies — all while working seamlessly offline and syncing to an existing NestJS + Prisma backend when connectivity is available.

The app targets a premium iOS-inspired design language (Apple Wallet / Health / Stocks aesthetic) with dark mode from day one.

---

## 2. Problem Statement

**User pain**: Consumers who shop across stores and currencies lack a simple tool to track what they've bought, at what price, over time — especially in markets with volatile exchange rates (e.g., Venezuela). Existing tools are either too generic (spreadsheets), too broad (full accounting suites), or require constant internet connectivity.

**Opportunity**: A mobile-first, offline-capable purchase tracker with a polished UI and multi-currency awareness can serve power shoppers who want price history, product comparison, and spend analytics without needing connectivity at checkout.

**Why now**: The backend (NestJS + Prisma, full CRUD + sync) is already built and stable. Building the mobile layer unlocks the complete product.

---

## 3. Proposed Solution

### 3.1 Architecture Overview

```
src/
  app/              # App entry, providers (QueryClient, Zustand, theme)
  modules/          # 8 feature modules (auth, categories, products, stores,
                    #   purchases, purchaseGroups, exchangeRates, sync)
  database/         # Expo SQLite schema, migrations, connection manager
  repositories/     # Data access layer (Repository Pattern) — abstracts
                    #   local DB vs. remote API
  services/         # Business logic (SyncService, CurrencyService, etc.)
  hooks/            # Custom hooks per module
  navigation/       # React Navigation setup (stack + tab navigators)
  components/       # Shared UI components (cards, lists, forms, widgets)
  theme/            # Colors, typography, spacing, dark/light tokens
  shared/           # Shared utilities (validation, formatting, constants)
  types/            # TypeScript interfaces / DTOs
  utils/            # Helpers (date, currency, idempotency)
```

**Key design decisions**:

- **Repository Pattern** shields business logic from data source (SQLite vs. REST API). Each domain entity has a repository interface with local-first and remote-capable implementations.
- **TanStack Query** handles server-state caching, stale-while-revalidate, and optimistic updates. Combined with Zustand for app-wide UI state (selected store, active purchase group, theme).
- **Expo SQLite** stores all domain tables plus `sync_status` and `last_synced_at` metadata. Soft-delete mirrors the backend schema.
- **Sync system**: `SyncService` orchestrates `PullChangesUseCase` (GET `/sync/pull?lastPulledAt`) and `PushChangesUseCase` (POST `/sync/push`). Local records track `sync_status` (`created` | `updated` | `deleted` | `synced`). Conflict resolution is LWW (backend wins), matching backend behavior.

### 3.2 Chained Proposal Strategy

**Recommendation: Split into 4 chained proposals.** A single monolithic PR for all 8 modules would far exceed the 250-line review budget and produce un-reviewable diffs. The chained strategy keeps each proposal reviewable and independently testable.

| Chain #   | Proposal Name                              | Scope                                                                                                               | Estimated LoC |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------- |
| **001-a** | Scaffold + Theme + Navigation              | Expo init, folder structure, theme tokens, dark mode, root navigation, shared components                            | ~600–800      |
| **001-b** | Auth + Categories + Products + Stores      | Login/register, CRUD for categories/products/stores, SQLite schema for these 4, repositories, screens               | ~1200–1500    |
| **001-c** | Purchases + PurchaseItems + PurchaseGroups | Purchase creation flow (multi-item), grouping, history list, detail view, SQLite schema, repositories               | ~1500–1800    |
| **001-d** | ExchangeRates + Sync + Dashboard           | Exchange rate management, full sync engine, dashboard with widgets (monthly spend, purchase count, price variation) | ~1200–1500    |

**Each chained proposal**:

- Builds on the previous one (merge order matters)
- Has its own test suite (Jest + React Native Testing Library)
- Respects the 250-line review budget per PR (multiple PRs per proposal)
- Can be reviewed, merged, and validated independently

**This document serves as the umbrella proposal (001)**. Each chain item (001-a through 001-d) will have its own `proposal.md` with detailed specs, tasks, and acceptance criteria.

---

## 4. Scope Boundaries

### IN Scope (for the full 001 chain)

- [ ] Expo SDK 56+ project scaffold with TypeScript
- [ ] Complete folder architecture as specified
- [ ] Theme system with light/dark mode tokens
- [ ] React Navigation (tab + stack) with iOS-style transitions
- [ ] Expo SQLite local database with all 8 domain tables + sync metadata
- [ ] Repository Pattern for all entities (local + remote)
- [ ] Auth module (login, register, JWT persistence, logout)
- [ ] Categories module (CRUD, global vs. user-scoped)
- [ ] Products module (CRUD, barcode field, category linkage)
- [ ] Stores module (CRUD, unique name+location)
- [ ] Purchases module (create, list, detail, soft-delete)
- [ ] PurchaseItems module (line items within a purchase)
- [ ] PurchaseGroups module (create, assign purchases, list)
- [ ] ExchangeRates module (view, manual entry, multi-source)
- [ ] Sync module (pull, push, LWW conflict resolution, sync status UI)
- [ ] Dashboard with modular widgets (monthly spend, purchase count, price variation)
- [ ] Dark mode support across all screens
- [ ] iOS-inspired premium design (Apple Wallet / Health / Stocks)
- [ ] Offline-first: all CRUD works without connectivity
- [ ] TanStack Query + Zustand integration
- [ ] Repository Pattern implementation for all entities

### OUT of Scope (for the full 001 chain)

- [ ] Home inventory management (future growth feature)
- [ ] Shopping lists (future growth feature)
- [ ] Advanced reports / charts beyond basic dashboard widgets
- [ ] Budgets and price alerts (future growth feature)
- [ ] Data sharing / collaboration (future growth feature)
- [ ] Financial dashboard with bank integration (future growth feature)
- [ ] Barcode scanning / camera integration (future, though schema supports it)
- [ ] Push notifications
- [ ] Biometric authentication (can be added later)
- [ ] E2E testing with Detox (deferred — Jest + RNTL only for now)
- [ ] App Store / Play Store submission

---

## 5. User Stories / Personas

### Persona: Carlos, the price-conscious shopper

**Situation**: Carlos shops at 3–4 stores weekly in Caracas. Prices fluctuate with exchange rates. He wants to know if a product is cheaper this month than last, and which store had the best price.

**Stories**:

1. Carlos opens the app offline at a store, creates a new purchase, adds 5 products with prices in USD, selects the store, and saves. The app stores everything locally.
2. Later, when online, Carlos's purchases sync automatically to the backend.
3. Carlos views his purchase history in a wallet-style list, sorted by date, showing total spent per purchase.
4. Carlos groups purchases by trip ("Semana 1 Junio", "Feria del Hogar") and sees aggregated totals.
5. Carlos checks the exchange rate screen to see today's BCV and Paralelo rates before recording a VES-denominated purchase.

### Persona: María, the bulk buyer

**Situation**: María organizes group purchases with friends and wants to track who bought what.

**Stories**:

1. María creates a purchase group "Casa Nueva" and adds purchases from multiple stores over two weeks.
2. She views the group summary to see total spend across all purchases in the group.
3. She filters products by category to see how much she's spent on groceries vs. home goods.

---

## 6. Success Criteria

### Functional

- [ ] User can register, login, and see a persistent session across app restarts
- [ ] All 8 domain entities support full CRUD offline (create, read, update, soft-delete)
- [ ] Sync correctly pulls remote changes and pushes local changes with LWW resolution
- [ ] Sync status is visible to the user (last sync time, pending changes count)
- [ ] Dashboard renders at least 3 widgets: monthly spend, purchase count, price variation
- [ ] Dark mode toggles correctly and persists user preference
- [ ] Navigation flows are intuitive (tab bar for main sections, stack for drill-down)

### Quality

- [ ] All business logic has unit tests (Jest) with TDD cycle enforced
- [ ] UI components have snapshot/interaction tests (React Native Testing Library)
- [ ] Repository interfaces are fully typed (TypeScript strict mode)
- [ ] No `any` types in production code
- [ ] App launches in < 2 seconds on a mid-range device
- [ ] SQLite queries are indexed for common lookup patterns

### Design

- [ ] Visual design matches iOS-inspired premium aesthetic (Apple Wallet / Health)
- [ ] Cards have 20–24px radius, subtle shadows, clean typography hierarchy
- [ ] Color system matches specified tokens (light + dark)
- [ ] Animations are subtle (fade, scale, slide) — no exaggerated transitions

---

## 7. Non-Goals

These are explicitly excluded from the 001 chain and will be tracked as future proposals:

1. **Home inventory** — tracking items currently owned at home (separate domain, requires inventory-specific screens and logic)
2. **Shopping lists** — forward-looking purchase planning vs. backward-looking purchase tracking
3. **Advanced analytics** — beyond the 3 dashboard widgets; no chart libraries yet
4. **Budgets** — spending limits, alerts, forecasting
5. **Price alerts** — notifications when a product drops below a threshold
6. **Sharing / collaboration** — multi-user access to shared purchase groups
7. **Bank / financial dashboard integration** — no external financial APIs
8. **Barcode scanning** — the schema supports barcodes, but camera/scanning UI is deferred
9. **Biometric auth** — JWT storage via SecureStore is sufficient for v1
10. **E2E testing (Detox)** — deferred until core functionality is stable

---

## 8. Risks and Mitigations

| #   | Risk                                              | Likelihood | Impact | Mitigation                                                                                                                                |
| --- | ------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | SQLite schema mismatch with backend models        | Medium     | High   | Generate SQLite schema directly from Prisma schema as source of truth. Use migration scripts.                                             |
| R2  | Sync conflicts produce data loss                  | Medium     | High   | LWW resolution (backend wins) is backend-determined. Local UI should show conflict notifications. Push before pull to minimize conflicts. |
| R3  | TanStack Query + offline mode complexity          | High       | Medium | Use Query `offline` flag patterns. Repository layer abstracts local vs. remote. Test offline scenarios explicitly.                        |
| R4  | Scope creep from dashboard/analytics ambition     | High       | Medium | Strictly limit v1 dashboard to 3 widgets. Charts/advanced analytics are non-goals.                                                        |
| R5  | Design inconsistency across 8 modules             | Medium     | Medium | Build shared component library first (001-a). Use theme tokens, not inline styles. Design review at each chain merge.                     |
| R6  | JWT secret hardcoded (`super-secreto-compartido`) | Low        | High   | Use environment variables / Expo config. Never commit secrets. Flag for rotation in production.                                           |
| R7  | Decimal precision loss in JS for currency         | Medium     | High   | Use string-based decimal handling or a library (e.g., `decimal.js-light`). Never use raw `number` for currency math.                      |
| R8  | Expo SQLite version compatibility with SDK 56     | Low        | Medium | Test SQLite compatibility during scaffold phase. Pin versions in `package.json`.                                                          |

---

## 9. Dependencies

| Dependency                    | Type       | Status     | Notes                                                                                                                    |
| ----------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Backend API (`purchase-back`) | External   | ✅ Built   | NestJS + Prisma, running locally. JWT secret: `super-secreto-compartido`.                                                |
| Backend: Auth endpoints       | External   | ✅ Built   | `POST /auth/register`, `POST /auth/login`                                                                                |
| Backend: Sync endpoints       | External   | ✅ Built   | `GET /sync/pull`, `POST /sync/push`                                                                                      |
| Backend: CRUD endpoints       | External   | ⚠️ Partial | Users CRUD confirmed. Need to verify Categories, Products, Stores, Purchases, PurchaseGroups, ExchangeRates controllers. |
| Expo SDK 56+                  | Tooling    | Available  | Latest stable.                                                                                                           |
| Expo SQLite                   | Dependency | Available  | Verify compatibility with SDK 56.                                                                                        |
| React Navigation              | Dependency | Available  | Latest v6/v7.                                                                                                            |
| TanStack Query v5             | Dependency | Available  | React Native compatible.                                                                                                 |
| Zustand                       | Dependency | Available  | Latest stable.                                                                                                           |
| Axios                         | Dependency | Available  | HTTP client.                                                                                                             |
| Jest + RNTL                   | Testing    | Available  | TDD enforcement required.                                                                                                |

**Open dependency question**: The task description mentions CRUD for all entities but the backend controller scan only confirmed `users`, `auth`, and `sync` controllers. Need to verify whether categories, products, stores, purchases, purchaseGroups, and exchangeRates have full REST controllers or need to be built.

---

## 10. Estimated Impact

| Metric                             | Estimate                                           |
| ---------------------------------- | -------------------------------------------------- |
| Total estimated LoC (all 4 chains) | ~4,500–5,600                                       |
| Total PRs across all chains        | ~12–16 (at ~250 lines each)                        |
| Modules created                    | 8 feature modules                                  |
| SQLite tables                      | 8 domain tables + sync_status                      |
| Repository interfaces              | 8 + 1 sync repository                              |
| Screens                            | ~15–20 (auth, lists, forms, detail, dashboard)     |
| Shared components                  | ~10–15 (Card, Button, Input, ListRow, Badge, etc.) |
| Test files                         | ~40–60 (matching work-unit convention)             |

### Modules Touched (per chain)

| Chain | Modules                                        | Key Screens                                                                   |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| 001-a | `app/`, `theme/`, `components/`, `navigation/` | None (infrastructure)                                                         |
| 001-b | `auth/`, `categories/`, `products/`, `stores/` | Login, Register, CategoryList, ProductList, ProductForm, StoreList, StoreForm |
| 001-c | `purchases/`, `purchaseGroups/`                | PurchaseList, PurchaseCreate, PurchaseDetail, GroupList, GroupForm            |
| 001-d | `exchangeRates/`, `sync/`, dashboard widgets   | ExchangeRateList, SyncStatus, Dashboard                                       |

---

## 11. Open Questions

These must be resolved before the spec phase can produce actionable tasks:

| #   | Question                                                                                                                                                                                                 | Why it matters                                                                            | Impact if unresolved                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Q1  | **Does the backend have full REST CRUD controllers for Categories, Products, Stores, Purchases, PurchaseItems, PurchaseGroups, and ExchangeRates?** The scan only confirmed `users`, `auth`, and `sync`. | Determines whether mobile app can actually sync all entities or needs backend work first. | Could block 3 of 4 chains.                               |
| Q2  | **What is the expected API response shape for CRUD endpoints?** (e.g., `{ data: [...] }` vs. `[...]`, pagination, error format)                                                                          | Affects repository implementation, TanStack Query setup, and error handling.              | Inconsistent API handling across modules.                |
| Q3  | **Should the sync be manual ("pull now" button) or automatic (background on connectivity)?**                                                                                                             | Changes SyncService architecture and UX expectations.                                     | Over-engineering or under-delivering on sync UX.         |
| Q4  | **How should JWT tokens be stored on device?** (Expo SecureStore vs. AsyncStorage)                                                                                                                       | Security implications. SecureStore is more secure but has size limits.                    | Potential security review failure.                       |
| Q5  | **What is the base currency for the app?** The backend defaults to `VES` for local currency but `USD` for exchange rate base. Is the user's `preferredCurrency` the display currency for the dashboard?  | Affects all currency formatting, conversion logic, and dashboard widget calculations.     | Incorrect currency display across the app.               |
| Q6  | **Should the app support multiple users on the same device?** Or is it single-user (one account per device)?                                                                                             | Affects auth flow, data isolation, and SQLite schema (do we scope local data by userId?). | Data leakage between accounts or unnecessary complexity. |
| Q7  | **Is the sync endpoint `/sync/push` designed to accept a batch of changes or one at a time?**                                                                                                            | Affects push implementation — single entity vs. bulk sync.                                | Performance issues or unnecessary round trips.           |

---

## 12. Proposal Chaining Decision Summary

**Decision**: This umbrella proposal (001) recommends 4 chained sub-proposals rather than a single monolithic build.

**Rationale**:

1. **Review budget**: 250-line limit per PR means a single 5,000+ LoC change would require 20+ PRs with no logical grouping — review fatigue guaranteed.
2. **Independent validation**: Each chain produces a runnable, testable subset of the app. Chain 001-a alone gives a themed, navigable skeleton.
3. **Parallel spec/design work**: Once 001-a is merged, spec/design for 001-b can proceed while 001-a is being reviewed.
4. **Risk containment**: If the sync engine (001-d) proves complex, it doesn't block the CRUD screens (001-b, 001-c).
5. **User feedback**: Early chains deliver tangible UI the user can interact with, enabling mid-build course correction.

**Next step after this proposal is approved**: Write `openspec/proposals/001a-scaffold-theme-nav/proposal.md` with detailed specs, tasks, and acceptance criteria for the first chain.

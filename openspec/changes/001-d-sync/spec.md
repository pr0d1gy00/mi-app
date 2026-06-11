# Spec 001-d — Sync + Exchange Rates

**Change:** `001d-sync`  
**Status:** Draft  
**Parent Proposal:** `openspec/proposals/001d-sync/proposal.md`

---

## 1. Overview

This spec defines the sync mechanism and exchange rate display for mi-purchase-app. The app operates offline-first with local SQLite storage and syncs with the NestJS backend when connectivity is available.

---

## 2. SQLite Schema Additions

### REQ-001-d-001 — exchange_rates table

```sql
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('BCV', 'Paralelo', 'Custom')),
  rate_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  last_synced_at TEXT,
  is_custom INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date);
```

### REQ-001-d-002 — sync_metadata table

```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys: 'last_pull_at', 'last_push_at', 'is_initial_sync_done'
```

---

## 3. TypeScript Types

### REQ-001-d-010 — ExchangeRate type

```typescript
interface ExchangeRate {
  id: string;
  baseCurrency: string; // 'USD'
  targetCurrency: string; // 'VES', 'ARS', 'EUR'
  rate: string; // decimal string
  source: 'BCV' | 'Paralelo' | 'Custom';
  rateDate: string; // ISO 8601 date only
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isCustom: boolean;
}
```

### REQ-001-d-011 — SyncMetadata type

```typescript
interface SyncMetadata {
  lastPullAt: string | null; // ISO 8601 timestamp
  lastPushAt: string | null; // ISO 8601 timestamp
  isInitialSyncDone: boolean;
}
```

### REQ-001-d-012 — SyncResult type

```typescript
interface SyncResult {
  success: boolean;
  pulledCount: number;
  pushedCount: number;
  errors: string[];
  lastSyncAt: string;
}
```

---

## 4. Exchange Rate Validation

### REQ-001-d-020 — exchangeRateSchema (Zod)

- `baseCurrency`: string, default 'USD'
- `targetCurrency`: string, non-empty
- `rate`: string, valid decimal > 0
- `source`: enum 'BCV' | 'Paralelo' | 'Custom'
- `rateDate`: string, ISO 8601 date format
- `isCustom`: boolean, default false

---

## 5. Services

### REQ-001-d-030 — SyncService

```typescript
export class SyncService {
  constructor(
    private db: SQLiteDatabase,
    private apiClient: ApiClient,
  ) {}

  // Core sync methods
  async sync(): Promise<SyncResult>;
  async pullChanges(): Promise<PullResult>;
  async pushChanges(): Promise<PushResult>;

  // Metadata
  async getLastSyncTime(): Promise<string | null>;
  async isInitialSyncDone(): Promise<boolean>;
  async markInitialSyncDone(): Promise<void>;

  // Connectivity
  async isOnline(): Promise<boolean>;
  onConnectivityChange(callback: (online: boolean) => void): void;
}
```

### REQ-001-d-031 — ExchangeRateService

```typescript
export class ExchangeRateService {
  constructor(
    private db: SQLiteDatabase,
    private apiClient: ApiClient,
  ) {}

  // Fetch from backend
  async fetchLatestRate(base: string, target: string): Promise<ExchangeRate>;
  async fetchRateHistory(base: string, target: string, days: number): Promise<ExchangeRate[]>;

  // Local storage
  async getLocalRate(base: string, target: string): Promise<ExchangeRate | null>;
  async getLatestLocalRate(base: string, target: string): Promise<ExchangeRate | null>;
  async saveCustomRate(rate: Omit<ExchangeRate, 'id' | 'isCustom'>): Promise<ExchangeRate>;
  async getRateHistory(base: string, target: string, days: number): Promise<ExchangeRate[]>;

  // Auto-refresh
  async refreshIfNeeded(base: string, target: string): Promise<void>;
  getRefreshInterval(): number; // 5 minutes in ms
}
```

---

## 6. Repository Methods (additions)

### REQ-001-d-040 — ExchangeRateRepository

```typescript
export class ExchangeRateRepository {
  constructor(private db: SQLiteDatabase) {}

  create(rate: ExchangeRateInsert): Promise<ExchangeRate>;
  getById(id: string): Promise<ExchangeRate | null>;
  getLatest(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | null>;
  getHistory(baseCurrency: string, targetCurrency: string, days: number): Promise<ExchangeRate[]>;
  softDelete(id: string): Promise<void>;
  getUnsynced(): Promise<ExchangeRate[]>;
  markSynced(ids: string[]): Promise<void>;
}
```

### REQ-001-d-041 — SyncMetadataRepository

```typescript
export class SyncMetadataRepository {
  constructor(private db: SQLiteDatabase) {}

  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getLastPullAt(): Promise<string | null>;
  setLastPullAt(timestamp: string): Promise<void>;
  getLastPushAt(): Promise<string | null>;
  setLastPushAt(timestamp: string): Promise<void>;
  isInitialSyncDone(): Promise<boolean>;
  markInitialSyncDone(): Promise<void>;
}
```

---

## 7. Screens

### REQ-001-d-050 — ExchangeRateDisplay (component)

- Shows current rate: "1 USD = X VES"
- Shows source badge: BCV, Paralelo, or Custom
- Shows last updated time
- Tap to change source or add custom rate

### REQ-001-d-051 — Dashboard updates

- Add exchange rate card to DashboardEntryScreen
- Show preferred currency rate (VES default)
- Auto-refresh every 5 minutes when online
- Show "Updating..." while refreshing

### REQ-001-d-052 — Settings sync section

- Show "Last synced: X ago" with timestamp
- "Sync Now" button to trigger manual sync
- Pull-to-refresh triggers sync
- Show sync errors if any

### REQ-001-d-053 — Rate source picker

- Modal/screen to select rate source
- Options: BCV, Paralelo, Custom
- If Custom: form to enter rate + date
- Persist selection to SecureStore

---

## 8. Navigation

### REQ-001-d-060 — SettingsScreen updates

Add to existing Settings screen:

- Sync status section
- Exchange rate section
- Rate source picker button

---

## 9. Auto-refresh Implementation

### REQ-001-d-070 — Rate refresh hook

```typescript
export function useExchangeRate(base: string, target: string) {
  // Returns { rate, isLoading, error, refresh }
  // Auto-refreshes every 5 minutes via setInterval
  // Only refreshes when online
  // Returns cached rate immediately
}
```

---

## 10. Requirements Coverage Matrix

| Requirement   | Description                   |
| ------------- | ----------------------------- |
| REQ-001-d-001 | exchange_rates table schema   |
| REQ-001-d-002 | sync_metadata table schema    |
| REQ-001-d-010 | ExchangeRate type             |
| REQ-001-d-011 | SyncMetadata type             |
| REQ-001-d-012 | SyncResult type               |
| REQ-001-d-020 | exchangeRateSchema validation |
| REQ-001-d-030 | SyncService interface         |
| REQ-001-d-031 | ExchangeRateService interface |
| REQ-001-d-040 | ExchangeRateRepository        |
| REQ-001-d-041 | SyncMetadataRepository        |
| REQ-001-d-050 | ExchangeRateDisplay component |
| REQ-001-d-051 | Dashboard rate card           |
| REQ-001-d-052 | Settings sync section         |
| REQ-001-d-053 | Rate source picker            |
| REQ-001-d-060 | Settings navigation updates   |
| REQ-001-d-070 | useExchangeRate hook          |

Total: 16 requirements

---

## 11. PR Tasks Summary

### PR 1: `001-d-1-sync-service`

- T01: Add exchange_rates migration
- T02: Add sync_metadata migration
- T03: Add ExchangeRate types
- T04: Add SyncMetadata types
- T05: Create ExchangeRateRepository
- T06: Create SyncMetadataRepository
- T07: Create SyncService
- T08: Create ExchangeRateService

### PR 2: `001-d-2-sync-hooks`

- T09: Add useExchangeRate hook
- T10: Add useSync hook
- T11: Add useConnectivity hook
- T12: Update PurchaseRepository.getUnsynced()
- T13: Update PurchaseGroupRepository.getUnsynced()

### PR 3: `001-d-3-screens`

- T14: Add ExchangeRateDisplay component
- T15: Update DashboardEntryScreen with rate card
- T16: Add rate source picker modal
- T17: Update Settings screen with sync section

### PR 4: `001-d-4-tests`

- T18: Add SyncService tests
- T19: Add ExchangeRateService tests
- T20: Add useExchangeRate hook tests
- T21: Update existing tests if needed

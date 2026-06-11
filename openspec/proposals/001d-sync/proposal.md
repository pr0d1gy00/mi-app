# Proposal 001d — Sync + Exchange Rates

| Field           | Value                                              |
| --------------- | -------------------------------------------------- |
| **Change Name** | `001d-sync` — Backend sync + exchange rate display |
| **Status**      | Draft                                              |
| **Date**        | 2026-06-11                                         |
| **Author**      | el Gentleman                                       |
| **Phase**       | Proposal                                           |

---

## 1. Description

Add offline-first sync capability with the NestJS backend and display exchange rates for multi-currency support. The sync mechanism uses timestamp-based pull/push with conflict resolution (server wins). Exchange rates are fetched from the backend and can be displayed alongside purchase totals.

---

## 2. Scope

### IN Scope

- **SyncService**: Centralized sync orchestration
- **Pull sync**: Fetch changes from server since last sync
- **Push sync**: Send local changes to server
- **ExchangeRate display**: Show rates in dashboard and purchase forms
- **Rate source selection**: User picks BCV, Paralelo, or Custom
- **Sync status indicator**: Show last sync time in settings
- **Manual sync trigger**: Pull-to-refresh on settings or dedicated button
- **Offline detection**: Detect online/offline state

### OUT of Scope

- Background sync (periodic, battery-efficient)
- Push notifications for sync conflicts
- Automatic retry with exponential backoff
- Sync conflict resolution UI (server wins always)

---

## 3. Sync Architecture

### Strategy: Timestamp-based Pull/Push

```
┌─────────────────────────────────────────────────────────────┐
│                      SYNC FLOW                               │
├─────────────────────────────────────────────────────────────┤
│  1. User creates/updates/deletes data (offline OK)          │
│     → Repository sets sync_status: 'created' | 'updated'    │
│     → Repository sets lastSyncedAt: null                    │
│                                                              │
│  2. User triggers sync (manual or on app focus)             │
│     → PUSH: Send all records with sync_status ≠ 'synced'    │
│     → PULL: Fetch server changes since lastPulledAt          │
│     → Update local records with server data                  │
│     → Mark synced records with sync_status: 'synced'         │
│     → Update lastSyncedAt timestamps                         │
│                                                              │
│  3. Conflict Resolution: Server wins (last-write-wins)      │
│     → Compare updatedAt timestamps                           │
│     → Server record is newer → update local                  │
│     → Local record is newer → server already has it (pushed) │
└─────────────────────────────────────────────────────────────┘
```

### Sync Status States

| Status    | Meaning                                     |
| --------- | ------------------------------------------- |
| `created` | Record created locally, never synced        |
| `updated` | Record modified locally since last sync     |
| `synced`  | Record matches server state                 |
| `deleted` | Record deleted locally, needs server delete |

### Sync Entity Order

To maintain referential integrity, sync in this order:

1. Categories (no FK dependencies)
2. Products (FK → categories)
3. Stores (no FK dependencies)
4. Purchases (FK → stores)
5. PurchaseItems (FK → purchases)
6. PurchaseGroups (no FK dependencies)
7. PurchaseGroupItems (FK → groups, purchases)

---

## 4. Exchange Rates

### Rate Sources

| Source     | Description                           |
| ---------- | ------------------------------------- |
| `BCV`      | Banco Central de Venezuela (VES only) |
| `Paralelo` | Parallel market rate (VES only)       |
| `Custom`   | User-entered manual rate              |

### Rate Storage

```typescript
interface ExchangeRate {
  id: string;
  baseCurrency: string; // 'USD'
  targetCurrency: string; // 'VES', 'ARS', 'EUR'
  rate: string; // decimal string
  source: 'BCV' | 'Paralelo' | 'Custom';
  date: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}
```

### Rate Display Locations

1. **Dashboard**: Show current USD → local currency rate
2. **Purchase Create**: Show selected rate, allow source switch
3. **Purchase Detail**: Show rate used at time of purchase
4. **Settings**: Full rate history, add custom rate

---

## 5. PR Structure

| PR   | Name                     | Scope                                   | Est. Lines |
| ---- | ------------------------ | --------------------------------------- | ---------- |
| PR 1 | `001-d-1-sync-service`   | SyncService, sync hook, offline detect  | ~200       |
| PR 2 | `001-d-2-pull-sync`      | Pull changes from server, merge locally | ~180       |
| PR 3 | `001-d-3-push-sync`      | Push local changes to server            | ~180       |
| PR 4 | `001-d-4-exchange-rates` | Rate types, API client, display         | ~150       |
| PR 5 | `001-d-5-sync-settings`  | Settings screen, sync status, last sync | ~120       |

---

## 6. API Endpoints (Backend)

### Sync Endpoints

```
GET  /sync/pull?lastPulledAt=<timestamp>
     → Returns all changes since timestamp

POST /sync/push
     → Body: { entities: { categories: [], products: [], ... } }
     → Returns: { applied: [], conflicts: [] }
```

### Exchange Rate Endpoints

```
GET  /exchange-rates?base=USD&target=VES
     → Returns latest rate for currency pair

GET  /exchange-rates/history?base=USD&target=VES&days=7
     → Returns rate history
```

---

## 7. Acceptance Criteria

- [ ] User can trigger manual sync from settings
- [ ] Pull fetches all server changes since last sync
- [ ] Push sends all locally changed records
- [ ] Sync status indicator shows "Last synced: X ago"
- [ ] Offline changes sync when connectivity restored
- [ ] Dashboard shows current exchange rate
- [ ] User can select rate source (BCV, Paralelo, Custom)
- [ ] Purchase shows rate used at creation time
- [ ] All existing tests still pass after sync additions
- [ ] TypeScript compiles without errors

---

## 8. Technical Notes

### Offline Detection

```typescript
// Use NetInfo or navigator.onLine
const isOnline = await NetInfo.fetch().then((state) => state.isConnected);
```

### Sync Trigger Points

1. **App focus**: When app returns to foreground
2. **Manual**: User pulls to refresh in Settings
3. **Before API calls**: Check sync before critical operations

### TanStack Query Integration

```typescript
// Use queryClient to trigger sync before queries
const queryClient = useQueryClient();
queryClient.prefetchQuery({
  queryKey: ['purchases'],
  queryFn: async () => {
    await syncService.sync(); // Sync first
    return purchaseRepo.getAll();
  },
});
```

---

## 9. Decisions

| Question                  | Decision                                                    |
| ------------------------- | ----------------------------------------------------------- |
| Rate refresh frequency    | Auto-refresh every 5 minutes when online                    |
| Custom rates              | Persist to SQLite (user-created rates survive app restart)  |
| Sync timestamps on logout | Keep timestamps — resume sync on re-login without full pull |
| Initial sync              | Full pull on first login (all user entities)                |

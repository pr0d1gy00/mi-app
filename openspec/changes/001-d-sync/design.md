# Design 001-d — Sync + Exchange Rates

## 1. Sync Flow

```
App Start
    ↓
Check isInitialSyncDone?
    ↓ no                      ↓ yes
Full Pull              Check lastPullAt
    ↓                        ↓
Merge to Local         Delta Pull (since lastPullAt)
    ↓                        ↓
Mark Initial Done      Merge changes
    ↓
Push Unsynced Local
    ↓
Done → Ready
```

## 2. Sync Order (FK integrity)

1. Categories
2. Products  
3. Stores
4. Purchases
5. PurchaseItems
6. PurchaseGroups
7. PurchaseGroupItems

## 3. Rate Auto-refresh

```typescript
// useExchangeRate.ts
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min

useEffect(() => {
  const interval = setInterval(() => {
    if (isOnline) refreshRate();
  }, REFRESH_INTERVAL);
  return () => clearInterval(interval);
}, []);
```

## 4. File Structure

```
src/
  services/
    SyncService.ts
    ExchangeRateService.ts
  repositories/
    ExchangeRateRepository.ts
    SyncMetadataRepository.ts
  hooks/
    useExchangeRate.ts
    useSync.ts
    useConnectivity.ts
  database/migrations/
    004-create-exchange-rates.ts
    005-create-sync-metadata.ts
  screens/settings/
    RateSourcePicker.tsx  (modal)
  components/
    ExchangeRateDisplay.tsx
```

## 5. Key Implementation Details

- SyncService uses TanStack Query's `onSuccess` to trigger sync after mutations
- ExchangeRateService caches rates in SQLite, fetches from backend on cache miss or stale
- useConnectivity uses `@react-native-community/netinfo`
- Settings screen uses existing SettingsScreen, add sections inline
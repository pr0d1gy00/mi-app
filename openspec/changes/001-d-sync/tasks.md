# Tasks 001-d — Sync + Exchange Rates

**Spec:** `openspec/changes/001-d-sync/spec.md` (16 requirements)
**Strict TDD:** true

---

## PR 1: `001-d-1-services-repos`

### T01: Migration 004 — exchange_rates
- [ ] `src/database/migrations/004-create-exchange-rates.ts`
- [ ] Test: creates table with all columns + indexes

### T02: Migration 005 — sync_metadata
- [ ] `src/database/migrations/005-create-sync-metadata.ts`
- [ ] Test: creates table with key/value + primary key

### T03: Types — ExchangeRate & SyncMetadata
- [ ] Add to `src/types/entities.ts`
- [ ] Test: `src/types/__tests__/exchange-rate.test.ts`

### T04: Validation — exchangeRateSchema
- [ ] Add to `src/types/validation.ts`
- [ ] Test: validates correct rate, rejects invalid

### T05: ExchangeRateRepository
- [ ] `src/repositories/ExchangeRateRepository.ts`
- [ ] `src/repositories/__tests__/ExchangeRateRepository.test.ts`

### T06: SyncMetadataRepository
- [ ] `src/repositories/SyncMetadataRepository.ts`
- [ ] `src/repositories/__tests__/SyncMetadataRepository.test.ts`

### T07: SyncService
- [ ] `src/services/SyncService.ts`
- [ ] `src/services/__tests__/SyncService.test.ts`

### T08: ExchangeRateService
- [ ] `src/services/ExchangeRateService.ts`
- [ ] `src/services/__tests__/ExchangeRateService.test.ts`

---

## PR 2: `001-d-2-hooks`

### T09: useConnectivity hook
- [ ] `src/hooks/useConnectivity.ts`
- [ ] Test: returns online/offline status

### T10: useExchangeRate hook
- [ ] `src/hooks/useExchangeRate.ts`
- [ ] Auto-refresh every 5 min
- [ ] Test: returns rate, refresh function

### T11: useSync hook
- [ ] `src/hooks/useSync.ts`
- [ ] Wraps SyncService with state
- [ ] Test: sync status, trigger function

---

## PR 3: `001-d-3-screens`

### T12: ExchangeRateDisplay component
- [ ] `src/components/ExchangeRateDisplay.tsx`
- [ ] Shows: rate, source badge, last updated
- [ ] Test: renders correctly

### T13: RateSourcePicker modal
- [ ] `src/components/RateSourcePicker.tsx`
- [ ] BCV, Paralelo, Custom options
- [ ] Custom form for manual rate
- [ ] Test: selection works

### T14: Dashboard rate card
- [ ] Update `src/screens/dashboard/DashboardEntryScreen.tsx`
- [ ] Add ExchangeRateDisplay to dashboard
- [ ] Test: card shows current rate

### T15: Settings sync section
- [ ] Update `src/navigation/TabNavigator.tsx` imports
- [ ] Add sync section to SettingsScreen
- [ ] Show last sync time, Sync Now button
- [ ] Test: sync button triggers sync

---

## PR 4: `001-d-4-tests`

### T16: Integration tests
- [ ] SyncService integration with mock API
- [ ] ExchangeRateService with mock API

---

## Dependency Graph

```
T01, T02 → T03 → T04 → T05, T06 → T07, T08
                                              ↓
T09, T10, T11 ← T07, T08
      ↓
T12, T13, T14, T15
```

---

## Acceptance Criteria

- [ ] All tests pass (expect ~400+)
- [ ] TypeScript compiles
- [ ] Sync works end-to-end
- [ ] Rate auto-refreshes every 5 min
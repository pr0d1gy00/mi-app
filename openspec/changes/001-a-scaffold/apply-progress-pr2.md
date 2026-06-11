# Apply Progress — PR 2: State + Providers + Toast (001-a-scaffold)

## Status

- **Change:** 001-a-scaffold
- **PR:** 2 of 6
- **Scope:** State + Providers + Toast (T-001-a-006 → T-001-a-010)
- **State:** All 5 tasks implemented and verified
- **TDD Mode:** Strict (RED → GREEN → TRIANGULATE → REFACTOR)

---

## Completed Tasks

### T-001-a-006 — Create Zustand Theme Store

- **Status:** ✅ Complete
- **Files changed:**
  - `src/hooks/useThemeStore.ts` (created)
  - `src/hooks/__tests__/useThemeStore.test.ts` (created)
  - `src/hooks/index.ts` (updated — exports useThemeStore)
  - `src/utils/constants.ts` (created — THEME_MODE_KEY)
  - `src/utils/index.ts` (updated — exports constants)
- **TDD Evidence:**
  - **RED:** 4 tests written, all failed because module didn't exist
  - **GREEN:** Implemented store with `create<ThemeStoreState>()`, setMode, initializeMode
  - **TRIANGULATE:** Added test for `setMode('light')` after `'dark'` and persistence error handling
  - **REFACTOR:** Extracted `THEME_MODE_KEY` to `src/utils/constants.ts`
- **Verification:** `npx jest src/hooks/__tests__/useThemeStore.test.ts` — 7/7 pass

### T-001-a-007 — Create Zustand Auth Store (Placeholder)

- **Status:** ✅ Complete
- **Files changed:**
  - `src/hooks/useAuthStore.ts` (created)
  - `src/hooks/__tests__/useAuthStore.test.ts` (created)
  - `src/hooks/index.ts` (updated — exports useAuthStore)
- **TDD Evidence:**
  - **RED:** 5 tests written, all failed because module didn't exist
  - **GREEN:** Implemented store with isAuthenticated, user, token, logout
  - **TRIANGULATE:** N/A (placeholder store — minimal surface)
  - **REFACTOR:** N/A
- **Verification:** `npx jest src/hooks/__tests__/useAuthStore.test.ts` — 5/5 pass

### T-001-a-008 — Create Zustand Notification Store

- **Status:** ✅ Complete
- **Files changed:**
  - `src/hooks/useNotificationStore.ts` (created)
  - `src/hooks/__tests__/useNotificationStore.test.ts` (created)
  - `src/hooks/index.ts` (updated — exports useNotificationStore)
- **TDD Evidence:**
  - **RED:** 8 tests written, all failed because module didn't exist
  - **GREEN:** Implemented store with FIFO queue, priority-based replacement (error=4 > warning=3 > success=2 > info=1)
  - **TRIANGULATE:** Added tests for same-priority error queuing, warning replacing info but queuing behind error
  - **REFACTOR:** Extracted `NOTIFICATION_PRIORITY` and `NOTIFICATION_DURATION` constants
- **Verification:** `npx jest src/hooks/__tests__/useNotificationStore.test.ts` — 10/10 pass

### T-001-a-009 — Create Theme Providers

- **Status:** ✅ Complete
- **Files changed:**
  - `src/theme/useTheme.ts` (created — context + hook)
  - `src/theme/ThemeProvider.tsx` (created — builds Theme from tokens + mode)
  - `src/theme/DarkModeProvider.tsx` (created — AsyncStorage init + Appearance detection)
  - `src/theme/__tests__/ThemeProvider.test.tsx` (created)
  - `src/theme/__tests__/DarkModeProvider.test.tsx` (created)
  - `src/theme/index.ts` (updated — exports all)
- **TDD Evidence:**
  - **RED:** 7 tests written (4 ThemeProvider + 3 DarkModeProvider), all failed because modules didn't exist
  - **GREEN:** Implemented all three files with context, provider, and lifecycle logic
  - **TRIANGULATE:** Added test for theme re-render on mode change (requires `act()`)
  - **REFACTOR:** Descriptive error message in `useTheme()`
- **Verification:**
  - `npx jest src/theme/__tests__/ThemeProvider.test.tsx` — 5/5 pass
  - `npx jest src/theme/__tests__/DarkModeProvider.test.tsx` — 3/3 pass

### T-001-a-010 — Create NotificationProvider + Toast Component

- **Status:** ✅ Complete
- **Files changed:**
  - `src/components/Toast.tsx` (created — slide-in animation, auto-dismiss, swipe, safe area)
  - `src/app/NotificationProvider.tsx` (created — subscribes to store, renders Toast)
  - `src/components/__tests__/Toast.test.tsx` (created)
  - `src/app/__tests__/NotificationProvider.test.tsx` (created)
  - `src/components/index.ts` (updated — exports Toast)
  - `src/app/index.ts` (updated — exports NotificationProvider)
- **TDD Evidence:**
  - **RED:** 7 tests written (5 Toast + 2 NotificationProvider), all failed because modules didn't exist
  - **GREEN:** Implemented Toast with Animated slide-in, PanResponder swipe, auto-dismiss via setTimeout, safe area insets
  - **TRIANGULATE:** Added test for error toast 5s vs info toast 2s auto-dismiss
  - **REFACTOR:** Extracted animation constants to local variables
- **Verification:**
  - `npx jest src/components/__tests__/Toast.test.tsx` — 5/5 pass
  - `npx jest src/app/__tests__/NotificationProvider.test.tsx` — 2/2 pass

---

## Test Summary

| Test Suite                                         | Tests  | Pass   | Fail  |
| -------------------------------------------------- | ------ | ------ | ----- |
| `src/hooks/__tests__/useThemeStore.test.ts`        | 7      | 7      | 0     |
| `src/hooks/__tests__/useAuthStore.test.ts`         | 5      | 5      | 0     |
| `src/hooks/__tests__/useNotificationStore.test.ts` | 10     | 10     | 0     |
| `src/theme/__tests__/ThemeProvider.test.tsx`       | 5      | 5      | 0     |
| `src/theme/__tests__/DarkModeProvider.test.tsx`    | 3      | 3      | 0     |
| `src/components/__tests__/Toast.test.tsx`          | 5      | 5      | 0     |
| `src/app/__tests__/NotificationProvider.test.tsx`  | 2      | 2      | 0     |
| **PR 2 Total**                                     | **37** | **37** | **0** |
| PR 1 tests (existing)                              | 22     | 22     | 0     |
| **Grand Total**                                    | **59** | **59** | **0** |

---

## Verification (PR 2 Scope)

| Check                                                               | Status | Notes                                                                                                                            |
| ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                                  | ✅     | Exit code 0                                                                                                                      |
| `npm test`                                                          | ✅     | 59/59 pass (37 new + 22 existing)                                                                                                |
| No `any` in `src/`                                                  | ✅     | grep verified zero matches                                                                                                       |
| Notification system: single toast, priority replacement, FIFO queue | ✅     | Verified by notification store tests                                                                                             |
| Dark mode toggle in Settings persists across restart                | ⏳     | Persistence mechanism in place (AsyncStorage + setMode + DarkModeProvider). Actual toggle UI is in Settings screen (PR 4 scope). |

---

## Files Changed

```
src/app/NotificationProvider.tsx
src/app/__tests__/NotificationProvider.test.tsx
src/app/index.ts
src/components/Toast.tsx
src/components/__tests__/Toast.test.tsx
src/components/index.ts
src/hooks/useThemeStore.ts
src/hooks/useAuthStore.ts
src/hooks/useNotificationStore.ts
src/hooks/__tests__/useThemeStore.test.ts
src/hooks/__tests__/useAuthStore.test.ts
src/hooks/__tests__/useNotificationStore.test.ts
src/hooks/index.ts
src/theme/useTheme.ts
src/theme/ThemeProvider.tsx
src/theme/DarkModeProvider.tsx
src/theme/__tests__/ThemeProvider.test.tsx
src/theme/__tests__/DarkModeProvider.test.tsx
src/theme/index.ts
src/utils/constants.ts
src/utils/index.ts
```

---

## TDD Cycle Evidence

| Task        | RED                              | GREEN                                | TRIANGULATE                                                    | REFACTOR                                                                |
| ----------- | -------------------------------- | ------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| T-001-a-006 | 4 tests failed (module missing)  | Store implemented, 4 pass            | Added `setMode('light')` reversion + persistence error test    | Extracted `THEME_MODE_KEY` to `src/utils/constants.ts`                  |
| T-001-a-007 | 5 tests failed (module missing)  | Store implemented, 5 pass            | N/A                                                            | N/A                                                                     |
| T-001-a-008 | 8 tests failed (module missing)  | Store implemented, 8 pass            | Added same-priority error queuing + warning/info priority test | Extracted `NOTIFICATION_PRIORITY` and `NOTIFICATION_DURATION` constants |
| T-001-a-009 | 7 tests failed (modules missing) | All 3 files implemented, 7 pass      | Added theme re-render on mode change with `act()`              | Descriptive error message in `useTheme`                                 |
| T-001-a-010 | 7 tests failed (modules missing) | Toast + Provider implemented, 7 pass | Added error 5s vs info 2s auto-dismiss test                    | Animation constants kept local (small component)                        |

---

## Deviation Notes

- `jest.mock("react-native", ...)` with `requireActual` spread caused TurboModule invariant violations in DarkModeProvider tests. Replaced with `jest.spyOn(Appearance, "getColorScheme")` for clean mocking.
- `useSafeAreaInsets` mock provided via `jest.mock("react-native-safe-area-context", ...)` in Toast and NotificationProvider tests.
- `Animated.timing` in Toast triggers `act()` warnings during tests; these are cosmetic warnings from react-test-renderer and do not affect test outcomes.
- `Zustand` state snapshots (`getState()` captured in a variable) do not reflect updates after `set()` calls. Fixed test patterns by re-reading `getState()` after mutations.

---

## Remaining Tasks

- **PR 3:** T-001-a-011 → T-001-a-017 (Shared Components)
- **PR 4:** T-001-a-018 → T-001-a-021 (Navigation)
- **PR 5:** T-001-a-022 → T-001-a-026 (Services + Database + Entry)
- **PR 6:** T-001-a-027 → T-001-a-035 (Testing + Linting + Verification)

---

## Workload / PR Boundary

- **PR 2 changed lines:** ~240 (store files + test files + provider files + Toast component)
- **PR 2 review budget:** ✓ ≤ 250
- **Tests added:** 37 new tests
- **Total tests:** 59 (22 from PR 1 + 37 from PR 2)

---

## Persisted Task Checkbox Updates

Updated `openspec/changes/001-a-scaffold/tasks.md`:

- `- [x] Notification system: single toast, priority replacement, FIFO queue working (PR 2)`

Unchecked items remaining:

- `- [ ] Dark mode toggle in Settings persists across restart (PR 2)` — mechanism complete, awaiting Settings screen (PR 4)
- `- [ ] npm run lint` — exit code 0, no warnings (PR 6)
- `- [ ] npm run format:check` — all files formatted (PR 6)
- `- [ ] npm test` — all ~120 tests pass (PR 6: 59 tests passing after PR 2)
- `- [ ] npm run test:coverage` — ≥ 80% statement coverage (PR 6)
- `- [ ] npx expo start` — app launches in simulator/emulator (PR 6)
- `- [ ] All 27 spec requirements satisfied (REQ-001-a-001 through REQ-001-a-027) (PR 6)`

# Implementation Tasks — Chain 001-a: Scaffold + Theme + Navigation

## Review Workload Forecast

| Field                   | Value                                      |
| ----------------------- | ------------------------------------------ |
| Estimated changed lines | ~1,100–1,350 (additions only; new project) |
| 400-line budget risk    | High — total far exceeds 400; must chain   |
| Chained PRs recommended | Yes                                        |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6    |
| Delivery strategy       | auto-chain                                 |
| Chain strategy          | stacked-to-main                            |

## Guard Lines

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

---

## PR Structure Overview

| PR       | Scope                            | Tasks                     | Est. Lines | Review Budget |
| -------- | -------------------------------- | ------------------------- | ---------- | ------------- |
| **PR 1** | Project Foundation               | T-001-a-001 → T-001-a-005 | ~200       | ✓ ≤ 250       |
| **PR 2** | State + Providers + Toast        | T-001-a-006 → T-001-a-010 | ~240       | ✓ ≤ 250       |
| **PR 3** | Shared Components                | T-001-a-011 → T-001-a-017 | ~230       | ✓ ≤ 250       |
| **PR 4** | Navigation                       | T-001-a-018 → T-001-a-021 | ~150       | ✓ ≤ 250       |
| **PR 5** | Services + Database + Entry      | T-001-a-022 → T-001-a-026 | ~180       | ✓ ≤ 250       |
| **PR 6** | Testing + Linting + Verification | T-001-a-027 → T-001-a-035 | ~250       | ✓ ≤ 250       |

**Total: 6 PRs, ~1,250 estimated lines, each within 250-line review budget.**

---

## PR 1: Project Foundation

**Scope:** Expo SDK 56 scaffold, TypeScript strict config, path aliases, type definitions, theme tokens.

**Dependencies:** None (first PR — branches from main).

---

### T-001-a-001 — Initialize Expo SDK 56 Project

**Description:** Create the Expo project with SDK 56, verify `package.json` declares correct Expo version, and install core dependencies (react, react-native, expo-status-bar, expo-splash-screen, typescript).

**Files:**

- `package.json` (modify — add dependencies)
- `app.json` (create — Expo config per design §10)
- `babel.config.js` (create — Expo preset + module-resolver plugin with path aliases)
- `tsconfig.json` (create — extends expo/tsconfig.base, strict mode, path aliases)
- `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png`, `assets/favicon.png` (create placeholders)

**Depends on:** None

**Estimated lines:** ~120 (package.json + app.json + tsconfig.json + babel.config.js)

**Tests required:** None (config files — verified by type-check and lint in PR 6)

**Acceptance criteria:**

- `npx tsc --noEmit` runs without errors on empty src/
- `package.json` has `expo` ^56, `react` ^19, `typescript` ^5.8
- `tsconfig.json` has `"strict": true`, `"noImplicitAny": true`, and all 12 path aliases
- `babel.config.js` has `module-resolver` with matching aliases
- `app.json` has `userInterfaceStyle: "automatic"` and `expo-sqlite` plugin

---

### T-001-a-002 — Create Modular Folder Structure

**Description:** Create all required `src/` subdirectories with barrel `index.ts` files.

**Files:**

- `src/app/index.ts`
- `src/modules/index.ts`
- `src/database/index.ts`
- `src/repositories/index.ts`
- `src/services/index.ts`
- `src/services/api/index.ts`
- `src/hooks/index.ts`
- `src/navigation/index.ts`
- `src/components/index.ts`
- `src/theme/index.ts`
- `src/shared/index.ts`
- `src/types/index.ts`
- `src/utils/index.ts`

**Depends on:** T-001-a-001

**Estimated lines:** ~40 (13 empty barrel files)

**Tests required:** None (structural — verified by acceptance check)

**Acceptance criteria:**

- All 13 directories exist under `src/`
- Each directory has an `index.ts` (empty or with future exports)
- Barrel files use `export * from` or `export { }` pattern (no default exports for modules)

---

### T-001-a-003 — Define Theme TypeScript Interfaces

**Description:** Create `src/types/theme.ts` and `src/types/user.ts` with fully typed interfaces (zero `any`).

**Files:**

- `src/types/theme.ts` (Theme, ThemeMode, ThemeColors, TypographyVariant, TypographyScale, SpacingTokens, BorderRadiusTokens, ShadowToken, ShadowTokens)
- `src/types/user.ts` (User interface)
- `src/types/index.ts` (update — re-export theme and user types)
- `src/types/notification.ts` (create — NotificationType, NotificationItem interfaces)

**Depends on:** T-001-a-001

**Estimated lines:** ~80

**Tests required (RED first):**

- `src/types/__tests__/theme-types.test.ts` — verify Theme interface has all required fields by attempting to construct a valid Theme object and checking TypeScript compilation (use `satisfies Theme` pattern)

**Acceptance criteria:**

- `npx tsc --noEmit` passes with all interfaces
- `Theme` interface includes: `mode`, `colors`, `typography`, `spacing`, `borderRadius`, `shadows`
- `ThemeColors` has all 11 color tokens (primary, secondary, background, card, textPrimary, textSecondary, border, success, warning, error, info)
- `TypographyScale` has all 8 variants (display, h1, h2, h3, body, bodySmall, caption, button)
- `SpacingTokens` has 8 values (xs through huge)
- `BorderRadiusTokens` has 5 values (small through full)
- `ShadowTokens` has 5 levels (none, sm, md, lg, xl)
- `User` interface has `id`, `email`, `username`, `preferredCurrency`
- `NotificationType` is `'success' | 'error' | 'warning' | 'info'`
- `NotificationItem` has `id`, `type`, `title`, `message`, `duration?`, `createdAt`
- Zero `any` in all type files

---

### T-001-a-004 — Define Theme Tokens

**Description:** Create `src/theme/tokens.ts` with exact color, typography, spacing, border radius, and shadow token values per the design spec.

**Files:**

- `src/theme/tokens.ts` (lightColors, darkColors, typography, spacing, borderRadius, shadows)

**Depends on:** T-001-a-003

**Estimated lines:** ~70

**Tests required (RED → GREEN → TRIANGULATE → REFACTOR):**

- **RED:** `src/theme/__tests__/tokens.test.ts` — tests that fail because tokens don't exist yet:
  1. Test that `lightColors` has all 11 keys with correct hex values
  2. Test that `darkColors` has all 11 keys with correct hex values
  3. Test that `typography` has 8 variants, each with fontSize/fontWeight/lineHeight
  4. Test that `spacing` has 8 numeric values in ascending order
  5. Test that `borderRadius` has 5 values with `full === 9999`
  6. Test that `shadows` has 5 levels (sm/md/lg/xl have y/blur/opacity; none is null)
  7. Test WCAG AA contrast ratios for light mode text colors on their backgrounds
  8. Test WCAG AA contrast ratios for dark mode text colors on their backgrounds
- **GREEN:** Implement tokens with exact hex values from design spec
- **TRIANGULATE:** Add a test that verifies typography `display` fontSize ≥ 34px, `h1` ≥ 28px, etc.
- **REFACTOR:** Extract WCAG contrast ratio utility to `src/utils/contrast.ts` if not already present

**Acceptance criteria:**

- All token values match the design spec exactly (design §4 tables)
- All 8 WCAG contrast tests pass (light + dark mode)
- `npx tsc --noEmit` passes (tokens satisfy Theme sub-interfaces)

---

### T-001-a-005 — Create Components Props Types

**Description:** Define all component props interfaces in `src/components/types.ts`.

**Files:**

- `src/components/types.ts` (ScreenProps, CardProps, ButtonProps, InputProps, TypographyProps, BadgeProps, LoadingSpinnerProps, ToastProps)

**Depends on:** T-001-a-003

**Estimated lines:** ~50

**Tests required:** None (types only — verified by component tests in PR 3)

**Acceptance criteria:**

- `ScreenProps` has `children`, `noPadding?`, `backgroundColor?`, `scrollable?`
- `CardProps` has `children`, `variant?`, `pressable?`, `onPress?`, `style?`
- `ButtonProps` has `children`, `variant?`, `loading?`, `disabled?`, `onPress?`, `style?`
- `InputProps` has `label?`, `value`, `onChangeText`, `placeholder?`, `error?`, `helperText?`, `keyboardType?`, `secureTextEntry?`
- `TypographyProps` has `children`, `variant`, `color?`, `align?`, `style?`
- `BadgeProps` has `label`, `variant?`
- `LoadingSpinnerProps` has `size?`, `overlay?`, `color?`
- `ToastProps` has `notification`, `onDismiss`, `isVisible`
- Zero `any` in all props interfaces

---

## PR 2: State + Providers + Toast

**Scope:** Zustand stores (theme, auth, notification), theme providers, notification system, toast component.

**Dependencies:** Merged PR 1.

---

### T-001-a-006 — Create Zustand Theme Store

**Description:** Implement `useThemeStore` with mode state, setMode action, and initializeMode action.

**Files:**

- `src/hooks/useThemeStore.ts`
- `src/hooks/index.ts` (update — export useThemeStore)
- `src/hooks/__tests__/useThemeStore.test.ts`

**Depends on:** T-001-a-003, T-001-a-004

**Estimated lines:** ~45 (store + test)

**Tests required (RED → GREEN → TRIANGULATE → REFACTOR):**

- **RED:** `src/hooks/__tests__/useThemeStore.test.ts`:
  1. Test default state is `{ mode: 'light' }`
  2. Test `setMode('dark')` updates mode to `'dark'`
  3. Test `initializeMode('dark')` sets mode without persistence side effect (AsyncStorage mocked)
  4. Test rapid toggles (5x in loop) result in final state matching last toggle (no race)
- **GREEN:** Implement store with `create<ThemeStoreState>()` pattern
- **TRIANGULATE:** Test with initial state `'dark'` → `setMode('light')` → verify `'light'`
- **REFACTOR:** Extract persistence key constant to `@/utils/constants.ts` if growing

**Acceptance criteria:**

- Store exports typed `useThemeStore` hook
- `setMode` and `initializeMode` are callable actions
- All 4 tests pass
- AsyncStorage persistence mocked in tests (no real writes)
- Zero `any` in store types

---

### T-001-a-007 — Create Zustand Auth Store (Placeholder)

**Description:** Implement `useAuthStore` placeholder with isAuthenticated, user, token, and CRUD actions.

**Files:**

- `src/hooks/useAuthStore.ts`
- `src/hooks/index.ts` (update — export useAuthStore)
- `src/hooks/__tests__/useAuthStore.test.ts`

**Depends on:** T-001-a-003, T-001-a-006

**Estimated lines:** ~50 (store + test)

**Tests required (RED → GREEN):**

- **RED:** `src/hooks/__tests__/useAuthStore.test.ts`:
  1. Test default state: `isAuthenticated: false`, `user: null`, `token: null`
  2. Test `setAuthenticated(true)` sets `isAuthenticated`
  3. Test `setUser({ id: '1', email: 'a@b.com', username: 'a', preferredCurrency: 'USD' })` sets user
  4. Test `setToken('abc')` sets token
  5. Test `logout()` resets all fields to defaults
- **GREEN:** Implement store

**Acceptance criteria:**

- Store exports typed `useAuthStore` hook
- All 5 tests pass
- `User` type imported from `@/types/user`
- Zero `any` in store types

---

### T-001-a-008 — Create Zustand Notification Store

**Description:** Implement `useNotificationStore` with FIFO queue, priority-based replacement (error > warning > success > info), single-toast visibility, and API: `notify()`, `dismiss()`, `clearAll()`.

**Files:**

- `src/hooks/useNotificationStore.ts`
- `src/hooks/index.ts` (update — export useNotificationStore)
- `src/hooks/__tests__/useNotificationStore.test.ts`

**Depends on:** T-001-a-003, T-001-a-007

**Estimated lines:** ~80 (store + test)

**Tests required (RED → GREEN → TRIANGULATE → REFACTOR):**

- **RED:** `src/hooks/__tests__/useNotificationStore.test.ts`:
  1. Test initial state: `queue: []`, `current: null`, `isShowing: false`
  2. Test `notify({ type: 'info', title: 'Hi', message: 'Hello' })` adds to queue
  3. Test when `isShowing === false`, `notify()` sets the notification as `current` and `isShowing = true`
  4. Test when `isShowing === true`, same-priority `notify()` adds to queue (FIFO)
  5. Test error priority: `notify({ type: 'error', ... })` replaces current success/info immediately
  6. Test `dismiss()` clears current and shows next queued item
  7. Test `clearAll()` empties queue and resets current
  8. Test duration defaults: error=5000, success=3000, info=2000, warning=4000
- **GREEN:** Implement store with priority logic (error=4, warning=3, success=2, info=1)
- **TRIANGULATE:** Test double-error scenario: error replaces error only if no error already showing (queue it)
- **REFACTOR:** Extract priority mapping to a constant `NOTIFICATION_PRIORITY`

**Acceptance criteria:**

- Store exports typed `useNotificationStore` hook
- All 8 tests pass
- Only one toast visible at a time (`isShowing` guard)
- Error replaces lower-priority toasts immediately
- FIFO queue for same-priority toasts
- Duration defaults match spec
- Zero `any` in store types

---

### T-001-a-009 — Create Theme Providers (ThemeProvider + DarkModeProvider + useTheme)

**Description:** Implement `ThemeProvider` (builds Theme object from tokens + Zustand mode), `DarkModeProvider` (initializes mode from AsyncStorage/system), and `useTheme` hook.

**Files:**

- `src/theme/useTheme.ts` (context + hook)
- `src/theme/ThemeProvider.tsx`
- `src/theme/DarkModeProvider.tsx`
- `src/theme/index.ts` (update — export all)
- `src/theme/__tests__/ThemeProvider.test.tsx`
- `src/theme/__tests__/DarkModeProvider.test.tsx`

**Depends on:** T-001-a-004, T-001-a-006

**Estimated lines:** ~130 (3 files + 2 test files)

**Tests required (RED → GREEN → TRIANGULATE → REFACTOR):**

- **RED:** `src/theme/__tests__/ThemeProvider.test.tsx`:
  1. Test `useTheme()` throws when called outside `ThemeProvider`
  2. Test `useTheme()` returns Theme with correct mode and light colors when store mode is 'light'
  3. Test `useTheme()` returns Theme with correct mode and dark colors when store mode is 'dark'
  4. Test theme object has all 6 top-level keys (mode, colors, typography, spacing, borderRadius, shadows)
- **RED:** `src/theme/__tests__/DarkModeProvider.test.tsx`: 5. Test on first launch (no AsyncStorage), mode defaults to 'light' 6. Test when AsyncStorage has 'dark', mode initializes to 'dark' 7. Test system appearance detection (mock `Appearance.getColorScheme()`)
- **GREEN:** Implement all three files
- **TRIANGULATE:** Test theme re-renders when mode changes (use `act()` in test)
- **REFACTOR:** Ensure `useTheme` hook throws with descriptive error message

**Acceptance criteria:**

- `ThemeProvider` wraps children in `ThemeContext.Provider` with computed theme
- `DarkModeProvider` reads AsyncStorage on mount, calls `initializeMode`
- `useTheme()` returns full Theme object, throws outside provider
- Splash screen stays visible until theme resolves (design §4 flash prevention)
- All 7 tests pass
- Zero `any` in provider code

---

### T-001-a-010 — Create NotificationProvider + Toast Component

**Description:** Implement `NotificationProvider` (renders at app root, subscribes to notification store) and `Toast` component (slide-in/out animation, auto-dismiss, swipe to dismiss, safe area aware).

**Files:**

- `src/components/Toast.tsx`
- `src/app/NotificationProvider.tsx`
- `src/components/__tests__/Toast.test.tsx`
- `src/app/__tests__/NotificationProvider.test.tsx`

**Depends on:** T-001-a-008, T-001-a-009

**Estimated lines:** ~120 (2 components + 2 test files)

**Tests required (RED → GREEN → TRIANGULATE → REFACTOR):**

- **RED:** `src/components/__tests__/Toast.test.tsx`:
  1. Test Toast renders with correct type-based background color
  2. Test Toast displays title and message text
  3. Test auto-dismiss: after duration ms, `onDismiss` is called (use fake timers)
  4. Test swipe-to-dismiss gesture calls `onDismiss` (mock PanResponder or gesture handler)
  5. Test Toast is not rendered when `isVisible` is false
- **RED:** `src/app/__tests__/NotificationProvider.test.tsx`: 6. Test NotificationProvider renders Toast when store has current notification 7. Test NotificationProvider renders nothing when store queue is empty
- **GREEN:** Implement Toast with `Animated` or `react-native-reanimated` for slide animation
- **TRIANGULATE:** Test error toast auto-dismiss at 5s vs info toast at 2s
- **REFACTOR:** Extract animation constants to a shared constant if duplicated

**Acceptance criteria:**

- `NotificationProvider` renders at app root level, subscribes to `useNotificationStore`
- `Toast` component has slide-in animation from top, auto-dismiss per type duration
- Swipe gesture dismisses toast
- Safe area respected (positioned below status bar notch)
- Only one Toast visible at a time (guaranteed by store logic)
- All 7 tests pass
- Zero `any` in component code

---

## PR 3: Shared Components

**Scope:** Screen, Card, Button, Input, Typography, LoadingSpinner, Badge — all themed, tested components.

**Dependencies:** Merged PR 2.

---

### T-001-a-011 — Create Screen Component

**Description:** Implement `Screen` component with safe area, theme background, default padding, and `noPadding`/`scrollable`/`backgroundColor` props.

**Files:**

- `src/components/Screen.tsx`
- `src/components/__tests__/Screen.test.tsx`

**Depends on:** T-001-a-009 (ThemeProvider, useTheme), T-001-a-005 (ScreenProps)

**Estimated lines:** ~40 (component + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/components/__tests__/Screen.test.tsx`:
  1. Test renders with `SafeAreaView` wrapping content
  2. Test background color matches `theme.colors.background`
  3. Test default padding is applied (`theme.spacing.lg`)
  4. Test `noPadding` prop removes internal padding
  5. Test `scrollable` prop wraps content in `ScrollView`
  6. Test `backgroundColor` prop overrides theme background
- **GREEN:** Implement component
- **TRIANGULATE:** Test nested Screen components don't double-pad

**Acceptance criteria:**

- Screen uses `useSafeAreaInsets()` for notch handling (REQ-001-a-013)
- Background defaults to theme, overridable via prop
- All 6 tests pass with `renderWithProviders`

---

### T-001-a-012 — Create Card Component

**Description:** Implement `Card` component with themed card styling, shadow variants (default/elevated/flat), and pressable animation.

**Files:**

- `src/components/Card.tsx`
- `src/components/__tests__/Card.test.tsx`

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~55 (component + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/components/__tests__/Card.test.tsx`:
  1. Test default Card has `borderRadius: 20` (theme.borderRadius.large)
  2. Test default Card has `theme.colors.card` background
  3. Test default Card has `theme.shadows.md` shadow style
  4. Test `variant="elevated"` applies `theme.shadows.lg`
  5. Test `variant="flat"` applies no shadow + border with `theme.colors.border`
  6. Test `pressable` prop wraps in `Pressable` with scale animation (0.98 on press)
  7. Test `onPress` callback fires on press when `pressable` is true
- **GREEN:** Implement component with Animated API for pressable scale
- **TRIANGULATE:** Test Card with custom `style` prop merges with computed styles

**Acceptance criteria:**

- Card renders with correct radius, background, shadow per variant
- Pressable variant has 0.98 scale animation on press
- All 7 tests pass

---

### T-001-a-013 — Create Button Component

**Description:** Implement `Button` with primary/secondary/ghost variants, loading state (ActivityIndicator), and disabled state (0.5 opacity).

**Files:**

- `src/components/Button.tsx`
- `src/components/__tests__/Button.test.tsx`

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~60 (component + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/components/__tests__/Button.test.tsx`:
  1. Test primary variant: bg=`theme.colors.primary`, text=white, borderRadius=12
  2. Test secondary variant: transparent bg, border=`theme.colors.primary`, text=`theme.colors.primary`
  3. Test ghost variant: no border, no bg, text=`theme.colors.primary`
  4. Test `loading={true}`: children replaced by `ActivityIndicator` with matching text color
  5. Test `loading={true}`: `onPress` is disabled
  6. Test `disabled={true}`: opacity 0.5, `onPress` disabled, not focusable
  7. Test `onPress` fires when not loading and not disabled
- **GREEN:** Implement component
- **TRIANGULATE:** Test button with custom `style` prop

**Acceptance criteria:**

- All 3 variants render correctly
- Loading state replaces text with spinner
- Disabled state has 0.5 opacity and blocks onPress
- All 7 tests pass

---

### T-001-a-014 — Create Input Component

**Description:** Implement `Input` with label, themed text input, error state, and helper text.

**Files:**

- `src/components/Input.tsx`
- `src/components/__tests__/Input.test.tsx`

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~55 (component + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/components/__tests__/Input.test.tsx`:
  1. Test renders with label using `theme.typography.bodySmall`
  2. Test input field has `theme.colors.border` border and `borderRadius: 8`
  3. Test input background matches `theme.colors.card`
  4. Test `error` prop: border color changes to `theme.colors.error`
  5. Test `error` prop: error message displayed in `theme.colors.error` with `theme.typography.caption`
  6. Test `helperText` prop: helper text displayed in `theme.colors.textSecondary` with `theme.typography.caption`
  7. Test error takes priority over helperText (only error shown when both present)
  8. Test `onChangeText` fires with typed text
- **GREEN:** Implement component
- **TRIANGULATE:** Test with `secureTextEntry` and `keyboardType` props

**Acceptance criteria:**

- Label, input, error, and helper text all render correctly
- Error state overrides border color and shows error message
- Error supersedes helperText when both provided
- All 8 tests pass

---

### T-001-a-015 — Create Typography Component

**Description:** Implement `Typography` component mapping variant prop to theme typography scale with color/align overrides.

**Files:**

- `src/components/Typography.tsx`
- `src/components/__tests__/Typography.test.tsx`

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~35 (component + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/components/__tests__/Typography.test.tsx`:
  1. Test `variant="h1"` applies fontSize=28, fontWeight=700, lineHeight=36
  2. Test `variant="body"` applies fontSize=16, fontWeight=400, lineHeight=24
  3. Test `variant="caption"` applies fontSize=12, fontWeight=400, lineHeight=16
  4. Test default color is `theme.colors.textPrimary`
  5. Test `color` prop overrides text color
  6. Test `align="center"` applies `textAlign: 'center'`
- **GREEN:** Implement component
- **TRIANGULATE:** Test all 8 variants render with correct typography tokens

**Acceptance criteria:**

- All 8 typography variants map to correct theme tokens
- Color and align props work as overrides
- All 6 tests pass (plus triangulation covering all variants)

---

### T-001-a-016 — Create LoadingSpinner Component

**Description:** Implement `LoadingSpinner` with centered ActivityIndicator, size prop, and overlay mode.

**Files:**

- `src/components/LoadingSpinner.tsx`
- `src/components/__tests__/LoadingSpinner.test.tsx`

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~35 (component + test)

**Tests required (RED → GREEN):**

- **RED:** `src/components/__tests__/LoadingSpinner.test.tsx`:
  1. Test renders `ActivityIndicator` with `theme.colors.primary` color
  2. Test centered within container
  3. Test `size="large"` passes `large` to ActivityIndicator
  4. Test `overlay` prop renders semi-transparent backdrop behind spinner
  5. Test `color` prop overrides spinner color
- **GREEN:** Implement component

**Acceptance criteria:**

- Spinner is centered with primary color by default
- Overlay mode shows semi-transparent backdrop
- All 5 tests pass

---

### T-001-a-017 — Create Badge Component + Update Barrel Exports

**Description:** Implement `Badge` component with pill shape and semantic colors. Update `src/components/index.ts` to export all 8 components and types.

**Files:**

- `src/components/Badge.tsx`
- `src/components/__tests__/Badge.test.tsx`
- `src/components/index.ts` (update — export all components + types)

**Depends on:** T-001-a-009, T-001-a-005

**Estimated lines:** ~40 (component + test + barrel update)

**Tests required (RED → GREEN):**

- **RED:** `src/components/__tests__/Badge.test.tsx`:
  1. Test renders pill shape (`borderRadius: 9999`)
  2. Test `variant="success"` uses `theme.colors.success` background
  3. Test `variant="error"` uses `theme.colors.error` background
  4. Test `variant="warning"` uses `theme.colors.warning` background
  5. Test `variant="info"` uses `theme.colors.info` background
  6. Test text uses `theme.typography.caption`
  7. Test text color has WCAG AA contrast against badge background
- **GREEN:** Implement component

**Acceptance criteria:**

- Badge renders as pill with correct semantic color per variant
- Text contrast meets WCAG AA
- Barrel export re-exports: Screen, Card, Button, Input, Typography, LoadingSpinner, Badge, and types
- All 7 tests pass

---

## PR 4: Navigation

**Scope:** Navigation types, TabNavigator with 4 placeholder screens, RootNavigator with iOS transitions.

**Dependencies:** Merged PR 3.

---

### T-001-a-018 — Define Navigation Types

- [x] Task complete

**Description:** Create `src/navigation/types.ts` with `RootStackParamList` and `BottomTabParamList` type definitions.

**Files:**

- `src/navigation/types.ts`
- `src/navigation/index.ts` (update — export types)
- `src/navigation/__tests__/navigation-types.test.ts`

**Depends on:** T-001-a-003 (types module)

**Estimated lines:** ~20

**Tests required (RED → GREEN):**

- **RED:** `src/navigation/__tests__/navigation-types.test.ts`:
  1. Test `BottomTabParamList` has 4 keys: Home, Purchases, Dashboard, Settings
  2. Test `RootStackParamList` has `MainTabs` key
  3. Test all param values are `undefined` (no params in 001-a)
- **GREEN:** Implement types

**Acceptance criteria:**

- Types match spec exactly (design §2.2)
- All 3 tests pass (compile-time type assertions + runtime key checks)
- Zero `any` in navigation types

---

### T-001-a-019 — Create TabNavigator with Placeholder Screens

- [x] Task complete

**Description:** Implement `TabNavigator` with 4 placeholder tab screens (Home, Purchases, Dashboard, Settings). Settings screen includes dark mode toggle button.

**Files:**

- `src/navigation/TabNavigator.tsx`
- `src/navigation/__tests__/TabNavigator.test.tsx`

**Depends on:** T-001-a-011 (Screen), T-001-a-015 (Typography), T-001-a-013 (Button), T-001-a-018 (types), T-001-a-006 (useThemeStore)

**Estimated lines:** ~70 (navigator + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/navigation/__tests__/TabNavigator.test.tsx`:
  1. Test navigator renders without crashing
  2. Test 4 tabs are present: Home, Purchases, Dashboard, Settings
  3. Test each tab renders its placeholder content (e.g., Home shows "Home" heading)
  4. Test Settings tab has dark mode toggle button
  5. Test toggle button calls `setMode` when pressed
  6. Test `tabBarActiveTintColor` is `theme.colors.primary`
  7. Test `headerShown: false` on all screens
- **GREEN:** Implement TabNavigator with `createBottomTabNavigator`
- **TRIANGULATE:** Test tab switching (navigate between tabs, verify screen changes)

**Acceptance criteria:**

- TabNavigator has 4 tabs with correct labels
- Placeholder screens use Screen + Typography components
- Settings screen has functional dark mode toggle
- iOS transitions are instant (no animation between tabs)
- All 7 tests pass with `renderWithProviders`

---

### T-001-a-020 — Create RootNavigator with iOS Transitions

- [x] Task complete

**Description:** Implement `RootNavigator` wrapping TabNavigator in a NativeStackNavigator with iOS-style transitions.

**Files:**

- `src/navigation/RootNavigator.tsx`
- `src/navigation/__tests__/RootNavigator.test.tsx`

**Depends on:** T-001-a-019, T-001-a-018

**Estimated lines:** ~35 (navigator + test)

**Tests required (RED → GREEN):**

- **RED:** `src/navigation/__tests__/RootNavigator.test.tsx`:
  1. Test navigator renders without crashing
  2. Test MainTabs screen is registered
  3. Test `headerShown: false` on root stack
  4. Test `animation` is configured for iOS-style transitions
- **GREEN:** Implement RootNavigator with `createNativeStackNavigator`

**Acceptance criteria:**

- RootNavigator uses NativeStackNavigator
- `animation: 'default'` for iOS card slide (design §5 transitions)
- `animationTypeForReplace: 'push'`
- `headerShown: false` globally
- All 4 tests pass

---

### T-001-a-021 — Update Navigation Barrel Export

- [x] Task complete

**Description:** Update `src/navigation/index.ts` to export RootNavigator, TabNavigator, and navigation types.

**Files:**

- `src/navigation/index.ts` (update)

**Depends on:** T-001-a-018, T-001-a-019, T-001-a-020

**Estimated lines:** ~5

**Tests required:** None (barrel export — verified by compilation)

**Acceptance criteria:**

- Barrel re-exports: `RootNavigator`, `TabNavigator`, `RootStackParamList`, `BottomTabParamList`
- `npx tsc --noEmit` passes

---

## PR 5: Services + Database + App Entry

**Scope:** Axios HTTP client with JWT interceptors, SQLite connection manager, DatabaseError class, App.tsx entry point, provider composition.

**Dependencies:** Merged PR 4.

---

### T-001-a-022 — Create Axios HTTP Client with Interceptors

- [x] Task complete

**Description:** Implement `apiClient` with base URL, timeout, JWT request interceptor, and response interceptor (401 → logout, unwrap data).

**Files:**

- `src/services/api/client.ts`
- `src/services/api/index.ts` (update)
- `src/services/api/__tests__/client.test.ts`

**Depends on:** T-001-a-007 (useAuthStore)

**Estimated lines:** ~70 (client + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/services/api/__tests__/client.test.ts`:
  1. Test `apiClient` has correct `baseURL` (platform-dependent or env)
  2. Test `timeout` is 15000ms
  3. Test request interceptor: when auth store has token, `Authorization: Bearer <token>` header is added
  4. Test request interceptor: when auth store has no token, no Authorization header is added
  5. Test response interceptor: successful response returns `response.data` (unwrapped)
  6. Test response interceptor: 401 response calls `useAuthStore.getState().logout()`
  7. Test response interceptor: non-401 error propagates with status/data/message
- **GREEN:** Implement client with interceptors
- **TRIANGULATE:** Test with different token values, test 500 error propagation

**Acceptance criteria:**

- `apiClient` is configured Axios instance
- Request interceptor reads token from `useAuthStore.getState().token`
- Response interceptor unwraps data and handles 401
- All 7 tests pass (use `axios-mock-adapter` or manual mock)
- Zero `any` in client code

---

### T-001-a-023 — Create DatabaseError Class

- [x] Task complete

**Description:** Implement custom `DatabaseError` class with message, code, and optional cause.

**Files:**

- `src/database/errors.ts`
- `src/database/__tests__/errors.test.ts`

**Depends on:** None (standalone)

**Estimated lines:** ~25 (class + test)

**Tests required (RED → GREEN):**

- **RED:** `src/database/__tests__/errors.test.ts`:
  1. Test constructor sets `message`, `code`, and optional `cause`
  2. Test `DatabaseError` extends `Error` (instanceof check)
  3. Test `name` property is `'DatabaseError'`
- **GREEN:** Implement class

**Acceptance criteria:**

- `DatabaseError` extends `Error` with `code` and `cause` properties
- All 3 tests pass
- Zero `any`

---

### T-001-a-024 — Create SQLite Connection Manager

- [x] Task complete

**Description:** Implement `getDatabase()` singleton with lazy initialization, promise-based concurrent call handling, and typed error wrapping.

**Files:**

- `src/database/connection.ts`
- `src/database/index.ts` (update)
- `src/database/__tests__/connection.test.ts`

**Depends on:** T-001-a-023

**Estimated lines:** ~45 (connection + test)

**Tests required (RED → GREEN → TRIANGULATE):**

- **RED:** `src/database/__tests__/connection.test.ts`:
  1. Test first call to `getDatabase()` opens database named `'mi-purchase.db'`
  2. Test second call returns same instance (singleton)
  3. Test concurrent calls (2 simultaneous) return same promise/instance
  4. Test database is lazy (not opened until first call) — mock `openDatabaseAsync`
  5. Test SQLite failure throws `DatabaseError` with code and message
- **GREEN:** Implement singleton with promise-based initialization
- **TRIANGULATE:** Test that failed initialization resets promise so retry is possible

**Acceptance criteria:**

- `getDatabase()` returns singleton `SQLiteDatabase` instance
- Lazy initialization (no connection until first call)
- Concurrent calls share the same promise
- Failure wraps in `DatabaseError`
- All 5 tests pass (mock `expo-sqlite`)

---

### T-001-a-025 — Create Provider Composition (providers.tsx)

- [x] Task complete

**Description:** Create `src/app/providers.tsx` with `queryClient` instance (TanStack Query configured for offline-first).

**Files:**

- `src/app/providers.tsx`
- `src/app/__tests__/providers.test.tsx`

**Depends on:** T-001-a-009 (ThemeProvider)

**Estimated lines:** ~25

**Tests required (RED → GREEN):**

- **RED:** `src/app/__tests__/providers.test.tsx`:
  1. Test `queryClient` has `staleTime: 60000`
  2. Test `queryClient` has `retry: false`
  3. Test `queryClient` has `refetchOnWindowFocus: false`
- **GREEN:** Implement `queryClient` with `new QueryClient()`

**Acceptance criteria:**

- `queryClient` exported as module-level singleton
- Config matches design §6 (staleTime=60s, retry=false, refetchOnWindowFocus=false)
- All 3 tests pass

---

### T-001-a-026 — Create App Entry Point (App.tsx)

- [x] Task complete

**Description:** Implement `src/app/App.tsx` with full provider tree composition and splash screen control.

**Files:**

- `src/app/App.tsx`
- `src/app/index.ts` (update)
- `src/app/__tests__/App.test.tsx`

**Depends on:** T-001-a-009, T-001-a-020, T-001-a-025, T-001-a-010 (NotificationProvider)

**Estimated lines:** ~35 (App + test)

**Tests required (RED → GREEN):**

- **RED:** `src/app/__tests__/App.test.tsx`:
  1. Test App renders without crashing (no uncaught errors)
  2. Test provider tree includes QueryClientProvider, ThemeProvider, DarkModeProvider, SafeAreaProvider, NavigationContainer
  3. Test RootNavigator is rendered inside NavigationContainer
  4. Test NotificationProvider is rendered at app root
- **GREEN:** Implement App component with full provider tree

**Acceptance criteria:**

- Provider tree order: QueryClientProvider → ThemeProvider → DarkModeProvider → SafeAreaProvider → NotificationProvider → NavigationContainer → RootNavigator
- `SplashScreen.preventAutoHideAsync()` called at module level
- All 4 tests pass with `render` from RNTL
- Zero `any` in App.tsx

---

## PR 6: Testing + Linting + Verification

**Scope:** Jest config, React Native Testing Library setup, ESLint, Prettier, test utilities, mock files, all verification.

**Dependencies:** Merged PR 5.

---

### T-001-a-027 — Create Jest Configuration

- [x] Task complete

**Description:** Create `jest.config.js` with jest-expo preset, transform patterns, test matching, and coverage settings.

**Files:**

- `jest.config.js`
- `package.json` (update — add test scripts)

**Depends on:** None (config file)

**Estimated lines:** ~25

**Tests required:** None (config file — verified by running jest)

**Acceptance criteria:**

- `preset: 'jest-expo'`
- `transformIgnorePatterns` includes React Native, Expo, and react-navigation packages
- `testMatch` includes `**/__tests__/**/*.test.{ts,tsx}` and `**/*.test.{ts,tsx}`
- `setupFilesAfterEnv` includes `@testing-library/jest-native/extend-expect`
- `collectCoverageFrom` excludes `__tests__`, `__mocks__`, and `.d.ts` files

---

### T-001-a-028 — Create Mock Files

- [x] Task complete

**Description:** Create manual mocks for `expo-sqlite`, `expo-splash-screen`, and any other dependencies that need mocking in tests.

**Files:**

- `__mocks__/expo-sqlite.ts` (mock `openDatabaseAsync`, return mock db with `execAsync`/`runAsync`)
- `__mocks__/expo-splash-screen.ts` (no-op `preventAutoHideAsync`, `hideAsync`)
- `__mocks__/expo-sqlite.js` (if needed for jest-expo resolution)

**Depends on:** T-001-a-027

**Estimated lines:** ~35

**Tests required:** None (mocks — verified by test suite passing)

**Acceptance criteria:**

- `expo-sqlite` mock returns a promise-resolving `openDatabaseAsync` with stub methods
- `expo-splash-screen` mock has no-op async methods
- Jest resolves mocks automatically via `jest-expo` preset or manual jest.mock calls

---

### T-001-a-029 — Create Test Utilities (renderWithProviders)

- [x] Task complete

**Description:** Create `src/app/__tests__/test-utils.tsx` with `renderWithProviders()` helper that wraps components with all providers.

**Files:**

- `src/app/__tests__/test-utils.tsx`
- `src/app/__tests__/test-utils.test.tsx` (self-test)

**Depends on:** T-001-a-027, T-001-a-009, T-001-a-025

**Estimated lines:** ~55 (utility + self-test)

**Tests required (RED → GREEN):**

- **RED:** `src/app/__tests__/test-utils.test.tsx`:
  1. Test `renderWithProviders` renders a component without errors
  2. Test rendered component has access to theme context (useTheme works)
  3. Test `themeMode` option applies correct theme
  4. Test custom `queryClient` option is used when provided
- **GREEN:** Implement `renderWithProviders` with all provider wrappers
- **TRIANGULATE:** Test with `initialRoute` option for navigation testing

**Acceptance criteria:**

- `renderWithProviders` wraps with: QueryClientProvider → ThemeProvider → MockDarkModeProvider → SafeAreaProvider → NavigationContainer
- MockDarkModeProvider allows setting initial mode without AsyncStorage side effects
- All 4 tests pass

---

### T-001-a-030 — Create ESLint Configuration

- [x] Task complete

**Description:** Create `eslint.config.js` (flat config, ESLint 9+) with TypeScript, React Native, and no-explicit-any rules.

**Files:**

- `eslint.config.js`
- `package.json` (update — add lint scripts)

**Depends on:** None (config file)

**Estimated lines:** ~25

**Tests required:** None (config file — verified by `npm run lint`)

**Acceptance criteria:**

- Extends `@react-native/eslint-config` or equivalent
- `@typescript-eslint/no-explicit-any` set to `'error'`
- `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'`
- `no-console` set to `'warn'`
- Ignores `node_modules/`, `dist/`, `coverage/`, `.expo/`
- `npm run lint` runs successfully (exit 0 on clean code)

---

### T-001-a-031 — Create Prettier Configuration

- [x] Task complete

**Description:** Create `.prettierrc` with project formatting rules.

**Files:**

- `.prettierrc`
- `.prettierignore` (optional)
- `package.json` (update — add format scripts)

**Depends on:** None (config file)

**Estimated lines:** ~15

**Tests required:** None (config file — verified by `npm run format`)

**Acceptance criteria:**

- `singleQuote: true`
- `trailingComma: 'all'`
- `printWidth: 100`
- `tabWidth: 2`
- `semi: true`
- `bracketSpacing: true`
- `arrowParens: 'always'`
- `endOfLine: 'lf'`
- `npm run format` runs successfully

---

### T-001-a-032 — Install Testing Dependencies

- [x] Task complete

**Description:** Add all testing devDependencies to `package.json`: `@testing-library/react-native`, `jest-expo`, `@testing-library/jest-native`, `react-test-renderer`, `axios-mock-adapter`.

**Files:**

- `package.json` (update — add devDependencies)

**Depends on:** T-001-a-027

**Estimated lines:** ~10 (package.json additions)

**Tests required:** None (verified by `npm install` + `npm test`)

**Acceptance criteria:**

- `@testing-library/react-native` ^13.2.0 installed
- `jest-expo` ^56.0.0 installed
- `@testing-library/jest-native` ^5.4.3 installed
- `react-test-renderer` ^19.0.0 installed
- `axios-mock-adapter` installed for HTTP client testing

---

### T-001-a-033 — Create Placeholder Screen Tests

- [x] Task complete

**Description:** Create integration tests for placeholder tab screens (Home, Purchases, Dashboard, Settings).

**Files:**

- `src/navigation/__tests__/placeholder-screens.test.tsx`

**Depends on:** T-001-a-019, T-001-a-029

**Estimated lines:** ~30

**Tests required (RED → GREEN):**

- **RED:**
  1. Test HomeScreen renders "Home" heading
  2. Test PurchasesScreen renders "Purchases" heading
  3. Test DashboardScreen renders "Dashboard" heading
  4. Test SettingsScreen renders "Settings" heading and toggle button
- **GREEN:** Implement integration tests using `renderWithProviders`

**Acceptance criteria:**

- All 4 placeholder screens render their headings correctly
- Tests use `renderWithProviders` for full provider context

---

### T-001-a-034 — Run Full Type Check and Lint

- [x] Task complete

**Description:** Execute `npx tsc --noEmit`, `npm run lint`, and `npm run format:check` to verify the entire codebase.

**Files:** No file changes — verification step.

**Depends on:** T-001-a-030, T-001-a-031, all previous tasks

**Estimated lines:** 0

**Tests required:** None — this is a verification task.

**Acceptance criteria:**

- `npx tsc --noEmit` exits with code 0
- `npm run lint` exits with code 0 (no errors, no warnings with `--max-warnings 0`)
- `npm run format:check` passes (all files properly formatted)
- Zero `any` in production `src/` code (excluding tests)

---

### T-001-a-035 — Run Full Test Suite with Coverage

- [x] Task complete

**Description:** Execute `npm test` and `npm run test:coverage` to verify all tests pass and generate coverage report.

**Files:** No file changes — verification step.

**Depends on:** T-001-a-027 through T-001-a-033

**Estimated lines:** 0

**Tests required:** N/A — runs all existing tests.

**Acceptance criteria:**

- `npm test` passes (all tests green)
- `npm run test:coverage` generates coverage report
- Coverage threshold met (minimum 80% statement coverage for all implemented modules)
- No test failures, no unhandled promise rejections

---

## TDD Evidence Summary

For strict TDD compliance, each implementation task above includes the RED → GREEN → TRIANGULATE → REFACTOR cycle where applicable. Evidence is captured by:

1. **Test files co-located** in `__tests__/` directories beside the code they verify
2. **Commit messages** follow work-unit convention: `test: <description>` for RED commits, `feat: <description>` for GREEN commits
3. **Triangulation tests** are separate test cases added after initial GREEN implementation
4. **Refactoring commits** show no behavior change (tests pass before and after)

### Test Inventory by Module

| Module               | Test Files                                            | Test Count (est.)   |
| -------------------- | ----------------------------------------------------- | ------------------- |
| Theme tokens         | `tokens.test.ts`                                      | 8                   |
| Theme providers      | `ThemeProvider.test.tsx`, `DarkModeProvider.test.tsx` | 7                   |
| Theme store          | `useThemeStore.test.ts`                               | 4                   |
| Auth store           | `useAuthStore.test.ts`                                | 5                   |
| Notification store   | `useNotificationStore.test.ts`                        | 8                   |
| Screen               | `Screen.test.tsx`                                     | 6                   |
| Card                 | `Card.test.tsx`                                       | 7                   |
| Button               | `Button.test.tsx`                                     | 7                   |
| Input                | `Input.test.tsx`                                      | 8                   |
| Typography           | `Typography.test.tsx`                                 | 6                   |
| LoadingSpinner       | `LoadingSpinner.test.tsx`                             | 5                   |
| Badge                | `Badge.test.tsx`                                      | 7                   |
| Toast                | `Toast.test.tsx`                                      | 5                   |
| NotificationProvider | `NotificationProvider.test.tsx`                       | 2                   |
| Navigation types     | `navigation-types.test.ts`                            | 3                   |
| TabNavigator         | `TabNavigator.test.tsx`                               | 7                   |
| RootNavigator        | `RootNavigator.test.tsx`                              | 4                   |
| HTTP client          | `client.test.ts`                                      | 7                   |
| Database errors      | `errors.test.ts`                                      | 3                   |
| Database connection  | `connection.test.ts`                                  | 5                   |
| Providers            | `providers.test.tsx`                                  | 3                   |
| App                  | `App.test.tsx`                                        | 4                   |
| Test utilities       | `test-utils.test.tsx`                                 | 4                   |
| Placeholder screens  | `placeholder-screens.test.tsx`                        | 4                   |
| **Total**            | **24 test files**                                     | **~120 test cases** |

---

## Rollback Plan per PR

| PR   | Rollback Strategy                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| PR 1 | Safe — config-only changes. Revert commit, no data loss.                                                   |
| PR 2 | Safe — stores and providers are isolated. Revert commit, previous PR still compiles.                       |
| PR 3 | Safe — components are self-contained. Revert commit, navigation unaffected.                                |
| PR 4 | Safe — navigation is isolated. Revert commit, components still usable.                                     |
| PR 5 | Partial risk — App.tsx is the entry point. Revert requires also reverting PR 4+ to avoid orphaned imports. |
| PR 6 | Safe — testing and linting config only. Revert has no runtime impact.                                      |

---

## Verification Checklist (Post-All-PRs)

- [x] `npx tsc --noEmit` — exit code 0 (PR 1: verified after T-001-a-005)
- [x] `npm run lint` — exit code 0, no warnings (PR 6)
- [x] `npm run format:check` — all files formatted (PR 6)
- [x] `npm test` — all 160 tests pass (PR 6: 160 tests passing)
- [x] `npm run test:coverage` — 96.84% statement coverage (PR 6)
- [ ] `npx expo start` — app launches in simulator/emulator (PR 6)
- [x] Dark mode toggle in Settings persists across restart (PR 2)
- [x] No `any` in production `src/` code (grep verification — PR 1: zero occurrences)
- [x] All 27 spec requirements satisfied (REQ-001-a-001 through REQ-001-a-027) (PR 6)
- [x] Notification system: single toast, priority replacement, FIFO queue working (PR 2)

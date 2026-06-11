# Scaffold + Theme + Navigation Specification

## Purpose

Define the foundational infrastructure for the mi-purchase-app: Expo SDK 56+ project scaffold, folder architecture, theme system with light/dark tokens, React Navigation setup with iOS-style transitions, shared base components, state management providers (Zustand + TanStack Query), HTTP client (Axios with JWT interceptor), SQLite connection manager, and testing/linting configuration. This chain delivers a runnable, themed, navigable app skeleton with zero domain logic or entity tables.

---

## Domains Covered

| Domain                   | Canonical Spec | Spec Type |
| ------------------------ | -------------- | --------- |
| Scaffold & Configuration | None (new)     | Full spec |
| Theme                    | None (new)     | Full spec |
| Navigation               | None (new)     | Full spec |
| Shared Components        | None (new)     | Full spec |
| State Management         | None (new)     | Full spec |
| HTTP Client              | None (new)     | Full spec |
| Database Connection      | None (new)     | Full spec |
| Testing & Linting        | None (new)     | Full spec |

---

## 1. Scaffold & Configuration

### Requirement: REQ-001-a-001 — Expo SDK 56+ Project with TypeScript Strict Mode

The project MUST be a React Native Expo SDK 56+ app with TypeScript in strict mode and path alias configuration.

#### Scenario: Fresh project initialization

- GIVEN the project root `C:\Users\mendo\Downloads\mi-purchase-app`
- WHEN the project is initialized
- THEN `package.json` declares `expo` with version `^56` or higher
- THEN `tsconfig.json` sets `"strict": true` and `"noImplicitAny": true`
- THEN `tsconfig.json` defines path aliases: `@/app/*`, `@/modules/*`, `@/database/*`, `@/repositories/*`, `@/services/*`, `@/hooks/*`, `@/navigation/*`, `@/components/*`, `@/theme/*`, `@/shared/*`, `@/types/*`, `@/utils/*`

#### Scenario: Type-checking passes

- GIVEN a fresh `npx tsc --noEmit` run
- WHEN no TypeScript errors exist
- THEN the command exits with code 0

#### Scenario: No `any` in production code

- GIVEN the production `src/` directory (excluding `node_modules`, `__tests__`, and config files)
- WHEN searching for the `any` type annotation
- THEN zero instances are found (except in `__tests__` fixtures or explicit `// eslint-disable-next-line` with documented reason)

### Requirement: REQ-001-a-002 — Folder Architecture

The project MUST follow the modular folder structure defined in the umbrella proposal.

#### Scenario: Required directories exist

- GIVEN the `src/` directory
- WHEN listing top-level subdirectories
- THEN the following exist: `app/`, `modules/`, `database/`, `repositories/`, `services/`, `hooks/`, `navigation/`, `components/`, `theme/`, `shared/`, `types/`, `utils/`

#### Scenario: Each directory has an index barrel export

- GIVEN any of the required `src/` subdirectories
- WHEN the directory contains exported symbols
- THEN an `index.ts` barrel file re-exports the public API of that directory

### Requirement: REQ-001-a-003 — App Entry and Provider Composition

The app entry MUST compose all providers in the correct order and render a single root component.

#### Scenario: Provider tree renders

- GIVEN the app starts
- WHEN the root component mounts
- THEN the provider tree includes (in order): QueryClientProvider, ThemeProvider, DarkModeProvider, NavigationContainer, and the root navigator
- THEN no uncaught errors occur during mount

#### Scenario: Provider composition is testable

- GIVEN a test utility file at `src/app/__tests__/test-utils.tsx`
- WHEN a test wraps a component with `renderWithProviders()`
- THEN the component receives QueryClient, theme context, dark mode context, and navigation context

---

## 2. Theme System

### Requirement: REQ-001-a-004 — Light Mode Color Tokens

The theme MUST define light mode color tokens matching the approved design specification.

#### Scenario: Light mode colors are defined

- GIVEN the theme tokens file
- WHEN accessing light mode colors
- THEN the following values are defined:
  - `primary`: `#0057FF`
  - `secondary`: `#23DCE1`
  - `background`: `#F5F7FA`
  - `card`: `#FFFFFF`
  - `textPrimary`: `#111827`
  - `textSecondary`: `#6B7280`
  - `border`: `#E5E7EB`
  - `success`, `warning`, `error`, `info` semantic colors are defined with accessible contrast ratios (WCAG AA minimum)

#### Scenario: Light mode colors pass accessibility contrast

- GIVEN any text color on any background color in light mode
- WHEN the contrast ratio is calculated
- THEN normal text meets WCAG AA (≥ 4.5:1) and large text meets WCAG AA (≥ 3:1)

### Requirement: REQ-001-a-005 — Dark Mode Color Tokens

The theme MUST define dark mode color tokens matching the approved design specification.

#### Scenario: Dark mode colors are defined

- GIVEN the theme tokens file
- WHEN accessing dark mode colors
- THEN the following values are defined:
  - `primary`: `#0057FF` (same as light)
  - `secondary`: `#23DCE1` (same as light)
  - `background`: `#0B0D12`
  - `card`: `#161A22`
  - `textPrimary`: `#F3F4F6`
  - `textSecondary`: `#9CA3AF`
  - `border`: `#2D3348` (derived from dark context)
  - Semantic colors (`success`, `warning`, `error`, `info`) are adjusted for dark mode with accessible contrast

#### Scenario: Dark mode colors pass accessibility contrast

- GIVEN any text color on any background color in dark mode
- WHEN the contrast ratio is calculated
- THEN normal text meets WCAG AA (≥ 4.5:1) and large text meets WCAG AA (≥ 3:1)

### Requirement: REQ-001-a-006 — Typography Scale

The theme MUST define a typography scale with large, clear hierarchy.

#### Scenario: Typography tokens are defined

- GIVEN the theme tokens file
- WHEN accessing typography configuration
- THEN the following scale is defined with size, weight, and line height:
  - `display`: large hero text (≥ 34px, weight 700)
  - `h1`: primary headings (≥ 28px, weight 700)
  - `h2`: secondary headings (≥ 22px, weight 600)
  - `h3`: section headings (≥ 18px, weight 600)
  - `body`: body text (≥ 16px, weight 400)
  - `bodySmall`: secondary body (≥ 14px, weight 400)
  - `caption`: labels/hints (≥ 12px, weight 400)
  - `button`: button labels (≥ 16px, weight 600)

#### Scenario: Font family is system default (iOS feel)

- GIVEN the typography configuration
- WHEN the font family is checked
- THEN the system font stack is used (`System` on iOS, `Roboto` on Android) without custom font files

### Requirement: REQ-001-a-007 — Spacing and Border Radius Tokens

The theme MUST define consistent spacing and border radius tokens.

#### Scenario: Spacing scale is defined

- GIVEN the theme tokens file
- WHEN accessing spacing configuration
- THEN a numeric scale is defined: `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `xxxl: 32`, `huge: 48`

#### Scenario: Border radius tokens are defined

- GIVEN the theme tokens file
- WHEN accessing border radius configuration
- THEN the following values are defined:
  - `small`: 8px (inputs, small badges)
  - `medium`: 12px (buttons, chips)
  - `large`: 20px (cards, panels — primary card radius)
  - `xlarge`: 24px (large cards, modals — maximum card radius)
  - `full`: 9999px (pill buttons, avatars)

### Requirement: REQ-001-a-008 — Shadow Tokens

The theme MUST define subtle shadow tokens for the iOS-inspired aesthetic.

#### Scenario: Shadow tokens are defined

- GIVEN the theme tokens file
- WHEN accessing shadow configuration
- THEN the following elevation levels are defined:
  - `none`: no shadow
  - `sm`: subtle lift (y: 1, blur: 2, opacity: 0.05)
  - `md`: card shadow (y: 2, blur: 8, opacity: 0.08)
  - `lg`: elevated card (y: 4, blur: 16, opacity: 0.10)
  - `xl`: modal/overlay (y: 8, blur: 32, opacity: 0.12)

### Requirement: REQ-001-a-009 — Theme Provider and TypeScript Interface

The theme system MUST export a typed `Theme` interface and a `ThemeProvider` component.

#### Scenario: Theme interface is fully typed

- GIVEN the `src/types/theme.ts` file
- WHEN the `Theme` interface is inspected
- THEN it includes: `colors`, `typography`, `spacing`, `borderRadius`, `shadows`, and a `mode: 'light' | 'dark'` field

#### Scenario: ThemeProvider supplies theme via context

- GIVEN a component wrapped in `ThemeProvider`
- WHEN the component calls `useTheme()`
- THEN it receives the current `Theme` object with all token categories populated

### Requirement: REQ-001-a-010 — Dark Mode Persistence

The dark mode preference MUST persist across app restarts using a durable storage mechanism.

#### Scenario: User toggles dark mode

- GIVEN the app is in light mode
- WHEN the user toggles dark mode via the theme settings
- THEN the theme immediately switches to dark mode
- AND the preference is persisted to device storage (AsyncStorage or SecureStore)

#### Scenario: Dark mode preference survives restart

- GIVEN the user previously set dark mode
- WHEN the app is closed and reopened
- THEN the app launches in dark mode without flickering to light mode first

#### Scenario: First launch respects system preference

- GIVEN the app has never been launched
- WHEN the app starts for the first time
- THEN the theme defaults to the device's system appearance setting (if detectable), falling back to light mode

---

## 3. Navigation

### Requirement: REQ-001-a-011 — Root Navigation Structure

The app MUST use React Navigation with a root stack navigator and a tab navigator for primary sections.

#### Scenario: Root stack navigator is configured

- GIVEN the navigation setup
- WHEN the root navigator is inspected
- THEN it is a `NativeStackNavigator` with iOS-style transitions (default iOS animation on iOS, slide on Android)
- THEN `headerShown` is `false` by default (custom headers via theme)

#### Scenario: Tab navigator defines primary sections

- GIVEN the tab navigator configuration
- WHEN the tab screens are inspected
- THEN the following placeholder tabs exist (routes only, no domain logic yet):
  - `Home` (placeholder screen)
  - `Purchases` (placeholder screen)
  - `Dashboard` (placeholder screen)
  - `Settings` (placeholder screen — includes dark mode toggle)
- THEN each tab has an icon placeholder and a label

#### Scenario: Navigation types are fully typed

- GIVEN `src/navigation/types.ts`
- WHEN the `RootStackParamList` interface is inspected
- THEN it defines all screen routes with their parameter types (or `undefined` for parameterless screens)
- THEN the `BottomTabParamList` interface is similarly defined

### Requirement: REQ-001-a-012 — iOS-Style Transitions

Navigation transitions MUST follow the iOS-inspired premium aesthetic.

#### Scenario: Stack transitions use iOS-style animation

- GIVEN a stack navigation event (push/pop)
- WHEN the transition occurs on iOS
- THEN the card-style slide-from-right animation is used
- WHEN the transition occurs on Android
- THEN a fade or slide animation is used (no default Android activity transition)

#### Scenario: Tab transitions are instant

- GIVEN a tab switch event
- WHEN the user taps a different tab
- THEN the screen changes immediately with no animation (standard tab behavior)

### Requirement: REQ-001-a-013 — Safe Area Handling

The app MUST respect iOS safe areas and notched displays.

#### Scenario: Content respects safe area insets

- GIVEN any screen wrapped in the `Screen` component (see REQ-001-a-014)
- WHEN the device has a notch or dynamic island
- THEN content is not obscured by the notch, home indicator, or rounded corners
- WHEN the device has no notch (iPad, older phones)
- THEN safe area insets are still applied correctly (no double-padding)

---

## 4. Shared Components

### Requirement: REQ-001-a-014 — Screen Wrapper Component

A `Screen` component MUST provide consistent safe area, background, and padding for all screens.

#### Scenario: Screen wraps content with safe area and theme background

- GIVEN a screen uses `<Screen>` as its root
- WHEN the screen renders
- THEN `SafeAreaView` wraps the content
- THEN the background color matches `theme.colors.background` for the current mode
- THEN a default padding of `spacing.lg` (16px) is applied

#### Scenario: Screen supports customization

- GIVEN a screen uses `<Screen>`
- WHEN the `noPadding` prop is passed
- THEN no internal padding is applied
- WHEN the `backgroundColor` prop is passed
- THEN the custom background color overrides the theme default
- WHEN the `scrollable` prop is passed
- THEN content is wrapped in a `ScrollView` with `contentContainerStyle` that respects safe area

### Requirement: REQ-001-a-015 — Card Component

A `Card` component MUST render a themed card with iOS-style rounded corners and subtle shadows.

#### Scenario: Card renders with default styling

- GIVEN a `<Card>` component
- WHEN rendered without props
- THEN it has border radius of `theme.borderRadius.large` (20px)
- THEN it has background color of `theme.colors.card`
- THEN it has shadow elevation of `theme.shadows.md`
- THEN it has internal padding of `spacing.lg` (16px)

#### Scenario: Card supports variants

- GIVEN a `<Card>` component
- WHEN the `variant="elevated"` prop is passed
- THEN the shadow is `theme.shadows.lg`
- WHEN the `variant="flat"` prop is passed
- THEN the shadow is `theme.shadows.none` and a border of `theme.colors.border` is applied
- WHEN the `pressable` prop is passed
- THEN the card responds to touch with a subtle scale-down animation (0.98) and `onPress` callback is available

### Requirement: REQ-001-a-016 — Button Component

A `Button` component MUST support primary, secondary, and ghost variants with loading and disabled states.

#### Scenario: Button renders in primary variant

- GIVEN a `<Button variant="primary">`
- WHEN rendered
- THEN it has background color of `theme.colors.primary`
- THEN it has text color of white
- THEN it has border radius of `theme.borderRadius.medium` (12px)
- THEN it has full-width layout (block button)

#### Scenario: Button renders in secondary and ghost variants

- GIVEN a `<Button variant="secondary">`
- THEN it has border of `theme.colors.primary` with transparent background and `theme.colors.primary` text
- GIVEN a `<Button variant="ghost">`
- THEN it has no border, no background, and `theme.colors.primary` text

#### Scenario: Button loading state

- GIVEN a `<Button loading={true}>`
- WHEN rendered
- THEN the button text is replaced by a `ActivityIndicator` matching the button's text color
- THEN `onPress` is disabled

#### Scenario: Button disabled state

- GIVEN a `<Button disabled={true}>`
- WHEN rendered
- THEN the button has reduced opacity (0.5)
- THEN `onPress` is disabled
- THEN the button is not focusable

### Requirement: REQ-001-a-017 — Input Component

An `Input` component MUST provide a themed text input with label, error, and helper text support.

#### Scenario: Input renders with label

- GIVEN an `<Input label="Product Name" />`
- WHEN rendered
- THEN a label is displayed above the input field using `theme.typography.bodySmall`
- THEN the input field has border of `theme.colors.border` and border radius of `theme.borderRadius.small` (8px)
- THEN the input background matches `theme.colors.card`

#### Scenario: Input error state

- GIVEN an `<Input error="This field is required" />`
- WHEN rendered
- THEN the input border color changes to `theme.colors.error`
- THEN the error message is displayed below the input in `theme.colors.error` using `theme.typography.caption`

#### Scenario: Input helper text

- GIVEN an `<Input helperText="Optional description" />`
- WHEN rendered
- THEN the helper text is displayed below the input in `theme.colors.textSecondary` using `theme.typography.caption`

### Requirement: REQ-001-a-018 — Typography Component

A `Typography` component MUST render text with the theme's typography scale.

#### Scenario: Typography renders with variant

- GIVEN a `<Typography variant="h1">Title</Typography>`
- WHEN rendered
- THEN the text uses `theme.typography.h1` (size, weight, line height)
- THEN the text color defaults to `theme.colors.textPrimary`

#### Scenario: Typography supports color and alignment overrides

- GIVEN a `<Typography>`
- WHEN the `color` prop is passed
- THEN the text color is overridden
- WHEN the `align` prop is passed (`left`, `center`, `right`)
- THEN the text alignment is applied

### Requirement: REQ-001-a-019 — Loading Spinner Component

A `LoadingSpinner` component MUST provide a consistent loading indicator.

#### Scenario: LoadingSpinner renders centered

- GIVEN a `<LoadingSpinner />`
- WHEN rendered
- THEN an `ActivityIndicator` is displayed with `theme.colors.primary` as the color
- THEN the spinner is centered within its container

#### Scenario: LoadingSpinner supports size and overlay modes

- GIVEN a `<LoadingSpinner size="large" />`
- THEN the `ActivityIndicator` size is `large`
- GIVEN a `<LoadingSpinner overlay />`
- THEN the spinner is displayed in a semi-transparent overlay covering the parent container

### Requirement: REQ-001-a-020 — Badge Component

A `Badge` component MUST render small labeled indicators with semantic colors.

#### Scenario: Badge renders with variant

- GIVEN a `<Badge label="New" variant="info" />`
- WHEN rendered
- THEN it has a pill shape (`borderRadius.full`)
- THEN the background color matches the variant's semantic color
- THEN the text color provides sufficient contrast (WCAG AA)
- THEN the text uses `theme.typography.caption`

---

## 5. State Management

### Requirement: REQ-001-a-021 — Zustand Store Setup

The app MUST use Zustand for app-wide UI state with placeholder stores for theme and auth.

#### Scenario: Theme store is defined

- GIVEN `src/hooks/useThemeStore.ts`
- WHEN the store is inspected
- THEN it exports a Zustand store with:
  - `mode: 'light' | 'dark'`
  - `setMode(mode)` action
  - `initializeMode()` action that reads persisted preference or system default
- THEN the store is typed (no `any` in state or actions)

#### Scenario: Auth store placeholder is defined

- GIVEN `src/hooks/useAuthStore.ts`
- WHEN the store is inspected
- THEN it exports a Zustand store with placeholder fields:
  - `isAuthenticated: boolean` (default `false`)
  - `user: User | null` (from `@/types/user.ts`)
  - `token: string | null`
  - Placeholder actions: `setAuthenticated`, `setUser`, `setToken`, `logout`
- THEN the `User` type interface exists in `@/types/user.ts` with at minimum: `id`, `email`, `username`, `preferredCurrency`

#### Scenario: Stores are testable in isolation

- GIVEN a unit test for the theme store
- WHEN the store is created in test mode
- THEN state changes can be verified without side effects (persistence is mocked)

### Requirement: REQ-001-a-022 — TanStack Query Provider Setup

The app MUST configure TanStack Query with appropriate defaults for offline-first operation.

#### Scenario: QueryClient is configured

- GIVEN the `QueryClient` instance in `src/app/providers.tsx`
- WHEN the configuration is inspected
- THEN `defaultOptions.queries.staleTime` is set to a non-zero value (≥ 60000ms / 1 minute)
- THEN `defaultOptions.queries.retry` is set to `false` (offline-first, manual retry via repository)
- THEN `defaultOptions.queries.refetchOnWindowFocus` is set to `false`

#### Scenario: QueryClientProvider wraps the app

- GIVEN the root provider composition
- WHEN the app renders
- THEN `QueryClientProvider` is the outermost provider in the tree
- THEN child components can use `useQuery` and `useMutation` hooks

---

## 6. HTTP Client

### Requirement: REQ-001-a-023 — Axios Instance with Base URL and Interceptors

The app MUST export a configured Axios instance with the backend base URL and a JWT interceptor.

#### Scenario: Axios instance is configured

- GIVEN `src/services/api/client.ts`
- WHEN the instance is inspected
- THEN `baseURL` is set to `http://10.0.2.2:3000/purchase/api/v1` for Android emulator OR `http://localhost:3000/purchase/api/v1` for iOS simulator (configurable via environment variable `API_BASE_URL`)
- THEN `timeout` is set to 15000ms
- THEN `headers['Content-Type']` defaults to `application/json`

#### Scenario: JWT request interceptor

- GIVEN an authenticated request
- WHEN the Axios request interceptor runs
- THEN it reads the JWT token from the auth store (or SecureStore)
- THEN if a token exists, it sets `Authorization: Bearer <token>` header
- THEN if no token exists, the request proceeds without the header (no error)

#### Scenario: JWT response interceptor

- GIVEN an API response with status 401
- WHEN the Axios response interceptor runs
- THEN it triggers a logout action (clears auth store state)
- THEN it does NOT redirect to a login screen (login screens are out of scope for 001-a)
- THEN the error is propagated to the caller

#### Scenario: Response data is unwrapped

- GIVEN a successful API response
- WHEN the response interceptor processes it
- THEN it returns `response.data` directly (unwrapping the Axios envelope)

---

## 7. Database Connection

### Requirement: REQ-001-a-024 — Expo SQLite Connection Manager

The app MUST initialize an Expo SQLite database connection without creating any tables.

#### Scenario: Database connection is established

- GIVEN `src/database/connection.ts`
- WHEN `getDatabase()` is called
- THEN it opens a database named `mi-purchase.db`
- THEN it returns a singleton database instance
- THEN subsequent calls return the same instance (no duplicate connections)

#### Scenario: Connection is lazy-initialized

- GIVEN the app starts
- WHEN no repository or database function has been called
- THEN the SQLite database is NOT opened yet (lazy on first `getDatabase()` call)

#### Scenario: Connection error handling

- GIVEN SQLite fails to open (disk full, permission denied)
- WHEN `getDatabase()` is called
- THEN it throws a typed error (not a generic `Error`)
- THEN the error message includes the SQLite error code

---

## 8. Testing & Linting

### Requirement: REQ-001-a-025 — Jest Configuration

The project MUST have Jest configured for React Native testing with TypeScript support.

#### Scenario: Jest config exists

- GIVEN `jest.config.js` or `jest.config.ts`
- WHEN the config is inspected
- THEN `preset` is set to `jest-expo`
- THEN `transformIgnorePatterns` includes React Native and Expo packages
- THEN `testMatch` includes `**/__tests__/**/*.test.{ts,tsx}` and `**/*.test.{ts,tsx}`
- THEN `setupFilesAfterEnv` includes `@testing-library/jest-native/extend-expect`

#### Scenario: Jest runs successfully

- GIVEN a placeholder test file exists
- WHEN `npx jest` is executed
- THEN all tests pass and coverage report is generated

### Requirement: REQ-001-a-026 — React Native Testing Library Setup

The project MUST have React Native Testing Library configured for component testing.

#### Scenario: RNTL is installed and configured

- GIVEN `package.json`
- THEN `@testing-library/react-native` is listed as a dev dependency
- GIVEN a component test using `render()`
- WHEN the test runs
- THEN the component renders without errors

### Requirement: REQ-001-a-027 — ESLint and Prettier Configuration

The project MUST have ESLint and Prettier configured for consistent code style.

#### Scenario: ESLint config exists

- GIVEN `.eslintrc.js` or `eslint.config.js`
- WHEN the config is inspected
- THEN it extends `@react-native` (or `@expo`) recommended rules
- THEN it enforces `no-any` or `@typescript-eslint/no-explicit-any` as an error (or warning with CI failure)

#### Scenario: Prettier config exists

- GIVEN `.prettierrc`
- WHEN the config is inspected
- THEN it sets `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `tabWidth: 2`, `semi: true`

#### Scenario: Lint and format commands work

- GIVEN the project root
- WHEN `npm run lint` is executed
- THEN ESLint runs and reports results (exit 0 if no errors, exit 1 if errors)
- WHEN `npm run format` is executed
- THEN Prettier formats all `.ts`, `.tsx`, and `.js` files

---

## 9. Data Models

### 9.1 Theme Interface

```typescript
// src/types/theme.ts

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographyVariant {
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  fontFamily?: string;
}

export interface TypographyScale {
  display: TypographyVariant;
  h1: TypographyVariant;
  h2: TypographyVariant;
  h3: TypographyVariant;
  body: TypographyVariant;
  bodySmall: TypographyVariant;
  caption: TypographyVariant;
  button: TypographyVariant;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
}

export interface BorderRadiusTokens {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  full: number;
}

export interface ShadowToken {
  y: number;
  blur: number;
  opacity: number;
  color?: string;
}

export interface ShadowTokens {
  none: null;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: TypographyScale;
  spacing: SpacingTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
}
```

### 9.2 Navigation Types

```typescript
// src/navigation/types.ts

export type BottomTabParamList = {
  Home: undefined;
  Purchases: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  // Placeholder for future domain screens:
  // PurchaseDetail: { purchaseId: string };
  // PurchaseCreate: undefined;
  // ... (added in subsequent chains)
};
```

### 9.3 User Type (Auth Placeholder)

```typescript
// src/types/user.ts

export interface User {
  id: string;
  email: string;
  username: string;
  preferredCurrency: string; // ISO 4217 code, e.g., 'USD', 'VES'
}
```

### 9.4 Component Props Interfaces

```typescript
// src/components/types.ts

export interface ScreenProps {
  children: React.ReactNode;
  noPadding?: boolean;
  backgroundColor?: string;
  scrollable?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
}

export interface TypographyProps {
  children: React.ReactNode;
  variant: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  overlay?: boolean;
  color?: string;
}
```

---

## 10. Acceptance Criteria

| #             | Requirement                | Verification Method                                                                           |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| REQ-001-a-001 | TypeScript strict mode     | `npx tsc --noEmit` exits 0; `tsconfig.json` has `"strict": true`                              |
| REQ-001-a-002 | Folder architecture        | `ls src/` shows all required directories; each has `index.ts` if it exports                   |
| REQ-001-a-003 | Provider composition       | App launches without errors; `test-utils.tsx` exports `renderWithProviders`                   |
| REQ-001-a-004 | Light mode tokens          | Theme file defines all required colors with correct hex values                                |
| REQ-001-a-005 | Dark mode tokens           | Theme file defines all required dark colors with correct hex values                           |
| REQ-001-a-006 | Typography scale           | Theme defines all 8 typography variants with correct size/weight/lineHeight                   |
| REQ-001-a-007 | Spacing & border radius    | Theme defines spacing scale (8 values) and border radius tokens (5 values)                    |
| REQ-001-a-008 | Shadow tokens              | Theme defines 5 shadow levels with y, blur, opacity values                                    |
| REQ-001-a-009 | Theme interface & provider | `Theme` interface typed; `useTheme()` returns full `Theme` object                             |
| REQ-001-a-010 | Dark mode persistence      | Toggle dark mode → kill app → restart → dark mode persists                                    |
| REQ-001-a-011 | Navigation structure       | Root stack + 4 tab screens exist; types are fully typed in `types.ts`                         |
| REQ-001-a-012 | iOS transitions            | iOS: card-style slide; Android: fade/slide (not default Android)                              |
| REQ-001-a-013 | Safe areas                 | `<Screen>` wraps content in `SafeAreaView`; no content obscured on notch devices              |
| REQ-001-a-014 | Screen component           | Renders with safe area, theme background, default padding; supports `noPadding`, `scrollable` |
| REQ-001-a-015 | Card component             | Renders with 20px radius, card background, md shadow; supports variants and pressable         |
| REQ-001-a-016 | Button component           | 3 variants render correctly; loading shows spinner; disabled reduces opacity                  |
| REQ-001-a-017 | Input component            | Renders with label, border; error state changes border color and shows message                |
| REQ-001-a-018 | Typography component       | All 8 variants render with correct size/weight; color/align overrides work                    |
| REQ-001-a-019 | Loading spinner            | Renders centered ActivityIndicator; overlay mode shows semi-transparent backdrop              |
| REQ-001-a-020 | Badge component            | Renders pill shape with semantic color; text has WCAG AA contrast                             |
| REQ-001-a-021 | Zustand stores             | Theme store has mode/setMode/initializeMode; auth store has placeholder fields                |
| REQ-001-a-022 | TanStack Query             | QueryClient configured with staleTime ≥ 60s, retry false, refetchOnWindowFocus false          |
| REQ-001-a-023 | Axios instance             | baseURL correct; JWT interceptor adds Bearer header; 401 triggers logout                      |
| REQ-001-a-024 | SQLite connection          | `getDatabase()` returns singleton; lazy-initialized; typed error on failure                   |
| REQ-001-a-025 | Jest config                | `jest.config.js` exists with jest-expo preset; `npx jest` passes                              |
| REQ-001-a-026 | RNTL setup                 | `@testing-library/react-native` installed; component `render()` works in tests                |
| REQ-001-a-027 | ESLint + Prettier          | Config files exist; `npm run lint` and `npm run format` work correctly                        |

---

## 11. Edge Cases

### Edge Case: EC-001 — Rapid Dark Mode Toggles

- **Scenario**: User toggles dark mode on/off rapidly (5+ times in 2 seconds)
- **Expected**: No race conditions; final state reflects last toggle; no visual glitch or flicker
- **Mitigation**: Debounce or atomic state update in the theme store; no async race between `setMode` and persistence write

### Edge Case: EC-002 — Theme Flash on First Launch

- **Scenario**: App launches for the first time before system preference is detected
- **Expected**: No visible flash from light to dark (or vice versa); app shows the correct theme from the first frame
- **Mitigation**: Initialize theme synchronously during app bootstrap before the first render; use `SplashScreen.preventAutoHideAsync()` until theme is resolved

### Edge Case: EC-003 — Font Scaling (Dynamic Type)

- **Scenario**: User increases device font size to maximum via Accessibility settings
- **Expected**: UI does not break; text reflows within cards; no overlapping elements; ScrollView allows scrolling when content exceeds viewport
- **Mitigation**: Use `PixelRatio.getFontScale()`-aware sizing or React Native's built-in dynamic type support; test with `fontScale: 1.5` and `2.0`

### Edge Case: EC-004 — Low Storage / SQLite Failure

- **Scenario**: Device has insufficient storage to create the SQLite database
- **Expected**: `getDatabase()` throws a typed `DatabaseError` with a user-understandable message
- **Mitigation**: Catch SQLite errors, wrap in a custom `DatabaseError` class with code and message

### Edge Case: EC-005 — Network Unavailable on App Launch

- **Scenario**: App launches with no network connectivity
- **Expected**: App loads normally (offline-first); Axios instance is initialized but no requests fail silently
- **Mitigation**: Axios timeout handles unresponsive server; no startup requests are made in 001-a (no domain logic)

### Edge Case: EC-006 — Expired or Invalid JWT in Storage

- **Scenario**: A JWT token exists in storage but is expired or malformed
- **Expected**: Axios interceptor still attaches the header (server will reject with 401); response interceptor handles 401 by clearing auth state
- **Mitigation**: Do not validate token client-side in 001-a (validation happens in 001-b); let server respond with 401

### Edge Case: EC-007 — iOS Home Indicator Overlap

- **Scenario**: Tab bar content extends behind the iOS home indicator on iPhone 12+
- **Expected**: Tab bar has proper bottom inset; content is not obscured or partially hidden
- **Mitigation**: `SafeAreaProvider` at root; `useSafeAreaInsets()` in components that need manual inset handling

### Edge Case: EC-008 — Theme Tokens Not Found in Component

- **Scenario**: A component accesses a theme token that does not exist (e.g., `theme.colors.accent` when not defined)
- **Expected**: TypeScript catches this at compile time (no runtime error in production)
- **Mitigation**: Strict `Theme` interface; no `any` in theme access; components must use typed `useTheme()` hook

### Edge Case: EC-009 — Concurrent getDatabase() Calls

- **Scenario**: Multiple repositories call `getDatabase()` simultaneously during app startup
- **Expected**: Only one database connection is created; all callers receive the same singleton instance
- **Mitigation**: Singleton pattern with promise-based lazy initialization (not simple sync singleton)

### Edge Case: EC-010 — Tab Navigator Memory on Deep Nesting

- **Scenario**: User navigates deep into a stack within a tab, switches tabs, and returns
- **Expected**: The previous stack state is preserved (not re-mounted)
- **Mitigation**: React Navigation's default behavior preserves stack state per tab; verify `lazy` is not set on tab screens if state preservation is desired

---

## 12. Out of Scope (Explicit)

The following are explicitly **NOT** part of 001-a and will be addressed in subsequent chains:

- Auth screens (login, register, forgot password) → 001-b
- Domain entity SQLite tables (categories, products, stores, purchases, etc.) → 001-b through 001-d
- CRUD operations or business logic → 001-b through 001-d
- API calls beyond Axios instance setup → 001-b through 001-d
- Sync engine (pull/push logic) → 001-d
- Dashboard widgets → 001-d
- Custom fonts or icon libraries → Future (system fonts only for 001-a)
- E2E testing with Detox → Deferred
- Biometric authentication → Deferred
- Push notifications → Deferred

---

## 13. Dependencies for 001-a

| Dependency                       | Version Constraint     | Purpose                                 |
| -------------------------------- | ---------------------- | --------------------------------------- |
| `expo`                           | `^56`                  | Core SDK                                |
| `expo-splash-screen`             | Compatible with SDK 56 | Splash screen control during theme init |
| `react-navigation/native`        | `^6.x` or `^7.x`       | Navigation core                         |
| `react-navigation/native-stack`  | Matching native        | Stack navigator                         |
| `react-navigation/bottom-tabs`   | Matching bottom-tabs   | Tab navigator                           |
| `expo-sqlite`                    | Compatible with SDK 56 | SQLite connection                       |
| `axios`                          | `^1.x`                 | HTTP client                             |
| `zustand`                        | `^4.x` or `^5.x`       | State management                        |
| `@tanstack/react-query`          | `^5.x`                 | Data caching                            |
| `react-native-safe-area-context` | Latest                 | Safe area handling                      |
| `@testing-library/react-native`  | Latest                 | Component testing                       |
| `jest-expo`                      | Matches Expo SDK       | Jest preset                             |
| `@react-native/eslint-config`    | Latest                 | ESLint rules                            |
| `prettier`                       | `^3.x`                 | Code formatting                         |

---

## 14. File Inventory (Expected Structure)

```
mi-purchase-app/
├── app.json                         # Expo config
├── tsconfig.json                    # TypeScript config with path aliases
├── jest.config.js                   # Jest configuration
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── babel.config.js                  # Babel config (Expo default)
├── package.json                     # Dependencies
└── src/
    ├── app/
    │   ├── App.tsx                  # Root component
    │   ├── providers.tsx            # Provider composition
    │   └── __tests__/
    │       ├── App.test.tsx         # App mount test
    │       └── test-utils.tsx       # Test render helper
    ├── components/
    │   ├── Screen.tsx               # Safe area wrapper
    │   ├── Card.tsx                 # Themed card
    │   ├── Button.tsx               # Themed button
    │   ├── Input.tsx                # Themed input
    │   ├── Typography.tsx           # Themed text
    │   ├── LoadingSpinner.tsx       # ActivityIndicator wrapper
    │   ├── Badge.tsx                # Semantic badge
    │   ├── index.ts                 # Barrel export
    │   └── __tests__/               # Component tests (one per component)
    ├── theme/
    │   ├── tokens.ts                # Color, spacing, typography, shadow tokens
    │   ├── ThemeProvider.tsx        # Theme context + provider
    │   ├── DarkModeProvider.tsx     # Dark mode persistence logic
    │   ├── useTheme.ts              # Theme context hook
    │   ├── index.ts                 # Barrel export
    │   └── __tests__/
    │       └── tokens.test.ts       # Token completeness test
    ├── navigation/
    │   ├── RootNavigator.tsx        # Stack navigator
    │   ├── TabNavigator.tsx         # Tab navigator
    │   ├── types.ts                 # Navigation param list types
    │   ├── index.ts                 # Barrel export
    │   └── __tests__/
    │       └── navigation.test.tsx  # Navigator render test
    ├── hooks/
    │   ├── useThemeStore.ts         # Zustand theme store
    │   ├── useAuthStore.ts          # Zustand auth store (placeholder)
    │   └── index.ts                 # Barrel export
    ├── services/
    │   └── api/
    │       ├── client.ts            # Axios instance + interceptors
    │       ├── index.ts             # Barrel export
    │       └── __tests__/
    │           └── client.test.ts   # Interceptor tests
    ├── database/
    │   ├── connection.ts            # SQLite connection manager
    │   ├── index.ts                 # Barrel export
    │   ├── errors.ts                # Custom DatabaseError class
    │   └── __tests__/
    │       └── connection.test.ts   # Connection singleton test
    ├── types/
    │   ├── theme.ts                 # Theme TypeScript interfaces
    │   ├── user.ts                  # User type (auth placeholder)
    │   └── index.ts                 # Barrel export
    ├── shared/
    │   └── index.ts                 # Shared utilities (empty for 001-a)
    ├── modules/
    │   └── index.ts                 # Module barrel (empty for 001-a)
    ├── repositories/
    │   └── index.ts                 # Repository barrel (empty for 001-a)
    └── utils/
        └── index.ts                 # Utils barrel (empty for 001-a)
```

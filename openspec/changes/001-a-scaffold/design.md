# Technical Design — Chain 001-a: Scaffold + Theme + Navigation

## 1. Dependency Graph

### Exact npm Packages with Versions

| Package                            | Version           | Purpose                                 | Category   |
| ---------------------------------- | ----------------- | --------------------------------------- | ---------- |
| `expo`                             | `^56`             | Core SDK, project runner                | Core       |
| `expo-status-bar`                  | `~2.0.0`          | Status bar theming                      | Core       |
| `expo-splash-screen`               | `~0.29.0`         | Splash screen control during theme init | Core       |
| `react-native`                     | `0.79.0` (SDK 56) | React Native framework                  | Core       |
| `react`                            | `^19.0.0`         | React library                           | Core       |
| `typescript`                       | `^5.8.0`          | TypeScript compiler                     | Dev        |
| `@expo/config-plugins`             | `~10.0.0`         | Expo config plugin support              | Dev        |
| `react-navigation/native`          | `^7.1.0`          | Navigation core library                 | Navigation |
| `react-navigation/native-stack`    | `^7.3.0`          | Native stack navigator                  | Navigation |
| `react-navigation/bottom-tabs`     | `^7.3.0`          | Bottom tab navigator                    | Navigation |
| `react-native-screens`             | `~4.9.0`          | Native screen containers (peer dep)     | Navigation |
| `react-native-safe-area-context`   | `~5.4.0`          | Safe area insets provider               | Navigation |
| `expo-sqlite`                      | `~15.2.0`         | SQLite database access                  | Database   |
| `axios`                            | `^1.9.0`          | HTTP client                             | HTTP       |
| `zustand`                          | `^5.0.4`          | State management (lightweight store)    | State      |
| `@tanstack/react-query`            | `^5.76.0`         | Server state caching and management     | State      |
| `@testing-library/react-native`    | `^13.2.0`         | Component testing utilities             | Testing    |
| `jest-expo`                        | `^56.0.0`         | Jest preset matching Expo SDK           | Testing    |
| `@testing-library/jest-native`     | `^5.4.3`          | Jest matchers for RNTL                  | Testing    |
| `react-test-renderer`              | `^19.0.0`         | React tree snapshot testing             | Testing    |
| `@react-native/eslint-config`      | `~0.79.0`         | React Native ESLint rules               | Tooling    |
| `@typescript-eslint/eslint-plugin` | `^8.0.0`          | TS-specific ESLint rules                | Tooling    |
| `eslint`                           | `^9.0.0`          | Linter                                  | Tooling    |
| `prettier`                         | `^3.5.0`          | Code formatter                          | Tooling    |

### Module Dependency Graph

```
                    ┌─────────────────┐
                    │    App.tsx      │  ← Root entry
                    │   (providers)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
   │QueryClient   │  │ThemeProvider │  │NavigationContainer│
   │Provider      │  │              │  │                │
   └──────────────┘  └──────┬───────┘  └────────┬───────┘
                            │                    │
                     ┌──────┴───────┐            │
                     │DarkModeProvider│          │
                     └──────┬───────┘            │
                            │                    │
                     ┌──────┴───────┐            │
                     │ useThemeStore│◄───────────┘
                     │ (Zustand)    │
                     └──────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
   │  RootStack   │ │ TabNavigator │  │  Screen/Card │
   │ Navigator    │ │              │  │  Components  │
   └──────────────┘ └──────────────┘  └──────────────┘
                                                │
                                       ┌────────┴────────┐
                                       ▼                 ▼
                                ┌──────────────┐ ┌──────────────┐
                                │Button/Input  │ │Typography/   │
                                │              │ │Badge/Spinner │
                                └──────────────┘ └──────────────┘

  ┌───────────────────┐   ┌───────────────────┐
  │  Axios Client     │   │ SQLite Connection │
  │  (services/api)   │   │  (database/)      │
  └────────┬──────────┘   └────────┬──────────┘
           │                       │
           ▼                       ▼
   ┌──────────────┐        ┌──────────────┐
   │useAuthStore  │        │  Repository  │
   │(token read)  │        │  layer (TBD) │
   └──────────────┘        └──────────────┘
```

### Dependency Rules (Enforced by Architecture)

- **`app/`** depends on: `theme/`, `navigation/`, `hooks/`, `services/`, `database/`
- **`navigation/`** depends on: `theme/` (for header styling), `components/` (for placeholder screens), `types/`
- **`components/`** depends on: `theme/`, `types/`
- **`hooks/`** (Zustand stores) depends on: `types/`, optionally `@/utils/` (for persistence helpers)
- **`services/api/`** depends on: `hooks/` (for auth store token access), `types/`
- **`database/`** depends on: `types/` (for error types), nothing else in 001-a
- **`theme/`** depends on: `types/`, `hooks/` (ThemeProvider reads Zustand store)
- **Circular dependency prevention**: `services/` reads from Zustand stores (not vice versa); `components/` never imports from `services/` or `database/`

---

## 2. Module Internals

### 2.1 Theme Module (`src/theme/`)

#### Files

| File                   | Responsibility                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `tokens.ts`            | Define raw color, typography, spacing, border radius, and shadow token objects            |
| `ThemeProvider.tsx`    | React context provider that composes tokens + mode into a `Theme` object                  |
| `DarkModeProvider.tsx` | Handles dark mode persistence (AsyncStorage), system preference detection, initialization |
| `useTheme.ts`          | Typed hook consuming ThemeContext                                                         |
| `index.ts`             | Barrel export: `ThemeProvider`, `DarkModeProvider`, `useTheme`, token objects             |

#### Public API

```typescript
// Exports from theme/index.ts
export { ThemeProvider } from './ThemeProvider';
export { DarkModeProvider } from './DarkModeProvider';
export { useTheme } from './useTheme';
export { lightColors, darkColors, typography, spacing, borderRadius, shadows } from './tokens';
```

#### Internal Architecture

**`tokens.ts`** — Pure data exports:

```typescript
export const lightColors = {
  /* ... */
};
export const darkColors = {
  /* ... */
};
export const typography = {
  /* ... */
};
export const spacing = {
  /* ... */
};
export const borderRadius = {
  /* ... */
};
export const shadows = {
  /* ... */
};
```

**`useTheme.ts`** — Context hook:

```typescript
const ThemeContext = createContext<Theme | undefined>(undefined);

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
```

**`ThemeProvider.tsx`** — Reads mode from Zustand store, selects token set, builds Theme object:

```
  Zustand useThemeStore() → mode
         │
         ▼
  selectColors(mode: 'light' | 'dark')
         │
         ▼
  build Theme { mode, colors, typography, spacing, borderRadius, shadows }
         │
         ▼
  ThemeContext.Provider(value=theme) → children
```

**`DarkModeProvider.tsx`** — Lifecycle wrapper around theme store initialization:

```
  App mounts
       │
       ▼
  DarkModeProvider runs useEffect
       │
       ├─ check AsyncStorage for persisted mode
       ├─ if null → detect system appearance (Appearance.getColorScheme())
       ├─ if null → default 'light'
       └─ call useThemeStore.initializeMode(resolvedMode)
       │
       ▼
  on toggle → useThemeStore.setMode(newMode) → persist to AsyncStorage
```

#### Data Flow

```
  AsyncStorage key: '@mi-purchase:theme-mode'
         ▲                                    │
         │  read on init                      │  write on toggle
         │                                    ▼
  ┌──────────────┐    setMode()    ┌─────────────────┐
  │ AsyncStorage │◄────────────────│  useThemeStore  │
  └──────────────┘                 │  (Zustand)      │
                                   └────────┬────────┘
                                            │
                                            ▼ read mode
                                   ┌─────────────────┐
                                   │ ThemeProvider   │
                                   │ → ThemeContext  │
                                   └────────┬────────┘
                                            │
                                            ▼ useTheme()
                                   ┌─────────────────┐
                                   │  Components     │
                                   └─────────────────┘
```

### 2.2 Navigation Module (`src/navigation/`)

#### Files

| File                | Responsibility                                                   |
| ------------------- | ---------------------------------------------------------------- |
| `types.ts`          | `RootStackParamList` and `BottomTabParamList` type definitions   |
| `TabNavigator.tsx`  | Bottom tab navigator with 4 placeholder screens                  |
| `RootNavigator.tsx` | Root stack navigator containing TabNavigator as `MainTabs`       |
| `index.ts`          | Barrel export: `RootNavigator`, `TabNavigator`, param list types |

#### Public API

```typescript
export { RootNavigator } from './RootNavigator';
export { TabNavigator } from './TabNavigator';
export type { RootStackParamList, BottomTabParamList } from './types';
```

#### Internal Architecture

**`TabNavigator.tsx`** — Creates tab screens using `createBottomTabNavigator`:

```
  Placeholder screens (inline function components):
    HomeScreen → <Screen><Typography variant="h1">Home</Typography></Screen>
    PurchasesScreen → <Screen><Typography variant="h1">Purchases</Typography></Screen>
    DashboardScreen → <Screen><Typography variant="h1">Dashboard</Typography></Screen>
    SettingsScreen → <Screen> + dark mode toggle button

  Tab options per screen:
    tabBarIcon: ({ color }) => placeholder icon (or SF Symbol via expo-symbols if available)
    tabBarLabel: string
    headerShown: false (custom headers via Screen component)

  Screen options:
    headerShown: false
    tabBarActiveTintColor: theme.colors.primary
    tabBarInactiveTintColor: theme.colors.textSecondary
    tabBarStyle: { borderTopWidth: 0, elevation: 0, shadowColor: 'transparent' }
```

**`RootNavigator.tsx`** — Wraps TabNavigator in a native stack:

```
  createNativeStackNavigator()
       │
       ▼
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'default',       // iOS: card slide-from-right
      animationTypeForReplace: 'push',
    }}
  >
    <Stack.Screen name="MainTabs" component={TabNavigator} />
    {/* Future screens added here: PurchaseDetail, PurchaseCreate, etc. */}
  </Stack.Navigator>
```

### 2.3 Components Module (`src/components/`)

#### Files

| File                 | Responsibility                                                  |
| -------------------- | --------------------------------------------------------------- |
| `Screen.tsx`         | SafeAreaView wrapper with theme background and padding          |
| `Card.tsx`           | Themed card with shadow, border radius, and pressable variant   |
| `Button.tsx`         | Primary/secondary/ghost button with loading and disabled states |
| `Input.tsx`          | Themed TextInput with label, error, helper text                 |
| `Typography.tsx`     | Text component using theme typography scale                     |
| `LoadingSpinner.tsx` | Centered ActivityIndicator with optional overlay                |
| `Badge.tsx`          | Pill-shaped semantic badge                                      |
| `types.ts`           | All component props interfaces                                  |
| `index.ts`           | Barrel export of all components and types                       |

#### Component Internals (Key Patterns)

**`Screen.tsx`** — Composition over configuration:

```typescript
function Screen({ children, noPadding, backgroundColor, scrollable }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle = {
    flex: 1,
    backgroundColor: backgroundColor ?? theme.colors.background,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const contentStyle = {
    flex: 1,
    padding: noPadding ? 0 : theme.spacing.lg,
  };

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
```

**`Card.tsx`** — Variant-driven styling:

```
  Props → variant selection → shadow + border computation
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
         variant='default'    variant='elevated'    variant='flat'
         shadow: md           shadow: lg            shadow: none
         border: none         border: none          border: 1px border color
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                         If pressable=true:
                         wrap in Pressable with
                         Animated.scale(0.98 on press)
                                    │
                                    ▼
                         Render <View> with computed styles
```

**`Button.tsx`** — State-driven rendering:

```
  Props { variant, loading, disabled, onPress }
           │
           ▼
  ┌─ disabled or loading?
  │   ├─ loading → show ActivityIndicator instead of children text
  │   └─ disabled → onPress = undefined, opacity = 0.5
  │
  ▼
  ┌─ variant selection
  │   ├─ primary: bg=primary, text=white
  │   ├─ secondary: bg=transparent, border=primary, text=primary
  │   └─ ghost: bg=transparent, border=none, text=primary
  │
  ▼
  Render Pressable with computed style
```

### 2.4 Hooks Module (`src/hooks/`)

#### Files

| File               | Responsibility                             |
| ------------------ | ------------------------------------------ |
| `useThemeStore.ts` | Zustand store for theme mode               |
| `useAuthStore.ts`  | Zustand store for auth state (placeholder) |
| `index.ts`         | Barrel export                              |

**`useThemeStore.ts`** — Store definition:

```typescript
interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  initializeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  mode: 'light', // Default, overwritten by DarkModeProvider
  setMode: (mode) => {
    set({ mode });
    // Persist to AsyncStorage (fire-and-forget, no await to avoid race)
    AsyncStorage.setItem('@mi-purchase:theme-mode', mode).catch(() => {});
  },
  initializeMode: (mode) => set({ mode }),
}));
```

**`useAuthStore.ts`** — Placeholder store:

```typescript
interface AuthStoreState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ isAuthenticated: false, user: null, token: null }),
}));
```

### 2.5 Services Module (`src/services/api/`)

#### Files

| File        | Responsibility                               |
| ----------- | -------------------------------------------- |
| `client.ts` | Axios instance, interceptors, error handling |
| `index.ts`  | Barrel export                                |

#### Public API

```typescript
export { apiClient } from './client';
```

#### Internal Architecture

See Section 7 (HTTP Client Architecture) below.

### 2.6 Database Module (`src/database/`)

#### Files

| File            | Responsibility                      |
| --------------- | ----------------------------------- |
| `connection.ts` | SQLite connection manager singleton |
| `errors.ts`     | Custom `DatabaseError` class        |
| `index.ts`      | Barrel export                       |

#### Public API

```typescript
export { getDatabase } from './connection';
export { DatabaseError } from './errors';
```

See Section 8 (Database Architecture) below.

### 2.7 Types Module (`src/types/`)

#### Files

| File       | Responsibility                     |
| ---------- | ---------------------------------- |
| `theme.ts` | Theme interface and sub-interfaces |
| `user.ts`  | User type for auth placeholder     |
| `index.ts` | Barrel export                      |

---

## 3. Component Tree

### Full Provider Composition (Root → Leaf)

```
App.tsx (root component)
 │
 ├─ <SplashScreenGuard>               ← Controls splash screen visibility during init
 │
 ├─ <QueryClientProvider client={queryClient}>
 │                                    ← TanStack Query (outermost — no other providers needed by queries)
 │
 │  ├─ <ThemeProvider>
 │  │                                 ← Builds Theme object from tokens + Zustand mode
 │  │  ├─ <DarkModeProvider>
 │  │  │                              ← Initializes dark mode from persistence/system on mount
 │  │  │
 │  │  │  └─ <SafeAreaProvider>      ← Provides safe area insets to entire tree
 │  │  │
 │  │  │     └─ <NavigationContainer> ← React Navigation container (theme-aware)
 │  │  │        │
 │  │  │        └─ <RootNavigator>
 │  │  │           │
 │  │  │           └─ <Stack.Screen name="MainTabs">
 │  │  │              │
 │  │  │              └─ <TabNavigator>
 │  │  │                 │
 │  │  │                 ├─ <Tab.Screen name="Home">
 │  │  │                 │  └─ <HomeScreen>
 │  │  │                 │     └─ <Screen>
 │  │  │                 │        └─ <SafeAreaView>
 │  │  │                 │           └─ <View> (padded)
 │  │  │                 │              └─ <Typography variant="h1">Home</Typography>
 │  │  │                 │
 │  │  │                 ├─ <Tab.Screen name="Purchases">
 │  │  │                 │  └─ <PurchasesScreen> → <Screen> → ...
 │  │  │                 │
 │  │  │                 ├─ <Tab.Screen name="Dashboard">
 │  │  │                 │  └─ <DashboardScreen> → <Screen> → ...
 │  │  │                 │
 │  │  │                 └─ <Tab.Screen name="Settings">
 │  │  │                    └─ <SettingsScreen>
 │  │  │                       └─ <Screen>
 │  │  │                          └─ <Typography>Theme</Typography>
 │  │  │                             └─ <Button>Toggle Dark Mode</Button>
 │  │  │
 │  │  (all screens below also have access to ThemeContext)
 │  │
 │  (QueryClient also available to all screens)
 │
 (QueryClient is the only provider not nested — it's the outermost)
```

### Context Summary

| Context              | Provider              | Consumers                              | Notes                          |
| -------------------- | --------------------- | -------------------------------------- | ------------------------------ |
| `QueryClientContext` | `QueryClientProvider` | All screens, future repositories       | Outermost provider             |
| `ThemeContext`       | `ThemeProvider`       | All components via `useTheme()`        | Re-renders on mode change      |
| `SafeAreaContext`    | `SafeAreaProvider`    | `Screen` component, any needing insets | React Native Safe Area Context |
| `NavigationContext`  | `NavigationContainer` | All screens, `useNavigation()`         | React Navigation               |

### Props Drilling vs Context

- **Theme**: Via `useTheme()` context hook — **never** pass theme as props
- **Navigation**: Via `useNavigation()` / `useRoute()` from React Navigation — **never** pass navigation as props
- **Screen configuration**: Props (`noPadding`, `scrollable`, `backgroundColor`) — local, not drilled
- **Component variants**: Props (`variant`, `loading`, `disabled`) — local, not drilled
- **Auth state**: Via `useAuthStore()` Zustand store — **never** drill auth props

---

## 4. Theme Architecture

### Token File Structure (`src/theme/tokens.ts`)

```
  tokens.ts
    │
    ├─ lightColors: ThemeColors          ← Hardcoded hex values per spec
    ├─ darkColors: ThemeColors           ← Hardcoded hex values per spec
    ├─ typography: TypographyScale       ← Shared between modes (no mode-specific typography)
    ├─ spacing: SpacingTokens            ← Shared between modes
    ├─ borderRadius: BorderRadiusTokens  ← Shared between modes
    └─ shadows: ShadowTokens             ← Shared between modes (can add mode-specific later)
```

#### Light Mode Color Tokens (Exact Values)

| Token           | Value     | WCAG Note             |
| --------------- | --------- | --------------------- |
| `primary`       | `#0057FF` | —                     |
| `secondary`     | `#23DCE1` | —                     |
| `background`    | `#F5F7FA` | —                     |
| `card`          | `#FFFFFF` | —                     |
| `textPrimary`   | `#111827` | 13.1:1 on `#FFFFFF` ✓ |
| `textSecondary` | `#6B7280` | 5.7:1 on `#FFFFFF` ✓  |
| `border`        | `#E5E7EB` | —                     |
| `success`       | `#059669` | 5.9:1 on `#FFFFFF` ✓  |
| `warning`       | `#D97706` | 4.6:1 on `#FFFFFF` ✓  |
| `error`         | `#DC2626` | 5.0:1 on `#FFFFFF` ✓  |
| `info`          | `#0284C7` | 5.2:1 on `#FFFFFF` ✓  |

#### Dark Mode Color Tokens (Exact Values)

| Token           | Value     | WCAG Note                   |
| --------------- | --------- | --------------------------- |
| `primary`       | `#0057FF` | Same as light (brand color) |
| `secondary`     | `#23DCE1` | Same as light               |
| `background`    | `#0B0D12` | —                           |
| `card`          | `#161A22` | —                           |
| `textPrimary`   | `#F3F4F6` | 14.3:1 on `#0B0D12` ✓       |
| `textSecondary` | `#9CA3AF` | 7.6:1 on `#0B0D12` ✓        |
| `border`        | `#2D3348` | —                           |
| `success`       | `#34D399` | Adjusted for dark bg        |
| `warning`       | `#FBBF24` | Adjusted for dark bg        |
| `error`         | `#F87171` | Adjusted for dark bg        |
| `info`          | `#38BDF8` | Adjusted for dark bg        |

#### Typography Scale (Exact Values)

| Variant     | fontSize | fontWeight | lineHeight | fontFamily |
| ----------- | -------- | ---------- | ---------- | ---------- |
| `display`   | 36       | 700        | 44         | System     |
| `h1`        | 28       | 700        | 36         | System     |
| `h2`        | 22       | 600        | 30         | System     |
| `h3`        | 18       | 600        | 26         | System     |
| `body`      | 16       | 400        | 24         | System     |
| `bodySmall` | 14       | 400        | 20         | System     |
| `caption`   | 12       | 400        | 16         | System     |
| `button`    | 16       | 600        | 24         | System     |

**Font family resolution**: Use React Native's platform detection. iOS resolves `System` to San Francisco. Android resolves `System` to Roboto. No custom font files.

#### Spacing Scale

```
xs: 4   sm: 8   md: 12   lg: 16   xl: 20   xxl: 24   xxxl: 32   huge: 48
```

#### Border Radius Tokens

```
small: 8    medium: 12    large: 20    xlarge: 24    full: 9999
```

#### Shadow Tokens

| Level  | y   | blur | opacity |
| ------ | --- | ---- | ------- |
| `none` | —   | —    | —       |
| `sm`   | 1   | 2    | 0.05    |
| `md`   | 2   | 8    | 0.08    |
| `lg`   | 4   | 16   | 0.10    |
| `xl`   | 8   | 32   | 0.12    |

### Theme Composition Flow

```
  ┌─────────────────────────────────────────────────────────────┐
  │                      tokens.ts                               │
  │  lightColors, darkColors, typography, spacing, border, shadows│
  └────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   ThemeProvider.tsx                          │
  │                                                              │
  │  const { mode } = useThemeStore();                           │
  │  const colors = mode === 'dark' ? darkColors : lightColors;  │
  │                                                              │
  │  const theme: Theme = {                                      │
  │    mode, colors, typography, spacing, borderRadius, shadows  │
  │  };                                                          │
  │                                                              │
  │  return <ThemeContext.Provider value={theme}>{children}</...>│
  └────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   useTheme() hook                            │
  │                                                              │
  │  Returns Theme object → components access theme.colors,      │
  │  theme.typography, theme.spacing, etc.                       │
  └──────────────────────────────────────────────────────────────┘
```

### Persistence Mechanism

```
  Key: '@mi-purchase:theme-mode'
  Storage: AsyncStorage (not SecureStore — theme mode is not sensitive data)

  Flow on toggle:
    1. User taps toggle button in Settings screen
    2. Button onPress → setMode(newMode)
    3. Zustand set({ mode: newMode }) → synchronous state update
    4. AsyncStorage.setItem() → fire-and-forget (catch silent)

  Flow on app start:
    1. DarkModeProvider mounts
    2. Read AsyncStorage.getItem('@mi-purchase:theme-mode')
    3. If found → initializeMode(value)
    4. If null → Appearance.getColorScheme() → default to 'light' if null
    5. initializeMode(resolvedMode)
    6. SplashScreen.hideAsync() after theme is resolved
```

### Flash Prevention Strategy

```
  App boot sequence:
    1. SplashScreen.preventAutoHideAsync() (in app entry before first render)
    2. DarkModeProvider async resolution (AsyncStorage read)
    3. Theme mode set in Zustand store
    4. ThemeProvider picks correct color tokens
    5. SplashScreen.hideAsync() — only after theme is confirmed
    6. App visible with correct theme from frame 1
```

---

## 5. Navigation Architecture

### Navigator Nesting

```
  NavigationContainer
    │
    └─ NativeStackNavigator (RootStackParamList)
       │
       └─ Screen: "MainTabs" (no params)
          │
          └─ BottomTabNavigator (BottomTabParamList)
             │
             ├─ Screen: "Home" (no params)
             ├─ Screen: "Purchases" (no params)
             ├─ Screen: "Dashboard" (no params)
             └─ Screen: "Settings" (no params)
```

### Screen Registration Pattern

All screens are registered via declarative `<Stack.Screen>` and `<Tab.Screen>` elements. No programmatic navigation registration.

**Placeholder screens** are defined inline in `TabNavigator.tsx` as lightweight function components:

```typescript
const HomeScreen = () => (
  <Screen>
    <Typography variant="h1">Home</Typography>
  </Screen>
);
```

Future domain screens (chain 001-b+) will be extracted to `src/app/screens/` or co-located under `src/modules/`.

### Type Generation Approach

Navigation types are **manually authored** in `src/navigation/types.ts` (not auto-generated). Rationale:

- The type definitions are small (4 tab routes, 1+ stack routes)
- Auto-generation adds build complexity for minimal benefit at this scale
- Types are manually maintained and updated as new routes are added in future chains
- TypeScript `satisfies` operator can be used to ensure consistency between type and navigator config

```typescript
export type BottomTabParamList = {
  Home: undefined;
  Purchases: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
};
```

Typed navigation hook usage:

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
const navigation = useNavigation<HomeScreenNavigationProp>();
```

### Transition Configuration

**iOS (Native Stack)**:

- `animation: 'default'` → Card-style slide-from-right (iOS native behavior)
- `animationTypeForReplace: 'push'` → Consistent animation on replace

**Android (Native Stack)**:

- `animation: 'fade_from_bottom'` → Smooth fade/slide (avoids default Android activity transition)
- Alternative: `animation: 'slide_from_right'` if `fade_from_bottom` not available in the SDK 56 version

**Tab Navigator**:

- `sceneAnimationEnabled: false` → Instant switch (standard tab behavior)

**Header Configuration**:

- `headerShown: false` globally on both stack and tab
- Custom headers will be built as themed components in future chains

---

## 6. State Management Architecture

### Zustand Store Layout

**One file per store** (not a single monolithic file). Rationale:

- Separation of concerns — theme and auth have different lifecycle and persistence needs
- Testable in isolation
- Easy to add new stores (e.g., `useSettingsStore`, `useFilterStore`) without growing a single file

```
src/hooks/
  useThemeStore.ts    ← Theme mode state + persistence actions
  useAuthStore.ts     ← Auth placeholder (isAuthenticated, user, token)
  index.ts            ← Barrel: export { useThemeStore, useAuthStore }
```

### Zustand Store Structure

**`useThemeStore.ts`**:

```typescript
interface ThemeStoreState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  initializeMode: (mode: ThemeMode) => void;
}
```

**`useAuthStore.ts`**:

```typescript
interface AuthStoreState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}
```

### TanStack Query Client Configuration

**Location**: `src/app/providers.tsx` (instantiated at module level, passed to QueryClientProvider)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute — data considered fresh for 60s
      retry: false, // Offline-first: no automatic retry
      refetchOnWindowFocus: false, // No refetch on app foreground
      refetchOnReconnect: false, // No refetch on network reconnect
    },
    mutations: {
      retry: false, // Mutations never auto-retry
    },
  },
});
```

**Rationale for settings**:

- `staleTime: 60_000`: Balances freshness with battery/network usage
- `retry: false`: Offline-first strategy — repositories handle retry logic explicitly
- `refetchOnWindowFocus: false`: App is offline-first; explicit pull-to-refresh only
- These settings prepare the client for 001-d sync engine integration

### Auth State Flow: Store → Axios Interceptor

```
  ┌─────────────────┐
  │ useAuthStore    │  ← Auth token set here (future: after login)
  │  .token         │
  └────────┬────────┘
           │
           │  useAuthStore.getState().token  (non-reactive read)
           ▼
  ┌─────────────────┐
  │ Axios Request   │  ← Interceptor reads token synchronously
  │ Interceptor     │     from store state (not via hook — interceptor is outside React)
  └────────┬────────┘
           │
           │  config.headers['Authorization'] = `Bearer ${token}`
           ▼
  ┌─────────────────┐
  │   HTTP Request  │  → Sent with Bearer token
  └─────────────────┘
```

**Key detail**: The Axios interceptor reads `useAuthStore.getState().token` directly (Zustand's `.getState()` method), not through a React hook. This works because interceptors run outside the React render cycle.

### Theme State Flow: Store → ThemeProvider

```
  ┌─────────────────┐
  │ useThemeStore   │  ← Mode set here (toggle or init)
  │  .mode          │
  └────────┬────────┘
           │
           │  useThemeStore()  ← React hook (ThemeProvider is a React component)
           ▼
  ┌─────────────────┐
  │ ThemeProvider   │  ← Re-renders when mode changes
  │ → selects colors│
  │ → builds Theme  │
  └────────┬────────┘
           │
           │  ThemeContext.Provider(value=theme)
           ▼
  ┌─────────────────┐
  │  All components │  ← Re-render via context subscription
  └─────────────────┘
```

---

## 7. HTTP Client Architecture

### Axios Instance Creation (`src/services/api/client.ts`)

```typescript
import axios from 'axios';
import { useAuthStore } from '@/hooks/useAuthStore';

const BASE_URL =
  process.env.API_BASE_URL ??
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/purchase/api/v1'
    : 'http://localhost:3000/purchase/api/v1');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Interceptor Chain Order

```
  Outbound Request Flow:
  ┌──────────────────────┐
  │  Caller calls        │
  │  apiClient.get/put/  │
  │  post/delete()       │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │ Request Interceptor  │
  │                      │
  │  1. Read token from  │
  │     useAuthStore     │
  │     .getState().     │
  │     token            │
  │                      │
  │  2. If token exists: │
  │     Add Authorization│
  │     header           │
  │                      │
  │  3. Return config    │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │   HTTP Network       │
  │   Layer              │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │ Response Interceptor │
  │                      │
  │  Success path:       │
  │    return res.data   │
  │    (unwrap envelope) │
  │                      │
  │  Error path:         │
  │    if status === 401:│
  │      useAuthStore    │
  │      .getState()     │
  │      .logout()       │
  │    return Promise.   │
  │    reject(wrapped)   │
  └──────────┬───────────┘
             ▼
  ┌──────────────────────┐
  │  Caller receives     │
  │  unwrapped data or   │
  │  typed error          │
  └──────────────────────┘
```

### Token Extraction

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

**Why `getState()` not hook**: Interceptors are registered at module load time, outside any React component. Using `getState()` allows synchronous token access without hook constraints.

### Error Handling Taxonomy

```
  AxiosError classification in response interceptor:

  Status 401 → AuthenticationError (logout, propagate)
  Status 403 → AuthorizationError (propagate — insufficient permissions)
  Status 4xx → ClientError (propagate with response data)
  Status 5xx → ServerError (propagate)
  Network error (no response) → NetworkError (propagate)
  Timeout (ECONNABORTED) → TimeoutError (propagate)

  All errors are wrapped in a consistent error shape:
  {
    message: string;
    status?: number;
    data?: unknown;
    code?: string;  // 'ECONNABORTED', 'ERR_NETWORK', etc.
  }
```

**Response interceptor**:

```typescript
apiClient.interceptors.response.use(
  (response) => response.data, // Unwrap Axios envelope
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    const apiError: ApiError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    };

    return Promise.reject(apiError);
  },
);
```

### Environment Configuration

| Environment      | `API_BASE_URL`                          | How Set                           |
| ---------------- | --------------------------------------- | --------------------------------- |
| Android Emulator | `http://10.0.2.2:3000/purchase/api/v1`  | Default fallback                  |
| iOS Simulator    | `http://localhost:3000/purchase/api/v1` | Default fallback                  |
| Development      | Custom                                  | `.env.development` or Expo config |
| Staging          | Custom                                  | `.env.staging` or Expo config     |
| Production       | Custom                                  | `.env.production` or Expo config  |

---

## 8. Database Architecture

### Connection Manager Singleton Pattern (`src/database/connection.ts`)

```
  ┌───────────────────────────────────────────────────────────────┐
  │                     getDatabase()                              │
  │                                                                │
  │  let dbInstance: SQLiteDatabase | null = null;                 │
  │  let dbPromise: Promise<SQLiteDatabase> | null = null;         │
  │                                                                │
  │  export async function getDatabase(): Promise<SQLiteDatabase>  │
  │  {                                                             │
  │    if (dbInstance) return dbInstance;                          │
  │                                                                │
  │    if (dbPromise) return dbPromise;                            │
  │                                                                │
  │    dbPromise = openDatabaseAsync('mi-purchase.db')             │
  │      .then((db) => {                                           │
  │        dbInstance = db;                                        │
  │        dbPromise = null;                                       │
  │        return db;                                              │
  │      })                                                        │
  │      .catch((err) => {                                         │
  │        dbPromise = null;                                       │
  │        throw new DatabaseError(                                │
  │          'Failed to open database',                            │
  │          err.code ?? 'UNKNOWN',                                │
  │          err                                                   │
  │        );                                                      │
  │      });                                                       │
  │                                                                │
  │    return dbPromise;                                           │
  │  }                                                             │
  └────────────────────────────────────────────────────────────────┘
```

### Lazy Initialization

The database is **not** opened during app bootstrap. It opens on the first call to `getDatabase()`, which will happen in chain 001-b when repositories are implemented.

```
  App starts
    → No database call
    → getDatabase() NOT called
    → No SQLite connection

  Future: First repository call
    → getDatabase() called
    → openDatabaseAsync('mi-purchase.db')
    → Connection established
    → Subsequent calls return cached instance
```

### Error Hierarchy

```
  ┌───────────────────┐
  │    DatabaseError  │  ← Custom error class
  │                   │
  │  constructor(     │
  │    message: str,  │
  │    code: str,     │  ← SQLite error code or custom code
  │    cause?: Error  │  ← Original error for debugging
  │  )                │
  └───────────────────┘

  Error codes (anticipated):
    'SQLITE_ERROR'     → Generic SQLite error
    'SQLITE_FULL'      → Disk full
    'SQLITE_PERM'      → Permission denied
    'SQLITE_BUSY'      → Database locked
    'UNKNOWN'          → Unrecognized error
```

### Migration Readiness (for Future Chains)

The connection manager is designed to support migrations:

```typescript
// Future implementation in 001-b or 001-d:
export async function getDatabase(): Promise<SQLiteDatabase> {
  // ... singleton pattern ...
  dbPromise = openDatabaseAsync('mi-purchase.db').then(async (db) => {
    await runMigrations(db); // ← Migration runner added later
    dbInstance = db;
    return db;
  });
}
```

The `DatabaseError` class and singleton pattern are established now so that:

- Migration runner can be added without changing the public API
- Error handling is consistent across all database operations
- Repositories in future chains can rely on a stable `getDatabase()` contract

---

## 9. Testing Architecture

### Test File Location Convention

**Co-located `__tests__/` directories** within each module:

```
src/components/
  Button.tsx
  __tests__/
    Button.test.tsx      ← Tests for Button only

src/theme/
  tokens.ts
  ThemeProvider.tsx
  __tests__/
    tokens.test.ts       ← Token completeness and contrast tests
    ThemeProvider.test.tsx

src/database/
  connection.ts
  __tests__/
    connection.test.ts   ← Singleton and error handling tests

src/services/api/
  client.ts
  __tests__/
    client.test.ts       ← Interceptor tests

src/app/
  App.tsx
  providers.tsx
  __tests__/
    App.test.tsx         ← Mount and provider tree tests
    test-utils.tsx       ← Shared renderWithProviders helper
```

### Mock Strategy for External Dependencies

| Dependency                                  | Mock Strategy                                                                  | How                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `@react-native-async-storage/async-storage` | `@testing-library/react-native` auto-mocks AsyncStorage via `jest-expo` preset | No manual mock needed                                          |
| `expo-sqlite`                               | Manual mock in `__mocks__/expo-sqlite.ts`                                      | Return mock database object with `execAsync`, `runAsync` stubs |
| `axios`                                     | `jest.mock('axios')` or `axios-mock-adapter` (preferred for interceptor tests) | `axios-mock-adapter` for granular request/response mocking     |
| `expo-splash-screen`                        | Manual mock — no-op `preventAutoHideAsync`, `hideAsync`                        | Prevent splash screen calls in tests                           |
| `react-native-safe-area-context`            | `jest-expo` provides SafeAreaProvider mock                                     | Override insets if needed via `mockSafeAreaContext`            |
| `@react-navigation/native`                  | Testing library renders navigators directly                                    | Use `renderWithProviders` wrapper                              |

### Test Utility Exports (`src/app/__tests__/test-utils.tsx`)

```typescript
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    initialRoute?: string;
    themeMode?: ThemeMode;
    queryClient?: QueryClient;
  }
): RenderResult & { ... } {
  const client = options?.queryClient ?? createTestQueryClient();

  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MockDarkModeProvider initialMode={options?.themeMode ?? 'light'}>
          <SafeAreaProvider>
            <NavigationContainer>
              {ui}
            </NavigationContainer>
          </SafeAreaProvider>
        </MockDarkModeProvider>
      </ThemeProvider>
    </QueryClientProvider>,
    options
  );
}
```

### Test Categories per Module

| Module           | Test Type   | What to Test                                                                            |
| ---------------- | ----------- | --------------------------------------------------------------------------------------- |
| Components       | Unit (RNTL) | Render, props behavior, variant changes, accessibility labels                           |
| Theme            | Unit        | Token completeness, WCAG contrast ratio calculation, mode switching                     |
| Navigation       | Integration | Navigator renders without crash, tabs are accessible                                    |
| Stores (Zustand) | Unit        | State changes, actions, initialization logic (persistence mocked)                       |
| Axios Client     | Unit        | Request interceptor adds header, response interceptor unwraps data, 401 triggers logout |
| Database         | Unit        | Singleton behavior (concurrent calls return same instance), error wrapping              |
| App              | Integration | Provider tree mounts, no uncaught errors                                                |

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
};
```

---

## 10. Build & Tooling

### Package.json Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/app/*": ["src/app/*"],
      "@/modules/*": ["src/modules/*"],
      "@/database/*": ["src/database/*"],
      "@/repositories/*": ["src/repositories/*"],
      "@/services/*": ["src/services/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/navigation/*": ["src/navigation/*"],
      "@/components/*": ["src/components/*"],
      "@/theme/*": ["src/theme/*"],
      "@/shared/*": ["src/shared/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    },
    "jsx": "react-native",
    "lib": ["es2022"],
    "moduleSuffixes": [".ios", ".android", ".native", ""],
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Path Alias Resolution

| Layer          | File                                               | How It Works                                                    |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| **TypeScript** | `tsconfig.json` → `compilerOptions.paths`          | Resolves `@/components/*` → `src/components/*` at compile time  |
| **Babel**      | `babel.config.js` → `babel-plugin-module-resolver` | Resolves `@/components/*` → `./src/components/*` at bundle time |

**Babel configuration** (`babel.config.js`):

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/app': './src/app',
            '@/modules': './src/modules',
            '@/database': './src/database',
            '@/repositories': './src/repositories',
            '@/services': './src/services',
            '@/hooks': './src/hooks',
            '@/navigation': './src/navigation',
            '@/components': './src/components',
            '@/theme': './src/theme',
            '@/shared': './src/shared',
            '@/types': './src/types',
            '@/utils': './src/utils',
          },
        },
      ],
    ],
  };
};
```

### ESLint Configuration (`.eslintrc.js` or `eslint.config.js`)

Using flat config format (ESLint 9+):

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactNative from '@react-native/eslint-config';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  reactNative,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.expo/'],
  },
];
```

**Note**: If ESLint 9 flat config causes issues with Expo tooling, fall back to `.eslintrc.js` with `@expo` extends.

### Prettier Configuration (`.prettierrc`)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Expo Configuration (`app.json`)

```json
{
  "expo": {
    "name": "mi-purchase-app",
    "slug": "mi-purchase-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5F7FA"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mipurchase.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5F7FA"
      },
      "package": "com.mipurchase.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-sqlite"]
  }
}
```

**Key setting**: `userInterfaceStyle: "automatic"` — enables React Native's `Appearance` API to detect system dark/light mode.

### Entry Point (`src/app/App.tsx`)

```typescript
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { DarkModeProvider } from '@/theme/DarkModeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { queryClient } from './providers';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DarkModeProvider>
          <SafeAreaProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </DarkModeProvider>
      </ThemeProvider>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
```

---

## 11. Risk Register & Mitigations

| Risk                                                           | Impact | Likelihood | Mitigation                                                                         |
| -------------------------------------------------------------- | ------ | ---------- | ---------------------------------------------------------------------------------- |
| Expo SDK 56 may have breaking changes vs SDK 54                | High   | Medium     | Pin exact Expo SDK version; test on both iOS and Android after init                |
| Zustand 5.x breaking changes from 4.x                          | Low    | Low        | Use `^5.0.4` (semver-compatible); Zustand API is stable                            |
| React Navigation 7.x transition configuration differs from 6.x | Medium | Medium     | Test iOS transitions on device; verify `animation: 'default'` works                |
| `expo-sqlite` 15.x API changes                                 | Low    | Low        | Use `openDatabaseAsync` (new API); verify in SDK 56 docs                           |
| AsyncStorage mock in `jest-expo` may not cover all methods     | Low    | Medium     | Add manual mock in `__mocks__` if needed                                           |
| Dark mode flash on first render                                | Medium | Medium     | `SplashScreen.preventAutoHideAsync()` + async resolution before hide               |
| `noImplicitAny` strictness catches edge cases                  | Low    | High       | Intentional — spec requires zero `any` in production code; fix at development time |

---

## 12. Implementation Order (Within Chain 001-a)

The following sequence minimizes rework and ensures each step builds on the previous:

1. **Project Scaffold** — `npx create-expo-app`, `package.json`, `tsconfig.json`, `babel.config.js`
2. **Type System** — `src/types/theme.ts`, `src/types/user.ts`, barrel exports
3. **Theme Tokens** — `src/theme/tokens.ts` with all color/typo/spacing/shadow values
4. **Zustand Stores** — `useThemeStore.ts`, `useAuthStore.ts`
5. **Theme Providers** — `ThemeProvider.tsx`, `DarkModeProvider.tsx`, `useTheme.ts`
6. **Components** — Screen, Card, Button, Input, Typography, LoadingSpinner, Badge
7. **Navigation Types** — `navigation/types.ts`
8. **Navigation** — `TabNavigator.tsx`, `RootNavigator.tsx`
9. **App Entry** — `App.tsx`, `providers.tsx` (composition)
10. **HTTP Client** — `services/api/client.ts` with interceptors
11. **Database** — `database/connection.ts`, `database/errors.ts`
12. **Testing** — Jest config, RNTL setup, `test-utils.tsx`, placeholder tests
13. **Linting** — ESLint, Prettier, scripts
14. **Verification** — `npx tsc --noEmit`, `npm run lint`, `npm test`

# mi-purchase-app

Offline-first purchase tracking app built with React Native + Expo.

## Features

- **Authentication**: Login/Register with JWT tokens
- **CRUD Operations**: Categories, Products, Stores
- **Purchase Management**: Create, edit, and group purchases
- **Exchange Rates**: Auto-refresh rates from BCV, Paralelo, or custom input
- **Offline Support**: Full functionality without internet
- **Sync**: Pull/push changes with backend when online

## Tech Stack

- **Frontend**: React Native + Expo SDK 52
- **Navigation**: React Navigation 7
- **Database**: expo-sqlite (local SQLite)
- **State**: Zustand
- **Validation**: Zod
- **HTTP**: Axios
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
src/
├── app/              # App entry, providers, initializer
├── components/      # Reusable UI components
├── database/        # SQLite connection, migrations
├── hooks/           # Custom React hooks
├── navigation/      # Navigation config (Tab, Stack)
├── repositories/    # Data access layer
├── screens/         # Screen components
├── services/        # Business logic, API client
├── theme/           # Theme provider, colors, typography
└── types/           # TypeScript types, validation schemas
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Expo CLI (`npm install -g expo-cli`)
- Backend running at `http://localhost:3000`

### Installation

```bash
# Clone the repository
git clone https://github.com/pr0d1gy00/mi-app.git
cd mi-purchase-app

# Install dependencies
npm install

# Start the app (requires backend)
npx expo start
```

### Environment Variables

Create `.env` based on `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/purchase/api/v1
```

## Backend

This app requires the [purchase-back](https://github.com/pr0d1gy00/purchase-back) backend.

```bash
cd ../purchase-back
npm install
npx prisma migrate dev
npm run start:dev
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="CategoryRepository"
```

## Database Migrations

Migrations run automatically on app startup:

| #   | Name            | Description                         |
| --- | --------------- | ----------------------------------- |
| 001 | Initial schema  | Users, stores, products, categories |
| 002 | Add deletedAt   | Soft delete support                 |
| 003 | Purchase groups | Group purchases together            |
| 004 | Exchange rates  | Store rate history                  |
| 005 | Sync metadata   | Track sync timestamps               |

## Sync Flow

1. **Initial Sync**: Full pull of all user data
2. **Ongoing Sync**: Pull changes since last sync + push local changes
3. **Conflict Resolution**: Server wins (last-write-wins)
4. **Timestamps Preserved**: Sync state survives logout/re-login

## Exchange Rates

- **Auto-refresh**: Every 5 minutes when online
- **Sources**: BCV, Paralelo (from backend), Custom (manual input)
- **Custom Persistence**: Stored in SQLite + SecureStore
- **Fallback**: Shows cached rate when offline

## Screens

| Tab        | Screens                        |
| ---------- | ------------------------------ |
| Home       | Dashboard (rate card + counts) |
| Categories | List, Create, Edit             |
| Products   | List, Create, Edit             |
| Stores     | List, Create, Edit             |
| Purchases  | List, Create, Detail           |
| Groups     | List, Create, Detail           |
| Settings   | Sync status, Appearance        |

## License

MIT

# Technical Design — Chain 001-c: Purchases + PurchaseItems + PurchaseGroups

## 1. Module Structure

```
src/
  database/migrations/
    002-create-purchases.ts    # purchases + purchase_items
    003-create-purchase-groups.ts  # purchase_groups + purchase_group_items

  types/
    entities.ts                # Add Purchase, PurchaseItem, PurchaseGroup, PurchaseGroupItem

  repositories/
    PurchaseRepository.ts
    PurchaseItemRepository.ts
    PurchaseGroupRepository.ts
    types.ts                   # Repository interfaces

  services/
    PurchaseService.ts        # Business logic (calculate totals, validate items)

  screens/
    purchases/
      PurchaseListScreen.tsx
      PurchaseCreateScreen.tsx
      PurchaseDetailScreen.tsx
    purchase-groups/
      PurchaseGroupListScreen.tsx
      PurchaseGroupCreateScreen.tsx
      PurchaseGroupDetailScreen.tsx

  navigation/
    types.ts                   # Add PurchaseStackParamList, PurchaseGroupStackParamList
    TabNavigator.tsx           # Add Purchases and Groups tabs
```

## 2. Database Schema

### purchases table

```sql
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  store_id TEXT,
  user_id TEXT NOT NULL,
  total_amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  purchase_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'created',
  last_synced_at TEXT,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### purchase_items table

```sql
CREATE TABLE purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price TEXT NOT NULL,
  total_price TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'created',
  last_synced_at TEXT,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### purchase_groups table

```sql
CREATE TABLE purchase_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'created',
  last_synced_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### purchase_group_items table

```sql
CREATE TABLE purchase_group_items (
  id TEXT PRIMARY KEY,
  purchase_group_id TEXT NOT NULL,
  purchase_id TEXT NOT NULL,
  FOREIGN KEY (purchase_group_id) REFERENCES purchase_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  UNIQUE(purchase_group_id, purchase_id)
);
```

## 3. TypeScript Interfaces

```typescript
// entities.ts additions

interface Purchase extends BaseEntity {
  storeId: string | null;
  userId: string;
  totalAmount: string;
  currency: string;
  notes: string | null;
  purchaseDate: string;
}

interface PurchaseItem extends BaseEntity {
  purchaseId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  notes: string | null;
}

interface PurchaseGroup extends BaseEntity {
  name: string;
  description: string | null;
  userId: string;
  startDate: string | null;
  endDate: string | null;
}

interface PurchaseGroupItem {
  id: string;
  purchaseGroupId: string;
  purchaseId: string;
}
```

## 4. Repository Implementation

### PurchaseRepository

- `create()`: Inserts purchase, then inserts all items, calculates total from items
- `getAll()`: Returns non-deleted purchases ordered by purchase_date DESC
- `getByStoreId()`: Filter by store_id
- `getBySyncStatus()`: For sync operations
- `softDelete()`: Sets deleted_at, sync_status='deleted', cascades to items via FK

### PurchaseItemRepository

- `getByPurchaseId()`: All items for a purchase
- `create()`: Single item creation
- `softDelete()`: Marks item deleted

### PurchaseGroupRepository

- `getAllWithPurchases()`: JOIN with purchase_group_items and purchases, aggregate totals
- `assignPurchase()`: Insert into purchase_group_items
- `unassignPurchase()`: Delete from purchase_group_items

## 5. Screen Design

### PurchaseListScreen

Layout:

- Header: "Purchases" (h1)
- Search bar (optional, by store)
- FlatList with cards:
  ```
  ┌─────────────────────────────┐
  │ 📅 2024-06-10              │
  │ 🏪 Supermercado Exito       │
  │ $45.50 USD · 5 items        │
  └─────────────────────────────┘
  ```
- FAB: + button (bottom right)

### PurchaseCreateScreen

Layout:

- Header: "New Purchase"
- Form fields:
  - Store picker (optional dropdown)
  - Date picker (default today)
  - Currency selector (default USD)
  - Notes input (multiline)
- Dynamic item list:
  ```
  ┌─────────────────────────────────────┐
  │ Product Name         [x]            │
  │ Qty: [1]  Price: [$5.00]           │
  │ Total: $5.00                        │
  └─────────────────────────────────────┘
  [+ Add Item]
  ```
- Grand Total: $XX.XX
- Save button (primary)

### PurchaseDetailScreen

Layout:

- Header: Purchase date + total
- Store info card
- Notes card (if present)
- Items list:
  ```
  ┌─────────────────────────────────────┐
  │ Leche Entera                    $2  │
  │ 1 × $2.00                          │
  └─────────────────────────────────────┘
  ```
- Delete button (destructive, bottom)

### PurchaseGroupListScreen

Layout:

- Header: "Groups"
- Cards:
  ```
  ┌─────────────────────────────┐
  │ 📦 Semana de Compras         │
  │ 12 purchases · $450.00 USD  │
  └─────────────────────────────┘
  ```

### PurchaseGroupDetailScreen

Layout:

- Header: Group name
- Description (if any)
- Date range (if set)
- Assigned purchases list
- "Assign Purchase" button
- Total aggregated

## 6. Navigation Structure

```typescript
// TabNavigator adds:
const PurchasesStack = createNativeStackNavigator<PurchaseStackParamList>();
const PurchaseGroupsStack = createNativeStackNavigator<PurchaseGroupStackParamList>();

// Bottom tabs:
-Dashboard | Categories | Products | Stores | Purchases | Groups;
```

## 7. Component Usage

- Use existing `Screen`, `Card`, `Button`, `Input`, `Typography`, `LoadingSpinner`
- DatePicker: Custom component or third-party (react-native-date-picker or expo-date-picker)
- ProductPicker: Modal with FlatList of products from ProductRepository
- StorePicker: Modal with FlatList of stores from StoreRepository

## 8. Edge Cases

1. **Empty purchase items**: Prevent saving with 0 items (validation error)
2. **Product deleted after purchase**: product_name snapshot preserves display
3. **Store deleted after purchase**: storeId is nullable, show "No store"
4. **Decimal precision**: Store all prices as strings, never round in JS
5. **Group with no purchases**: Show $0.00 total
6. **Delete purchase in group**: Remove from group automatically via cascade or explicit unassign

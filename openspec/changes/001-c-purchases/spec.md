# Specification — Chain 001-c: Purchases + PurchaseItems + PurchaseGroups

## Purpose

Add purchase tracking with multi-item creation, purchase history, soft-delete, and grouping functionality.

---

## Domains Covered

| Domain         | Canonical Spec | Spec Type |
| -------------- | -------------- | --------- |
| Purchases      | This spec      | Full spec |
| PurchaseItems  | This spec      | Full spec |
| PurchaseGroups | This spec      | Full spec |

---

## 1. SQLite Schema

### REQ-001-c-001 — purchases table

The `purchases` table MUST be created with:

- `id` TEXT PRIMARY KEY (UUID v4)
- `store_id` TEXT, FOREIGN KEY → stores(id), NULL allowed (optional store)
- `user_id` TEXT NOT NULL
- `total_amount` TEXT NOT NULL (decimal stored as string)
- `currency` TEXT NOT NULL, DEFAULT 'USD'
- `notes` TEXT NULL
- `purchase_date` TEXT NOT NULL (ISO 8601)
- Standard BaseEntity fields: created_at, updated_at, deleted_at, sync_status, last_synced_at

### REQ-001-c-002 — purchase_items table

The `purchase_items` table MUST be created with:

- `id` TEXT PRIMARY KEY (UUID v4)
- `purchase_id` TEXT, FOREIGN KEY → purchases(id), ON DELETE CASCADE
- `product_id` TEXT, FOREIGN KEY → products(id), NULL allowed
- `product_name` TEXT NOT NULL (snapshot of product name at creation)
- `quantity` REAL NOT NULL, DEFAULT 1
- `unit_price` TEXT NOT NULL (decimal stored as string)
- `total_price` TEXT NOT NULL (quantity × unit_price)
- `notes` TEXT NULL
- Standard BaseEntity fields

### REQ-001-c-003 — purchase_groups table

The `purchase_groups` table MUST be created with:

- `id` TEXT PRIMARY KEY (UUID v4)
- `name` TEXT NOT NULL
- `description` TEXT NULL
- `user_id` TEXT NOT NULL
- `start_date` TEXT NULL (ISO 8601)
- `end_date` TEXT NULL (ISO 8601)
- Standard BaseEntity fields

### REQ-001-c-004 — purchase_group_items junction table

The `purchase_group_items` table MUST be created with:

- `id` TEXT PRIMARY KEY (UUID v4)
- `purchase_group_id` TEXT, FOREIGN KEY → purchase_groups(id), ON DELETE CASCADE
- `purchase_id` TEXT, FOREIGN KEY → purchases(id), ON DELETE CASCADE
- UNIQUE constraint on (purchase_group_id, purchase_id)

---

## 2. TypeScript Types

### REQ-001-c-010 — Purchase type

```typescript
interface Purchase {
  id: string;
  storeId: string | null;
  userId: string;
  totalAmount: string; // decimal string
  currency: string;
  notes: string | null;
  purchaseDate: string; // ISO 8601
  // BaseEntity fields
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}
```

### REQ-001-c-011 — PurchaseItem type

```typescript
interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string | null;
  productName: string; // snapshot
  quantity: number;
  unitPrice: string; // decimal string
  totalPrice: string; // decimal string
  notes: string | null;
  // BaseEntity fields
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}
```

### REQ-001-c-012 — PurchaseGroup type

```typescript
interface PurchaseGroup {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  startDate: string | null;
  endDate: string | null;
  // BaseEntity fields
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}
```

### REQ-001-c-013 — PurchaseGroupItem type

```typescript
interface PurchaseGroupItem {
  id: string;
  purchaseGroupId: string;
  purchaseId: string;
}
```

---

## 3. Validation Schemas

### REQ-001-c-020 — purchaseSchema (Zod)

- `storeId`: optional string (UUID)
- `totalAmount`: string, non-empty, valid decimal
- `currency`: string, default 'USD'
- `notes`: optional string, max 500 chars
- `purchaseDate`: string, ISO 8601 format
- `items`: array of at least 1 item, each with product_name, quantity (≥1), unit_price

### REQ-001-c-021 — purchaseGroupSchema (Zod)

- `name`: string, 1-100 chars
- `description`: optional string, max 500 chars
- `startDate`: optional, ISO 8601
- `endDate`: optional, ISO 8601, must be >= startDate if both provided

---

## 4. Repositories

### REQ-001-c-030 — PurchaseRepository

Methods:

- `create(purchase: Omit<Purchase, 'id'>, items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]): Promise<Purchase>`
- `getById(id: string): Promise<Purchase | null>`
- `getAll(): Promise<Purchase[]>`
- `getByStoreId(storeId: string): Promise<Purchase[]>`
- `getBySyncStatus(status: SyncStatus): Promise<Purchase[]>`
- `update(id: string, data: Partial<Purchase>): Promise<Purchase>`
- `softDelete(id: string): Promise<void>`

### REQ-001-c-031 — PurchaseItemRepository

Methods:

- `create(item: Omit<PurchaseItem, 'id'>): Promise<PurchaseItem>`
- `getByPurchaseId(purchaseId: string): Promise<PurchaseItem[]>`
- `update(id: string, data: Partial<PurchaseItem>): Promise<PurchaseItem>`
- `softDelete(id: string): Promise<void>`

### REQ-001-c-032 — PurchaseGroupRepository

Methods:

- `create(group: Omit<PurchaseGroup, 'id'>): Promise<PurchaseGroup>`
- `getById(id: string): Promise<PurchaseGroup | null>`
- `getAll(): Promise<PurchaseGroup[]>`
- `getAllWithPurchases(): Promise<(PurchaseGroup & { purchases: Purchase[]; total: string })[]>`
- `update(id: string, data: Partial<PurchaseGroup>): Promise<PurchaseGroup>`
- `softDelete(id: string): Promise<void>`
- `assignPurchase(groupId: string, purchaseId: string): Promise<void>`
- `unassignPurchase(groupId: string, purchaseId: string): Promise<void>`
- `getPurchasesInGroup(groupId: string): Promise<Purchase[]>`

---

## 5. Screens

### REQ-001-c-040 — PurchaseListScreen

- Header: "Purchases" with FAB (+)
- List: FlatList of purchase cards showing:
  - Date (formatted)
  - Store name (or "No store")
  - Total amount + currency
  - Item count badge
- Search: Filter by date range or store
- Pull-to-refresh
- Tap card → PurchaseDetailScreen
- FAB → PurchaseCreateScreen

### REQ-001-c-041 — PurchaseCreateScreen

- Store picker (optional, dropdown from StoreRepository)
- Date picker (default: today)
- Currency selector (default: USD)
- Notes input (optional)
- Dynamic item list:
  - Product picker (from ProductRepository) or manual name
  - Quantity input (numeric)
  - Unit price input (decimal)
  - Total calculated automatically
  - Add item button
  - Remove item button per row
- Grand total displayed
- Save button → validates → creates purchase + items → toast → navigate back

### REQ-001-c-042 — PurchaseDetailScreen

- Header: Purchase date + total
- Store info (if assigned)
- Notes (if any)
- List of purchase items with:
  - Product name (snapshot)
  - Quantity × unit price = total
- Delete button (soft delete) → confirmation → toast → navigate back

### REQ-001-c-043 — PurchaseGroupListScreen

- Header: "Groups" with FAB (+)
- List: Cards showing:
  - Group name
  - Description (truncated)
  - Purchase count
  - Total amount (sum of all purchases)
- Tap card → GroupDetailScreen (or inline expansion)
- FAB → PurchaseGroupCreateScreen

### REQ-001-c-044 — PurchaseGroupCreateScreen

- Name input (required)
- Description input (optional)
- Start/End date pickers (optional)
- Save button → creates group → navigate back

### REQ-001-c-045 — PurchaseGroupDetailScreen (or inline in list)

- Group name + description
- Date range (if set)
- List of assigned purchases
- "Assign purchase" button → modal with unassigned purchases list
- "Unassign" per purchase (confirmation)
- Total aggregated amount

---

## 6. Navigation

### REQ-001-c-050 — Navigation Types

```typescript
type PurchaseStackParamList = {
  PurchaseList: undefined;
  PurchaseCreate: undefined;
  PurchaseDetail: { purchaseId: string };
};

type PurchaseGroupStackParamList = {
  PurchaseGroupList: undefined;
  PurchaseGroupCreate: undefined;
  PurchaseGroupDetail: { groupId: string };
};
```

Add to TabNavigator:

- Purchases tab → PurchaseStack
- Groups tab → PurchaseGroupStack

---

## 7. Requirements Coverage Matrix

| Requirement   | Description                       |
| ------------- | --------------------------------- |
| REQ-001-c-001 | purchases table schema            |
| REQ-001-c-002 | purchase_items table schema       |
| REQ-001-c-003 | purchase_groups table schema      |
| REQ-001-c-004 | purchase_group_items schema       |
| REQ-001-c-010 | Purchase type                     |
| REQ-001-c-011 | PurchaseItem type                 |
| REQ-001-c-012 | PurchaseGroup type                |
| REQ-001-c-013 | PurchaseGroupItem type            |
| REQ-001-c-020 | purchaseSchema validation         |
| REQ-001-c-021 | purchaseGroupSchema validation    |
| REQ-001-c-030 | PurchaseRepository interface      |
| REQ-001-c-031 | PurchaseItemRepository interface  |
| REQ-001-c-032 | PurchaseGroupRepository interface |
| REQ-001-c-040 | PurchaseListScreen                |
| REQ-001-c-041 | PurchaseCreateScreen              |
| REQ-001-c-042 | PurchaseDetailScreen              |
| REQ-001-c-043 | PurchaseGroupListScreen           |
| REQ-001-c-044 | PurchaseGroupCreateScreen         |
| REQ-001-c-045 | PurchaseGroupDetailScreen         |
| REQ-001-c-050 | Navigation types                  |

Total: 20 requirements

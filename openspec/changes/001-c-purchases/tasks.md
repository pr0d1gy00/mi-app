# Implementation Tasks — Chain 001-c: Purchases + PurchaseItems + PurchaseGroups

**Spec:** `openspec/changes/001-c-purchases/spec.md` (20 requirements)
**Design:** `openspec/changes/001-c-purchases/design.md`
**Strict TDD:** true — every task must produce RED → GREEN → TRIANGULATE evidence.
**Review Budget:** 250 changed lines per PR.

---

## Review Workload Forecast

| Field                   | Value                       |
| ----------------------- | --------------------------- |
| Estimated changed lines | ~800–900 (additions only)   |
| 400-line budget risk    | Low — well under 400 per PR |
| Chained PRs recommended | No                          |
| Delivery strategy       | Sequential                  |
| Chain strategy          | stacked-to-main             |

---

## PR 1: `001-c-1-schema-types` — Migration + Types + Validation

### T01: Add Purchase Types — `src/types/entities.ts`

- [ ] **Files:** `src/types/entities.ts` (modify)
- **Depends on:** None
- **Estimated lines:** ~40
- **TDD — RED first:**
  1. Create `src/types/__tests__/purchase-entities.test.ts`
  2. Test: `Purchase` interface has required fields
  3. Test: `PurchaseItem` interface has required fields
  4. Test: `PurchaseGroup` interface has required fields
  5. Test: `PurchaseGroupItem` interface has required fields
- **Implementation:** Add interfaces extending BaseEntity
- **Acceptance criteria:** REQ-001-c-010, REQ-001-c-011, REQ-001-c-012, REQ-001-c-013

### T02: Create Purchase Validation Schemas — `src/types/validation.ts`

- [ ] **Files:** `src/types/validation.ts` (modify — add schemas)
- **Depends on:** T01 (types)
- **Estimated lines:** ~50
- **TDD — RED first:**
  1. Create `src/types/__tests__/purchase-validation.test.ts`
  2. Test: `purchaseSchema` validates valid purchase data
  3. Test: `purchaseSchema` rejects empty items array
  4. Test: `purchaseSchema` rejects invalid date format
  5. Test: `purchaseGroupSchema` validates valid group
  6. Test: `purchaseGroupSchema` rejects end_date < start_date
- **Implementation:** Add Zod schemas
- **Acceptance criteria:** REQ-001-c-020, REQ-001-c-021

### T03: Create Purchase Migrations — `src/database/migrations/`

- [ ] **Files:** `src/database/migrations/002-create-purchases.ts`, `src/database/migrations/003-create-purchase-groups.ts`
- **Depends on:** None
- **Estimated lines:** ~90
- **TDD — RED first:**
  1. Create `src/database/__tests__/purchases-migration.test.ts`
  2. Test: `runMigrations()` creates purchases table with all columns
  3. Test: `runMigrations()` creates purchase_items table with FK to purchases
  4. Test: `runMigrations()` creates purchase_groups table
  5. Test: `runMigrations()` creates purchase_group_items junction table
  6. Test: Cascade delete works (delete purchase removes items)
  7. Test: UNIQUE constraint on purchase_group_items
- **Implementation:** Write migration SQL per design §2
- **Acceptance criteria:** REQ-001-c-001, REQ-001-c-002, REQ-001-c-003, REQ-001-c-004

---

## PR 2: `001-c-2-repositories` — All 3 Repositories

### T04: Create PurchaseRepository — `src/repositories/PurchaseRepository.ts`

- [ ] **Files:** `src/repositories/PurchaseRepository.ts`, `src/repositories/__tests__/PurchaseRepository.test.ts`
- **Depends on:** T01, T03
- **Estimated lines:** ~120
- **TDD — RED first:**
  1. Write all tests first (create, getById, getAll, getByStoreId, getBySyncStatus, update, softDelete)
  2. Mock in-memory DB
  3. Test: create sets totalAmount from items
  4. Test: getAll excludes soft-deleted
  5. Test: softDelete cascades to items (via FK or manual)
- **Implementation:** Per design §4
- **Acceptance criteria:** REQ-001-c-030

### T05: Create PurchaseItemRepository — `src/repositories/PurchaseItemRepository.ts`

- [ ] **Files:** `src/repositories/PurchaseItemRepository.ts`, `src/repositories/__tests__/PurchaseItemRepository.test.ts`
- **Depends on:** T03, T04
- **Estimated lines:** ~80
- **TDD — RED first:**
  1. Write tests for create, getByPurchaseId, update, softDelete
  2. Test: getByPurchaseId excludes deleted items
  3. Test: softDelete marks deleted
- **Implementation:** Per design §4
- **Acceptance criteria:** REQ-001-c-031

### T06: Create PurchaseGroupRepository — `src/repositories/PurchaseGroupRepository.ts`

- [ ] **Files:** `src/repositories/PurchaseGroupRepository.ts`, `src/repositories/__tests__/PurchaseGroupRepository.test.ts`
- **Depends on:** T03, T04
- **Estimated lines:** ~100
- **TDD — RED first:**
  1. Write tests for create, getById, getAll, getAllWithPurchases, update, softDelete, assignPurchase, unassignPurchase, getPurchasesInGroup
  2. Test: getAllWithPurchases aggregates totals
  3. Test: assignPurchase prevents duplicates (UNIQUE)
  4. Test: getPurchasesInGroup excludes soft-deleted
- **Implementation:** Per design §4
- **Acceptance criteria:** REQ-001-c-032

### T07: Create PurchaseService — `src/services/PurchaseService.ts`

- [ ] **Files:** `src/services/PurchaseService.ts`, `src/services/__tests__/PurchaseService.test.ts`
- **Depends on:** T04, T05, T06
- **Estimated lines:** ~60
- **TDD — RED first:**
  1. Write tests for calculateTotal, validateItems, createPurchaseWithItems
  2. Test: calculateTotal sums item totals
  3. Test: createPurchaseWithItems creates purchase + items atomically
- **Implementation:** Business logic for purchase creation
- **Acceptance criteria:** All business rules in one service

---

## PR 3: `001-c-3-purchase-screens` — Purchase Screens

### T08: Update Navigation Types — `src/navigation/types.ts`

- [ ] **Files:** `src/navigation/types.ts` (modify)
- **Depends on:** None
- **Estimated lines:** ~20
- **TDD — RED first:**
  1. Test: PurchaseStackParamList has all routes
  2. Test: PurchaseGroupStackParamList has all routes
  3. Test: BottomTabParamList includes purchases and purchaseGroups
- **Implementation:** Add types per design §6
- **Acceptance criteria:** REQ-001-c-050

### T09: Update TabNavigator — `src/navigation/TabNavigator.tsx`

- [ ] **Files:** `src/navigation/TabNavigator.tsx` (modify)
- **Depends on:** T08
- **Estimated lines:** ~30
- **TDD — RED first:**
  1. Test: Purchases tab renders
  2. Test: Groups tab renders
- **Implementation:** Add stacks per design §6
- **Acceptance criteria:** REQ-001-c-050

### T10: Create PurchaseListScreen — `src/screens/purchases/PurchaseListScreen.tsx`

- [ ] **Files:** `src/screens/purchases/PurchaseListScreen.tsx`, `src/screens/purchases/__tests__/PurchaseListScreen.test.tsx`
- **Depends on:** T04, T05, T08, T09
- **Estimated lines:** ~80
- **TDD — RED first:**
  1. Write tests for empty state, loading, render with purchases
  2. Test: FAB navigates to PurchaseCreate
  3. Test: Card tap navigates to PurchaseDetail
- **Implementation:** Per design §5.1
- **Acceptance criteria:** REQ-001-c-040

### T11: Create PurchaseCreateScreen — `src/screens/purchases/PurchaseCreateScreen.tsx`

- [ ] **Files:** `src/screens/purchases/PurchaseCreateScreen.tsx`, `src/screens/purchases/__tests__/PurchaseCreateScreen.test.tsx`
- **Depends on:** T04, T05, T07, T08
- **Estimated lines:** ~120
- **TDD — RED first:**
  1. Write tests for form validation, item management, save flow
  2. Test: cannot save with 0 items
  3. Test: can add/remove items dynamically
  4. Test: save creates purchase + all items
  5. Test: validation errors shown inline
- **Implementation:** Per design §5.2
- **Acceptance criteria:** REQ-001-c-041

### T12: Create PurchaseDetailScreen — `src/screens/purchases/PurchaseDetailScreen.tsx`

- [ ] **Files:** `src/screens/purchases/PurchaseDetailScreen.tsx`, `src/screens/purchases/__tests__/PurchaseDetailScreen.test.tsx`
- **Depends on:** T04, T05, T08
- **Estimated lines:** ~80
- **TDD — RED first:**
  1. Write tests for render, items list, delete flow
  2. Test: shows all line items
  3. Test: delete shows confirmation
  4. Test: delete navigates back on success
- **Implementation:** Per design §5.3
- **Acceptance criteria:** REQ-001-c-042

---

## PR 4: `001-c-4-group-screens` — PurchaseGroup Screens

### T13: Create PurchaseGroupListScreen — `src/screens/purchase-groups/PurchaseGroupListScreen.tsx`

- [ ] **Files:** `src/screens/purchase-groups/PurchaseGroupListScreen.tsx`, `src/screens/purchase-groups/__tests__/PurchaseGroupListScreen.test.tsx`
- **Depends on:** T06, T08, T09
- **Estimated lines:** ~70
- **TDD — RED first:**
  1. Write tests for empty state, render with groups, FAB navigates
  2. Test: cards show name, purchase count, total
- **Implementation:** Per design §5.4
- **Acceptance criteria:** REQ-001-c-043

### T14: Create PurchaseGroupCreateScreen — `src/screens/purchase-groups/PurchaseGroupCreateScreen.tsx`

- [ ] **Files:** `src/screens/purchase-groups/PurchaseGroupCreateScreen.tsx`, `src/screens/purchase-groups/__tests__/PurchaseGroupCreateScreen.test.tsx`
- **Depends on:** T06, T08
- **Estimated lines:** ~60
- **TDD — RED first:**
  1. Write tests for form validation, save flow
  2. Test: name required validation
  3. Test: end_date >= start_date validation
- **Implementation:** Per design §5.5
- **Acceptance criteria:** REQ-001-c-044

### T15: Create PurchaseGroupDetailScreen — `src/screens/purchase-groups/PurchaseGroupDetailScreen.tsx`

- [ ] **Files:** `src/screens/purchase-groups/PurchaseGroupDetailScreen.tsx`, `src/screens/purchase-groups/__tests__/PurchaseGroupDetailScreen.test.tsx`
- **Depends on:** T06, T08
- **Estimated lines:** ~90
- **TDD — RED first:**
  1. Write tests for render, assign/unassign, delete group
  2. Test: shows aggregated total
  3. Test: assign opens modal with available purchases
  4. Test: unassign removes from group
- **Implementation:** Per design §5.6
- **Acceptance criteria:** REQ-001-c-045

### T16: Update App.tsx Imports — `src/app/App.tsx`

- [ ] **Files:** `src/app/App.tsx` (modify)
- **Depends on:** T09, T10, T11, T12, T13, T14, T15
- **Estimated lines:** ~5
- **TDD — RED first:**
  1. Test: App renders without errors after all screens added
- **Implementation:** Ensure all navigation imports present
- **Acceptance criteria:** App compiles and renders

---

## Task Dependency Graph

```
T01 ──┬── T02 ──┬── T10 ──┬── T11 ──┐
      │         │         │         ├── T16
      │         │         │         │
      │         │         ├── T12 ──┘
      │         │         │
      │         └── T04 ──┬── T05 ──┬── T10
      │                   │         │
      │                   │         └── T11
      │                   │         │
      │                   │         └── T12
      │                   │
      │                   └── T07 ──┬── T11
      │                                       │
      ├── T03 ──┬── T04 ──┬── T05 ──┤
      │         │         │         │
      │         │         └── T06 ──┤
      │         │                   │
      │         └── T06 ──┬── T07 ──┼── T11
      │                   │         │
      │                   │         └── T12
      │                   │
      │                   ├── T13 ──┬── T14 ──┬── T15
      │                   │         │         │
      │                   │         │         └── T16
      │                   │         │
      │                   │         └── T15
      │                   │
      └── T08 ──┬── T09 ──┴── T10
                │
                ├── T11
                ├── T12
                ├── T13
                ├── T14
                └── T15
```

---

## TDD Evidence Requirements

For every task, the following evidence must be present:

1. **RED evidence:** Test file exists with failing tests
2. **GREEN evidence:** All tests pass
3. **TRIANGULATE evidence (where specified):** Edge cases tested

---

## PR Merge Checklist

- [ ] All new tests pass
- [ ] All existing tests from previous PRs still pass
- [ ] TypeScript compiles without errors
- [ ] No lint errors
- [ ] Changed lines ≤ 250 per PR
- [ ] TDD evidence present

---

## Requirements Coverage Matrix

| Task | Requirements Covered                                       |
| ---- | ---------------------------------------------------------- |
| T01  | REQ-001-c-010, REQ-001-c-011, REQ-001-c-012, REQ-001-c-013 |
| T02  | REQ-001-c-020, REQ-001-c-021                               |
| T03  | REQ-001-c-001, REQ-001-c-002, REQ-001-c-003, REQ-001-c-004 |
| T04  | REQ-001-c-030                                              |
| T05  | REQ-001-c-031                                              |
| T06  | REQ-001-c-032                                              |
| T07  | (business logic)                                           |
| T08  | REQ-001-c-050                                              |
| T09  | REQ-001-c-050                                              |
| T10  | REQ-001-c-040                                              |
| T11  | REQ-001-c-041                                              |
| T12  | REQ-001-c-042                                              |
| T13  | REQ-001-c-043                                              |
| T14  | REQ-001-c-044                                              |
| T15  | REQ-001-c-045                                              |
| T16  | (integration)                                              |

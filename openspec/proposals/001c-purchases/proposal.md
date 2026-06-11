# Proposal 001c — Purchases + PurchaseItems + PurchaseGroups

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| **Change Name** | `001c-purchases` — Purchase tracking with multi-item creation |
| **Status**      | Draft                                                         |
| **Date**        | 2026-06-11                                                    |
| **Author**      | el Gentleman                                                  |
| **Phase**       | Proposal                                                      |

---

## 1. Description

Add purchase tracking to mi-purchase-app: create purchases with multiple line items (product + quantity + price), assign them to stores, view purchase history, soft-delete purchases, and organize purchases into groups (trips, events, budget periods).

---

## 2. Scope

### IN Scope

- SQLite schema for `purchases` and `purchase_items` tables
- PurchaseRepository and PurchaseItemRepository
- PurchaseGroups table and PurchaseGroupRepository
- PurchaseService for business logic
- Purchase screens: List, Create (multi-item), Detail, Delete
- PurchaseGroup screens: List, Create, Assign purchases

### OUT of Scope

- Purchase editing (edit items after creation — v2)
- Purchase splitting (move items between purchases)
- Exchange rate conversion in purchase display (handled in 001-d)

---

## 3. SQLite Schema

### purchases table

| Column         | Type | Constraints                            |
| -------------- | ---- | -------------------------------------- |
| id             | TEXT | PRIMARY KEY                            |
| store_id       | TEXT | FOREIGN KEY → stores(id), NULL allowed |
| user_id        | TEXT | NOT NULL                               |
| total_amount   | TEXT | NOT NULL (decimal as string)           |
| currency       | TEXT | NOT NULL, DEFAULT 'USD'                |
| notes          | TEXT | NULL                                   |
| purchase_date  | TEXT | NOT NULL (ISO 8601)                    |
| created_at     | TEXT | NOT NULL                               |
| updated_at     | TEXT | NOT NULL                               |
| deleted_at     | TEXT | NULL                                   |
| sync_status    | TEXT | NOT NULL, DEFAULT 'created'            |
| last_synced_at | TEXT | NULL                                   |

### purchase_items table

| Column         | Type | Constraints                              |
| -------------- | ---- | ---------------------------------------- |
| id             | TEXT | PRIMARY KEY                              |
| purchase_id    | TEXT | FOREIGN KEY → purchases(id)              |
| product_id     | TEXT | FOREIGN KEY → products(id), NULL allowed |
| product_name   | TEXT | NOT NULL (snapshot at creation)          |
| quantity       | REAL | NOT NULL, DEFAULT 1                      |
| unit_price     | TEXT | NOT NULL (decimal as string)             |
| total_price    | TEXT | NOT NULL (quantity × unit_price)         |
| notes          | TEXT | NULL                                     |
| created_at     | TEXT | NOT NULL                                 |
| updated_at     | TEXT | NOT NULL                                 |
| deleted_at     | TEXT | NULL                                     |
| sync_status    | TEXT | NOT NULL, DEFAULT 'created'              |
| last_synced_at | TEXT | NULL                                     |

### purchase_groups table

| Column         | Type | Constraints                 |
| -------------- | ---- | --------------------------- |
| id             | TEXT | PRIMARY KEY                 |
| name           | TEXT | NOT NULL                    |
| description    | TEXT | NULL                        |
| user_id        | TEXT | NOT NULL                    |
| start_date     | TEXT | NULL (ISO 8601)             |
| end_date       | TEXT | NULL (ISO 8601)             |
| created_at     | TEXT | NOT NULL                    |
| updated_at     | TEXT | NOT NULL                    |
| deleted_at     | TEXT | NULL                        |
| sync_status    | TEXT | NOT NULL, DEFAULT 'created' |
| last_synced_at | TEXT | NULL                        |

### purchase_group_items (junction table)

| Column            | Type | Constraints                       |
| ----------------- | ---- | --------------------------------- |
| id                | TEXT | PRIMARY KEY                       |
| purchase_group_id | TEXT | FOREIGN KEY → purchase_groups(id) |
| purchase_id       | TEXT | FOREIGN KEY → purchases(id)       |

---

## 4. PR Structure

| PR   | Name                       | Scope                                    | Est. Lines |
| ---- | -------------------------- | ---------------------------------------- | ---------- |
| PR 1 | `001-c-1-schema-types`     | Migration + Purchase types + validation  | ~180       |
| PR 2 | `001-c-2-repositories`     | All 3 repositories with CRUD + sync      | ~250       |
| PR 3 | `001-c-3-purchase-screens` | Purchase List + Create + Detail + Delete | ~200       |
| PR 4 | `001-c-4-group-screens`    | Group List + Create + Assign             | ~180       |

---

## 5. Acceptance Criteria

- User can create a purchase with 1+ line items
- Purchase items capture product snapshot (name at time of purchase)
- Purchase list shows date, store, total, item count
- Purchase detail shows all line items with prices
- User can soft-delete a purchase (removes from list, preserves in DB)
- User can create purchase groups and assign purchases to them
- Group view shows aggregated total of assigned purchases
- All sync_status fields managed correctly on create/update/delete

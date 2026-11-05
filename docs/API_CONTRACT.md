# API Contract — Shared Living App

**Owner of edits:** Member A, only after written approval from Member B (see `OWNERSHIP.md` R4).
**Consumers:** Member B builds the frontend strictly against this document; Member A implements strictly to it.

## 1. Conventions

- Base URL: `http://<host>:3000/api` · JSON in, JSON out · `Content-Type: application/json`
- Member IDs are strings: `"M01"`, `"M02"`, `"M03"` (Ali, Ayesha, Bilal). All other IDs are integers.
- **Money:** JSON numbers in PKR with at most 2 decimals (`780`, `333.34`). Responses are always rounded to 2 decimals. Server converts to integer paisa internally.
- Dates: `expense_date` = `YYYY-MM-DD`; timestamps = ISO 8601.
- Categories (enum): `Groceries`, `Utilities`, `Entertainment`, `Cleaning`, `Other`.
- Units (enum): `pack`, `dozen`, `bottle`, `bag`.
- **Authentication:** every endpoint except `GET /health` and `POST /auth/login` requires the header `Authorization: Bearer <token>` (token from `/auth/login`). Identity (`created_by`) always comes from the token, never from the request body. If the backend runs with `AUTH_REQUIRED=false` (testing switch) the header is ignored.

### Error envelope (all non-2xx)
```json
{ "error": { "code": "OVER_SETTLEMENT", "message": "Amount exceeds what Ayesha owes (450.00).", "field": "amount" } }
```
`field` is optional.

| HTTP | `code` | When |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing, malformed, invalid-signature or expired token (client must return to Login) |
| 401 | `INVALID_CREDENTIALS` | Wrong username or password (identical message for both) |
| 403 | `FORBIDDEN` | Authenticated but not allowed (e.g. settling a payment you are not a party to) |
| 429 | `TOO_MANY_ATTEMPTS` | Too many failed logins; retry after ~60 s |
| 400 | `VALIDATION_ERROR` | Missing/invalid field, bad enum, >2 decimals |
| 400 | `NON_POSITIVE_AMOUNT` | amount ≤ 0 |
| 400 | `SELF_PAYMENT` | sender == recipient |
| 400 | `OVER_SETTLEMENT` | amount > debtor's debt or recipient's credit; or sender not a debtor / recipient not a creditor |
| 400 | `SPLIT_MISMATCH` | custom splits don't sum to amount |
| 404 | `NOT_FOUND` | member / item does not exist |
| 409 | `ALREADY_BOUGHT` | checkout includes an item already `bought` |
| 500 | `INTERNAL_ERROR` | unexpected |

---

## 2. Endpoints

### POST `/auth/login`  *(public)*
Request: `{ "username": "ayesha", "password": "Demo@1234" }`
Response `200`:
```json
{ "token": "<jwt>", "expires_in": 43200,
  "user": { "id": 2, "username": "ayesha", "member_id": "M02", "name": "Ayesha" } }
```
Errors: `400 VALIDATION_ERROR` (missing fields), `401 INVALID_CREDENTIALS`, `429 TOO_MANY_ATTEMPTS`.
Username is case-insensitive. Demo accounts: `ali` (M01), `ayesha` (M02), `bilal` (M03).

### GET `/auth/me`
Returns the user for the supplied token (used by the app to restore a session):
```json
{ "id": 2, "username": "ayesha", "member_id": "M02", "name": "Ayesha" }
```
`401 UNAUTHORIZED` if the token is missing/invalid/expired.

### POST `/auth/change-password`  *(optional, MAY)*
`{ "current_password": "...", "new_password": "..." }` → `204`. `new_password` ≥ 8 chars; wrong current → `401 INVALID_CREDENTIALS`.

### GET `/members`
```json
[ { "id": "M01", "name": "Ali" }, { "id": "M02", "name": "Ayesha" }, { "id": "M03", "name": "Bilal" } ]
```

### GET `/shopping`
Optional query: `?status=pending|bought`. Newest first.
```json
[ { "id": 1, "title": "Milk", "unit": "bottle", "requested_qty": 2, "status": "pending" } ]
```

### POST `/shopping`
Request: `{ "title": "Rice", "unit": "bag", "requested_qty": 1 }` → `201` with the item object (`status: "pending"`).
Validation: `title` non-empty, `unit` in enum, `requested_qty` > 0.

### POST `/shopping/checkout`
Request:
```json
{ "item_ids": [1, 2], "total_paid": 780.00, "payer_id": "M01", "split_members": ["M01", "M02", "M03"] }
```
Behavior (atomic): marks items `bought`, creates an **equal-split** expense (category `Groceries`, title built from item titles, dated today). Response `201`:
```json
{ "expense": { "id": 4, "title": "Grocery: Milk, Rice", "category": "Groceries", "amount": 780.00,
               "payer_id": "M01", "split_type": "equal", "expense_date": "2026-11-05", "created_by": "M01",
               "splits": [ {"member_id":"M01","amount":260.00}, {"member_id":"M02","amount":260.00}, {"member_id":"M03","amount":260.00} ] },
  "items": [ { "id": 1, "status": "bought" }, { "id": 2, "status": "bought" } ] }
```
Errors: `NOT_FOUND`, `ALREADY_BOUGHT`, `VALIDATION_ERROR` (empty `item_ids`/`split_members`, `total_paid` ≤ 0).

### GET `/expenses`
Newest first. Each element has the same shape as `expense` above.

### POST `/expenses`
Equal split:
```json
{ "title": "Cleaning Supplies", "category": "Cleaning", "amount": 900, "payer_id": "M02",
  "split_type": "equal", "expense_date": "2026-11-05",
  "splits": [ { "member_id": "M01" }, { "member_id": "M02" } ] }
```
Custom split:
```json
{ "title": "Internet Bill", "category": "Utilities", "amount": 1500, "payer_id": "M03",
  "split_type": "custom",
  "splits": [ {"member_id":"M01","amount":500}, {"member_id":"M02","amount":300}, {"member_id":"M03","amount":700} ] }
```
- `expense_date` optional (defaults to today). For `equal`, `splits[].amount` is ignored and computed by the server (paisa remainder to ascending member ID).
- Response `201`: the `expense` object with computed `splits`.

### GET `/balances`
```json
{ "balances": [
    { "member_id": "M01", "name": "Ali",    "paid": 1800.00, "share_owed": 1550.00, "settlements_received": 0.00, "settlements_sent": 0.00, "net": 250.00 },
    { "member_id": "M02", "name": "Ayesha", "paid": 900.00,  "share_owed": 1350.00, "settlements_received": 0.00, "settlements_sent": 0.00, "net": -450.00 },
    { "member_id": "M03", "name": "Bilal",  "paid": 1500.00, "share_owed": 1300.00, "settlements_received": 0.00, "settlements_sent": 0.00, "net": 200.00 } ],
  "sum": 0.00 }
```
`net > 0` → member is owed money · `net < 0` → member owes money.

### GET `/balances/simplify`  *(Annexure A, Option 1)*
Greedy minimal transfers. Empty list when everyone is settled.
```json
{ "transfers": [
    { "from_id": "M02", "from_name": "Ayesha", "to_id": "M01", "to_name": "Ali",   "amount": 250.00 },
    { "from_id": "M02", "from_name": "Ayesha", "to_id": "M03", "to_name": "Bilal", "amount": 200.00 } ],
  "count": 2 }
```
Executing a suggestion = call `POST /settle` with the same values.

### POST `/settle`
Request: `{ "sender_id": "M02", "recipient_id": "M01", "amount": 250.00 }` → `201`:
```json
{ "settlement": { "id": 1, "sender_id": "M02", "recipient_id": "M01", "amount": 250.00, "created_by": "M02", "created_at": "2026-11-05T10:15:00.000Z" } }
```
Validation order: amount > 0 → sender ≠ recipient → members exist → **caller (from token) is the sender or the recipient, else `403 FORBIDDEN`** → sender is debtor & recipient is creditor → amount ≤ min(debt, credit).

### GET `/budget`  *(addition required by Home screen)*
Current calendar month.
```json
{ "month": "2026-11", "budget": 5000.00, "spent": 4200.00, "remaining": 800.00,
  "percent_used": 84.0, "status": "near_limit" }
```
`status`: `on_track` (<80%) · `near_limit` (80% to <100%) · `over_budget` (≥100%). `remaining` may be negative.

### GET `/health`  *(public)*
`{ "status": "ok" }` — used by the app to verify connectivity.

---

## 3. Frontend ↔ Endpoint map (for Member B)

| Screen / action | Endpoint(s) |
|---|---|
| Login screen | `POST /auth/login` |
| App start (session restore) | `GET /auth/me`, then `/members` |
| Logout | none (client deletes the token) |
| Home | `/budget`, `/balances`, `/shopping?status=pending` |
| Shopping list / add | `/shopping`, `POST /shopping` |
| Checkout | `POST /shopping/checkout` |
| Expenses | `/expenses`, `POST /expenses`, `/balances` |
| Settle Up / Smart Settle | `POST /settle`, `/balances/simplify` |

## 4. Reserved for the Hour-3.5 surprise (do not pre-build)
| Option | Likely contract change |
|---|---|
| 2 Tax & discount | `POST /shopping/checkout` gains optional `tax_percent`, `discount_amount` |
| 3 Category alerts | new `GET /budget/categories` |
| 4 Recurring | `POST /expenses` gains `is_recurring`; new `POST /expenses/recurring/apply` |

Any such change follows the contract change protocol (OWNERSHIP R4), which for the surprise round is a 2-minute chat approval.


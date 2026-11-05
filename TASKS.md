# TASKS — Work Division & Timeline (5 Hours)

## 0. Pre-Start Gate (both members, before the clock starts)
- [ ] **Written confirmation from organizers that AI tools (Antigravity) are allowed.** The task sheet p.1 states AI-assisted coding is prohibited → disqualification. Do not skip this.
- [ ] Both read `ARCHITECTURE.md` (requirement IDs per area), `docs/API_CONTRACT.md`, `OWNERSHIP.md`
- [ ] Auth adds roughly 30–40 min per side: Phase 1 absorbs it; if you fall behind at 2:30, drop MAY/SHOULD auth items (AUTH-12/13/14, AUTHFE-10/11/12) first, never the MUSTs
- [ ] Hooks installed (`OWNERSHIP.md` §4)

---

## 1. Roles

| | **Member A — Backend & Financial Engine** | **Member B — Mobile Frontend** |
|---|---|---|
| Zone | `backend/**`, `tests/**` | `frontend/**` |
| Rubric focus | Functionality (REST API, split logic, settlements, budget), Code Quality (route modularization), validation | Design (20), UX & resilience, Code Quality (state mgmt, API client) |
| Oral defense topics | API routes, SQLite schema, paisa split algorithm, net-balance equation, settlement validation, greedy simplify | Navigation, AppContext state, API client + interceptors, `useAsyncAction`, forms/modals |
| Extra duties | Owns the contract file edits, benchmark tests, demo data reset, README run steps | Owns UX polish, demo flow rehearsal, on-device testing |

---

## 2. Member A — Backend Checklist

**Phase 1 (0:20 – 1:30) Foundation**
- [ ] Install packages exactly as listed in `PACKAGES.md` (express, cors, better-sqlite3, dotenv; dev: nodemon; tests use built-in `node --test`)
- [ ] `database.js`: schema, FK on, seed M01/M02/M03, `settings.monthly_budget_paisa = 500000`
- [ ] `server.js`: JSON, CORS, listen `0.0.0.0:3000`, `errorHandler`
- [ ] `services/money.js`, `utils/AppError.js`, `middleware/errorHandler.js`
- [ ] Auth (AUTH-01…09, 15): `users` table + seed accounts, `authService` (bcryptjs + jsonwebtoken), `POST /auth/login`, `GET /auth/me`, `requireAuth` middleware, fail-fast on missing `JWT_SECRET`
- [ ] `GET /health`, `GET /members` (behind auth) → **notify B (Milestone M1)**

**Phase 2 (1:30 – 3:00) Core features**
- [ ] `splitEngine.js` + `tests/split.test.js` (1000 → 333.34/333.33/333.33)
- [ ] Shopping: `GET/POST /shopping`
- [ ] Expenses: `POST /expenses` (equal + custom), `GET /expenses` → **M2**
- [ ] `GET /balances` with sum = 0.00 assertion → **M3**
- [ ] `POST /shopping/checkout` (transactional)
- [ ] `POST /settle` with all 5 validations + party check (403) + `created_by` from token
- [ ] Login rate limit (AUTH-12), `AUTH_REQUIRED` switch (AUTH-14), `tests/auth.test.js`
- [ ] `GET /budget`

**Phase 3 (3:00 – 3:30) Prep & verify**
- [ ] `GET /balances/simplify` (Option 1 is marked "Recommended" — build it now; it is cheap)
- [ ] `tests/benchmark.test.js` full 4,200 scenario passes → **M4**
- [ ] Verify persistence: restart server, data intact

**Phase 4 (3:30 – 4:30) Surprise round** — implement the backend half of the released option (see §4).

**Phase 5 (4:30 – 5:00)** Bug fixes from Handoff Reports, reset script for demo DB, rehearse defense.

---

## 3. Member B — Frontend Checklist

**Phase 1 (0:20 – 1:30) Foundation**
- [ ] `npx create-expo-app`, install: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `axios`
- [ ] `theme.js`, `utils/format.js` (`formatPKR`)
- [ ] `services/api.js` (axios instance, interceptor → `{code,message}`, endpoint functions per contract)
- [ ] `AuthContext`, `tokenStorage.js` (expo-secure-store), `LoginScreen`, auth-gated navigation in `App.js`, Bearer + 401 interceptors
- [ ] `AppContext`, `useAsyncAction`
- [ ] Reusable components: Card, MoneyText, StatusBadge, ProgressBar, PrimaryButton, ErrorBanner, LoadingOverlay
- [ ] `App.js` with 3 tabs (placeholder screens)
- [ ] *Until M1–M3 land*, develop against contract examples using a local mock object inside `frontend/` only

**Phase 2 (1:30 – 3:00) Screens**
- [ ] `HomeScreen`: budget bar + status, MemberSelector (defaults to logged-in member), net-balance card, pending count, user name + Logout
- [ ] `ShoppingScreen`: list + tags, AddItemForm, multi-select, CheckoutModal
- [ ] `ExpensesScreen`: ExpenseForm (equal/custom), BalanceTable, SettleModal

**Phase 3 (3:00 – 3:30) Resilience & polish**
- [ ] Spinners on all fetches; buttons disabled during POSTs
- [ ] Error banners for 4xx messages and network drop
- [ ] Empty states, pull-to-refresh, consistent PKR formatting
- [ ] Smart Settle button + `SmartSettleCard` with One-Tap Settle (Option 1 UI, ready once M4 lands)

**Phase 4 (3:30 – 4:30) Surprise round** — implement the UI half of the released option.

**Phase 5 (4:30 – 5:00)** Full demo run on a real device, fix UI issues, rehearse defense.

---

## 4. Surprise Round Split (Hour 3.5 → 4.5)

| Option | Member A (backend) | Member B (frontend) |
|---|---|---|
| **1 Smart Settle** | Already built in Phase 3 → spend the hour hardening + extra tests | Already built → polish, error states |
| **2 Tax & discount** | `tax_percent`, `discount_amount` in checkout; `final = items_total × (1 + tax%) − discount`, in paisa; store metadata (new nullable columns) | Two new inputs in CheckoutModal + live net-total preview |
| **3 Category alerts** | `GET /budget/categories`; flag category > 40% of monthly budget | Category breakdown list on Home + ⚠️ warning badge |
| **4 Recurring** | `is_recurring` on expenses; `POST /expenses/recurring/apply` | Checkbox on ExpenseForm + "Generate Monthly Recurring Bills" button on Home |

**Process (strict):** within 5 minutes of the release, post the contract delta in chat → other member says "APPROVED" → A updates the contract (R4) → both build in parallel. No one touches the other zone.

---

## 5. Milestones & Handoffs

| ID | Time | Owner → Receiver | Deliverable |
|---|---|---|---|
| **M0** | 0:20 | A → B | Setup commit + frozen docs, contract agreed |
| **M1** | ~1:00 | A → B | Server running: `/health`, `/auth/login`, `/auth/me`, `/members` (login works with seeded accounts) |
| **M2** | ~2:00 | A → B | Shopping + Expenses endpoints |
| **M3** | ~2:15 | A → B | `/balances`, `/budget` |
| **M4** | ~3:15 | A → B | `/settle`, `/shopping/checkout`, `/balances/simplify`, benchmark green |
| **M5** | 3:30 | both | Hour-3.5 freeze: full integration smoke test on device |
| **M6** | 4:30 | both | Surprise feature merged to `develop` |
| **M7** | 4:45 | both | `develop` → `main`, final demo run, **submit before 5:00** |

## 6. Demo Script (5 minutes)
1. Home: show budget 0%, active member selector
2. Shopping: add Milk + Rice → multi-select → checkout 780, payer Ali, split all
3. Expenses: log Cleaning (900, Ayesha, equal Ali+Ayesha) and Internet (1,500, Bilal, custom 500/300/700)
4. Show Electricity 1,020 if time permits → balances +250 / −450 / +200, budget 84% **Near Limit**
5. Smart Settle (or surprise feature) → One-Tap Settle both → balances 0.00, spend still 4,200
6. Show an error (over-settlement) and a disabled button during submit
7. Each member explains their own zone when asked


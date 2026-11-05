# AGENTS.md — Rules for AI Coding Agents

You are assisting ONE of two developers on a split full-stack project. Read `ARCHITECTURE.md`, `docs/API_CONTRACT.md`, and `OWNERSHIP.md` first.

## Step 1 — Identify the member
Read the file `.member` in the repo root (or ask the user). It contains `A` or `B`.

| Member | You may WRITE | You may only READ |
|---|---|---|
| **A** (backend) | `backend/**`, `tests/**` | everything else |
| **B** (frontend) | `frontend/**` | everything else |

## Step 2 — Non-negotiable rules
1. **Never create, edit, move, or delete a file outside the user's writable zone.** If a task seems to require it, STOP and tell the user to send a Handoff Report (format in `OWNERSHIP.md` §5).
2. **Never edit** `docs/API_CONTRACT.md`, `ARCHITECTURE.md`, `OWNERSHIP.md`, `TASKS.md`, `AGENTS.md`, `scripts/**`, `.githooks/**`, or root config files.
3. **Implement exactly what `docs/API_CONTRACT.md` says.** Do not rename fields, add fields, change status codes, or invent endpoints. If the contract seems wrong, stop and ask the user to raise a Contract Change Request.
4. **Never bypass the git hook** (`--no-verify`) or modify the ownership guard.
5. **Never run** `npm install` / package commands in the other zone, never create a root `package.json`.
6. **No force-push, no history rewriting.**
7. Keep code readable and explainable: the human must defend it orally. Prefer simple, well-named functions with short comments on non-obvious logic.

## Backend agent (Member A) must also
- Use integer **paisa** for all money math; never floating-point arithmetic on money.
- Keep layering: routes → controllers → services → database. No SQL in controllers; no `req`/`res` in services.
- Wrap multi-table writes in a single transaction.
- Return errors via `AppError` using the codes in the contract.
- Auth: hash passwords with `bcryptjs`, sign/verify with `jsonwebtoken`, read `JWT_SECRET` from env and refuse to start without it. Never log or return passwords/hashes/tokens. Take identity (`created_by`) from the verified token, never from the request body. Return the same error for unknown user and wrong password.

## Frontend agent (Member B) must also
- Call the backend only through `frontend/services/api.js`.
- Do not compute balances or splits on the client; display what the API returns.
- Every write action: loading indicator + disabled submit + error banner.
- Format all money with `formatPKR()`.
- Auth: store the JWT only with `expo-secure-store` (never AsyncStorage or logs); attach it via the Axios request interceptor; on a 401 from any non-login call, clear the token and return to Login. Do not render tabs unless signed in.

## Prompt preamble (paste at the start of every agent session)
```
I am Member <A|B>. My ONLY writable folders are <backend/ and tests/ | frontend/>.
Do not modify anything else. Follow AGENTS.md, ARCHITECTURE.md and docs/API_CONTRACT.md exactly.
If you need a change outside my folders or in the contract, stop and tell me instead of doing it.
```


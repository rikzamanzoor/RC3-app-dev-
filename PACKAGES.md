# PACKAGES.md — Dependencies & Install Steps

Exact packages for each zone. **Install only what is listed for your own zone** (OWNERSHIP R6). Do not add other packages without telling your teammate. Add this file to the setup commit (Zone S, frozen afterwards).

## 0. Prerequisites (both machines)

| Tool | Requirement |
|---|---|
| Node.js | **LTS 20 or 22** (needed for `better-sqlite3` prebuilt binaries and the built-in `node:test` runner). Check: `node -v` |
| npm | comes with Node |
| Git | with `core.hooksPath` set (see OWNERSHIP §4) |
| Phone testing | **Expo Go** app on the phone; phone and laptop on the same Wi-Fi |

---

## 1. Member A — Backend (`backend/`)

### Runtime packages
| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `cors` | allow the mobile app to call the API |
| `better-sqlite3` | SQLite driver (synchronous, simple transactions) |
| `dotenv` | load `backend/.env` (PORT, DB path, auth settings) |
| `bcryptjs` | password hashing (pure JS, no native build) |
| `jsonwebtoken` | sign / verify JWT access tokens |

### Dev packages
| Package | Purpose |
|---|---|
| `nodemon` | auto-restart on file save |

Tests use Node's **built-in** runner (`node --test`), so no test framework is needed.

### Install
```bash
cd backend
npm init -y
npm install express cors better-sqlite3 dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

### `backend/package.json` scripts (edit after `npm init`)
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "node --test ../tests",
  "db:reset": "node utils/resetDb.js"
}
```

### `backend/.env.example` (copy to `.env`)
```
PORT=3000
DB_PATH=./data/shared_living.db
JWT_SECRET=change-me-to-a-long-random-string   # REQUIRED: server will not start without it
JWT_EXPIRES_IN=12h
SEED_PASSWORD=Demo@1234                          # demo accounts: ali / ayesha / bilal
AUTH_REQUIRED=true                               # false = testing switch only
```
Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Verify
```bash
node -e "require('better-sqlite3')(':memory:'); console.log('sqlite OK')"
npm run dev        # then open http://localhost:3000/api/health
```

### Troubleshooting
- `better-sqlite3` fails to build on Windows → confirm Node is LTS 20/22 (prebuilt binaries exist); otherwise install "Desktop development with C++" Build Tools and re-run `npm install`.
- Phone can't reach the server → server must listen on `0.0.0.0`, and Windows Firewall must allow Node on private networks.

---

## 2. Member B — Frontend (`frontend/`)

### Create the project (blank JavaScript template → gives `App.js`)
```bash
cd frontend
rm .gitkeep                                   # create-expo-app wants an empty folder
npx create-expo-app@latest . --template blank
```

### Packages
| Package | Purpose |
|---|---|
| `@react-navigation/native` | navigation core |
| `@react-navigation/bottom-tabs` | Home / Shopping / Expenses tab bar |
| `react-native-screens` | native screen containers (required by React Navigation) |
| `react-native-safe-area-context` | safe-area handling (required by React Navigation) |
| `axios` | HTTP client for `services/api.js` |
| `expo-secure-store` | encrypted on-device storage for the JWT (auth session) |

Icons come from `@expo/vector-icons`, which is already bundled with Expo. Dropdowns and dates use simple chip buttons and a `YYYY-MM-DD` text field, so **no picker packages are needed**.

### Install (use `expo install` so native versions match your Expo SDK)
```bash
npx expo install react-native-screens react-native-safe-area-context expo-secure-store
npm install @react-navigation/native @react-navigation/bottom-tabs axios
```

### `frontend/.env.example` (copy to `.env`)
```
# Use your laptop's LAN IP (ipconfig / ifconfig), NOT localhost, for a real phone
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000/api
# Android emulator instead: http://10.0.2.2:3000/api
```
Restart `npx expo start` after changing `.env`.

### Verify
```bash
npx expo start          # scan the QR with Expo Go
npx expo-doctor         # optional: checks version mismatches
```

### Troubleshooting
- "Network Error" in the app → wrong `EXPO_PUBLIC_API_URL`, backend not running, or different Wi-Fi networks.
- Version warnings → re-run `npx expo install <package>` rather than plain `npm install` for native packages.

---

## 3. Instructions for the AI agent (Antigravity)

1. Run only the commands for **your member's zone**; `cd` into that folder first. Never run `npm install` in the other zone and never create a root `package.json`.
2. Install exactly the packages above. If you believe another package is needed, stop and ask the user instead of installing it.
3. Do not pin or upgrade versions manually in the frontend; use `npx expo install` for Expo-native packages.
4. After installing, run the **Verify** step for the zone and report the result.
5. Never hardcode `JWT_SECRET` or passwords in source; backend reads them from `backend/.env`. Frontend stores the token only via `expo-secure-store`.
6. Commit `package.json` and `package-lock.json` inside the zone only (never `node_modules`, `.env`, or `backend/data/*.db`).


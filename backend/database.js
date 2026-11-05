const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'shared_living.db');

// Ensure parent data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE NOT NULL REFERENCES members(id),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Groceries', 'Utilities', 'Entertainment', 'Cleaning', 'Other')),
      amount_paisa INTEGER NOT NULL CHECK(amount_paisa > 0),
      payer_id TEXT NOT NULL REFERENCES members(id),
      split_type TEXT NOT NULL CHECK(split_type IN ('equal', 'custom')),
      expense_date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'checkout')),
      created_by TEXT NOT NULL REFERENCES members(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('pack', 'dozen', 'bottle', 'bag')),
      requested_qty REAL NOT NULL CHECK(requested_qty > 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'bought')),
      expense_id INTEGER REFERENCES expenses(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id),
      share_paisa INTEGER NOT NULL CHECK(share_paisa >= 0)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT NOT NULL REFERENCES members(id),
      recipient_id TEXT NOT NULL REFERENCES members(id),
      amount_paisa INTEGER NOT NULL CHECK(amount_paisa > 0),
      created_by TEXT NOT NULL REFERENCES members(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK(sender_id <> recipient_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seedData() {
  const seedMembers = [
    { id: 'M01', name: 'Ali' },
    { id: 'M02', name: 'Ayesha' },
    { id: 'M03', name: 'Bilal' }
  ];

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO members (id, name) VALUES (?, ?)
  `);

  const seedUsers = [
    { username: 'ali', member_id: 'M01' },
    { username: 'ayesha', member_id: 'M02' },
    { username: 'bilal', member_id: 'M03' }
  ];

  const seedPassword = process.env.SEED_PASSWORD || 'Demo@1234';
  const passwordHash = bcrypt.hashSync(seedPassword, 10);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (member_id, username, password_hash)
    VALUES (?, ?, ?)
  `);

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const m of seedMembers) {
      insertMember.run(m.id, m.name);
    }

    for (const u of seedUsers) {
      insertUser.run(u.member_id, u.username.toLowerCase(), passwordHash);
    }

    insertSetting.run('monthly_budget_paisa', '500000');
  });

  transaction();
}

initSchema();
seedData();

module.exports = db;


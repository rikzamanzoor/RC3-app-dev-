const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/shared_living.db');

function resetDatabase() {
  try {
    const db = require('../database');
    db.exec(`
      PRAGMA foreign_keys = OFF;
      DELETE FROM expense_splits;
      DELETE FROM shopping_items;
      DELETE FROM settlements;
      DELETE FROM expenses;
      DELETE FROM users;
      DELETE FROM members;
      DELETE FROM settings;
      PRAGMA foreign_keys = ON;
    `);

    // Re-seed members, users, settings
    const bcrypt = require('bcryptjs');
    const seedMembers = [
      { id: 'M01', name: 'Ali' },
      { id: 'M02', name: 'Ayesha' },
      { id: 'M03', name: 'Bilal' }
    ];
    const insertMember = db.prepare('INSERT INTO members (id, name) VALUES (?, ?)');
    for (const m of seedMembers) {
      insertMember.run(m.id, m.name);
    }

    const seedPassword = process.env.SEED_PASSWORD || 'Demo@1234';
    const passwordHash = bcrypt.hashSync(seedPassword, 10);
    const insertUser = db.prepare('INSERT INTO users (member_id, username, password_hash) VALUES (?, ?, ?)');
    const seedUsers = [
      { username: 'ali', member_id: 'M01' },
      { username: 'ayesha', member_id: 'M02' },
      { username: 'bilal', member_id: 'M03' }
    ];
    for (const u of seedUsers) {
      insertUser.run(u.member_id, u.username.toLowerCase(), passwordHash);
    }

    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('monthly_budget_paisa', '500000');
  } catch (err) {
    console.error('Error during resetDatabase:', err);
    throw err;
  }
}

if (require.main === module) {
  resetDatabase();
  console.log('Database successfully reset and re-seeded with demo data.');
}

module.exports = resetDatabase;

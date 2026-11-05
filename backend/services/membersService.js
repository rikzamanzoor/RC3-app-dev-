const db = require('../database');

function getAllMembers() {
  return db.prepare('SELECT id, name FROM members ORDER BY id ASC').all();
}

function getMemberById(id) {
  return db.prepare('SELECT id, name FROM members WHERE id = ?').get(id);
}

module.exports = {
  getAllMembers,
  getMemberById
};


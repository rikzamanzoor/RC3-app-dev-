const db = require('../database');
const AppError = require('../utils/AppError');
const expenseService = require('./expenseService');
const { toPaisa } = require('./money');

const ALLOWED_UNITS = ['pack', 'dozen', 'bottle', 'bag'];

/**
 * Retrieves shopping items, optionally filtered by status, ordered newest first.
 * @param {'pending'|'bought'} [status] 
 * @returns {object[]}
 */
function getShoppingItems(status) {
  if (status && !['pending', 'bought'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', "status query must be 'pending' or 'bought'.", 400, 'status');
  }

  let query = 'SELECT id, title, unit, requested_qty, status FROM shopping_items';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY id DESC';

  return db.prepare(query).all(...params);
}

/**
 * Creates a new pending shopping item.
 * @param {object} itemData
 * @param {string} itemData.title
 * @param {string} itemData.unit
 * @param {number} itemData.requested_qty
 * @returns {object} Created shopping item
 */
function createShoppingItem({ title, unit, requested_qty }) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new AppError('VALIDATION_ERROR', 'Title cannot be empty.', 400, 'title');
  }

  if (!unit || !ALLOWED_UNITS.includes(unit)) {
    throw new AppError('VALIDATION_ERROR', `Unit must be one of: ${ALLOWED_UNITS.join(', ')}.`, 400, 'unit');
  }

  if (typeof requested_qty !== 'number' || !Number.isFinite(requested_qty) || requested_qty <= 0) {
    throw new AppError('VALIDATION_ERROR', 'requested_qty must be greater than zero.', 400, 'requested_qty');
  }

  const trimmedTitle = title.trim();

  const stmt = db.prepare(`
    INSERT INTO shopping_items (title, unit, requested_qty, status)
    VALUES (?, ?, ?, 'pending')
  `);

  const info = stmt.run(trimmedTitle, unit, requested_qty);

  return {
    id: Number(info.lastInsertRowid),
    title: trimmedTitle,
    unit,
    requested_qty,
    status: 'pending'
  };
}

/**
 * Performs atomic checkout of selected shopping items.
 * Marks items as 'bought', links them to an equal-split Groceries expense.
 *
 * @param {object} checkoutData
 * @param {number[]} checkoutData.item_ids
 * @param {number} checkoutData.total_paid
 * @param {string} checkoutData.payer_id
 * @param {string[]} checkoutData.split_members
 * @param {string} checkoutData.created_by
 * @returns {object} { expense, items }
 */
function checkout({ item_ids, total_paid, payer_id, split_members, created_by }) {
  if (!Array.isArray(item_ids) || item_ids.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'item_ids must be a non-empty array.', 400, 'item_ids');
  }

  if (!Array.isArray(split_members) || split_members.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'split_members must be a non-empty array.', 400, 'split_members');
  }

  // Validate positive total_paid
  toPaisa(total_paid, 'total_paid');

  // Verify all item_ids exist and are not already bought
  const placeholders = item_ids.map(() => '?').join(',');
  const items = db.prepare(`
    SELECT id, title, status FROM shopping_items WHERE id IN (${placeholders})
  `).all(...item_ids);

  if (items.length !== item_ids.length) {
    throw new AppError('NOT_FOUND', 'One or more shopping items not found.', 404, 'item_ids');
  }

  for (const item of items) {
    if (item.status === 'bought') {
      throw new AppError('ALREADY_BOUGHT', `Item "${item.title}" (ID: ${item.id}) is already bought.`, 409, 'item_ids');
    }
  }

  // Preserve the order of items as in item_ids
  const itemMap = new Map(items.map(i => [i.id, i]));
  const orderedItems = item_ids.map(id => itemMap.get(id));
  const expenseTitle = `Grocery: ${orderedItems.map(i => i.title).join(', ')}`;

  const updateItemStmt = db.prepare(`
    UPDATE shopping_items
    SET status = 'bought', expense_id = ?
    WHERE id = ?
  `);

  let expenseResult;

  const transaction = db.transaction(() => {
    // 1. Create the equal split expense
    expenseResult = expenseService.createExpense({
      title: expenseTitle,
      category: 'Groceries',
      amount: total_paid,
      payer_id,
      split_type: 'equal',
      expense_date: expenseService.getTodayDateString(),
      splits: split_members.map(m => ({ member_id: m })),
      created_by,
      source: 'checkout'
    });

    // 2. Mark each item as bought and link expense_id
    for (const id of item_ids) {
      updateItemStmt.run(expenseResult.id, id);
    }
  });

  transaction();

  return {
    expense: expenseResult,
    items: item_ids.map(id => ({ id, status: 'bought' }))
  };
}

module.exports = {
  getShoppingItems,
  createShoppingItem,
  checkout,
  ALLOWED_UNITS
};

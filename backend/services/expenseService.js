const db = require('../database');
const AppError = require('../utils/AppError');
const { toPaisa, fromPaisa } = require('./money');
const { calculateEqualSplit, validateCustomSplit } = require('./splitEngine');

const ALLOWED_CATEGORIES = ['Groceries', 'Utilities', 'Entertainment', 'Cleaning', 'Other'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateMembersExist(memberIds) {
  const placeholders = memberIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT id FROM members WHERE id IN (${placeholders})`).all(...memberIds);
  const existingIds = new Set(rows.map(r => r.id));

  for (const id of memberIds) {
    if (!existingIds.has(id)) {
      throw new AppError('NOT_FOUND', `Member not found: ${id}.`, 404, 'member_id');
    }
  }
}

/**
 * Creates an expense with splits atomically inside a transaction.
 *
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.category
 * @param {number} params.amount
 * @param {string} params.payer_id
 * @param {'equal'|'custom'} params.split_type
 * @param {string} [params.expense_date]
 * @param {object[]} params.splits
 * @param {string} params.created_by - Member ID of the authenticated user
 * @param {'manual'|'checkout'} [params.source='manual']
 * @returns {object} Created expense object
 */
function createExpense({
  title,
  category,
  amount,
  payer_id,
  split_type,
  expense_date,
  splits,
  created_by,
  source = 'manual'
}) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new AppError('VALIDATION_ERROR', 'Title cannot be empty.', 400, 'title');
  }

  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    throw new AppError('VALIDATION_ERROR', `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`, 400, 'category');
  }

  if (!payer_id || typeof payer_id !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Payer ID is required.', 400, 'payer_id');
  }

  if (!split_type || !['equal', 'custom'].includes(split_type)) {
    throw new AppError('VALIDATION_ERROR', "split_type must be 'equal' or 'custom'.", 400, 'split_type');
  }

  let finalDate = expense_date;
  if (!finalDate) {
    finalDate = getTodayDateString();
  } else if (typeof finalDate !== 'string' || !DATE_REGEX.test(finalDate)) {
    throw new AppError('VALIDATION_ERROR', 'expense_date must be in YYYY-MM-DD format.', 400, 'expense_date');
  }

  const totalPaisa = toPaisa(amount, 'amount');

  if (!Array.isArray(splits) || splits.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one split member is required.', 400, 'splits');
  }

  // Validate payer and all split members exist
  const splitMemberIds = splits.map(s => (typeof s === 'string' ? s : s.member_id));
  validateMembersExist([payer_id, ...splitMemberIds]);

  let computedSplits;
  if (split_type === 'equal') {
    computedSplits = calculateEqualSplit(totalPaisa, splitMemberIds);
  } else {
    computedSplits = validateCustomSplit(totalPaisa, splits);
  }

  const insertExpenseStmt = db.prepare(`
    INSERT INTO expenses (title, category, amount_paisa, payer_id, split_type, expense_date, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSplitStmt = db.prepare(`
    INSERT INTO expense_splits (expense_id, member_id, share_paisa)
    VALUES (?, ?, ?)
  `);

  const trimmedTitle = title.trim();

  let expenseId;
  const transaction = db.transaction(() => {
    const info = insertExpenseStmt.run(
      trimmedTitle,
      category,
      totalPaisa,
      payer_id,
      split_type,
      finalDate,
      source,
      created_by
    );
    expenseId = Number(info.lastInsertRowid);

    for (const split of computedSplits) {
      insertSplitStmt.run(expenseId, split.member_id, split.share_paisa);
    }
  });

  transaction();

  return {
    id: expenseId,
    title: trimmedTitle,
    category,
    amount: fromPaisa(totalPaisa),
    payer_id,
    split_type,
    expense_date: finalDate,
    created_by,
    splits: computedSplits.map(s => ({
      member_id: s.member_id,
      amount: fromPaisa(s.share_paisa)
    }))
  };
}

/**
 * Retrieves all expenses newest first, with splits.
 * @returns {object[]}
 */
function getAllExpenses() {
  const expenses = db.prepare(`
    SELECT id, title, category, amount_paisa, payer_id, split_type, expense_date, created_by
    FROM expenses
    ORDER BY id DESC
  `).all();

  if (expenses.length === 0) {
    return [];
  }

  const splitsStmt = db.prepare(`
    SELECT member_id, share_paisa
    FROM expense_splits
    WHERE expense_id = ?
    ORDER BY member_id ASC
  `);

  return expenses.map(e => {
    const splits = splitsStmt.all(e.id).map(s => ({
      member_id: s.member_id,
      amount: fromPaisa(s.share_paisa)
    }));

    return {
      id: e.id,
      title: e.title,
      category: e.category,
      amount: fromPaisa(e.amount_paisa),
      payer_id: e.payer_id,
      split_type: e.split_type,
      expense_date: e.expense_date,
      created_by: e.created_by,
      splits
    };
  });
}

module.exports = {
  createExpense,
  getAllExpenses,
  getTodayDateString,
  ALLOWED_CATEGORIES
};


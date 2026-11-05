const db = require('../database');
const { fromPaisa } = require('./money');

function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculates current month household budget, spent amount, remaining amount, and status.
 *
 * @returns {object} Budget response
 */
function getBudget() {
  const currentMonth = getCurrentMonthString();

  const settingRow = db.prepare("SELECT value FROM settings WHERE key = 'monthly_budget_paisa'").get();
  const budgetPaisa = settingRow ? parseInt(settingRow.value, 10) : 500000;

  const spentRow = db.prepare(`
    SELECT COALESCE(SUM(amount_paisa), 0) AS total_spent_paisa
    FROM expenses
    WHERE expense_date LIKE ?
  `).get(`${currentMonth}%`);

  const spentPaisa = spentRow ? spentRow.total_spent_paisa : 0;
  const remainingPaisa = budgetPaisa - spentPaisa;

  const percentUsed = budgetPaisa > 0
    ? Number(((spentPaisa / budgetPaisa) * 100).toFixed(1))
    : 0;

  let status = 'on_track';
  if (percentUsed >= 100) {
    status = 'over_budget';
  } else if (percentUsed >= 80) {
    status = 'near_limit';
  }

  return {
    month: currentMonth,
    budget: fromPaisa(budgetPaisa),
    spent: fromPaisa(spentPaisa),
    remaining: fromPaisa(remainingPaisa),
    percent_used: percentUsed,
    status
  };
}

module.exports = {
  getBudget,
  getCurrentMonthString
};


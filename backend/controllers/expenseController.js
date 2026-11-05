const expenseService = require('../services/expenseService');

function getExpenses(req, res, next) {
  try {
    const expenses = expenseService.getAllExpenses();
    res.status(200).json(expenses);
  } catch (err) {
    next(err);
  }
}

function addExpense(req, res, next) {
  try {
    const { title, category, amount, payer_id, split_type, expense_date, splits } = req.body || {};
    const created_by = req.user.member_id;

    const expense = expenseService.createExpense({
      title,
      category,
      amount,
      payer_id,
      split_type,
      expense_date,
      splits,
      created_by
    });

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getExpenses,
  addExpense
};


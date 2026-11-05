const budgetService = require('../services/budgetService');

function getBudget(req, res, next) {
  try {
    const budget = budgetService.getBudget();
    res.status(200).json(budget);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBudget
};


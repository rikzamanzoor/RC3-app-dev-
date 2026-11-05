const balanceService = require('../services/balanceService');
const simplifyService = require('../services/simplifyService');

function getBalances(req, res, next) {
  try {
    const { balances, sum } = balanceService.getBalances();
    res.status(200).json({ balances, sum });
  } catch (err) {
    next(err);
  }
}

function getSimplify(req, res, next) {
  try {
    const result = simplifyService.getSimplifyTransfers();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBalances,
  getSimplify
};


const settlementService = require('../services/settlementService');

function settle(req, res, next) {
  try {
    const { sender_id, recipient_id, amount } = req.body || {};
    const caller_member_id = req.user ? req.user.member_id : null;

    const result = settlementService.createSettlement({
      sender_id,
      recipient_id,
      amount,
      caller_member_id
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  settle
};


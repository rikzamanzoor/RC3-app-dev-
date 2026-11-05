const shoppingService = require('../services/shoppingService');

function getItems(req, res, next) {
  try {
    const { status } = req.query;
    const items = shoppingService.getShoppingItems(status);
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

function addItem(req, res, next) {
  try {
    const { title, unit, requested_qty } = req.body || {};
    const item = shoppingService.createShoppingItem({ title, unit, requested_qty });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

function checkout(req, res, next) {
  try {
    const { item_ids, total_paid, payer_id, split_members } = req.body || {};
    const created_by = req.user.member_id;

    const result = shoppingService.checkout({
      item_ids,
      total_paid,
      payer_id,
      split_members,
      created_by
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getItems,
  addItem,
  checkout
};

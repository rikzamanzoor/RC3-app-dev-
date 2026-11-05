const db = require('../database');
const AppError = require('../utils/AppError');
const { toPaisa, fromPaisa } = require('./money');
const { getBalances } = require('./balanceService');

/**
 * Creates and records a debt settlement between two members.
 * Strictly adheres to the 5-stage validation order.
 *
 * @param {object} params
 * @param {string} params.sender_id
 * @param {string} params.recipient_id
 * @param {number} params.amount
 * @param {string} params.caller_member_id - Authenticated user's member_id from JWT
 * @returns {object} { settlement: object }
 */
function createSettlement({ sender_id, recipient_id, amount, caller_member_id }) {
  // 1. Amount > 0 check
  const amountPaisa = toPaisa(amount, 'amount');

  // 2. Sender != Recipient check
  if (!sender_id || !recipient_id || sender_id === recipient_id) {
    throw new AppError('SELF_PAYMENT', 'Sender and recipient cannot be the same member.', 400, 'recipient_id');
  }

  // 3. Members exist check
  const sender = db.prepare('SELECT id, name FROM members WHERE id = ?').get(sender_id);
  const recipient = db.prepare('SELECT id, name FROM members WHERE id = ?').get(recipient_id);
  if (!sender || !recipient) {
    throw new AppError('NOT_FOUND', 'Sender or recipient member not found.', 404);
  }

  // 4. Caller is party to the settlement (AUTH-10)
  const isAuthRequired = process.env.AUTH_REQUIRED !== 'false';
  if (isAuthRequired && caller_member_id) {
    if (caller_member_id !== sender_id && caller_member_id !== recipient_id) {
      throw new AppError('FORBIDDEN', 'Only the people involved can record this payment.', 403);
    }
  }

  // 5 & 6. Sender is debtor, recipient is creditor, amount <= min(debt, credit)
  const { rawPaisa } = getBalances();
  const senderData = rawPaisa.get(sender_id);
  const recipientData = rawPaisa.get(recipient_id);

  const senderNetPaisa = senderData ? senderData.net_paisa : 0;
  const recipientNetPaisa = recipientData ? recipientData.net_paisa : 0;

  if (senderNetPaisa >= 0) {
    throw new AppError('OVER_SETTLEMENT', `${sender.name} does not owe any money.`, 400, 'amount');
  }

  if (recipientNetPaisa <= 0) {
    throw new AppError('OVER_SETTLEMENT', `${recipient.name} is not owed any money.`, 400, 'amount');
  }

  const senderDebtPaisa = Math.abs(senderNetPaisa);
  const recipientCreditPaisa = recipientNetPaisa;
  const maxAllowablePaisa = Math.min(senderDebtPaisa, recipientCreditPaisa);

  if (amountPaisa > maxAllowablePaisa) {
    throw new AppError(
      'OVER_SETTLEMENT',
      `Amount exceeds allowable settlement (${fromPaisa(maxAllowablePaisa)}).`,
      400,
      'amount'
    );
  }

  // Record settlement
  const stmt = db.prepare(`
    INSERT INTO settlements (sender_id, recipient_id, amount_paisa, created_by)
    VALUES (?, ?, ?, ?)
  `);

  const createdBy = caller_member_id || sender_id;
  const info = stmt.run(sender_id, recipient_id, amountPaisa, createdBy);
  const settlementId = Number(info.lastInsertRowid);

  const row = db.prepare(`
    SELECT id, sender_id, recipient_id, amount_paisa, created_by, created_at
    FROM settlements
    WHERE id = ?
  `).get(settlementId);

  // Re-verify invariant after settlement write
  getBalances();

  return {
    settlement: {
      id: row.id,
      sender_id: row.sender_id,
      recipient_id: row.recipient_id,
      amount: fromPaisa(row.amount_paisa),
      created_by: row.created_by,
      created_at: row.created_at
    }
  };
}

module.exports = {
  createSettlement
};


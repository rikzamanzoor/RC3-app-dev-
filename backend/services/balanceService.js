const db = require('../database');
const AppError = require('../utils/AppError');
const { fromPaisa } = require('./money');

/**
 * Calculates current member balances in integer paisa, asserts zero-sum invariant,
 * and formats values to PKR 2-decimal numbers.
 *
 * @returns {{ balances: object[], sum: number, rawPaisa: Map<string, { net_paisa: number, name: string }> }}
 */
function getBalances() {
  const members = db.prepare('SELECT id, name FROM members ORDER BY id ASC').all();

  const paidRows = db.prepare(`
    SELECT payer_id, COALESCE(SUM(amount_paisa), 0) AS total_paid
    FROM expenses
    GROUP BY payer_id
  `).all();
  const paidMap = new Map(paidRows.map(r => [r.payer_id, r.total_paid]));

  const owedRows = db.prepare(`
    SELECT member_id, COALESCE(SUM(share_paisa), 0) AS total_owed
    FROM expense_splits
    GROUP BY member_id
  `).all();
  const owedMap = new Map(owedRows.map(r => [r.member_id, r.total_owed]));

  const receivedRows = db.prepare(`
    SELECT recipient_id, COALESCE(SUM(amount_paisa), 0) AS total_received
    FROM settlements
    GROUP BY recipient_id
  `).all();
  const receivedMap = new Map(receivedRows.map(r => [r.recipient_id, r.total_received]));

  const sentRows = db.prepare(`
    SELECT sender_id, COALESCE(SUM(amount_paisa), 0) AS total_sent
    FROM settlements
    GROUP BY sender_id
  `).all();
  const sentMap = new Map(sentRows.map(r => [r.sender_id, r.total_sent]));

  let sumNetPaisa = 0;
  const balances = [];
  const rawPaisa = new Map();

  for (const m of members) {
    const paidPaisa = paidMap.get(m.id) || 0;
    const owedPaisa = owedMap.get(m.id) || 0;
    const receivedPaisa = receivedMap.get(m.id) || 0;
    const sentPaisa = sentMap.get(m.id) || 0;

    // Sending a settlement pays down debt (+); receiving a settlement satisfies credit (-)
    const netPaisa = paidPaisa - owedPaisa + sentPaisa - receivedPaisa;
    sumNetPaisa += netPaisa;

    rawPaisa.set(m.id, {
      net_paisa: netPaisa,
      name: m.name
    });

    balances.push({
      member_id: m.id,
      name: m.name,
      paid: fromPaisa(paidPaisa),
      share_owed: fromPaisa(owedPaisa),
      settlements_received: fromPaisa(receivedPaisa),
      settlements_sent: fromPaisa(sentPaisa),
      net: fromPaisa(netPaisa)
    });
  }

  // Hard Invariant: Sum of net balances must equal 0 paisa
  if (sumNetPaisa !== 0) {
    console.error(`[INVARIANT VIOLATION] Sum of net balances is non-zero: ${sumNetPaisa} paisa`);
    throw new AppError('INTERNAL_ERROR', 'Balance invariant violation: sum of net balances is non-zero.', 500);
  }

  return {
    balances,
    sum: fromPaisa(sumNetPaisa),
    rawPaisa
  };
}

module.exports = {
  getBalances
};

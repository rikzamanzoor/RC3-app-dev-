const { getBalances } = require('./balanceService');
const { fromPaisa } = require('./money');

/**
 * Computes minimal greedy debt transfers among members.
 *
 * @returns {{ transfers: object[], count: number }}
 */
function getSimplifyTransfers() {
  const { rawPaisa } = getBalances();

  const debtors = [];
  const creditors = [];

  for (const [id, data] of rawPaisa.entries()) {
    if (data.net_paisa < 0) {
      debtors.push({
        id,
        name: data.name,
        amount_paisa: Math.abs(data.net_paisa)
      });
    } else if (data.net_paisa > 0) {
      creditors.push({
        id,
        name: data.name,
        amount_paisa: data.net_paisa
      });
    }
  }

  const sortDesc = (a, b) => {
    if (b.amount_paisa !== a.amount_paisa) {
      return b.amount_paisa - a.amount_paisa;
    }
    return a.id.localeCompare(b.id);
  };

  const transfers = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(sortDesc);
    creditors.sort(sortDesc);

    const largestDebtor = debtors[0];
    const largestCreditor = creditors[0];

    const transferPaisa = Math.min(largestDebtor.amount_paisa, largestCreditor.amount_paisa);

    transfers.push({
      from_id: largestDebtor.id,
      from_name: largestDebtor.name,
      to_id: largestCreditor.id,
      to_name: largestCreditor.name,
      amount: fromPaisa(transferPaisa)
    });

    largestDebtor.amount_paisa -= transferPaisa;
    largestCreditor.amount_paisa -= transferPaisa;

    if (largestDebtor.amount_paisa === 0) {
      debtors.shift();
    }
    if (largestCreditor.amount_paisa === 0) {
      creditors.shift();
    }
  }

  return {
    transfers,
    count: transfers.length
  };
}

module.exports = {
  getSimplifyTransfers
};


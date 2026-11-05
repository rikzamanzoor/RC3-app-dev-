const AppError = require('../utils/AppError');
const { toPaisa, fromPaisa } = require('./money');

/**
 * Computes equal split in integer paisa among provided member IDs.
 * Remainder paisas are allocated to members in ascending member ID order.
 *
 * @param {number} totalPaisa - Total expense amount in integer paisa
 * @param {string[]} memberIds - Array of member IDs
 * @returns {{ member_id: string, share_paisa: number, amount: number }[]}
 */
function calculateEqualSplit(totalPaisa, memberIds) {
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one split member is required.', 400, 'splits');
  }

  // Deduplicate and sort ascending by member ID
  const uniqueSortedIds = Array.from(new Set(memberIds)).sort();
  const n = uniqueSortedIds.length;

  const base = Math.floor(totalPaisa / n);
  const rem = totalPaisa % n;

  return uniqueSortedIds.map((id, index) => {
    const sharePaisa = base + (index < rem ? 1 : 0);
    return {
      member_id: id,
      share_paisa: sharePaisa,
      amount: fromPaisa(sharePaisa)
    };
  });
}

/**
 * Validates and normalizes custom splits against total expense amount.
 *
 * @param {number} totalPaisa - Total expense amount in integer paisa
 * @param {{ member_id: string, amount: number }[]} splits - Array of split objects
 * @returns {{ member_id: string, share_paisa: number, amount: number }[]}
 */
function validateCustomSplit(totalPaisa, splits) {
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new AppError('VALIDATION_ERROR', 'At least one split member is required.', 400, 'splits');
  }

  const seen = new Set();
  let sumPaisa = 0;
  const result = [];

  for (const item of splits) {
    if (!item.member_id || typeof item.member_id !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'Each split must specify a valid member_id.', 400, 'splits');
    }
    if (seen.has(item.member_id)) {
      throw new AppError('VALIDATION_ERROR', `Duplicate member in splits: ${item.member_id}.`, 400, 'splits');
    }
    seen.add(item.member_id);

    // Amounts in custom split can be 0 or positive
    const sharePaisa = toPaisa(item.amount, `splits.${item.member_id}.amount`, true);
    sumPaisa += sharePaisa;

    result.push({
      member_id: item.member_id,
      share_paisa: sharePaisa,
      amount: fromPaisa(sharePaisa)
    });
  }

  if (sumPaisa !== totalPaisa) {
    throw new AppError(
      'SPLIT_MISMATCH',
      `Custom splits sum (${fromPaisa(sumPaisa)}) does not equal total amount (${fromPaisa(totalPaisa)}).`,
      400,
      'splits'
    );
  }

  return result;
}

module.exports = {
  calculateEqualSplit,
  validateCustomSplit
};


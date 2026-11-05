const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateEqualSplit, validateCustomSplit } = require('../backend/services/splitEngine');
const { toPaisa } = require('../backend/services/money');

describe('Split Engine Unit Tests (FIN-01, FIN-02, FIN-03)', () => {
  it('FIN-02: 1,000.00 split equally over M01, M02, M03 -> 333.34 / 333.33 / 333.33', () => {
    const totalPaisa = toPaisa(1000); // 100000 paisa
    const splits = calculateEqualSplit(totalPaisa, ['M03', 'M01', 'M02']);

    assert.equal(splits.length, 3);
    assert.deepEqual(splits, [
      { member_id: 'M01', share_paisa: 33334, amount: 333.34 },
      { member_id: 'M02', share_paisa: 33333, amount: 333.33 },
      { member_id: 'M03', share_paisa: 33333, amount: 333.33 }
    ]);

    const totalCalculated = splits.reduce((sum, s) => sum + s.share_paisa, 0);
    assert.equal(totalCalculated, totalPaisa);
  });

  it('FIN-01: Remainder > 1 paisa (10.04 over 3 members -> 3.35, 3.35, 3.34)', () => {
    const totalPaisa = toPaisa(10.04); // 1004 paisa: base 334, rem 2
    const splits = calculateEqualSplit(totalPaisa, ['M01', 'M02', 'M03']);

    assert.deepEqual(splits, [
      { member_id: 'M01', share_paisa: 335, amount: 3.35 },
      { member_id: 'M02', share_paisa: 335, amount: 3.35 },
      { member_id: 'M03', share_paisa: 334, amount: 3.34 }
    ]);
  });

  it('FIN-03: Custom split succeeds when exact match', () => {
    const totalPaisa = toPaisa(1500);
    const customInput = [
      { member_id: 'M01', amount: 500 },
      { member_id: 'M02', amount: 300 },
      { member_id: 'M03', amount: 700 }
    ];

    const splits = validateCustomSplit(totalPaisa, customInput);
    assert.equal(splits.length, 3);
    assert.deepEqual(splits, [
      { member_id: 'M01', share_paisa: 50000, amount: 500.00 },
      { member_id: 'M02', share_paisa: 30000, amount: 300.00 },
      { member_id: 'M03', share_paisa: 70000, amount: 700.00 }
    ]);
  });

  it('FIN-03: Custom split throws SPLIT_MISMATCH when sum does not equal total', () => {
    const totalPaisa = toPaisa(1500);
    const customInput = [
      { member_id: 'M01', amount: 500 },
      { member_id: 'M02', amount: 300 },
      { member_id: 'M03', amount: 699.99 } // 1 paisa short
    ];

    assert.throws(() => {
      validateCustomSplit(totalPaisa, customInput);
    }, (err) => {
      return err.code === 'SPLIT_MISMATCH' && err.statusCode === 400;
    });
  });

  it('Rejects invalid decimal places (> 2 decimals)', () => {
    assert.throws(() => {
      toPaisa(12.345);
    }, (err) => {
      return err.code === 'VALIDATION_ERROR' && err.statusCode === 400;
    });
  });

  it('Rejects non-positive amounts', () => {
    assert.throws(() => {
      toPaisa(0);
    }, (err) => {
      return err.code === 'NON_POSITIVE_AMOUNT';
    });

    assert.throws(() => {
      toPaisa(-50);
    }, (err) => {
      return err.code === 'NON_POSITIVE_AMOUNT';
    });
  });
});


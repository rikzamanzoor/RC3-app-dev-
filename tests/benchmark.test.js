const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../backend/server');
const resetDatabase = require('../backend/utils/resetDb');

/**
 * Full Acceptance Benchmark — ARCHITECTURE.md §8
 * Covers all 12 steps from the official acceptance test scenario.
 * Run from a clean ledger via resetDatabase() before each suite.
 */
describe('Full Acceptance Benchmark (§8) — All 12 Steps', () => {
  let server;
  let baseUrl;
  let aliToken;
  let ayeshaToken;
  let bilalToken;

  before((t, done) => {
    resetDatabase();

    server = app.listen(0, async () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;

      try {
        const login = async (username) => {
          const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: 'Demo@1234' })
          });
          const data = await res.json();
          return data.token;
        };

        aliToken    = await login('ali');
        ayeshaToken = await login('ayesha');
        bilalToken  = await login('bilal');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  after((t, done) => {
    if (server) server.close(done);
    else done();
  });

  // ─────────────────────────────────────────────
  // Step 0a — Successful login
  // ─────────────────────────────────────────────
  it('Step 0a: POST /auth/login succeeds, returns token and correct user (M02 Ayesha)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ayesha', password: 'Demo@1234' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token, 'Should return a token');
    assert.equal(typeof body.expires_in, 'number');
    assert.equal(body.user.username, 'ayesha');
    assert.equal(body.user.member_id, 'M02');
  });

  // ─────────────────────────────────────────────
  // Step 0b — Wrong password / unknown user → same 401
  // ─────────────────────────────────────────────
  it('Step 0b: Wrong password returns 401 INVALID_CREDENTIALS', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ayesha', password: 'WrongPass' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(body.error.message, 'Invalid username or password.');
  });

  it('Step 0b: Unknown user returns identical 401 INVALID_CREDENTIALS message', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nobody', password: 'AnyPass' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(body.error.message, 'Invalid username or password.');
  });

  // ─────────────────────────────────────────────
  // Step 0c — No token → 401
  // ─────────────────────────────────────────────
  it('Step 0c: GET /balances without token returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/balances`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('Step 0c: Garbage token returns 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: 'Bearer this.is.garbage' }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  // ─────────────────────────────────────────────
  // Step 1 — Grocery 780 by M01, equal ×3
  // ─────────────────────────────────────────────
  it('Step 1: Grocery 780, M01 pays, equal split ×3 → 260/260/260', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({
        title: 'Grocery',
        category: 'Groceries',
        amount: 780,
        payer_id: 'M01',
        split_type: 'equal',
        splits: [{ member_id: 'M01' }, { member_id: 'M02' }, { member_id: 'M03' }]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.amount, 780.00);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 260.00 },
      { member_id: 'M02', amount: 260.00 },
      { member_id: 'M03', amount: 260.00 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 2 — Cleaning 900 by M02, equal M01+M02
  // ─────────────────────────────────────────────
  it('Step 2: Cleaning 900, M02 pays, equal split M01+M02 → 450/450', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({
        title: 'Cleaning',
        category: 'Cleaning',
        amount: 900,
        payer_id: 'M02',
        split_type: 'equal',
        splits: [{ member_id: 'M01' }, { member_id: 'M02' }]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.amount, 900.00);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 450.00 },
      { member_id: 'M02', amount: 450.00 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 3 — Internet 1500 by M03, custom 500/300/700
  // ─────────────────────────────────────────────
  it('Step 3: Internet 1500, M03 pays, custom 500/300/700', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bilalToken}` },
      body: JSON.stringify({
        title: 'Internet',
        category: 'Utilities',
        amount: 1500,
        payer_id: 'M03',
        split_type: 'custom',
        splits: [
          { member_id: 'M01', amount: 500 },
          { member_id: 'M02', amount: 300 },
          { member_id: 'M03', amount: 700 }
        ]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.amount, 1500.00);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 500.00 },
      { member_id: 'M02', amount: 300.00 },
      { member_id: 'M03', amount: 700.00 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 4 — Electricity 1020 by M01, equal ×3
  // ─────────────────────────────────────────────
  it('Step 4: Electricity 1020, M01 pays, equal ×3 → 340/340/340', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({
        title: 'Electricity',
        category: 'Utilities',
        amount: 1020,
        payer_id: 'M01',
        split_type: 'equal',
        splits: [{ member_id: 'M01' }, { member_id: 'M02' }, { member_id: 'M03' }]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.amount, 1020.00);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 340.00 },
      { member_id: 'M02', amount: 340.00 },
      { member_id: 'M03', amount: 340.00 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 5 — GET /balances
  // ─────────────────────────────────────────────
  it('Step 5: GET /balances → Ali +250 / Ayesha -450 / Bilal +200 / sum 0.00', async () => {
    const res = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.sum, 0.00);

    const ali    = body.balances.find(b => b.member_id === 'M01');
    const ayesha = body.balances.find(b => b.member_id === 'M02');
    const bilal  = body.balances.find(b => b.member_id === 'M03');

    assert.equal(ali.paid,       1800.00);
    assert.equal(ali.share_owed, 1550.00);
    assert.equal(ali.net,         250.00);

    assert.equal(ayesha.paid,       900.00);
    assert.equal(ayesha.share_owed, 1350.00);
    assert.equal(ayesha.net,        -450.00);

    assert.equal(bilal.paid,       1500.00);
    assert.equal(bilal.share_owed, 1300.00);
    assert.equal(bilal.net,         200.00);
  });

  // ─────────────────────────────────────────────
  // Step 6 — GET /budget
  // ─────────────────────────────────────────────
  it('Step 6: GET /budget → spent 4200, remaining 800, 84.0% near_limit', async () => {
    const res = await fetch(`${baseUrl}/budget`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.budget,       5000.00);
    assert.equal(body.spent,        4200.00);
    assert.equal(body.remaining,     800.00);
    assert.equal(body.percent_used,   84.0);
    assert.equal(body.status,       'near_limit');
  });

  // ─────────────────────────────────────────────
  // Step 7 — GET /balances/simplify
  // ─────────────────────────────────────────────
  it('Step 7: GET /balances/simplify → M02→M01 250.00, M02→M03 200.00 (count 2)', async () => {
    const res = await fetch(`${baseUrl}/balances/simplify`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 2);
    assert.deepEqual(body.transfers, [
      { from_id: 'M02', from_name: 'Ayesha', to_id: 'M01', to_name: 'Ali',   amount: 250.00 },
      { from_id: 'M02', from_name: 'Ayesha', to_id: 'M03', to_name: 'Bilal', amount: 200.00 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 8 — Non-party settlement → 403 FORBIDDEN
  // ─────────────────────────────────────────────
  it('Step 8: Bilal (non-party) tries to settle M02→M01 → 403 FORBIDDEN', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bilalToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 250.00 })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  // ─────────────────────────────────────────────
  // Step 9 — Ayesha settles M02→M01 250 and M02→M03 200
  // ─────────────────────────────────────────────
  it('Step 9a: Ayesha settles M02→M01 250 → 201 with settlement receipt', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 250.00 })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.settlement.id);
    assert.equal(body.settlement.sender_id,    'M02');
    assert.equal(body.settlement.recipient_id, 'M01');
    assert.equal(body.settlement.amount,        250.00);
    assert.equal(body.settlement.created_by,   'M02');
  });

  it('Step 9b: Ayesha settles M02→M03 200 → 201 with settlement receipt', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M03', amount: 200.00 })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.settlement.amount, 200.00);
  });

  it('Step 9c: After settlements — all nets = 0.00, sum = 0.00', async () => {
    const res = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.sum, 0.00);
    for (const b of body.balances) {
      assert.equal(b.net, 0.00, `${b.name} net should be 0.00, got ${b.net}`);
    }
  });

  it('Step 9d: After settlements — spending stays at 4200.00', async () => {
    const res = await fetch(`${baseUrl}/budget`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.spent, 4200.00, 'Settlements must not change household spending');
  });

  // ─────────────────────────────────────────────
  // Step 10 — 1000 equal split ×3 → 333.34/333.33/333.33
  // ─────────────────────────────────────────────
  it('Step 10: 1000.00 equal split ×3 → 333.34 / 333.33 / 333.33', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({
        title: 'Test Split',
        category: 'Other',
        amount: 1000,
        payer_id: 'M01',
        split_type: 'equal',
        splits: [{ member_id: 'M01' }, { member_id: 'M02' }, { member_id: 'M03' }]
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.amount, 1000.00);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 333.34 },
      { member_id: 'M02', amount: 333.33 },
      { member_id: 'M03', amount: 333.33 }
    ]);
  });

  // ─────────────────────────────────────────────
  // Step 11 — Validation error rejections
  // ─────────────────────────────────────────────
  it('Step 11a: Settle amount = 0 → 400 NON_POSITIVE_AMOUNT', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 0 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'NON_POSITIVE_AMOUNT');
  });

  it('Step 11b: Settle amount = -5 → 400 NON_POSITIVE_AMOUNT', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: -5 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'NON_POSITIVE_AMOUNT');
  });

  it('Step 11c: Self-payment M01→M01 → 400 SELF_PAYMENT', async () => {
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({ sender_id: 'M01', recipient_id: 'M01', amount: 100 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'SELF_PAYMENT');
  });

  it('Step 11d: Over-settlement M02→M01 9999 → 400 OVER_SETTLEMENT', async () => {
    // After step 10, Ayesha (M02) is now a debtor again
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 9999 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'OVER_SETTLEMENT');
  });

  // ─────────────────────────────────────────────
  // Step 12 — Data persistence across server restart
  // ─────────────────────────────────────────────
  it('Step 12: Expense data survives a fresh DB connection (simulates restart)', async () => {
    // Reconnect to same DB file (simulate restart by re-requiring db)
    delete require.cache[require.resolve('../backend/database')];
    const freshDb = require('../backend/database');

    const expenses = freshDb.prepare('SELECT COUNT(*) AS cnt FROM expenses').get();
    // We've logged: Grocery, Cleaning, Internet, Electricity, Test Split = 5 expenses
    assert.ok(expenses.cnt >= 5, `Expected ≥ 5 expenses after restart, got ${expenses.cnt}`);

    const settlements = freshDb.prepare('SELECT COUNT(*) AS cnt FROM settlements').get();
    assert.equal(settlements.cnt, 2, 'Should have 2 settlements (Ayesha→Ali, Ayesha→Bilal)');
  });
});

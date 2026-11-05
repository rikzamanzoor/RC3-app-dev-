const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../backend/server');
const resetDatabase = require('../backend/utils/resetDb');

describe('Balances, Budget, Settle & Simplify Tests (Phase 3)', () => {
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

        aliToken = await login('ali');
        ayeshaToken = await login('ayesha');
        bilalToken = await login('bilal');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  after((t, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('GET /api/balances on empty ledger has 0.00 nets and sum 0.00', async () => {
    const res = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.sum, 0.00);
    assert.equal(body.balances.length, 3);
    for (const b of body.balances) {
      assert.equal(b.net, 0.00);
    }
  });

  it('Log benchmark expenses: Grocery 780, Cleaning 900, Internet 1500, Electricity 1020', async () => {
    // 1. Grocery 780 by M01, equal x3
    await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({
        title: 'Grocery', category: 'Groceries', amount: 780, payer_id: 'M01',
        split_type: 'equal', splits: [{ member_id: 'M01' }, { member_id: 'M02' }, { member_id: 'M03' }]
      })
    });

    // 2. Cleaning 900 by M02, equal M01+M02
    await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({
        title: 'Cleaning', category: 'Cleaning', amount: 900, payer_id: 'M02',
        split_type: 'equal', splits: [{ member_id: 'M01' }, { member_id: 'M02' }]
      })
    });

    // 3. Internet 1500 by M03, custom 500 / 300 / 700
    await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bilalToken}` },
      body: JSON.stringify({
        title: 'Internet', category: 'Utilities', amount: 1500, payer_id: 'M03',
        split_type: 'custom',
        splits: [
          { member_id: 'M01', amount: 500 },
          { member_id: 'M02', amount: 300 },
          { member_id: 'M03', amount: 700 }
        ]
      })
    });

    // 4. Electricity 1020 by M01, equal x3
    await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({
        title: 'Electricity', category: 'Utilities', amount: 1020, payer_id: 'M01',
        split_type: 'equal', splits: [{ member_id: 'M01' }, { member_id: 'M02' }, { member_id: 'M03' }]
      })
    });
  });

  it('GET /api/balances matches benchmark: +250.00 / -450.00 / +200.00', async () => {
    const res = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.sum, 0.00);

    const m1 = body.balances.find(b => b.member_id === 'M01');
    const m2 = body.balances.find(b => b.member_id === 'M02');
    const m3 = body.balances.find(b => b.member_id === 'M03');

    assert.equal(m1.paid, 1800.00);
    assert.equal(m1.share_owed, 1550.00);
    assert.equal(m1.net, 250.00);

    assert.equal(m2.paid, 900.00);
    assert.equal(m2.share_owed, 1350.00);
    assert.equal(m2.net, -450.00);

    assert.equal(m3.paid, 1500.00);
    assert.equal(m3.share_owed, 1300.00);
    assert.equal(m3.net, 200.00);
  });

  it('GET /api/budget returns spent 4200, remaining 800, 84% near_limit', async () => {
    const res = await fetch(`${baseUrl}/budget`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.budget, 5000.00);
    assert.equal(body.spent, 4200.00);
    assert.equal(body.remaining, 800.00);
    assert.equal(body.percent_used, 84.0);
    assert.equal(body.status, 'near_limit');
  });

  it('GET /api/balances/simplify returns minimal 2 transfers', async () => {
    const res = await fetch(`${baseUrl}/balances/simplify`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 2);
    assert.deepEqual(body.transfers, [
      { from_id: 'M02', from_name: 'Ayesha', to_id: 'M01', to_name: 'Ali', amount: 250.00 },
      { from_id: 'M02', from_name: 'Ayesha', to_id: 'M03', to_name: 'Bilal', amount: 200.00 }
    ]);
  });

  it('POST /api/settle fails when non-party attempts settlement (AUTH-10 -> 403 FORBIDDEN)', async () => {
    // Bilal (M03) trying to settle payment between Ayesha (M02) and Ali (M01)
    const res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bilalToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 250.00 })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  it('POST /api/settle rejects invalid settlement attempts', async () => {
    // 1. Self payment
    let res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliToken}` },
      body: JSON.stringify({ sender_id: 'M01', recipient_id: 'M01', amount: 100 })
    });
    assert.equal(res.status, 400);
    let body = await res.json();
    assert.equal(body.error.code, 'SELF_PAYMENT');

    // 2. Non-positive amount
    res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 0 })
    });
    assert.equal(res.status, 400);
    body = await res.json();
    assert.equal(body.error.code, 'NON_POSITIVE_AMOUNT');

    // 3. Over settlement (exceeds debt/credit)
    res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 9999 })
    });
    assert.equal(res.status, 400);
    body = await res.json();
    assert.equal(body.error.code, 'OVER_SETTLEMENT');
  });

  it('Execute both settlements: balances become 0.00, simplify returns 0', async () => {
    // Settlement 1: Ayesha pays Ali 250
    let res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M01', amount: 250.00 })
    });
    assert.equal(res.status, 201);
    let body = await res.json();
    assert.ok(body.settlement);
    assert.equal(body.settlement.amount, 250.00);
    assert.equal(body.settlement.sender_id, 'M02');
    assert.equal(body.settlement.recipient_id, 'M01');

    // Settlement 2: Ayesha pays Bilal 200
    res = await fetch(`${baseUrl}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayeshaToken}` },
      body: JSON.stringify({ sender_id: 'M02', recipient_id: 'M03', amount: 200.00 })
    });
    assert.equal(res.status, 201);
    body = await res.json();
    assert.equal(body.settlement.amount, 200.00);

    // Verify all balances are now 0.00
    const balRes = await fetch(`${baseUrl}/balances`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    const balData = await balRes.json();
    assert.equal(balData.sum, 0.00);
    for (const b of balData.balances) {
      assert.equal(b.net, 0.00);
    }

    // Verify simplify is now empty
    const simRes = await fetch(`${baseUrl}/balances/simplify`, {
      headers: { Authorization: `Bearer ${aliToken}` }
    });
    const simData = await simRes.json();
    assert.equal(simData.count, 0);
    assert.deepEqual(simData.transfers, []);
  });
});


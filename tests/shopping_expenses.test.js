const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../backend/server');

describe('Shopping & Expenses API Tests (Phase 2)', () => {
  let server;
  let baseUrl;
  let authToken;

  before((t, done) => {
    server = app.listen(0, async () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;

      try {
        // Login as Ali (M01)
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'ali', password: 'Demo@1234' })
        });
        const loginData = await loginRes.json();
        authToken = loginData.token;
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

  let milkItemId;
  let riceItemId;

  it('POST /api/shopping creates pending item', async () => {
    const res = await fetch(`${baseUrl}/shopping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ title: 'Milk', unit: 'bottle', requested_qty: 2 })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.title, 'Milk');
    assert.equal(body.unit, 'bottle');
    assert.equal(body.requested_qty, 2);
    assert.equal(body.status, 'pending');

    milkItemId = body.id;
  });

  it('POST /api/shopping creates second item', async () => {
    const res = await fetch(`${baseUrl}/shopping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ title: 'Rice', unit: 'bag', requested_qty: 1 })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.title, 'Rice');
    assert.equal(body.status, 'pending');

    riceItemId = body.id;
  });

  it('GET /api/shopping lists items with status filter', async () => {
    const res = await fetch(`${baseUrl}/shopping?status=pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const items = await res.json();
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 2);
    assert.equal(items[0].id, riceItemId); // newest first
    assert.equal(items[1].id, milkItemId);
  });

  it('POST /api/expenses creates equal-split expense', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Cleaning Supplies',
        category: 'Cleaning',
        amount: 900,
        payer_id: 'M02',
        split_type: 'equal',
        expense_date: '2026-11-05',
        splits: [{ member_id: 'M01' }, { member_id: 'M02' }]
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.title, 'Cleaning Supplies');
    assert.equal(body.category, 'Cleaning');
    assert.equal(body.amount, 900);
    assert.equal(body.payer_id, 'M02');
    assert.equal(body.split_type, 'equal');
    assert.equal(body.created_by, 'M01'); // Token user Ali
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 450.00 },
      { member_id: 'M02', amount: 450.00 }
    ]);
  });

  it('POST /api/expenses creates custom-split expense', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Internet Bill',
        category: 'Utilities',
        amount: 1500,
        payer_id: 'M03',
        split_type: 'custom',
        expense_date: '2026-11-05',
        splits: [
          { member_id: 'M01', amount: 500 },
          { member_id: 'M02', amount: 300 },
          { member_id: 'M03', amount: 700 }
        ]
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.title, 'Internet Bill');
    assert.equal(body.amount, 1500);
    assert.deepEqual(body.splits, [
      { member_id: 'M01', amount: 500.00 },
      { member_id: 'M02', amount: 300.00 },
      { member_id: 'M03', amount: 700.00 }
    ]);
  });

  it('POST /api/shopping/checkout performs atomic checkout', async () => {
    const res = await fetch(`${baseUrl}/shopping/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        item_ids: [milkItemId, riceItemId],
        total_paid: 780.00,
        payer_id: 'M01',
        split_members: ['M01', 'M02', 'M03']
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.expense);
    assert.equal(body.expense.title, 'Grocery: Milk, Rice');
    assert.equal(body.expense.category, 'Groceries');
    assert.equal(body.expense.amount, 780.00);
    assert.equal(body.expense.payer_id, 'M01');
    assert.deepEqual(body.expense.splits, [
      { member_id: 'M01', amount: 260.00 },
      { member_id: 'M02', amount: 260.00 },
      { member_id: 'M03', amount: 260.00 }
    ]);
    assert.deepEqual(body.items, [
      { id: milkItemId, status: 'bought' },
      { id: riceItemId, status: 'bought' }
    ]);
  });

  it('POST /api/shopping/checkout returns 409 ALREADY_BOUGHT on re-checkout', async () => {
    const res = await fetch(`${baseUrl}/shopping/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        item_ids: [milkItemId],
        total_paid: 300.00,
        payer_id: 'M01',
        split_members: ['M01', 'M02', 'M03']
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'ALREADY_BOUGHT');
  });

  it('GET /api/expenses lists all created expenses newest first', async () => {
    const res = await fetch(`${baseUrl}/expenses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const expenses = await res.json();
    assert.ok(Array.isArray(expenses));
    assert.ok(expenses.length >= 3);
    assert.equal(expenses[0].title, 'Grocery: Milk, Rice');
    assert.equal(expenses[1].title, 'Internet Bill');
    assert.equal(expenses[2].title, 'Cleaning Supplies');
  });
});

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../backend/server');

describe('Auth & Base Infrastructure Tests (Phase 1)', () => {
  let server;
  let baseUrl;
  let authToken;

  before((t, done) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      done();
    });
  });

  after((t, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('GET /api/health should return status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { status: 'ok' });
  });

  it('POST /api/auth/login should fail on bad password with 401 INVALID_CREDENTIALS', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ayesha', password: 'WrongPassword!' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(body.error.message, 'Invalid username or password.');
  });

  it('POST /api/auth/login should fail on unknown user with identical 401 INVALID_CREDENTIALS', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'AnyPassword' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    assert.equal(body.error.message, 'Invalid username or password.');
  });

  it('POST /api/auth/login should succeed with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ayesha', password: 'Demo@1234' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.equal(typeof body.expires_in, 'number');
    assert.equal(body.user.username, 'ayesha');
    assert.equal(body.user.member_id, 'M02');
    assert.equal(body.user.name, 'Ayesha');

    authToken = body.token;
  });

  it('GET /api/auth/me should return 401 when token is missing', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('GET /api/auth/me should return user when token is valid', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.username, 'ayesha');
    assert.equal(body.member_id, 'M02');
    assert.equal(body.name, 'Ayesha');
  });

  it('GET /api/members should return the 3 members', async () => {
    const res = await fetch(`${baseUrl}/members`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 3);
    assert.deepEqual(body, [
      { id: 'M01', name: 'Ali' },
      { id: 'M02', name: 'Ayesha' },
      { id: 'M03', name: 'Bilal' }
    ]);
  });
});

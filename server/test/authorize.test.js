import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import authorize from '../middleware/authorize.js';

// authorize() is pure sync middleware — no DB, no HTTP server needed.
// A minimal fake req/res/next is enough to exercise every branch.

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

describe('authorize middleware', () => {
  test('calls next() when the user role is in the allowed list', () => {
    const req = { user: { role: 'admin' } };
    const res = makeRes();
    let nextCalled = false;

    authorize('admin')(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  test('calls next() when the role matches one of several allowed roles', () => {
    const req = { user: { role: 'employee' } };
    const res = makeRes();
    let nextCalled = false;

    authorize('admin', 'employee')(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
  });

  test('returns 403 when the role is not in the allowed list', () => {
    const req = { user: { role: 'employee' } };
    const res = makeRes();
    let nextCalled = false;

    authorize('admin')(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /admin/);
  });

  test('returns 403 when req.user is missing (unauthenticated)', () => {
    const req = {};
    const res = makeRes();
    let nextCalled = false;

    authorize('admin')(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  });

  test('returns 403 when req.user.role is undefined', () => {
    const req = { user: {} };
    const res = makeRes();

    authorize('admin', 'employee')(req, res, () => {});

    assert.equal(res.statusCode, 403);
  });

  test('the 403 message lists every allowed role', () => {
    const req = { user: { role: 'guest' } };
    const res = makeRes();

    authorize('admin', 'employee')(req, res, () => {});

    assert.equal(res.body.message, 'Access denied. Required role: admin or employee.');
  });
});

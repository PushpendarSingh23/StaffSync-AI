import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { createEmployee } from '../routes/createEmployee.js';
import { createEmployeeRules } from '../middleware/employeeValidators.js';
import validate from '../middleware/validate.js';

/**
 * POST /api/v1/employees is authenticate -> authorize('admin') ->
 * createEmployeeRules -> validate -> handler. Two layers are DB-free and
 * covered here directly against the real router:
 *   - authenticate's early-exit 401s (missing/invalid token — same guard
 *     used across every protected route, see also auth.test.js)
 *
 * authorize('admin')'s RBAC branching is unit-tested directly (no HTTP,
 * no DB) in authorize.test.js, since reaching it here would require a real
 * authenticated user (i.e. a live MongoDB for authenticate's User.findById).
 *
 * createEmployeeRules is the field-level validation createEmployee.js runs
 * before ever touching the database — tested here in isolation against a
 * stub handler so bad payloads are proven to be rejected before any write
 * would happen, without needing a DB connection.
 *
 * The full authorized-admin success path (actually inserting an Employees
 * document) needs a live database and is out of scope for this unit suite —
 * see the note in auth.test.js.
 */

let employeesServer;
let employeesBaseUrl;
let validatorsServer;
let validatorsBaseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/employees', createEmployee);
  employeesServer = http.createServer(app);
  await new Promise((resolve) => employeesServer.listen(0, resolve));
  employeesBaseUrl = `http://127.0.0.1:${employeesServer.address().port}/api/v1/employees`;

  // A second, tiny app that runs only the validation chain createEmployee.js
  // uses, backed by a stub 200 handler instead of the real DB-writing one.
  const validatorApp = express();
  validatorApp.use(express.json());
  validatorApp.post('/', createEmployeeRules, validate, (req, res) => {
    res.status(200).json({ success: true });
  });
  validatorsServer = http.createServer(validatorApp);
  await new Promise((resolve) => validatorsServer.listen(0, resolve));
  validatorsBaseUrl = `http://127.0.0.1:${validatorsServer.address().port}`;
});

after(async () => {
  await new Promise((resolve) => employeesServer.close(resolve));
  await new Promise((resolve) => validatorsServer.close(resolve));
});

describe('POST /api/v1/employees — authenticate guard', () => {
  test('returns 401 with no Authorization header', async () => {
    const res = await fetch(employeesBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  });

  test('returns 401 for an invalid JWT, before authorize/validate/DB ever run', async () => {
    const res = await fetch(employeesBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer garbage.token.here' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 401);
  });
});

describe('createEmployeeRules — field validation', () => {
  const postValidator = async (body) => {
    const res = await fetch(validatorsBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  const validPayload = {
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1-555-0100',
    job: 'Software Engineer',
    dateOfJoining: '2024-01-15',
    image: 'https://example.com/jane.png',
  };

  test('accepts a fully valid payload and reaches the handler', async () => {
    const { status, body } = await postValidator(validPayload);
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });

  test('rejects a payload missing required fields', async () => {
    const { status, body } = await postValidator({});
    assert.equal(status, 422);
    const fields = body.errors.map((e) => e.field);
    ['firstname', 'lastname', 'email', 'phone', 'job', 'dateOfJoining', 'image'].forEach((f) =>
      assert.ok(fields.includes(f), `expected ${f} to be a validation error`)
    );
  });

  test('rejects an invalid email', async () => {
    const { status, body } = await postValidator({ ...validPayload, email: 'not-an-email' });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'email'));
  });

  test('rejects a malformed phone number', async () => {
    const { status, body } = await postValidator({ ...validPayload, phone: 'call me maybe' });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'phone'));
  });

  test('rejects a non-ISO8601 dateOfJoining', async () => {
    const { status, body } = await postValidator({ ...validPayload, dateOfJoining: '15th of January' });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'dateOfJoining'));
  });

  test('rejects a non-URL image value', async () => {
    const { status, body } = await postValidator({ ...validPayload, image: 'not-a-url' });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'image'));
  });

  test('rejects a firstname over the 50-character limit', async () => {
    const { status, body } = await postValidator({ ...validPayload, firstname: 'A'.repeat(51) });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'firstname'));
  });
});

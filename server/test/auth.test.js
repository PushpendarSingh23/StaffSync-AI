import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { authRouter } from '../routes/auth.js';

/**
 * These tests cover the parts of auth.js that are reachable WITHOUT a live
 * MongoDB connection: express-validator's registerRules/loginRules (which
 * run — and can short-circuit with a 422 — before the route handler ever
 * touches the User model), and authenticate's early-exit 401 paths (missing
 * header / malformed token, which fail before the User.findById lookup).
 *
 * The success paths (actual register/login/me against a real user) need a
 * database and are intentionally out of scope here — this repo doesn't yet
 * have DB-backed test infrastructure (e.g. mongodb-memory-server). See
 * server/scripts for the manual eval/benchmark scripts that do run against
 * a real Atlas connection.
 */

let server;
let baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const postJson = async (path, body) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

describe('POST /register — validation layer', () => {
  test('rejects a missing fullName / email / password with 422', async () => {
    const { status, body } = await postJson('/register', {});
    assert.equal(status, 422);
    assert.equal(body.success, false);
    const fields = body.errors.map((e) => e.field);
    assert.ok(fields.includes('fullName'));
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  test('rejects an invalid email address', async () => {
    const { status, body } = await postJson('/register', {
      fullName: 'Jane Doe',
      email: 'not-an-email',
      password: 'ValidPass1',
    });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'email'));
  });

  test('rejects a password under 8 characters', async () => {
    const { status, body } = await postJson('/register', {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'short1A',
    });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'password'));
  });

  test('rejects a password missing an uppercase letter or a digit', async () => {
    const { status, body } = await postJson('/register', {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'alllowercase',
    });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'password'));
  });

  test('rejects an invalid role value', async () => {
    const { status, body } = await postJson('/register', {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'ValidPass1',
      role: 'superadmin',
    });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'role'));
  });
});

describe('POST /login — validation layer', () => {
  test('rejects a missing email and password with 422', async () => {
    const { status, body } = await postJson('/login', {});
    assert.equal(status, 422);
    const fields = body.errors.map((e) => e.field);
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  test('rejects a malformed email', async () => {
    const { status, body } = await postJson('/login', { email: 'nope', password: 'whatever' });
    assert.equal(status, 422);
    assert.ok(body.errors.some((e) => e.field === 'email'));
  });
});

describe('GET /me — authenticate guard', () => {
  test('returns 401 with no Authorization header', async () => {
    const res = await fetch(`${baseUrl}/me`);
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  });

  test('returns 401 for an Authorization header that is not "Bearer <token>"', async () => {
    const res = await fetch(`${baseUrl}/me`, { headers: { Authorization: 'Basic abc123' } });
    assert.equal(res.status, 401);
  });

  test('returns 401 for a syntactically invalid JWT (fails verify before any DB lookup)', async () => {
    const res = await fetch(`${baseUrl}/me`, { headers: { Authorization: 'Bearer not.a.valid.jwt' } });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.match(body.message, /invalid token/i);
  });
});

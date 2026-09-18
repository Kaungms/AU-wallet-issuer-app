import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import handler from '../../api/proxy.js';

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; } };
}

test('proxy forwards HTTP, queries, authorization and login bodies; preserves errors', async (t) => {
  const previous = process.env.VITE_API_BASE_URL;
  process.env.VITE_API_BASE_URL = 'http://backend.example.com:3000/api';
  t.after(() => { if (previous === undefined) delete process.env.VITE_API_BASE_URL; else process.env.VITE_API_BASE_URL = previous; });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('{"message":"Unauthorized"}', { status: 401, headers: { 'content-type': 'application/json' } }));
  const res = response();
  await handler({ method: 'GET', query: { path: 'issuer/credentials', page: '2' }, headers: { authorization: 'Bearer test-token' } }, res);
  assert.equal(String(fetchMock.mock.calls[0].arguments[0]), 'http://backend.example.com:3000/api/issuer/credentials?page=2');
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers.Authorization, 'Bearer test-token');
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.toString(), '{"message":"Unauthorized"}');
  await handler({ method: 'POST', query: { path: 'auth/issuer/login' }, headers: {}, body: { email: 'test@example.com', password: 'test' } }, response());
  assert.equal(fetchMock.mock.calls[1].arguments[1].body, JSON.stringify({ email: 'test@example.com', password: 'test' }));
});

test('proxy rejects arbitrary paths and reports upstream connection failures', async (t) => {
  const previous = process.env.VITE_API_BASE_URL;
  process.env.VITE_API_BASE_URL = 'http://backend.example.com:3000';
  t.after(() => { if (previous === undefined) delete process.env.VITE_API_BASE_URL; else process.env.VITE_API_BASE_URL = previous; });
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  for (const path of ['https://other.example.com', 'issuer/../admin', 'issuer/%2e%2e/admin']) {
    const res = response();
    await handler({ method: 'GET', query: { path }, headers: {} }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(mock.mock.callCount(), 0);
  const res = response();
  await handler({ method: 'GET', query: { path: 'issuer/dashboard/connection-summary' }, headers: {} }, res);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.error.code, 'API_UNREACHABLE');
});

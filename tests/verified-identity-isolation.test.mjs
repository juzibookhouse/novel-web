// Offline only: SDK and environment imports are replaced; all network is denied.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = await readFile(new URL('../src/lib/server/verifiedIdentity.ts', import.meta.url), 'utf8');
const id = '10000000-0000-4000-8000-000000000001';
const other = '20000000-0000-4000-8000-000000000002';
const request = (value) => new Request('https://fictional.invalid/?userId=forged&role=admin', {
  headers: value === undefined ? {} : { Authorization: value }
});

async function fixture({ result = { data: { user: { id, role: 'admin' } }, error: null },
  getUser, browser = false, windowPresent = false, createFails = false } = {}) {
  const calls = [];
  const clients = [];
  const context = vm.createContext({ ...(windowPresent ? { window: {} } : {}),
    console: new Proxy({}, { get() { throw new Error('Logging forbidden'); } }),
    fetch() { throw new Error('Network forbidden'); } });
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source, { mode: 'transform' }), { context });
  await module.link((name) => {
    const imports = {
      '$app/environment': { browser },
      '$env/static/public': { PUBLIC_SUPABASE_URL: 'https://fictional.invalid', PUBLIC_SUPABASE_ANON_KEY: 'fictional-anon' },
      '@supabase/supabase-js': { createClient(url, key, options) {
        if (createFails) throw new Error('sensitive provider details');
        const client = { url, key, options };
        clients.push(client);
        return { auth: { async getUser(token) {
          calls.push(token);
          return getUser ? getUser(token) : result;
        } }, from() { throw new Error('Database queries forbidden'); } };
      } }
    };
    assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    const values = imports[name];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return { verify: module.namespace.verifyRequestIdentity, calls, clients };
}

async function rejects(f, header, status, code) {
  await assert.rejects(() => f.verify(request(header)), (error) => {
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    assert.equal(error.message, code);
    assert.equal(error.cause, undefined);
    assert.ok(!String(error.stack).includes('sensitive provider details'));
    return true;
  });
}

test('standard Bearer validates with SDK and exposes only verified UUID', async () => {
  const f = await fixture();
  assert.equal(JSON.stringify(await f.verify(request('Bearer fictional-token'))), JSON.stringify({ id }));
  assert.deepEqual(f.calls, ['fictional-token']);
  assert.equal(f.clients[0].options.auth.persistSession, false);
  assert.equal(f.clients[0].options.auth.autoRefreshToken, false);
  assert.equal(f.clients[0].options.auth.detectSessionInUrl, false);
});

test('legacy session ignores forged UUID, role and all additional fields', async () => {
  const f = await fixture();
  const header = 'Bearer ' + JSON.stringify({ access_token: 'legacy-token', user: { id: other, role: 'admin' }, userId: other });
  assert.equal((await f.verify(request(header))).id, id);
  assert.deepEqual(f.calls, ['legacy-token']);
});

test('missing credentials rejected without invoking SDK', async () => {
  const f = await fixture();
  await rejects(f, undefined, 401, 'credentials_missing');
  assert.equal(f.clients.length, 0);
});

for (const header of ['Basic invalid', 'Bearer null', 'Bearer {broken', 'Bearer {"user":{"id":"forged"}}', 'Bearer {"access_token":42}', 'Bearer {"access_token":"  "}']) {
  test(`malformed credentials rejected locally: ${header}`, async () => {
    const f = await fixture();
    await rejects(f, header, 401, 'credentials_invalid');
    assert.equal(f.calls.length, 0);
  });
}

for (const error of [{ status: 401 }, { status: 400, code: 'bad_jwt' }, { code: 'session_expired' }]) {
  test('SDK-confirmed invalid or expired token is 401', async () => {
    await rejects(await fixture({ result: { data: { user: { id } }, error } }), 'Bearer fictional', 401, 'credentials_invalid');
  });
}

for (const error of [{ status: 503 }, { status: 429 }, { status: 500, code: 'invalid_jwt' }, { status: 400, code: 'unknown_failure' }]) {
  test('service or unknown failure is not logout', async () => {
    await rejects(await fixture({ result: { data: null, error } }), 'Bearer fictional', 503, 'auth_unavailable');
  });
}

test('network exception and SDK construction failure are sanitized 503', async () => {
  await rejects(await fixture({ getUser() { throw new Error('sensitive provider details'); } }), 'Bearer fictional', 503, 'auth_unavailable');
  await rejects(await fixture({ createFails: true }), 'Bearer fictional', 503, 'auth_unavailable');
});

test('banned account is forbidden, not an administrator decision', async () => {
  await rejects(await fixture({ result: { data: null, error: { code: 'user_banned' } } }), 'Bearer fictional', 403, 'account_forbidden');
});

test('missing or malformed verified UUID fails closed', async () => {
  for (const user of [null, {}, { id: 'forged' }]) {
    await rejects(await fixture({ result: { data: { user }, error: null } }), 'Bearer fictional', 503, 'auth_invalid_response');
  }
});

test('concurrent requests use independent clients and verified identities', async () => {
  const f = await fixture({ getUser: async (token) => {
    await Promise.resolve();
    return { data: { user: { id: token === 'first' ? id : other } }, error: null };
  } });
  const [a, b] = await Promise.all([f.verify(request('Bearer first')), f.verify(request('Bearer second'))]);
  assert.equal(a.id, id);
  assert.equal(b.id, other);
  assert.equal(f.clients.length, 2);
  assert.notEqual(f.clients[0], f.clients[1]);
  assert.equal(f.clients[0].options.global.headers.Authorization, 'Bearer first');
  assert.equal(f.clients[1].options.global.headers.Authorization, 'Bearer second');
});

test('browser environments cannot evaluate module', async () => {
  await assert.rejects(() => fixture({ browser: true }), /identity_verification_server_only/);
  await assert.rejects(() => fixture({ windowPresent: true }), /identity_verification_server_only/);
});

test('static boundary: identity only, no shared auth coupling, database or logging', () => {
  assert.doesNotMatch(source, /\.from\(|console\.|\$lib\/server\/auth|service_role|SERVICE_ROLE|\.setSession\(/);
  assert.match(source, /client\.auth\.getUser\(token\)/);
});

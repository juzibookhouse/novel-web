// Run with Node 24: node --experimental-vm-modules --test tests/auth-isolation.test.mjs
// No dependencies, environment files, real SDK clients, or external services are loaded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const fakeEnv = {
  PUBLIC_SUPABASE_URL: 'https://fictional.invalid',
  PUBLIC_SUPABASE_ANON_KEY: 'fictional-public-key'
};
const noNetwork = () => { throw new Error('Network forbidden in isolated tests'); };

// Deliberately small PostgREST-expression validator, not a replacement server.
// It rejects malformed/unsupported syntax instead of accepting arbitrary strings.
function parseStatusOr(expression) {
  assert.match(expression, /^\(status\.eq\.(active|pending)(,status\.eq\.(active|pending))*\)$/);
  return expression.slice(1, -1).split(',').map((term) => term.split('.')[2]);
}

function compileMembershipQuery(params) {
  const allowed = ['select', 'user_id', 'status', 'start_date', 'end_date', 'order', 'limit', 'or'];
  for (const key of params.keys()) assert.ok(allowed.includes(key), `Unsupported query key: ${key}`);
  assert.match(params.get('user_id') || '', /^eq\.[A-Za-z0-9-]+$/);
  const userId = params.get('user_id').slice(3);
  const statusFilter = params.get('status');
  if (statusFilter) assert.match(statusFilter, /^eq\.(active|pending)$/);
  const statuses = params.has('or') ? parseStatusOr(params.get('or')) : null;
  assert.ok(statusFilter || statuses, 'A status filter is required');
  for (const [field, operator] of [['start_date', 'lte'], ['end_date', 'gte']]) {
    assert.match(params.get(field) || '', new RegExp(`^${operator}\\.\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$`));
    assert.ok(Number.isFinite(Date.parse(params.get(field).slice(4))));
  }
  assert.equal(params.get('order'), 'end_date.desc,id.asc');
  assert.equal(params.get('limit'), '1');
  const nowStart = Date.parse(params.get('start_date').slice(4));
  const nowEnd = Date.parse(params.get('end_date').slice(4));
  return (records) => records.filter((row) =>
    row.user_id === userId &&
    (!statusFilter || row.status === statusFilter.slice(3)) &&
    (!statuses || statuses.includes(row.status)) &&
    Date.parse(row.start_date) <= nowStart && Date.parse(row.end_date) >= nowEnd
  ).sort((a, b) => Date.parse(b.end_date) - Date.parse(a.end_date) || a.id.localeCompare(b.id)).slice(0, 1);
}

async function loadSource(path, imports, globals = {}) {
  const context = vm.createContext({ Request, Response, Headers, console, fetch: noNetwork, ...globals });
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link((name) => {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import blocked: ${name}`);
    const values = imports[name];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

async function authFixture({ role = 'reader', profileMissing = false, throws = false,
  authError = null, dbError = null, dbThrow = null, membershipMissing = false,
  memberships = null, now = '2026-10-22T12:00:00.000Z' } = {}) {
  const calls = [];
  const membership = { id: 'membership-fictional', status: 'active', end_date: '2999-01-01' };
  const clients = [];
  const membershipQueries = [];
  const createClient = (url, key, options) => {
    const client = {
      auth: { async getUser(token) {
        calls.push(['verify', token]);
        if (throws) throw new Error('simulated provider outage');
        if (authError) return { data: { user: null }, error: authError };
        const id = token === 'valid-A' ? 'user-A' : token === 'valid-B' ? 'user-B' : null;
        return id ? { data: { user: { id } }, error: null }
          : { data: { user: null }, error: { status: 401, code: 'bad_jwt' } };
      } },
      from(table) {
        calls.push(['from', table]);
        const filters = [];
        const params = new URLSearchParams();
        const query = {
          select(columns) { params.set('select', columns); return query; },
          eq(column, value) { filters.push([column, value]); params.set(column, `eq.${value}`); calls.push(['eq', table, column, value]); return query; },
          or(value) { params.set('or', `(${value})`); return query; },
          gte(column, value) { params.set(column, `gte.${value}`); return query; },
          lte(column, value) { params.set(column, `lte.${value}`); return query; },
          order(column, { ascending }) {
            const order = `${column}.${ascending ? 'asc' : 'desc'}`;
            params.set('order', params.has('order') ? `${params.get('order')},${order}` : order);
            return query;
          },
          limit(value) { params.set('limit', String(value)); return query; },
          async maybeSingle() {
            let execute;
            if (table === 'user_memberships') {
              membershipQueries.push(new URLSearchParams(params));
              execute = compileMembershipQuery(params);
            }
            if (dbThrow === table) throw new Error('simulated database connection failure');
            if (dbError?.table === table && (!dbError.status || params.get('status') === `eq.${dbError.status}`)) {
              return { data: null, error: { code: dbError.code } };
            }
            const id = filters.find(([column]) => column === 'user_id')?.[1];
            return { data: table === 'user_profiles'
              ? (profileMissing ? null : { user_id: id, role, user_name: 'Fictional' })
              : execute(memberships || (membershipMissing ? [] : [{ ...membership, user_id: id, start_date: '2000-01-01T00:00:00.000Z' }]))[0] || null,
              error: null };
          }
        };
        return query;
      }
    };
    clients.push({ url, key, options, client });
    return client;
  };
  const auth = await loadSource('src/lib/server/auth.ts', {
    '@supabase/supabase-js': { createClient }, '$env/static/public': fakeEnv
  }, {
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return Date.parse(now); }
    }
  });
  return { ...auth, calls, clients, membershipQueries };
}

function request(authorization) {
  return new Request('https://local.invalid/api/user', {
    headers: authorization === undefined ? {} : { Authorization: authorization }
  });
}

for (const header of [undefined, 'Basic fictional', 'Bearer null', 'Bearer {bad',
  'Bearer {}', 'Bearer {"access_token":42}', 'Bearer {"user":{"id":"admin-fictional"}}',
  'Bearer forged-token', 'Bearer expired-token', 'Bearer {"access_token":"forged-token","user":{"id":"admin-fictional"}}']) {
  test(`rejects missing/malformed/unverified credential: ${header ?? 'missing'}`, async () => {
    const fixture = await authFixture();
    await assert.rejects(() => fixture.getAuthUser(request(header)), { status: 401,
      code: header === undefined ? 'credentials_missing' : 'credentials_invalid' });
    assert.equal(fixture.calls.filter(([kind]) => kind === 'from').length, 0);
  });
}

test('legacy JSON cannot override the identity returned by token verification', async () => {
  const fixture = await authFixture();
  const result = await fixture.getAuthUser(request('Bearer {"access_token":"valid-A","user":{"id":"admin-fictional"}}'));
  assert.equal(result.id, 'user-A');
  assert.equal(result.user_id, 'user-A');
  assert.equal(result.isAdmin, false);
  assert.equal(result.isMembership, true);
  assert.deepEqual(fixture.calls[0], ['verify', 'valid-A']);
  assert.ok(fixture.calls.filter(([kind, , column]) => kind === 'eq' && column === 'user_id').every((call) => call[3] === 'user-A'));
});

test('reader, author and admin retain their profile-based response shape', async () => {
  for (const role of ['reader', 'author', 'admin']) {
    const fixture = await authFixture({ role });
    const result = await fixture.getAuthUser(request('Bearer valid-A'));
    assert.equal(result.role, role);
    assert.equal(result.isAdmin, role === 'admin');
    assert.equal(result.membership.id, 'membership-fictional');
  }
});

test('provider failure and missing profile are distinguished, neither is a logout', async () => {
  for (const [options, status, code] of [[{ throws: true }, 503, 'auth_unavailable'],
    [{ profileMissing: true }, 403, 'profile_missing_or_inaccessible']]) {
    const fixture = await authFixture(options);
    await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), { status, code });
  }
});

test('concurrent requests have separate clients with the matching bearer token', async () => {
  const fixture = await authFixture();
  const results = await Promise.all(['A', 'B'].map((id) => fixture.getAuthUser(request(`Bearer valid-${id}`))));
  assert.deepEqual(results.map((value) => value.user_id), ['user-A', 'user-B']);
  assert.notEqual(fixture.clients[0].client, fixture.clients[1].client);
  for (const [index, id] of ['A', 'B'].entries()) {
    const { options, key } = fixture.clients[index];
    assert.equal(key, fakeEnv.PUBLIC_SUPABASE_ANON_KEY);
    assert.equal(options.global.headers.Authorization, `Bearer valid-${id}`);
    assert.equal(options.auth.persistSession, false);
    assert.equal(options.auth.autoRefreshToken, false);
    assert.equal(options.auth.detectSessionInUrl, false);
  }
});

async function apiFixture(storedSession, withStorage = true) {
  const sent = [];
  const api = await loadSource('src/lib/api.ts', { '$env/static/public': fakeEnv }, {
    ...(withStorage ? { localStorage: { getItem: () => storedSession } } : {}),
    fetch: async (url, options) => {
      sent.push({ url, options });
      return Response.json({ success: true });
    }
  });
  return { ...api, sent };
}

test('request helper preserves legacy session compatibility without forwarding refresh_token', async () => {
  const fixture = await apiFixture(JSON.stringify({ access_token: 'valid-A', user: { id: 'fictional' }, refresh_token: 'never-send' }));
  await fixture.sendRequest('/local', { method: 'POST', headers: { 'X-Example': 'kept' }, body: '{}' });
  const { options } = fixture.sent[0];
  assert.deepEqual(JSON.parse(options.headers.get('Authorization').slice(7)), {access_token:'valid-A',user:{id:'fictional'}});
  assert.equal(options.headers.get('X-Example'), 'kept');
  assert.equal(options.headers.get('Content-Type'), 'application/json');
  assert.equal(options.method, 'POST');
  assert.equal(options.body, '{}');
  assert.ok(!options.headers.get('Authorization').includes('never-send'));
});

test('request helper preserves explicitly supplied credentials', async () => {
  const fixture = await apiFixture('{"access_token":"valid-A"}');
  await fixture.sendRequest('/local', { headers: new Headers({ Authorization: 'Bearer valid-B' }) });
  assert.equal(fixture.sent[0].options.headers.get('Authorization'), 'Bearer valid-B');
});

test('missing, corrupt, or unavailable storage does not produce fake credentials', async () => {
  for (const [stored, available] of [[null, true], ['{bad', true], ['{}', true], ['{"access_token":42}', true], [null, false]]) {
    const fixture = await apiFixture(stored, available);
    assert.equal(fixture.getAuthToken(), null);
    await fixture.sendRequest('/local');
    assert.equal(fixture.sent[0].options.headers.has('Authorization'), false);
  }
});

test('user API returns 401 for empty identity, keeps currentUser for authenticated users', async () => {
  let identity = { id: '', user_id: '', isAdmin: false, email: '' };
  const route = await loadSource('src/routes/api/user/+server.ts', {
    '$lib/server/auth': { getAuthUser: async () => identity, authenticationErrorResponse: () => undefined },
    '@sveltejs/kit': { json: (body, options) => Response.json(body, options) },
    '$lib/errorLogger': { logError: noNetwork },
    '$lib/constants': { WEBSITE_NAME: 'Fictional Test' }
  });
  const event = { request: request() };
  assert.equal((await route.GET(event)).status, 401);
  identity = { id: 'user-A', user_id: 'user-A', isAdmin: false };
  const response = await route.GET(event);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).currentUser, identity);
});

async function storeFixture({ browser = false } = {}) {
  const cells = [];
  let reply = { data: { currentUser: { user_id: 'user-A', id: 'user-A', isAdmin: false } }, status: 200 };
  let requests = 0;
  let session = { user: { id: 'user-A' } };
  const events = {};
  const store = await loadSource('src/lib/stores/authStore.ts', {
    'svelte/store': { writable: (initial) => {
      const cell = { value: initial }; cells.push(cell);
      return { set: (value) => { cell.value = value; } };
    } },
    '$lib/supabaseClient': { supabase: { auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (callback) => { events.auth = callback; }
    } } },
    '$app/environment': { browser },
    '$lib/api': { sendRequest: async () => { requests++; return typeof reply === 'function' ? reply() : reply; } }
  }, { window: { addEventListener: (name, callback) => { events[name] = callback; }, location: { pathname: '/' } } });
  return { ...store, cells, events, get requests() { return requests; },
    reply: (value) => { reply = value; }, session: (value) => { session = value; } };
}

test('temporary failures retain display state as unverified; explicit invalid token clears it', async () => {
  const fixture = await storeFixture();
  await fixture.setUser({ id: 'user-A' });
  const cached = fixture.cells[0].value;
  for (const result of [
    { status: null, error: { code: 'network_or_response_error' } },
    { status: 503, error: { code: 'auth_unavailable' } },
    { status: 503, error: { code: 'membership_unavailable' } },
    { status: 403, error: { code: 'profile_missing_or_inaccessible' } },
    { status: 401, error: { code: 'credentials_missing' } }
  ]) {
    fixture.reply(result);
    await fixture.setUser({ id: 'user-A' });
    assert.equal(fixture.cells[0].value, cached);
    assert.equal(fixture.cells[1].value.status, 'unverified');
  }
  fixture.reply({ status: 401, error: { code: 'credentials_invalid' } });
  await fixture.setUser({ id: 'user-A' });
  assert.equal(fixture.cells[0].value, null);
  assert.equal(fixture.cells[1].value.status, 'signed_out');
});

for (const upstream of [{ status: 500 }, { status: 503 }, { status: 429 }, { code: 'unknown_failure' }]) {
  test(`Auth ${JSON.stringify(upstream)} is a service failure, not 401`, async () => {
    const fixture = await authFixture({ authError: upstream });
    await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), { status: 503, code: 'auth_unavailable' });
    assert.equal(fixture.calls.filter(([kind]) => kind === 'from').length, 0);
  });
}

for (const table of ['user_profiles', 'user_memberships']) {
  for (const code of ['42501', 'PGRST100', '08006']) {
    test(`${table} ${code} has a distinct permission/query failure`, async () => {
      const fixture = await authFixture({ dbError: { table, code } });
      await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), {
        status: code === '42501' ? 403 : code === 'PGRST100' ? 500 : 503,
        code: `${table === 'user_profiles' ? 'profile' : 'membership'}_${code === '42501' ? 'forbidden' : code === 'PGRST100' ? 'query_failed' : 'unavailable'}`
      });
    });
  }
  test(`${table} connection exception is 503`, async () => {
    const fixture = await authFixture({ dbThrow: table });
    await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), { status: 503 });
  });
}

test('no matching membership is a valid non-VIP, not a query failure', async () => {
  const fixture = await authFixture({ membershipMissing: true });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.user_id, 'user-A');
  assert.equal(result.membership, undefined);
  assert.equal(Boolean(result.isMembership), false);
});

function member(id, status, end_date = '2027-04-16T00:00:00.000Z', overrides = {}) {
  return { id, status, user_id: 'user-A', plan_id: 'fictional-plan',
    start_date: '2026-01-01T00:00:00.000Z', end_date, ...overrides };
}

test('the old raw OR expression is rejected; the balanced expression parses', () => {
  assert.throws(() => parseStatusOr('(status.eq.active,status.eq.pending))'));
  assert.throws(() => parseStatusOr('(status.eq.active,status.pending)'));
  assert.deepEqual(parseStatusOr('(status.eq.active,status.eq.pending)'), ['active', 'pending']);
});

test('actual membership expressions have explicit equality, date filters, order and limit', async () => {
  const fixture = await authFixture({ memberships: [] });
  await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(fixture.membershipQueries.length, 2);
  for (const [index, params] of fixture.membershipQueries.entries()) {
    // Validate the encoded query round-trip as well as the decoded filters.
    const encoded = new URL(`https://local.invalid/user_memberships?${params}`);
    assert.doesNotThrow(() => compileMembershipQuery(encoded.searchParams));
    assert.equal(params.get('user_id'), 'eq.user-A');
    assert.equal(params.get('status'), index === 0 ? 'eq.active' : 'eq.pending');
    assert.equal(params.get('start_date'), 'lte.2026-10-22T12:00:00.000Z');
    assert.equal(params.get('end_date'), 'gte.2026-10-22T12:00:00.000Z');
    assert.equal(params.get('order'), 'end_date.desc,id.asc');
    assert.equal(params.get('limit'), '1');
    assert.equal(params.has('or'), false);
  }
  const malformed = new URLSearchParams(fixture.membershipQueries[0]);
  malformed.set('status', 'eq.active)');
  assert.throws(() => compileMembershipQuery(malformed));
  malformed.set('status', 'eq.active');
  malformed.set('end_date', 'gte.not-a-date');
  assert.throws(() => compileMembershipQuery(malformed));
});

test('valid active member remains VIP and pending lookup is unnecessary', async () => {
  const record = member('active-only', 'active');
  const fixture = await authFixture({ memberships: [record] });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.isMembership, true);
  assert.equal(result.membership.id, record.id);
  assert.equal(result.membership.end_date, record.end_date);
  assert.equal(fixture.membershipQueries.length, 1);
});

test('pending-only member retains pending details but never gains VIP', async () => {
  const fixture = await authFixture({ memberships: [member('pending-only', 'pending')] });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.membership.id, 'pending-only');
  assert.equal(result.membership.status, 'pending');
  assert.equal(result.isMembership, false);
  assert.equal(fixture.membershipQueries.length, 2);
});

test('a later-ending pending purchase never covers an active membership', async () => {
  const records = [member('pending-long', 'pending', '2029-01-01T00:00:00.000Z'), member('active-short', 'active')];
  for (const ordered of [records, [...records].reverse()]) {
    const fixture = await authFixture({ memberships: ordered });
    const result = await fixture.getAuthUser(request('Bearer valid-A'));
    assert.equal(result.membership.id, 'active-short');
    assert.equal(result.isMembership, true);
    assert.equal(fixture.membershipQueries.length, 1);
  }
});

test('multiple active records select the latest end date, with a stable ID tie-break', async () => {
  const records = [member('old', 'active'),
    member('b', 'active', '2028-01-01T00:00:00.000Z'),
    member('a', 'active', '2028-01-01T00:00:00.000Z')];
  const original = JSON.stringify(records);
  for (const ordered of [records, [...records].reverse()]) {
    const fixture = await authFixture({ memberships: ordered });
    const result = await fixture.getAuthUser(request('Bearer valid-A'));
    assert.equal(result.membership.id, 'a');
    assert.equal(result.membership.end_date, '2028-01-01T00:00:00.000Z');
    assert.equal(result.isMembership, true);
  }
  assert.equal(JSON.stringify(records), original, 'Existing records and dates must not be changed');
});

test('multiple pending records are deterministic and remain non-VIP', async () => {
  const fixture = await authFixture({ memberships: [
    member('pending-b', 'pending', '2028-01-01T00:00:00.000Z'),
    member('pending-old', 'pending'),
    member('pending-a', 'pending', '2028-01-01T00:00:00.000Z')
  ] });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.membership.id, 'pending-a');
  assert.equal(result.isMembership, false);
});

test('expired/future memberships, unrelated users and unsupported statuses cannot grant VIP', async () => {
  const fixture = await authFixture({ memberships: [
    member('expired', 'active', '2026-10-21T12:00:00.000Z'),
    member('future', 'active', undefined, { start_date: '2026-10-23T00:00:00.000Z' }),
    member('other-user', 'active', undefined, { user_id: 'user-B' }),
    member('cancelled', 'cancelled')
  ] });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.membership, undefined);
  assert.equal(Boolean(result.isMembership), false);
});

test('expired active records do not prevent an eligible pending record from being returned', async () => {
  const fixture = await authFixture({ memberships: [member('expired', 'active', '2026-01-01T00:00:00.000Z'),
    member('pending-current', 'pending')] });
  const result = await fixture.getAuthUser(request('Bearer valid-A'));
  assert.equal(result.membership.id, 'pending-current');
  assert.equal(result.isMembership, false);
});

test('the existing start-inclusive/end-strict VIP boundaries are retained', async () => {
  const now = '2026-10-22T12:00:00.000Z';
  const starting = await authFixture({ memberships: [member('starting-now', 'active', undefined, { start_date: now })] });
  assert.equal((await starting.getAuthUser(request('Bearer valid-A'))).isMembership, true);
  const ending = await authFixture({ memberships: [member('ending-now', 'active', now)] });
  assert.equal((await ending.getAuthUser(request('Bearer valid-A'))).isMembership, false);
});

test('active query failure cannot fall back to pending and pretend the user is non-VIP', async () => {
  const fixture = await authFixture({ memberships: [member('pending', 'pending')],
    dbError: { table: 'user_memberships', status: 'active', code: '08006' } });
  await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), { status: 503, code: 'membership_unavailable' });
  assert.equal(fixture.membershipQueries.length, 1);
});

test('pending fallback query failure is also an error, not no membership', async () => {
  const fixture = await authFixture({ memberships: [],
    dbError: { table: 'user_memberships', status: 'pending', code: 'PGRST100' } });
  await assert.rejects(() => fixture.getAuthUser(request('Bearer valid-A')), { status: 500, code: 'membership_query_failed' });
  assert.equal(fixture.membershipQueries.length, 2);
});

test('user API propagates typed failures without sending external error email', async () => {
  const fixture = await authFixture();
  let failure;
  const route = await loadSource('src/routes/api/user/+server.ts', {
    '$lib/server/auth': {
      getAuthUser: async () => { throw failure; },
      authenticationErrorResponse: fixture.authenticationErrorResponse
    },
    '@sveltejs/kit': { json: (body, options) => Response.json(body, options) },
    '$lib/errorLogger': { logError: noNetwork }, '$lib/constants': { WEBSITE_NAME: 'Fictional' }
  });
  for (const [status, code] of [[401, 'credentials_missing'], [401, 'credentials_invalid'],
    [403, 'profile_missing_or_inaccessible'], [503, 'auth_unavailable'], [503, 'membership_unavailable']]) {
    failure = new fixture.AuthenticationError(status, code);
    const response = await route.GET({ request: request() });
    assert.equal(response.status, status);
    assert.equal((await response.json()).code, code);
  }
});

test('request helper preserves HTTP status/code, including non-JSON errors, without network calls', async () => {
  for (const [status, body, expected] of [[401, { code: 'credentials_invalid' }, 'credentials_invalid'],
    [403, { code: 'profile_forbidden' }, 'profile_forbidden'], [503, null, 'request_failed']]) {
    const api = await loadSource('src/lib/api.ts', { '$env/static/public': fakeEnv }, {
      fetch: async () => body ? Response.json(body, { status }) : new Response('unavailable', { status })
    });
    const result = await api.sendRequest('/local');
    assert.equal(result.status, status);
    assert.equal(result.error.code, expected);
  }
  const api = await loadSource('src/lib/api.ts', { '$env/static/public': fakeEnv });
  const result = await api.sendRequest('/local');
  assert.equal(result.status, null);
  assert.equal(result.error.code, 'network_or_response_error');
});

test('manual revalidation after recovery succeeds without automatic retry loops', async () => {
  const fixture = await storeFixture();
  await fixture.setUser({ id: 'user-A' });
  fixture.reply({ status: null, error: { code: 'network_or_response_error' } });
  await fixture.setUser({ id: 'user-A' });
  assert.equal(fixture.requests, 2);
  fixture.reply({ status: 200, data: { currentUser: { user_id: 'user-A', id: 'user-A' } } });
  await fixture.getUserSession();
  assert.equal(fixture.cells[1].value.status, 'verified');
  assert.equal(fixture.requests, 3);
});

test('same-user requests deduplicate; old responses cannot overwrite a new account or logout', async () => {
  const fixture = await storeFixture();
  let finishA;
  fixture.reply(() => new Promise((resolve) => { finishA = resolve; }));
  const first = fixture.setUser({ id: 'user-A' });
  const duplicate = fixture.setUser({ id: 'user-A' });
  assert.equal(first, duplicate);
  assert.equal(fixture.requests, 1);
  fixture.reply({ status: 200, data: { currentUser: { id: 'user-B', user_id: 'user-B' } } });
  await fixture.setUser({ id: 'user-B' });
  finishA({ status: 200, data: { currentUser: { id: 'user-A', user_id: 'user-A' } } });
  await first;
  assert.equal(fixture.cells[0].value.user_id, 'user-B');
  let finishB;
  fixture.reply(() => new Promise((resolve) => { finishB = resolve; }));
  const pending = fixture.setUser({ id: 'user-B' });
  await fixture.setUser(null);
  finishB({ status: 200, data: { currentUser: { id: 'user-B', user_id: 'user-B' } } });
  await pending;
  assert.equal(fixture.cells[0].value, null);
  assert.equal(fixture.cells[1].value.status, 'signed_out');
});

test('online recovery makes one deduplicated attempt and no retry after success', async () => {
  const fixture = await storeFixture({ browser: true });
  await fixture.setUser({ id: 'user-A' });
  fixture.reply({ status: null, error: { code: 'network_or_response_error' } });
  await fixture.setUser({ id: 'user-A' });
  const before = fixture.requests;
  fixture.reply({ status: 200, data: { currentUser: { id: 'user-A', user_id: 'user-A' } } });
  fixture.events.online();
  fixture.events.online();
  await new Promise(setImmediate);
  assert.equal(fixture.requests, before + 1);
  assert.equal(fixture.cells[1].value.status, 'verified');
  fixture.events.online();
  await new Promise(setImmediate);
  assert.equal(fixture.requests, before + 1);
  await fixture.events.auth('SIGNED_OUT', null);
  assert.equal(fixture.cells[0].value, null);
  assert.equal(fixture.cells[1].value.status, 'signed_out');
});

test('a late rejection for the previous token cannot clear a refreshed session', async () => {
  const fixture = await storeFixture({ browser: true });
  await fixture.setUser({ id: 'user-A' });
  let finishOld;
  fixture.reply(() => new Promise((resolve) => { finishOld = resolve; }));
  const old = fixture.setUser({ id: 'user-A' });
  fixture.reply({ status: 200, data: { currentUser: { id: 'user-A', user_id: 'user-A' } } });
  await fixture.events.auth('TOKEN_REFRESHED', { user: { id: 'user-A' } });
  await new Promise(setImmediate);
  finishOld({ status: 401, error: { code: 'credentials_invalid' } });
  await old;
  assert.equal(fixture.cells[0].value.user_id, 'user-A');
  assert.equal(fixture.cells[1].value.status, 'verified');
});

async function routeFiles(directory = 'src/routes/api') {
  const found = [];
  for (const entry of await readdir(new URL(`../${directory}`, import.meta.url), { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...await routeFiles(`${directory}/${entry.name}`));
    else if (entry.name === '+server.ts') found.push(`${directory}/${entry.name}`);
  }
  return found;
}

for (const path of await routeFiles()) {
  const original = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  if (!original.includes('getAuthUser')) continue;
  const code = stripTypeScriptTypes(original);
  const methods = ['GET', 'POST', 'PATCH', 'DELETE'].filter((method) => {
    const match = code.match(new RegExp(`export (?:async function|const) ${method}\\b([\\s\\S]*?)(?=\\nexport |$)`));
    return match && match[1].includes('await getAuthUser(');
  });
  for (const method of methods) {
    test(`${method} ${path} preserves authentication status before any business operation`, async () => {
      const fixture = await authFixture();
      let failure;
      const auth = { getAuthUser: async () => { throw failure; }, authenticationErrorResponse: fixture.authenticationErrorResponse };
      const database = { supabase: { from: noNetwork }, getCategories: noNetwork, getTags: noNetwork, getNovelChapterGifts: noNetwork };
      const route = await loadSource(path, {
        '$lib/server/adminAuthorization': { assertServerAdmin: noNetwork, AdminAuthorizationError: class extends Error {} },
        '$lib/server/membershipWriter': { registerMembershipPayment: noNetwork, getMembershipTarget: noNetwork, updateMembership: noNetwork, MembershipWriteError: class extends Error {} },
        '@supabase/supabase-js': { createClient: noNetwork },
        '$env/dynamic/private': { env: {} },
        '$lib/server/membershipHistory': { checkMembershipHistory: noNetwork },
        '$lib/server/auth': auth, '$lib/server/auth.js': auth,
        '$lib/supabaseClient': database, '$lib/supabaseClient.js': database,
        '$lib/novel.js': { getSortedChapters: noNetwork },
        '@sveltejs/kit': { json: (body, options) => Response.json(body, options) },
        '$lib/errorLogger': { logError: noNetwork },
        '$lib/constants': { WEBSITE_NAME: 'Fictional', CURRENCY_CN: 'cny', CURRENCY_US: 'usd' },
        '$env/static/private': { STRIPE_SECRET_KEY: 'fictional-not-a-key' },
        stripe: { default: class MockStripe {} }
      });
      for (const status of [401, 403, 503]) {
        failure = new fixture.AuthenticationError(status, 'fictional_auth_failure');
        const event = {
          request: new Request('https://local.invalid/?month=2026-01&filter=user', { method: 'POST', body: '{}' }),
          url: new URL('https://local.invalid/?month=2026-01&filter=user'),
          params: { novelId: 'fictional-novel', chapterId: 'fictional-chapter', commentId: 'fictional-comment', tagId: 'fictional-tag' }, locals: {}
        };
        const response = await route[method](event);
        assert.equal(response.status, status);
        assert.equal((await response.json()).code, 'fictional_auth_failure');
      }
    });
  }
}

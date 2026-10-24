// No SDK, .env file, database, or network is used.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const sourcePath = 'src/lib/server/adminAuthorization.ts';
const source = await readFile(new URL(`../${sourcePath}`, import.meta.url), 'utf8');
const adminA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const adminB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const reader = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

async function fixture({ env = { ADMIN_AUTH_USER_IDS: `${adminA}, ${adminB}` }, browser = false, windowPresent = false } = {}) {
  const context = vm.createContext({ ...(windowPresent ? { window: {} } : {}),
    fetch: () => { throw new Error('Network forbidden'); } });
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link((name) => {
    const imports = { '$app/environment': { browser }, '$env/dynamic/private': { env } };
    assert.ok(Object.hasOwn(imports, name), `Unexpected import blocked: ${name}`);
    const values = imports[name];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

function denies(module, identity) {
  assert.throws(() => module.assertServerAdmin(identity), (error) => {
    assert.equal(error.code, 'admin_access_denied');
    assert.equal(error.status, 403);
    assert.equal(error.message, 'admin_access_denied');
    assert.ok(!String(error.stack).includes(adminA));
    assert.ok(!String(error.stack).includes(adminB));
    assert.ok(!JSON.stringify(error).includes('ADMIN_AUTH_USER_IDS'));
    assert.equal(error.cause, undefined);
    return true;
  });
}

test('listed verified Auth UUIDs are allowed; authorization returns no configuration', async () => {
  const module = await fixture();
  assert.equal(module.assertServerAdmin(adminA), undefined);
  assert.equal(module.assertServerAdmin(adminB), undefined);
  assert.equal(module.assertServerAdmin(adminA.toUpperCase()), undefined);
});

test('a nonlisted Auth UUID is denied', async () => denies(await fixture(), reader));

for (const env of [{}, { ADMIN_AUTH_USER_IDS: '' }, { ADMIN_AUTH_USER_IDS: '  ' },
  { PUBLIC_ADMIN_AUTH_USER_IDS: adminA }, { ADMIN_AUTH_USER_IDS: null }, { ADMIN_AUTH_USER_IDS: 123 }]) {
  test('missing/empty private configuration denies even an otherwise listed UUID', async () => {
    denies(await fixture({ env }), adminA);
  });
}

for (const value of ['not-a-uuid', `${adminA},not-a-uuid`, `${adminA},`, `,${adminA}`,
  `${adminA},,${adminB}`, JSON.stringify([adminA]), `${adminA};${adminB}`, 'fictional@example.invalid']) {
  test('malformed configuration denies the entire list', async () => {
    denies(await fixture({ env: { ADMIN_AUTH_USER_IDS: value } }), adminA);
  });
}

for (const identity of [undefined, null, '', 'admin', 'fictional@example.invalid', ` ${adminA}`, `${adminA}extra`,
  { id: adminA, role: 'admin' }, { user_id: adminA }, new Request('https://local.invalid')]) {
  test('invalid identity or browser-shaped input cannot authorize', async () => {
    denies(await fixture(), identity);
  });
}

test('browser-like runtimes cannot evaluate the module', async () => {
  await assert.rejects(() => fixture({ browser: true }), /admin_authorization_server_only/);
  await assert.rejects(() => fixture({ windowPresent: true }), /admin_authorization_server_only/);
});

test('configuration removal takes effect without retaining a previous allowlist', async () => {
  const env = { ADMIN_AUTH_USER_IDS: adminA };
  const module = await fixture({ env });
  module.assertServerAdmin(adminA);
  env.ADMIN_AUTH_USER_IDS = '';
  denies(module, adminA);
});

test('configuration whitespace is supported and separate module instances do not share lists', async () => {
  const first = await fixture({ env: { ADMIN_AUTH_USER_IDS: ` ${adminA} \n` } });
  const second = await fixture({ env: { ADMIN_AUTH_USER_IDS: adminB } });
  first.assertServerAdmin(adminA);
  second.assertServerAdmin(adminB);
  denies(first, adminB);
  denies(second, adminA);
});

test('only approved server authorization entry points import the module', async () => {
  const module = await fixture();
  assert.deepEqual(Object.keys(module).sort(), ['AdminAuthorizationError', 'assertServerAdmin']);
  assert.match(sourcePath, /^src\/lib\/server\//);
  assert.doesNotMatch(source, /\$env\/[^'\"]*public|user_profiles|console\.|createClient/);
  const approved = new Set([sourcePath, 'src/routes/api/admin/users/+server.ts',
    'src/routes/api/admin/authors/+server.ts', 'src/routes/api/author-application/+server.ts',
    'src/routes/api/admin/tags/+server.ts', 'src/routes/api/admin/tags/[tagId]/+server.ts',
    'src/routes/api/reading_records/+server.ts', 'src/routes/api/novels/+server.ts']);
  async function visit(dir) {
    for (const entry of await readdir(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (!approved.has(file) && /\.(ts|svelte|js)$/.test(file)) {
        assert.ok(!(await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).includes('adminAuthorization'), `Unexpected business integration: ${file}`);
      }
    }
  }
  await visit('src');
});

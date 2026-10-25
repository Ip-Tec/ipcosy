import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { validateUpload } from '../src/lib/storage-policy.ts';

// Run the actual route with infrastructure doubles, retaining its authorization logic.
const source = stripTypeScriptTypes(readFileSync(new URL('../src/app/api/storage/route.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
function route(session, user) {
  const signed = [];
  const context = vm.createContext({
    console, authOptions: {}, storageEnabled: () => true, requireStorageConfig: () => {}, validateUpload,
    getServerSession: async () => session,
    prisma: { user: { findUnique: async () => user } },
    NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) },
    prepareUpload: async (...args) => { signed.push(args); return { uploadUrl: 'test-signed-url' }; },
  });
  vm.runInContext(source + '\nthis.routes = { GET, POST };', context);
  return { ...context.routes, signed };
}
function request(type, size, extra = {}, origin = 'https://ipcosy.vercel.app') {
  return { headers: { get: () => origin }, nextUrl: { origin: 'https://ipcosy.vercel.app' },
    cookies: { get: () => ({ value: 'anonymous-test-session' }) },
    json: async () => ({ type, size, name: 'test', ...extra }) };
}
test('guest and free API reject larger sizes and forged paid flags before signing', async () => {
  for (const [session, user] of [[null, null], [{ user: { id: 'free', isPremium: true } }, { isPremium: false, isBanned: false }]]) {
    const api = route(session, user);
    assert.equal((await api.GET()).body.isPremium, false);
    for (const [type, size] of [['image/png', 4*1024*1024+1], ['application/octet-stream', 16*1024*1024+1]]) {
      assert.equal((await api.POST(request(type, size, { isPremium: true }))).status, 400);
    }
    assert.equal(api.signed.length, 0);
    assert.equal((await api.POST(request('image/png', 4*1024*1024))).status, 200);
    assert.equal((await api.POST(request('application/octet-stream', 16*1024*1024))).status, 200);
    assert.equal(api.signed[0][3], false);
  }
});
test('paid API permits exact larger boundaries using database status even with stale session', async () => {
  const api = route({ user: { id: 'paid', isPremium: false } }, { isPremium: true, isBanned: false });
  assert.equal((await api.GET()).body.isPremium, true);
  assert.equal((await api.POST(request('image/png', 20*1024*1024))).status, 200);
  assert.equal((await api.POST(request('application/octet-stream', 100*1024*1024))).status, 200);
  assert.equal(api.signed[0][3], true);
  assert.equal((await api.POST(request('image/png', 20*1024*1024+1))).status, 400);
  assert.equal((await api.POST(request('application/octet-stream', 100*1024*1024+1))).status, 400);
  assert.equal(api.signed.length, 2);
});
test('banned users, missing accounts and cross-origin requests cannot sign uploads', async () => {
  for (const user of [null, { isPremium: true, isBanned: true }]) {
    const api = route({ user: { id: 'blocked' } }, user);
    assert.equal((await api.GET()).body.isPremium, false);
    assert.equal((await api.POST(request('image/png', 100))).status, 403);
    assert.equal(api.signed.length, 0);
  }
  const api = route(null, null);
  assert.equal((await api.POST(request('image/png', 100, {}, 'https://other.example'))).status, 403);
});

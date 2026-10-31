import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
function load(relativePath, require, environment) {
  const exports = {};
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, require, process: { env: environment }, Buffer, Date, Number,
  });
  return exports;
}
const environment = { AUTH_SESSION_SECRET: 'unit-test-secret-'.repeat(3), CLAUDE_AGENT_SECRET: 'a'.repeat(32) };
const session = load('../../src/lib/auth/session.ts', name => {
  if (name === 'node:crypto') return crypto;
  if (name === 'next/headers') return {};
  throw new Error(`Unexpected dependency ${name}`);
}, environment);
const agent = load('../../src/lib/agent/auth.ts', name => {
  if (name === 'node:crypto') return crypto;
  if (name === '@/lib/auth/session') return session;
  throw new Error(`Unexpected dependency ${name}`);
}, environment);
const valid = { userId: 'user-1', tenantId: 'tenant-1', accountType: 'TENANT', issuedAt: Date.now(), expiresAt: Date.now() + 60000 };
test('session signée valide, signature altérée et suffixe rejeté', () => {
  const token = session.signSession(valid);
  assert.equal(session.verifySession(token).userId, valid.userId);
  assert.equal(session.verifySession(`${token}.extra`), null);
  assert.equal(session.verifySession(`${token}x`), null);
});
test('les métadonnées signées invalides échouent sans ouvrir de session', () => {
  for (const patch of [{ expiresAt: undefined }, { expiresAt: '9999999999999' }, { expiresAt: valid.issuedAt - 1 }, { accountType: 'ADMIN' }, { tenantId: undefined }, { issuedAt: Date.now() + 120000 }, { accountType: 'SALER' }]) {
    assert.equal(session.verifySession(session.signSession({ ...valid, ...patch })), null);
  }
});
test('une clé agent Unicode est rejetée sans exception de comparaison', () => {
  assert.equal(agent.verifyAgentKey({ headers: { get: () => 'é'.repeat(32) } }), false);
  assert.equal(agent.verifyAgentKey({ headers: { get: () => 'a'.repeat(32) } }), true);
});

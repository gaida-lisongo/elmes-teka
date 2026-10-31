import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const userId = '111111111111111111111111';
const tenantId = '222222222222222222222222';
function fixture({ userActive = true, tenantOwned = true, session = { userId, tenantId, accountType: 'TENANT' } } = {}) {
  const exports = {};
  const queries = [];
  const query = value => ({ select: () => ({ lean: async () => value }) });
  const source = readFileSync(new URL('../../src/lib/auth/require-tenant.ts', import.meta.url), 'utf8');
  const models = {
    User: { findOne: filter => { queries.push(['user', filter]); return query(userActive ? { _id: userId } : null); } },
    Tenant: { findOne: filter => { queries.push(['tenant', filter]); return query(tenantOwned ? { _id: tenantId } : null); } },
  };
  const require = name => {
    if (name === 'mongoose') return { Types: { ObjectId: { isValid: value => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value) } } };
    if (name === '@/lib/auth/session') return { getSession: async () => session };
    if (name === '@/lib/models/User') return models;
    if (name === '@/lib/utils/db') return async () => {};
    throw new Error(`Unexpected dependency ${name}`);
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, { exports, require });
  return { ...exports, queries };
}
test('les mutations tenant revérifient utilisateur actif et propriété en base', async () => {
  const context = fixture();
  assert.equal((await context.requireTenantSession()).tenantId, tenantId);
  assert.equal(context.queries[0][1].status, 'ACTIVE');
  assert.equal(context.queries[1][1].userId, userId);
  assert.equal(context.queries[1][1]._id, tenantId);
  assert.equal(context.queries[1][1].status, 'ACTIVE');
});
test('utilisateur suspendu, relation étrangère, rôle vendeur et ID invalide sont refusés', async () => {
  await assert.rejects(fixture({ userActive: false }).requireTenantSession(), /TENANT_INACTIVE/);
  await assert.rejects(fixture({ tenantOwned: false }).requireTenantSession(), /TENANT_INACTIVE/);
  await assert.rejects(fixture({ session: { userId, tenantId, accountType: 'SALER' } }).requireTenantSession(), /FORBIDDEN_TENANT_ONLY/);
  await assert.rejects(fixture({ session: { userId: 'bad', tenantId, accountType: 'TENANT' } }).requireTenantSession(), /INVALID_TENANT/);
});

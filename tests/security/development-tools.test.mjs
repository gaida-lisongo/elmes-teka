import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports = {};
const source = readFileSync(new URL('../../src/lib/agent/development-tools.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
const { developmentAgentToolsEnabled } = exports;
test('les fixtures destructives exigent environnement de test et opt-in', () => {
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'production', AGENT_TOOLS_ENABLED: 'true' }), false);
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'production' }), false);
  assert.equal(developmentAgentToolsEnabled({ AGENT_TOOLS_ENABLED: 'true' }), false);
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'development' }), false);
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'test', AGENT_TOOLS_ENABLED: 'false' }), false);
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'test', AGENT_TOOLS_ENABLED: 'true' }), true);
  assert.equal(developmentAgentToolsEnabled({ NODE_ENV: 'development', AGENT_TOOLS_ENABLED: 'true' }), true);
});

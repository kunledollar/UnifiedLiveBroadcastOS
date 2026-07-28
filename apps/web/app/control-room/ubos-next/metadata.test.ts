import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaces } from './metadata';

test('UBOS Next metadata is serializable, unwired, and role differentiated', () => {
  assert.equal(new Set(workspaces.map(workspace => workspace.id)).size, 9);
  assert.doesNotThrow(() => JSON.stringify(workspaces));
  for (const workspace of workspaces) {
    assert.ok(workspace.role && workspace.mission && workspace.responsive && workspace.accessibility);
    assert.ok(workspace.panels.length >= 3);
    assert.ok(workspace.commands.every(command => command.binding.status !== ('wired' as never)));
  }
  assert.equal(new Set(workspaces.map(workspace => workspace.panels.slice().sort().join('|'))).size, 9);
});

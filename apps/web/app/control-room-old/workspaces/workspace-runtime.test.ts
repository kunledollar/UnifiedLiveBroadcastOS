import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorkspacePlugin, workspaceRegistry } from './WorkspaceRegistry.js';
import { workspaceById, workspaceIds } from './workspace-catalog.js';

test('workspace registry satisfies the dockable plugin contract', () => {
  for (const plugin of workspaceRegistry) {
    assert.ok(plugin.id && plugin.title && plugin.route.startsWith('/control-room/'));
    assert.equal(typeof plugin.component, 'function');
    assert.equal(typeof plugin.inspector, 'function');
    assert.equal(typeof plugin.workbench, 'function');
  }
});

test('all routed workspaces load a plugin and retain desktop side-by-side monitor geometry', () => {
  for (const id of workspaceIds) {
    assert.equal(getWorkspacePlugin(id).id, id);
    assert.equal(workspaceById[id]!.geometry.orientation, id === 'monitor-wall' ? 'grid' : 'horizontal-split');
  }
});

test('workspace modules provide distinct workbench and inspector surfaces', () => {
  assert.notEqual(getWorkspacePlugin('director').workbench, getWorkspacePlugin('audio-engineer').workbench);
  assert.notEqual(getWorkspacePlugin('sources').inspector, getWorkspacePlugin('social-fabric').inspector);
});

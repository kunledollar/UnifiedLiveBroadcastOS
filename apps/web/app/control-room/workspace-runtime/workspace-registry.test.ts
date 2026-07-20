import assert from 'node:assert/strict';
import test from 'node:test';
import {workspaceRegistry,getWorkspacePlugin} from './workspace-registry.js';
import {defaultLayoutMetadata} from './layout-persistence.js';

test('workspace registry registers the v5.15.3 operational surfaces through the plugin contract',()=>{
  const expected=['director','solo-streamer','technical-director','audio-engineer','graphics-operator','replay-operator','streaming-operator','monitor-wall','compact','scenes','sources','social-fabric','guests','automation','scheduler','ai-producer','emergency-control'];
  assert.deepEqual(workspaceRegistry.map(plugin=>plugin.id),expected);
  for(const plugin of workspaceRegistry){assert.ok(plugin);assert.ok(plugin!.route.startsWith('/control-room/'));assert.equal(typeof plugin!.component,'function');assert.equal(typeof plugin!.inspector,'function');assert.equal(typeof plugin!.workbench,'function');assert.ok(plugin!.shortcuts.length>0);}
});
test('registry lookup has a director fallback and workspace-specific workbench/inspector components',()=>{assert.equal(getWorkspacePlugin('missing').id,'director');assert.notEqual(getWorkspacePlugin('audio-engineer').workbench,getWorkspacePlugin('graphics-operator').workbench);assert.notEqual(getWorkspacePlugin('sources').inspector,getWorkspacePlugin('social-fabric').inspector);});
test('layout persistence metadata stores only workspace layout metadata defaults',()=>{const metadata=defaultLayoutMetadata(getWorkspacePlugin('director').defaultLayout);assert.deepEqual(Object.keys(metadata).sort(),['bottomHeight','inspectorCollapsed','inspectorWidth','previewWeight','programWeight','selectedTab']);assert.equal(metadata.inspectorCollapsed,false);});

const assert = Object.assign((value: unknown, message?: string) => { if (!value) throw new Error(message ?? 'assertion failed'); }, { equal: (a: unknown, b: unknown) => { if (a !== b) throw new Error(`Expected ${String(a)} to equal ${String(b)}`); }, deepEqual: (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Expected ${JSON.stringify(a)} to deepEqual ${JSON.stringify(b)}`); }, throws: (fn: () => unknown, re: RegExp) => { try { fn(); } catch (e) { if (re.test(e instanceof Error ? e.message : String(e))) return; throw e; } throw new Error('Expected function to throw'); }, ok: (v: unknown) => { if (!v) throw new Error('Expected truthy value'); } });
import { createInitialProductionGraph, type ProductionGraph } from '../production-graph.js';
import { RundownRuntimeController, RUNDOWN_TRANSITIONS, ITEM_TRANSITIONS, mapRundownToProductionGraphMetadata } from './index.js';

function graph(): ProductionGraph {
  const g = createInitialProductionGraph({ broadcastSessionId: 's1', timestamp: '2026-07-10T00:00:00.000Z' });
  return {
    ...g,
    status: 'live',
    scenes: { scene1: { id: 'scene1', name: 'Opening', order: 1, sourceIds: ['src1'], canvasIds: [], overlayIds: ['gfx1'], metadata: {}, createdAt: g.createdAt, updatedAt: g.updatedAt } },
    sources: { src1: { id: 'src1', name: 'Camera 1', type: 'camera', enabled: true, metadata: {} } },
    destinations: { out1: { id: 'out1', name: 'Program', platform: 'rtmp', enabled: true, status: 'ready', metadata: {} } },
    overlays: { gfx1: { id: 'gfx1', name: 'Lower Third', enabled: true, metadata: {} } },
    guests: { guest1: { id: 'guest1', displayName: 'Guest', status: 'connected', muted: false, pinned: false, sourceId: 'src1', metadata: {} } },
    plugins: { 'device:dev1': { metadataOnly: true }, 'replay:clip1': { metadataOnly: true } },
  };
}
const events: unknown[] = [];
const health: unknown[] = [];
const controller = new RundownRuntimeController(graph(), { eventBus: { publish: (e) => events.push(e) }, healthManager: { updateRundownHealth: (h) => health.push(h) } });

const rundown = controller.createRundown({ rundownId: 'r1', sessionId: 's1', title: 'Morning Show' });
assert.equal(rundown.state, 'created');
assert.throws(() => controller.createRundown({ rundownId: 'r1', sessionId: 's1', title: 'Duplicate' }), /Duplicate rundown/);
assert.throws(() => controller.createRundown({ rundownId: 'bad', sessionId: 's2', title: 'Wrong session' }), /session/);

controller.addItem('r1', { itemId: 'i2', title: 'B', itemType: 'media', order: 2, sourceReferences: ['src1'], requiredDevices: ['dev1'], requiredInputs: ['src1'], requiredOutputs: ['out1'], graphicsReference: 'gfx1', replayReference: 'clip1', durationEstimateMs: 1000, executionMode: 'operator-confirmed' });
controller.addItem('r1', { itemId: 'i1', title: 'A', itemType: 'scene', order: 1, sceneReference: 'scene1', sourceReferences: ['src1'], durationEstimateMs: 1000 });
assert.deepEqual(controller.listRundowns('s1')[0]!.items.map((i) => i.itemId), ['i1', 'i2']);
assert.throws(() => controller.addItem('r1', { itemId: 'unsafe', title: 'Unsafe', metadata: { streamHandle: 'x' } }), /handle/i);

assert.ok(RUNDOWN_TRANSITIONS.created.includes('loading'));
assert.ok(ITEM_TRANSITIONS.ready.includes('cued'));
assert.throws(() => controller.startRundown('r1'), /Illegal rundown transition/);
controller.loadRundown('r1');
const validation = controller.validateRundown('r1');
assert.equal(validation.state, 'validated');
assert.equal(controller.getNextItem('r1')!.itemId, 'i1');

controller.startRundown('r1');
controller.cueItem('r1', 'i2');
assert.equal(controller.getNextItem('r1')!.itemId, 'i2');
controller.jumpToItem('r1', 'i1');
assert.equal(controller.getNextItem('r1')!.itemId, 'i1');
controller.takeNext('r1', 'take-1');
assert.equal(controller.getCurrentItem('r1')!.itemId, 'i1');
assert.throws(() => controller.takeNext('r1', 'take-1'), /Duplicate/);
assert.throws(() => controller.updateItem('r1', 'i1', { title: 'Mutating executing item' }), /executing/);
controller.completeItem('r1', 'i1');
controller.holdItem('r1', 'i2');
assert.equal(controller.listRundowns('s1')[0]!.items.find((i) => i.itemId === 'i2')!.status, 'held');
controller.resumeItem('r1', 'i2');
controller.skipItem('r1', 'i2');
assert.equal(controller.getHistory('r1').some((h) => h.command === 'skip item'), true);

const meta = controller.productionGraphMetadata('r1');
assert.equal(meta.activeRundown.rundownId, 'r1');
assert.equal(meta.itemStatus.i2, 'skipped');
assert.deepEqual(meta, mapRundownToProductionGraphMetadata(controller.listRundowns('s1')[0]!, controller.getHistory('r1').at(-1)!.command, meta.validationStatus!));
assert.ok(events.some((e) => (e as { type?: string }).type === 'RundownItemStarted'));
assert.ok(health.length > 0);

const snapshot = controller.createSnapshot('r1');
assert.equal(snapshot.schemaVersion, '4.7');
const restored = controller.restoreSnapshot(snapshot);
assert.equal(restored.state, 'recovering');
assert.throws(() => controller.restoreSnapshot({ ...snapshot, rundownVersion: -1 }), /Malformed|stale/);
assert.equal(controller.getMetrics('r1').totalItems, 2);
controller.disposeRundown('r1');
assert.equal(controller.listRundowns('s1').length, 0);

const bad = new RundownRuntimeController(graph());
bad.createRundown({ rundownId: 'bad-r', sessionId: 's1', title: 'Bad' });
bad.loadRundown('bad-r');
bad.addItem('bad-r', { itemId: 'bad-i', title: 'Bad', sceneReference: 'missing', sourceReferences: ['missing'], requiredDevices: ['missing'], requiredInputs: ['missing'], requiredOutputs: ['missing'], graphicsReference: 'missing', replayReference: 'missing', durationEstimateMs: -1, transitionMetadata: { durationMs: -1 } });
const badResult = bad.validateRundown('bad-r');
assert.equal(badResult.state, 'failed');
assert.ok(bad.getHistory('bad-r').some((h) => h.result === 'failed'));

console.log('rundown-runtime validation passed');

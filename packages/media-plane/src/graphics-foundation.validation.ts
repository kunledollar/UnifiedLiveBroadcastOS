import {
  GraphicsFoundationProcessor,
  createGraphicsFoundationEngine,
  type GraphicsDefinition,
} from './graphics-foundation.js';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(`Graphics v5.9.1 validation failed: ${message}`); };
const throws = (fn: () => unknown, message: string) => { let ok=false; try { fn(); } catch { ok=true; } assert(ok, message); };
const def = (id: string, generation = 1): GraphicsDefinition => Object.freeze({
  id, version: '5.9.1', generation, displayName: id, type: 'FOUNDATION_GRAPHIC', width: 1, height: 1, aspectRatio: '16:9', safeMetadata: { title: id }, createdAtNs: generation, updatedAtNs: generation,
  layers: [Object.freeze({ id: 'content', role: 'CONTENT', zOrder: 1, elementIds: ['text'], safeMetadata: {} })],
  elements: [Object.freeze({ id: 'text', generation, elementType: 'TEXT', text: `hello ${generation}`, fontReference: 'font:metadata', styleReference: 'style:metadata', alignment: 'CENTER', anchor: 'CENTER', opacity: 1, transform: { translateX:0, translateY:0, scaleX:1, scaleY:1, rotationDegrees:0, metadataOnly:true as const }, colorMetadata: { color: 'white' }, visibility: { visible: true, opacity: 1, lifecycle: 'READY' as const, safeMetadata: {} }, safeMetadata: {} })]
}) as GraphicsDefinition;

const engine = createGraphicsFoundationEngine('validation');
engine.create(def('g1'));
engine.show('g1', 1);
assert(engine.snapshot().health.activeGraphics === 1, 'show activates graphics');
engine.hide('g1', 2);
assert(engine.snapshot().health.hiddenGraphics === 1, 'hide hides graphics');
engine.update(def('g1', 2));
throws(() => engine.update(def('g1', 2)), 'stale generation rejected');
throws(() => engine.create(def('g1', 3)), 'duplicate id rejected');
const snap = engine.snapshot();
throws(() => ((snap.definitions as unknown as unknown[]).push(def('bad'))), 'snapshots are immutable');
assert(snap.sourceGraph.metadataOnly && !snap.sourceGraph.realRendering, 'source graph is metadata only');
engine.delete('g1', 3);
assert(engine.snapshot().health.graphicsCount === 0, 'delete removes definition');
const replayA = createGraphicsFoundationEngine('replay-a');
const replayB = createGraphicsFoundationEngine('replay-b');
for (let i=0; i<10000; i++) { const id=`g${i}`; replayA.create(def(id)); replayB.create(def(id)); if (i%2===0) { replayA.show(id,1); replayB.show(id,1); } }
for (let t=0; t<100000; t++) { replayA.processFrame({ frameNumber: BigInt(t), startedAtNs: BigInt(t), deadlineAtNs: BigInt(t+1), scheduledTimeNs: BigInt(t+1), actualTimeNs: BigInt(t), presentationTimeNs: BigInt(t), frameDurationNs: 1n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false }, false); replayB.processFrame({ frameNumber: BigInt(t), startedAtNs: BigInt(t), deadlineAtNs: BigInt(t+1), scheduledTimeNs: BigInt(t+1), actualTimeNs: BigInt(t), presentationTimeNs: BigInt(t), frameDurationNs: 1n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false }, false); }
assert(JSON.stringify(replayA.snapshot().health) === JSON.stringify(replayB.snapshot().health), 'deterministic replay health');
assert(replayA.snapshot().health.duplicateIds === 0, 'long run has zero duplicate ids');
assert(replayA.snapshot().health.generationMismatches === 0, 'long run has zero generation mismatches');
const processor = new GraphicsFoundationProcessor(createGraphicsFoundationEngine('processor'));
assert(processor.initialize().status === 'READY', 'processor initializes');
assert(processor.processTick({ frameNumber: 1n, startedAtNs: 1n, deadlineAtNs: 2n, scheduledTimeNs: 2n, actualTimeNs: 1n, presentationTimeNs: 1n, frameDurationNs: 1n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false }, undefined as never).status === 'SUCCEEDED', 'processor executes');
assert(processor.shutdown().status === 'STOPPED', 'shutdown cleanup');
console.log('UBOS v5.9.1 graphics foundation validation passed');

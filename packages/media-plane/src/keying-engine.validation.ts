/* eslint-disable @typescript-eslint/no-explicit-any */
const assert = { equal(a: unknown, b: unknown) { if (a !== b) throw new Error(`Assertion failed: ${String(a)} !== ${String(b)}`); }, notEqual(a: unknown, b: unknown) { if (a === b) throw new Error(`Assertion failed: ${String(a)} === ${String(b)}`); }, ok(v: unknown) { if (!v) throw new Error('Assertion failed'); }, throws(fn: () => unknown, re: RegExp) { try { fn(); } catch (e) { if (re.test(String(e))) return; throw e; } throw new Error('Expected throw'); } };
import { SyntheticFrameMemoryManager, type FrameLease } from './frame-memory.js';
import { KeyingEngine, KeyingPipelineStage, SyntheticKeyingBackend, blueKeyingPreset, createKeyingCommandHandlers, createKeyingSourceGraphMetadata, greenKeyingPreset, validateKeyingParameters } from './keying-engine.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';

let t = 1000n;
const nowNs = () => (t += 1000n);
const frame = (lease: FrameLease): VideoPipelineFrameReference => ({
  frameId: lease.frameId, storageId: lease.frameId, frameGeneration: lease.generation, storageGeneration: lease.generation,
  leaseId: lease.leaseId, ownerId: 'TEST', sourceId: 'src', streamId: 'main', sequenceNumber: 1n, runtimeFrameNumber: 1n,
  format: { format: 'RGBA8', width: 16, height: 9, alphaMode: 'STRAIGHT' }, memoryDomain: 'CPU', state: 'LEASED',
  sourceTimestampNs: 10n, normalizedTimestampNs: 10n, discontinuity: false, metadata: { colorMetadata: { transfer: 'srgb' } },
});

const fm = new SyntheticFrameMemoryManager(nowNs);
const inputLease = await fm.allocate({ width: 16, height: 9, format: 'RGBA8', memoryDomain: 'SYNTHETIC', ownerId: 'TEST', usageFlags: ['SOURCE_INPUT'], accessMode: 'READ_ONLY' });
const input = frame(inputLease);

const engine = new KeyingEngine(4, nowNs);
assert.throws(() => engine.registerBackend(new SyntheticKeyingBackend()), /DuplicateKeyingBackend/);
const green = greenKeyingPreset();
const blue = blueKeyingPreset();
assert.equal(validateKeyingParameters(green).valid, true);
assert.throws(() => validateKeyingParameters({ ...green, softness: -1 }), /KeyingParametersInvalid|KeyingParameterOutOfRange/);
assert.throws(() => validateKeyingParameters({ ...green, keyColorSpace: 'XYZ' as any }), /KeyingColorSpaceUnsupported/);

const planA = engine.plan({ requestId: 'p1', inputFrame: input, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' });
const planB = engine.plan({ requestId: 'p2', inputFrame: input, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' });
assert.equal(planA.planId, planB.planId);
assert.equal(engine.getTelemetry().cacheHits, 1);
const shuffled = new KeyingEngine(4, nowNs);
shuffled.registerBackend(new SyntheticKeyingBackend({ backendId: 'z-backend' }));
const shuffledPlan = shuffled.plan({ requestId: 'p3', inputFrame: input, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' });
assert.equal(shuffledPlan.selectedBackendId, 'synthetic-keying-reference');

const passParams = { ...green, enabled: false, keyMode: 'BYPASS' as const, outputMode: 'PASSTHROUGH' as const };
const pass = await engine.execute({ requestId: 'r-pass', sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: passParams, outputMode: 'PASSTHROUGH', parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' }, { frameMemory: fm, nowNs });
assert.equal(pass.status, 'PASSED_THROUGH');
assert.equal(pass.outputForeground?.frameId, input.frameId);

const keyed = await engine.execute({ requestId: 'r-key', sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' }, { frameMemory: fm, nowNs });
assert.equal(keyed.status, 'COMPLETED');
assert.notEqual(keyed.outputForeground?.frameId, input.frameId);
assert.equal(keyed.outputForeground?.sourceTimestampNs, input.sourceTimestampNs);
assert.equal(keyed.spillSuppressionApplied, true);
assert.ok(createKeyingSourceGraphMetadata(keyed).keyingEnabled);

const matteParams = { ...blue, outputMode: 'MATTE_ONLY' as const, edgeFeather: 2, edgeChoke: 1, matteGamma: 1.2, invertMatte: true };
const matte = await engine.execute({ requestId: 'r-matte', sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: matteParams, outputMode: 'MATTE_ONLY', parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' }, { frameMemory: fm, nowNs });
assert.equal(matte.outputMode, 'MATTE_ONLY');
assert.ok(matte.outputMatte);
assert.equal(matte.matteRefinementApplied, true);

const ac = new AbortController(); ac.abort();
const cancelled = await engine.execute({ requestId: 'r-cancel', sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1', cancellationSignal: ac.signal }, { frameMemory: fm, nowNs });
assert.equal(cancelled.status, 'CANCELLED');

const failing = new KeyingEngine(4, nowNs); failing.unregisterBackend('synthetic-keying-reference'); failing.registerBackend(new SyntheticKeyingBackend({ backendId: 'fail', fail: true }));
const failed = await failing.execute({ requestId: 'r-fail', sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: green, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: '1' }, { frameMemory: fm, nowNs });
assert.equal(failed.status, 'FAILED');

for (let i = 0; i < 10000; i++) engine.plan({ requestId: `lp-${i}`, inputFrame: input, parameters: { ...green, similarity: (i % 100) / 100 }, outputMode: green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: String(i % 8) });
assert.ok(engine.getHealth().planCacheSize <= 4);
for (let i = 0; i < 10000; i++) await engine.execute({ requestId: `op-${i}`, sourceId: 'src', streamId: 'main', inputFrame: input, inputLease, expectedFrameGeneration: input.frameGeneration, expectedStorageGeneration: input.storageGeneration, parameters: i % 3 === 0 ? green : i % 3 === 1 ? matteParams : { ...green, keyMode: 'LUMA', keyColorSpace: 'RGB', spillSuppression: false }, outputMode: i % 3 === 1 ? 'MATTE_ONLY' : green.outputMode, parameterPolicy: 'REJECT_OUT_OF_RANGE', pipelineConfigurationGeneration: 'load' }, { frameMemory: fm, nowNs });
for (let i = 0; i < 100000; i++) { if (i % 1000 === 0) engine.assertInvariants(); }

const stageFm = new SyntheticFrameMemoryManager(nowNs);
const stageInputLease = await stageFm.allocate({ width: 16, height: 9, format: 'RGBA8', memoryDomain: 'SYNTHETIC', ownerId: 'TEST', usageFlags: ['SOURCE_INPUT'], accessMode: 'READ_ONLY' });
const stageInput = frame(stageInputLease);
const stage = new KeyingPipelineStage(engine, stageFm, green);
const sr = await stage.process({ inputFrame: stageInput, priorStageOutputs: new Map(), frameContext: {} } as any, { requestId: 'stage', nowNs, cancellationSignal: new AbortController().signal, configuration: { generation: 1 } } as any);
assert.equal(sr.status, 'COMPLETED');
assert.equal(stage.descriptor.stageKind, 'KEYING');
const handlers = createKeyingCommandHandlers(engine);
assert.ok(handlers.KEYING_VALIDATE);
engine.assertInvariants();
await engine.shutdown();
engine.assertInvariants();
console.log('UBOS v5.4.1 keying engine validation passed');

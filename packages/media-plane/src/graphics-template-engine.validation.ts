const assert = { equal: (actual: unknown, expected: unknown) => { if (actual !== expected) throw new Error(`Expected ${String(actual)} to equal ${String(expected)}`); }, deepEqual: (actual: unknown, expected: unknown) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(actual)} to deepEqual ${JSON.stringify(expected)}`); }, throws: (fn: () => unknown, errorType: new (...args: never[]) => Error) => { try { fn(); } catch (error) { if (error instanceof errorType) return; throw error; } throw new Error('Expected function to throw'); } };
import { createGraphicsTemplateEngine, createGraphicsTemplateProcessor, GraphicsTemplateEngineError, type GraphicsTemplateDefinition } from './graphics-template-engine.js';

const baseGraphics = {
  id: 'lower-third-base', version: '1.0.0', generation: 1, displayName: 'Lower Third Base', type: 'LOWER_THIRD', width: 1920, height: 1080, aspectRatio: '16:9', createdAtNs: 1, updatedAtNs: 1, safeMetadata: {},
  layers: [{ id: 'text-layer', role: 'OVERLAY' as const, zOrder: 10, elementIds: ['headline'], safeMetadata: {} }],
  elements: [{ id: 'headline', generation: 1, elementType: 'TEXT' as const, text: '{{headline}}', fontReference: 'font:brand:sans', styleReference: 'style:lower-third', alignment: 'START' as const, anchor: 'LEFT' as const, opacity: 1, transform: { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotationDegrees: 0, metadataOnly: true as const }, colorMetadata: {}, visibility: { visible: true, opacity: 1, lifecycle: 'READY' as const, safeMetadata: {} }, safeMetadata: {} }],
};
const template: GraphicsTemplateDefinition = { id: 'template:lower-third', version: '1.0.0', generation: 1, displayName: 'Dynamic Lower Third', lifecycle: 'READY', baseGraphics, fields: [{ id: 'headline', type: 'TEXT', required: true, safeMetadata: {} }, { id: 'accent', type: 'COLOR', required: false, defaultValue: 'brand-blue', safeMetadata: {} }], bindings: [{ id: 'binding:headline', fieldId: 'headline', targetElementId: 'headline', bindingType: 'TEXT_CONTENT', targetProperty: 'text', required: true, safeMetadata: {} }], outputRoles: ['PROGRAM', 'PREVIEW'], safeMetadata: { token: 'redacted', department: 'graphics' } };

const tick = (frame: number) => ({ frameNumber: BigInt(frame), startedAtNs: BigInt(frame) * 16_666_667n, deadlineAtNs: BigInt(frame) * 16_666_667n, scheduledTimeNs: BigInt(frame) * 16_666_667n, actualTimeNs: BigInt(frame) * 16_666_667n, presentationTimeNs: BigInt(frame) * 16_666_667n, frameDurationNs: 16_666_667n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false });
const engine = createGraphicsTemplateEngine();
const registered = engine.registerTemplate(template);
assert.equal(registered.safeMetadata.token, undefined);
assert.throws(() => engine.registerTemplate(template), GraphicsTemplateEngineError);
const instance = engine.createInstance({ instanceId: 'instance:program', templateId: template.id, templateGeneration: 1, generation: 1, outputRole: 'PROGRAM', values: { headline: 'Election Night' }, safeMetadata: {} });
assert.equal(instance.outputRole, 'PROGRAM');
const publication = engine.evaluate(instance.instanceId);
assert.equal(publication.dataSnapshot.resolvedValues.headline, 'Election Night');
assert.equal(publication.dataSnapshot.resolvedValues.accent, 'brand-blue');
assert.equal(publication.metadataOnly, true);
assert.equal(publication.realRendering, false);
const missing = engine.createInstance({ instanceId: 'instance:preview', templateId: template.id, templateGeneration: 1, generation: 1, outputRole: 'PREVIEW', values: {}, safeMetadata: {} });
assert.equal(engine.evaluate(missing.instanceId).dataSnapshot.missingFields.includes('headline'), true);
const snapshot = engine.processFrame(tick(1));
if (!snapshot) throw new Error('Expected published snapshot');
assert.equal(snapshot.health.templates, 1);
assert.equal(snapshot.health.instances, 2);
assert.equal(snapshot.telemetry.realDataFetch, false);
assert.deepEqual([...snapshot.sourceGraph.outputRoles].sort(), ['PREVIEW', 'PROGRAM']);
for (let frame = 2; frame <= 100_000; frame++) engine.processFrame(tick(frame), false);
assert.equal(engine.snapshot().telemetry.ticksProcessed, 100_000);
const processor = createGraphicsTemplateProcessor(engine);
assert.equal(processor.initialize().status, 'READY');
console.log('UBOS v5.9.2 graphics template engine validation passed');

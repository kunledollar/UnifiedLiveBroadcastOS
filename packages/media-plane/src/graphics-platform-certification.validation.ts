import {
  GRAPHICS_FOUNDATION_PROCESSOR_ORDER,
  GRAPHICS_TEMPLATE_PROCESSOR_ORDER,
  BROADCAST_GRAPHICS_PROCESSOR_ORDER,
  CAPTION_ACCESSIBILITY_PROCESSOR_ORDER,
  GRAPHICS_ANIMATION_CUEING_PROCESSOR_ORDER,
  BRANDING_SAFE_AREA_PROCESSOR_ORDER,
  MULTI_FORMAT_GRAPHICS_PROCESSOR_ORDER,
  createGraphicsFoundationEngine,
  createGraphicsTemplateEngine,
  createBroadcastGraphicsEngine,
  createCaptionAccessibilityEngine,
  createGraphicsAnimationCueingEngine,
  createBrandingSafeAreaCoordinatorEngine,
  createMultiFormatGraphicsCoordinatorEngine,
} from './index.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`UBOS v5.9.8 graphics platform certification failed: ${message}`);
};
const json = (value: unknown) => JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item));

const order = [
  GRAPHICS_FOUNDATION_PROCESSOR_ORDER,
  GRAPHICS_TEMPLATE_PROCESSOR_ORDER,
  BROADCAST_GRAPHICS_PROCESSOR_ORDER,
  CAPTION_ACCESSIBILITY_PROCESSOR_ORDER,
  GRAPHICS_ANIMATION_CUEING_PROCESSOR_ORDER,
  BRANDING_SAFE_AREA_PROCESSOR_ORDER,
  MULTI_FORMAT_GRAPHICS_PROCESSOR_ORDER,
];
assert(new Set(order).size === order.length, 'processor order constants are unique');
for (let i = 1; i < order.length; i++) assert(order[i]! > order[i - 1]!, 'processor order is strictly increasing');

const engines = [
  ['graphics/text', createGraphicsFoundationEngine('certification').snapshot()],
  ['template/data-binding', createGraphicsTemplateEngine().snapshot()],
  ['broadcast graphics', createBroadcastGraphicsEngine().snapshot()],
  ['captions/accessibility', createCaptionAccessibilityEngine().snapshot()],
  ['animation/cueing', createGraphicsAnimationCueingEngine().snapshot()],
  ['branding/safe-area', createBrandingSafeAreaCoordinatorEngine().snapshot()],
  ['multi-format/output-role', createMultiFormatGraphicsCoordinatorEngine().snapshot()],
] as const;

for (const [name, snapshot] of engines) {
  const serialized = json(snapshot);
  assert(serialized.length > 0, `${name} exposes serializable metadata state`);
  assert(!serialized.includes('HTMLCanvasElement'), `${name} does not expose browser canvas handles`);
  assert(!serialized.includes('GPUDevice'), `${name} does not expose GPU handles`);
  assert(!serialized.includes('rawImageBytes'), `${name} does not expose raw image bytes`);
  assert(!serialized.includes('credential'), `${name} does not expose credential fields in empty certification state`);
}

const first = engines.map(([name, snapshot]) => [name, json(snapshot)]);
const second = [
  ['graphics/text', createGraphicsFoundationEngine('certification').snapshot()],
  ['template/data-binding', createGraphicsTemplateEngine().snapshot()],
  ['broadcast graphics', createBroadcastGraphicsEngine().snapshot()],
  ['captions/accessibility', createCaptionAccessibilityEngine().snapshot()],
  ['animation/cueing', createGraphicsAnimationCueingEngine().snapshot()],
  ['branding/safe-area', createBrandingSafeAreaCoordinatorEngine().snapshot()],
  ['multi-format/output-role', createMultiFormatGraphicsCoordinatorEngine().snapshot()],
].map(([name, snapshot]) => [name, json(snapshot)]);
assert(json(first) === json(second), 'empty-platform deterministic replay is stable across all v5.9 engines');

for (let frame = 0; frame < 1000; frame++) {
  const tick = { frameNumber: BigInt(frame), startedAtNs: BigInt(frame), deadlineAtNs: BigInt(frame + 1), scheduledTimeNs: BigInt(frame), actualTimeNs: BigInt(frame), presentationTimeNs: BigInt(frame), frameDurationNs: 1n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false };
  createGraphicsFoundationEngine(`frame:${frame}`).processFrame(tick, false);
}

console.log('UBOS v5.9.8 graphics platform certification validation passed');

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  UIGEventNormalizer,
  canonicalTypeToNodeType,
} from './uigEventNormalizer.js';

test('UENL maps raw engine types to canonical event types', () => {
  const n = new UIGEventNormalizer();

  assert.equal(
    n.mapType({ type: 'SceneNode', source: 'scene-graph', payload: { program: true } }),
    'scene.active',
  );
  assert.equal(
    n.mapType({ type: 'SceneNode', source: 'scene-graph', payload: { missing: true } }),
    'scene.missing_source',
  );
  assert.equal(
    n.mapType({ type: 'AudioNode', source: 'audio-engine', payload: { peak: 0.4 } }),
    'audio.level',
  );
  assert.equal(
    n.mapType({ type: 'RoutingNode', source: 'routing-engine', payload: { broken: true } }),
    'routing.destination_error',
  );
  assert.equal(
    n.mapType({ type: 'OutputNode', source: 'output-engine', payload: { droppedFrames: 3 } }),
    'output.frame_drop',
  );
  assert.equal(
    n.mapType({ type: 'HealthNode', source: 'health-engine', payload: { status: 'ok' } }),
    'system.healthy',
  );
  assert.equal(
    n.mapType({ type: 'HealthNode', source: 'health-engine', payload: { status: 'error' } }),
    'system.degraded',
  );
  assert.equal(
    n.mapType({ type: 'ai.insight', source: 'ai-crew', payload: { message: 'x' } }),
    'ai.insight',
  );
});

test('UENL normalize produces canonical shape with lineage and lowercase attributes', () => {
  const n = new UIGEventNormalizer();
  n.setContext({ workspace: 'analytics', operator: 'director-1', system: 'ubos-control-room' });

  const event = n.normalize({
    id: 'audio:mix',
    type: 'AudioNode',
    source: 'audio-engine',
    payload: { Peak: 0.98, RMS: 0.55, cameraId: 'cam-a' },
  });

  assert.equal(event.id, 'audio:mix');
  assert.equal(event.type, 'audio.level');
  assert.equal(event.source, 'audio-engine');
  assert.equal(event.workspace, 'analytics');
  assert.equal(event.operator, 'director-1');
  assert.equal(event.attributes.peak, 0.98);
  assert.equal(event.attributes.rms, 0.55);
  assert.equal(event.attributes.cameraid, 'cam-a');
  assert.equal(event.attributes.system, 'ubos-control-room');
  assert.ok(event.confidence >= 0.9);
  assert.ok(event.timestamp > 0);
  assert.deepEqual(event.lineage.slice(0, 3), ['engine', 'audio-engine', 'normalizer']);
});

test('canonicalTypeToNodeType maps event families onto UIG nodes', () => {
  assert.equal(canonicalTypeToNodeType('scene.active'), 'SceneNode');
  assert.equal(canonicalTypeToNodeType('graphics.error'), 'GraphicsNode');
  assert.equal(canonicalTypeToNodeType('audio.level'), 'AudioNode');
  assert.equal(canonicalTypeToNodeType('replay.marker_added'), 'ReplayNode');
  assert.equal(canonicalTypeToNodeType('routing.path_change'), 'RoutingNode');
  assert.equal(canonicalTypeToNodeType('automation.trigger_fired'), 'AutomationNode');
  assert.equal(canonicalTypeToNodeType('output.frame_drop'), 'OutputNode');
  assert.equal(canonicalTypeToNodeType('system.degraded'), 'HealthNode');
  assert.equal(canonicalTypeToNodeType('ai.insight'), 'PredictionNode');
  assert.equal(canonicalTypeToNodeType('operator.presence'), 'OperatorNode');
  assert.equal(canonicalTypeToNodeType('system.unknown'), 'SystemNode');
});

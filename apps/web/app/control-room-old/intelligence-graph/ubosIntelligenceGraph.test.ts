import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

test('UIG ingest normalizes events, derives edges, and runs inference', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'op-1', system: 'ubos-control-room' });

  graph.ingest({
    id: 'scene:current',
    type: 'SceneNode',
    source: 'scene-graph',
    payload: { name: 'Main', program: true, layerIds: ['lower-third'] },
  });

  graph.ingest({
    id: 'audio:mix',
    type: 'AudioNode',
    source: 'audio-engine',
    payload: { peak: 0.98, rms: 0.7 },
  });

  graph.ingest({
    id: 'health:output',
    type: 'HealthNode',
    source: 'health-engine',
    payload: { subsystem: 'output', status: 'error' },
  });

  const scene = graph.getNode('scene:current');
  assert.ok(scene);
  assert.equal(scene.type, 'SceneNode');
  assert.equal(scene.eventType, 'scene.active');
  assert.equal(scene.workspace, 'production');
  assert.equal(scene.operator, 'op-1');
  assert.deepEqual(scene.lineage?.slice(0, 3), ['engine', 'scene-graph', 'normalizer']);
  assert.ok(scene.timestamp > 0);
  assert.ok(Array.isArray(scene.attributes.layerids));
  assert.equal((scene.attributes.layerids as string[])[0], 'lower-third');

  const edges = graph.getEdges();
  assert.ok(edges.some((e) => e.from === 'scene:current' && e.to === 'output:program' && e.type === 'feeds_into'));
  assert.ok(edges.some((e) => e.from === 'audio:mix' && e.to === 'health:audio' && e.type === 'is_degraded_by'));
  assert.ok(edges.some((e) => e.from === 'health:output' && e.type === 'is_degraded_by'));

  const insights = graph.getInsights();
  assert.ok(insights.some((i) => i.kind === 'warning' && i.message === 'Audio clipping risk'));
  assert.ok(insights.some((i) => i.kind === 'warning' && i.message.toLowerCase().includes('output')));

  const snapshot = graph.getSnapshot();
  assert.equal(snapshot.nodeCount, 3);
  assert.ok(snapshot.edgeCount >= 2);
  assert.ok(snapshot.insightCount >= 2);
  assert.equal(snapshot.eventCount, 3);
  assert.equal(snapshot.latestEvents[0]?.type, 'system.degraded');
  assert.equal(snapshot.nodesByType.SceneNode, 1);
  assert.equal(snapshot.nodesByType.AudioNode, 1);
  assert.equal(snapshot.nodesByType.HealthNode, 1);
});

test('UIG ingestBatch updates graph once and supports routing warnings', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.ingestBatch([
    {
      id: 'scene:current',
      type: 'SceneNode',
      source: 'scene-graph',
      payload: { missing: true },
    },
    {
      id: 'routing:1',
      type: 'RoutingNode',
      source: 'routing-engine',
      payload: { source: 'cam-a', destination: 'program', broken: true },
    },
  ]);

  assert.equal(graph.getNodes().length, 2);
  assert.equal(graph.getNode('scene:current')?.eventType, 'scene.missing_source');
  assert.equal(graph.getNode('routing:1')?.eventType, 'routing.destination_error');
  const insights = graph.getInsights();
  assert.ok(insights.some((i) => i.message === 'Scene has missing source'));
  assert.ok(insights.some((i) => i.message === 'Routing path failure'));
});

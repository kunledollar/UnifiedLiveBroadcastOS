import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

test('UIE Phase 1 rules: missing source, audio danger, routing break, output degradation', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'director', system: 'ubos-control-room' });

  graph.ingestBatch([
    {
      id: 'scene:current',
      type: 'scene.missing_source',
      source: 'scene-graph',
      payload: { missing: true, missing_sources: ['cam-a'] },
    },
    {
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      payload: { peak: 0.97 },
    },
    {
      id: 'routing:1',
      type: 'routing.path_change',
      source: 'routing-engine',
      payload: { source: 'cam-a', destination: 'program', broken: true },
    },
    {
      id: 'output:program',
      type: 'output.health_update',
      source: 'output-engine',
      payload: { dropped_frames: 5, latency: 40 },
    },
    {
      id: 'operator:1',
      type: 'operator.presence',
      source: 'multi-user',
      workspace: 'production',
      payload: { name: 'director', workspace: 'production' },
    },
  ]);

  const results = graph.getInferenceResults();
  assert.ok(results.some((r) => r.rule === 'rule.missing_source' && r.message === 'Scene has missing source'));
  assert.ok(results.some((r) => r.rule === 'rule.audio_danger' && r.message === 'Audio clipping risk'));
  assert.ok(results.some((r) => r.rule === 'rule.routing_break' && r.message === 'Routing path failure'));
  assert.ok(results.some((r) => r.rule === 'rule.output_degradation' && r.message === 'Output degraded'));
  assert.ok(results.some((r) => r.rule === 'rule.operator_awareness' && r.kind === 'workspace_highlight'));
  assert.ok(graph.getUiEmphasis().length > 0);
  assert.ok(graph.getAutomationTriggers().length > 0);
  assert.ok(graph.getHighlightedNodeIds().length > 0);
});

test('UIE Rule 2 graphics conflict and Rule 8 graphics activation prediction', () => {
  const graph = new UBOSIntelligenceGraph();

  graph.ingestBatch([
    {
      id: 'scene:current',
      type: 'scene.active',
      source: 'scene-graph',
      payload: { name: 'A', program: true, layerIds: ['lower-third', 'bug'] },
    },
    {
      id: 'graphics:lower-third',
      type: 'graphics.active',
      source: 'graphics-engine',
      payload: { sceneId: 'current', conflict: true, conflicts_with: 'graphics:bug' },
    },
    {
      id: 'graphics:bug',
      type: 'graphics.active',
      source: 'graphics-engine',
      payload: { sceneId: 'current', conflicts_with: 'graphics:lower-third' },
    },
  ]);

  const results = graph.getInferenceResults();
  assert.ok(results.some((r) => r.rule === 'rule.graphics_conflict'));
  assert.ok(results.some((r) => r.rule === 'rule.predict_graphics_activation' && r.message === 'Graphics activation likely'));
  assert.ok(
    graph.getEdges().some((e) => e.type === 'conflicts_with'),
    'conflict edges should be derived',
  );
});

test('UIE Rule 7 predicts scene transition after frequent changes', () => {
  const graph = new UBOSIntelligenceGraph();

  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    payload: { name: 'Scene-A', program: true },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    payload: { name: 'Scene-B', program: true },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    payload: { name: 'Scene-C', program: true },
  });

  const results = graph.getInferenceResults();
  assert.ok(
    results.some((r) => r.rule === 'rule.predict_scene_transition' && r.message === 'Scene transition likely'),
  );
});

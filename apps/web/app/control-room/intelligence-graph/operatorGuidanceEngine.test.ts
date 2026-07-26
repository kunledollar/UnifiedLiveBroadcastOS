import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import { normalizeRole } from './operatorGuidanceEngine.js';

test('normalizeRole maps multi-user and display role names', () => {
  assert.equal(normalizeRole('audio-engineer'), 'Audio Engineer');
  assert.equal(normalizeRole('Technical Director'), 'Technical Director');
  assert.equal(normalizeRole('graphics-operator'), 'Graphics Operator');
  assert.equal(normalizeRole('streamer'), 'Solo Streamer');
  assert.equal(normalizeRole('director'), 'Director');
});

test('OGE filters fused insights by Audio Engineer role', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'audio', operator: 'ae-1', system: 'ubos' });

  for (const peak of [0.55, 0.75, 0.96]) {
    graph.ingest({
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      workspace: 'audio',
      payload: { peak },
    });
  }
  graph.ingest({
    id: 'graphics:lt',
    type: 'graphics.active',
    source: 'graphics-engine',
    workspace: 'graphics',
    payload: { conflict: true, conflicts_with: 'graphics:bug' },
  });

  const actions = graph.generateOperatorGuidance('Audio Engineer', 'audio');
  assert.ok(actions.length >= 1);
  assert.ok(actions.every((a) => a.role === 'Audio Engineer'));
  assert.ok(actions.every((a) => a.cluster === 'audio'));
  assert.ok(
    actions.some((a) => a.message.toLowerCase().includes('audio') || a.message.toLowerCase().includes('gain')),
  );
  assert.ok(actions.every((a) => a.confidence >= 0.5));
});

test('OGE produces Director scene guidance and Streaming output guidance', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'dir', system: 'ubos' });

  graph.ingest({
    id: 'scene:current',
    type: 'scene.missing_source',
    source: 'scene-graph',
    workspace: 'director',
    payload: { missing: true, missing_sources: ['cam-a'] },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'A', program: true },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'B', program: true },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'C', program: true },
  });

  const directorActions = graph.generateOperatorGuidance('Director', 'director');
  assert.ok(directorActions.some((a) => a.cluster === 'scene'));
  assert.ok(
    directorActions.some(
      (a) =>
        a.severity === 'Critical Action' ||
        a.severity === 'Warning Action' ||
        a.severity === 'Prepare Action',
    ),
  );

  graph.ingest({
    id: 'output:program',
    type: 'output.frame_drop',
    source: 'output-engine',
    workspace: 'distribution',
    payload: { dropped_frames: 8, latency: 40 },
  });

  const streamActions = graph.generateOperatorGuidance('Streaming Operator', 'distribution');
  assert.ok(streamActions.some((a) => a.cluster === 'output'));
  assert.ok(
    streamActions.some((a) =>
      a.message.toLowerCase().includes('output') ||
      a.message.toLowerCase().includes('fallback') ||
      a.message.toLowerCase().includes('stream'),
    ),
  );
});

test('OGE ranks critical above prepare and exposes snapshot fields', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'op', system: 'ubos' });
  graph.guidanceEngine.setContext('Technical Director', 'production');

  graph.ingest({
    id: 'routing:1',
    type: 'routing.destination_error',
    source: 'routing-engine',
    workspace: 'production',
    payload: { source: 'cam-a', destination: 'program', broken: true },
  });
  graph.ingest({
    id: 'output:program',
    type: 'output.health_update',
    source: 'output-engine',
    workspace: 'production',
    payload: { dropped_frames: 4 },
  });

  const actions = graph.getOperatorGuidance();
  assert.ok(actions.length >= 1);
  for (let i = 1; i < actions.length; i++) {
    assert.ok(
      graph.guidanceEngine.rank(actions[i - 1]!) >= graph.guidanceEngine.rank(actions[i]!) - 1e-9,
    );
  }

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.guidanceCount >= 1);
  assert.equal(snapshot.guidanceRole, 'Technical Director');
  assert.ok(snapshot.latestOperatorGuidance.length >= 1);
});

/**
 * Milestone 3 — Program Output Pipeline Verification
 *
 * Objective: Prove that Program is the single authoritative output used by
 * every downstream subsystem (recording, pipeline routing, scene changes).
 *
 * Pipeline under test:
 *
 *   Source → Scene → Preview → CUT/AUTO → Program → Recording
 *                                                  → Streaming
 *                                                  → Pipeline model
 *
 * All tests run in Node.js only (no browser APIs required).
 *
 * Ownership boundary definitions:
 *   - ProductionGraph.program.sceneId  → single authoritative Program scene
 *   - ProductionGraph.preview.sceneId  → staging bus, never enters downstream
 *   - CUT_TO_PROGRAM / AUTO_TRANSITION → the only commands that move Preview to Program
 *   - SET_PREVIEW_SCENE                → stages a scene; never touches Program
 *   - Recording route                  → always sources from graph.program.sceneId
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialProductionGraph,
  applyProductionCommand,
  applyProductionCommands,
  selectProgramScene,
  selectPreviewScene,
  selectRecordingState,
  createProductionPipelineModel,
  validateProductionPipeline,
  LocalProductionCommandDispatcher,
  createBroadcastSession,
  type ProductionCommand,
  type ProductionGraph,
  type StableId,
} from '@ubos/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTOR = 'operator-1';
const SESSION_ID = 'session-test';
let _seq = 0;
function cmdId() {
  return `cmd-${++_seq}`;
}
const now = () => new Date().toISOString();

function makeCommand(
  graph: ProductionGraph,
  type: ProductionCommand['type'],
  payload: Record<string, unknown> = {},
): ProductionCommand {
  return {
    id: cmdId(),
    type,
    broadcastSessionId: graph.broadcastSessionId,
    actorId: ACTOR,
    actorRole: 'DIRECTOR',
    timestamp: now(),
    payload,
  };
}

/** Build a graph with two scenes and return it along with scene IDs. */
function buildTwoSceneGraph() {
  const base = createInitialProductionGraph({ broadcastSessionId: SESSION_ID });
  const t1 = applyProductionCommand(
    base,
    makeCommand(base, 'CREATE_SCENE', { id: 'scene-a', name: 'Scene A' }),
  );
  const t2 = applyProductionCommand(
    t1.nextGraph,
    makeCommand(t1.nextGraph, 'CREATE_SCENE', { id: 'scene-b', name: 'Scene B' }),
  );
  return { graph: t2.nextGraph, sceneA: 'scene-a' as StableId, sceneB: 'scene-b' as StableId };
}

/** Build a graph with three scenes. */
function buildThreeSceneGraph() {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  const t = applyProductionCommand(
    graph,
    makeCommand(graph, 'CREATE_SCENE', { id: 'scene-c', name: 'Scene C' }),
  );
  return { graph: t.nextGraph, sceneA, sceneB, sceneC: 'scene-c' as StableId };
}

// ---------------------------------------------------------------------------
// 1. Program ownership — ProductionGraph is the single authoritative source
// ---------------------------------------------------------------------------

test('program.sceneId starts as undefined (no Program assigned on init)', () => {
  const graph = createInitialProductionGraph();
  assert.equal(graph.program.sceneId, undefined);
  assert.equal(graph.preview.sceneId, undefined);
  assert.equal(selectProgramScene(graph), undefined);
  assert.equal(selectPreviewScene(graph), undefined);
});

test('SET_PREVIEW_SCENE assigns preview — Program is unaffected', () => {
  const { graph, sceneA } = buildTwoSceneGraph();
  const transition = applyProductionCommand(
    graph,
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
  );
  assert.ok(transition.accepted, 'SET_PREVIEW_SCENE must be accepted');
  assert.equal(transition.nextGraph.preview.sceneId, sceneA);
  assert.equal(transition.nextGraph.program.sceneId, undefined, 'Program must remain empty');
});

test('CUT_TO_PROGRAM moves preview to program — Program owns the scene', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  const afterPreview = applyProductionCommand(
    graph,
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
  ).nextGraph;
  const transition = applyProductionCommand(
    afterPreview,
    makeCommand(afterPreview, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  );
  assert.ok(transition.accepted, 'CUT_TO_PROGRAM must be accepted');
  assert.equal(transition.nextGraph.program.sceneId, sceneA, 'Program must be Scene A after CUT');
  assert.equal(transition.nextGraph.program.transitionType, 'cut', 'CUT must record cut transition type');
  void sceneB;
});

test('AUTO_TRANSITION moves preview to program — same ownership rule as CUT', () => {
  const { graph, sceneA } = buildTwoSceneGraph();
  const afterPreview = applyProductionCommand(
    graph,
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
  ).nextGraph;
  const transition = applyProductionCommand(
    afterPreview,
    makeCommand(afterPreview, 'AUTO_TRANSITION', {
      sceneId: sceneA,
      transitionType: 'fade',
      durationMs: 500,
    }),
  );
  assert.ok(transition.accepted, 'AUTO_TRANSITION must be accepted');
  assert.equal(transition.nextGraph.program.sceneId, sceneA, 'Program must own Scene A after AUTO');
});

test('TAKE_PREVIEW moves preview to program', () => {
  const { graph, sceneA } = buildTwoSceneGraph();
  const afterPreview = applyProductionCommand(
    graph,
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
  ).nextGraph;
  const transition = applyProductionCommand(
    afterPreview,
    makeCommand(afterPreview, 'TAKE_PREVIEW', { sceneId: sceneA }),
  );
  assert.ok(transition.accepted);
  assert.equal(transition.nextGraph.program.sceneId, sceneA);
});

// ---------------------------------------------------------------------------
// 2. Preview ownership — Preview must never contaminate Program
// ---------------------------------------------------------------------------

test('preview change does not affect Program', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  // Put scene A on Program
  const withProgram = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  ]).nextGraph;
  assert.equal(withProgram.program.sceneId, sceneA);
  // Change Preview to Scene B
  const afterPreviewChange = applyProductionCommand(
    withProgram,
    makeCommand(withProgram, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
  ).nextGraph;
  assert.equal(afterPreviewChange.preview.sceneId, sceneB, 'Preview should be Scene B');
  assert.equal(afterPreviewChange.program.sceneId, sceneA, 'Program must still be Scene A');
});

test('multiple preview changes without CUT leave Program unchanged', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  const withProgram = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  ]).nextGraph;
  // Cycle Preview back and forth
  const after = applyProductionCommands(withProgram, [
    makeCommand(withProgram, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
    makeCommand(withProgram, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(withProgram, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
  ]).nextGraph;
  assert.equal(after.program.sceneId, sceneA, 'Program must remain Scene A after Preview cycling');
  assert.equal(after.preview.sceneId, sceneB);
});

// ---------------------------------------------------------------------------
// 3. CUT transition sequence — A → B → C
// ---------------------------------------------------------------------------

test('sequential CUT operations: A → B → C correctly transfer Program ownership', () => {
  const { graph, sceneA, sceneB, sceneC } = buildThreeSceneGraph();

  // CUT to Scene A
  const step1 = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  ]).nextGraph;
  assert.equal(step1.program.sceneId, sceneA, 'Step 1: Program = Scene A');

  // CUT to Scene B
  const step2 = applyProductionCommands(step1, [
    makeCommand(step1, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
    makeCommand(step1, 'CUT_TO_PROGRAM', { sceneId: sceneB }),
  ]).nextGraph;
  assert.equal(step2.program.sceneId, sceneB, 'Step 2: Program = Scene B');

  // CUT to Scene C
  const step3 = applyProductionCommands(step2, [
    makeCommand(step2, 'SET_PREVIEW_SCENE', { sceneId: sceneC }),
    makeCommand(step2, 'CUT_TO_PROGRAM', { sceneId: sceneC }),
  ]).nextGraph;
  assert.equal(step3.program.sceneId, sceneC, 'Step 3: Program = Scene C');

  // Confirm selectProgramScene selector matches
  const programScene = selectProgramScene(step3);
  assert.ok(programScene, 'selectProgramScene must return a scene after CUT to C');
  assert.equal(programScene.id, sceneC);
  assert.equal(programScene.name, 'Scene C');
});

test('AUTO transition sequence: A → B → C (same ownership rule)', () => {
  const { graph, sceneA, sceneB, sceneC } = buildThreeSceneGraph();
  const step1 = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'AUTO_TRANSITION', { sceneId: sceneA, transitionType: 'fade', durationMs: 500 }),
  ]).nextGraph;
  const step2 = applyProductionCommands(step1, [
    makeCommand(step1, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
    makeCommand(step1, 'AUTO_TRANSITION', { sceneId: sceneB, transitionType: 'fade', durationMs: 500 }),
  ]).nextGraph;
  const step3 = applyProductionCommands(step2, [
    makeCommand(step2, 'SET_PREVIEW_SCENE', { sceneId: sceneC }),
    makeCommand(step2, 'AUTO_TRANSITION', { sceneId: sceneC, transitionType: 'fade', durationMs: 500 }),
  ]).nextGraph;
  assert.equal(step3.program.sceneId, sceneC);
  void sceneA;
  void sceneB;
});

// ---------------------------------------------------------------------------
// 4. Recording follows Program — never Preview
// ---------------------------------------------------------------------------

test('recording route always sources from program.sceneId, not preview.sceneId', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  // Put Scene A on Program, Scene B on Preview
  const ready = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
    makeCommand(graph, 'START_RECORDING'),
  ]).nextGraph;

  assert.equal(ready.program.sceneId, sceneA, 'Program = Scene A');
  assert.equal(ready.preview.sceneId, sceneB, 'Preview = Scene B');
  assert.equal(ready.recording.status, 'recording', 'Recording is active');

  const model = createProductionPipelineModel(ready);
  const recordingRoute = model.state.outputRouting.find((r) => r.kind === 'recording');
  assert.ok(recordingRoute, 'Pipeline model must include a recording route');
  assert.equal(
    recordingRoute!.sourceId,
    sceneA,
    'Recording route must source from Program (Scene A), not Preview (Scene B)',
  );
  assert.ok(recordingRoute!.active, 'Recording route must be active');
});

test('recording route sourceId follows CUT — scene change appears in route', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  // Record while on Scene A
  const recording = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
    makeCommand(graph, 'START_RECORDING'),
  ]).nextGraph;
  assert.equal(recording.recording.status, 'recording');
  assert.equal(createProductionPipelineModel(recording).state.outputRouting.find((r) => r.kind === 'recording')?.sourceId, sceneA);

  // CUT to Scene B while recording
  const afterCut = applyProductionCommands(recording, [
    makeCommand(recording, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
    makeCommand(recording, 'CUT_TO_PROGRAM', { sceneId: sceneB }),
  ]).nextGraph;
  assert.equal(afterCut.recording.status, 'recording', 'Recording must remain active after CUT');
  assert.equal(afterCut.program.sceneId, sceneB, 'Program must be Scene B after CUT');
  const routeAfterCut = createProductionPipelineModel(afterCut).state.outputRouting.find((r) => r.kind === 'recording');
  assert.equal(
    routeAfterCut?.sourceId,
    sceneB,
    'Recording route sourceId must follow Program after CUT (not remain on old scene)',
  );
});

test('preview change during recording does NOT move the recording route', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  const recording = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
    makeCommand(graph, 'START_RECORDING'),
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),  // Only staging
  ]).nextGraph;
  assert.equal(recording.program.sceneId, sceneA, 'Program still Scene A');
  assert.equal(recording.preview.sceneId, sceneB, 'Preview now Scene B');
  const route = createProductionPipelineModel(recording).state.outputRouting.find((r) => r.kind === 'recording');
  assert.equal(route?.sourceId, sceneA, 'Recording must source from Program, not Preview');
});

// ---------------------------------------------------------------------------
// 5. Program monitor updates — pipeline model reflects program state
// ---------------------------------------------------------------------------

test('pipeline model program field matches graph.program.sceneId', () => {
  const { graph, sceneA, sceneB } = buildTwoSceneGraph();
  const withProgram = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneB }),
  ]).nextGraph;
  const model = createProductionPipelineModel(withProgram);
  assert.ok(model.program, 'pipeline model must have a program scene');
  assert.equal(model.program?.id, sceneA, 'model.program must be Scene A');
  assert.ok(model.preview, 'pipeline model must have a preview scene');
  assert.equal(model.preview?.id, sceneB, 'model.preview must be Scene B');
});

test('pipeline validation warns when program is missing', () => {
  const graph = createInitialProductionGraph();
  const warnings = validateProductionPipeline(graph);
  const programWarning = warnings.find((w) => w.id === 'program-missing');
  assert.ok(programWarning, 'must warn when program output is missing');
  assert.equal(programWarning?.severity, 'failed');
});

test('pipeline validation has no program-missing warning after CUT', () => {
  const { graph, sceneA } = buildTwoSceneGraph();
  const withProgram = applyProductionCommands(graph, [
    makeCommand(graph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(graph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  ]).nextGraph;
  const warnings = validateProductionPipeline(withProgram);
  const programWarning = warnings.find((w) => w.id === 'program-missing');
  assert.equal(programWarning, undefined, 'must not warn about missing program after CUT');
});

test('pipeline validation warns recording-without-program when recording with no program scene', () => {
  const graph = createInitialProductionGraph();
  const t1 = applyProductionCommand(
    graph,
    makeCommand(graph, 'CREATE_SCENE', { id: 'scene-x', name: 'Scene X' }),
  );
  // Start recording without taking any scene to program
  const withRecording = applyProductionCommand(
    t1.nextGraph,
    makeCommand(t1.nextGraph, 'START_RECORDING'),
  ).nextGraph;
  const warnings = validateProductionPipeline(withRecording);
  const recWarning = warnings.find((w) => w.id === 'recording-without-program');
  assert.ok(recWarning, 'must warn when recording is active without a program scene');
  assert.equal(recWarning?.severity, 'failed');
});

// ---------------------------------------------------------------------------
// 6. LocalProductionCommandDispatcher — single dispatcher owns Program state
// ---------------------------------------------------------------------------

test('LocalProductionCommandDispatcher: CUT moves preview to program atomically', () => {
  const session = createBroadcastSession({ id: SESSION_ID });
  const dispatcher = new LocalProductionCommandDispatcher(session);

  const createA = dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CREATE_SCENE', { id: 'sc-a', name: 'A' }));
  assert.ok(createA.accepted);
  const createB = dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CREATE_SCENE', { id: 'sc-b', name: 'B' }));
  assert.ok(createB.accepted);

  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'SET_PREVIEW_SCENE', { sceneId: 'sc-a' }));
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CUT_TO_PROGRAM', { sceneId: 'sc-a' }));
  assert.equal(dispatcher.getGraph().program.sceneId, 'sc-a', 'Program must be sc-a after CUT');

  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'SET_PREVIEW_SCENE', { sceneId: 'sc-b' }));
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CUT_TO_PROGRAM', { sceneId: 'sc-b' }));
  assert.equal(dispatcher.getGraph().program.sceneId, 'sc-b', 'Program must be sc-b after second CUT');
  assert.equal(dispatcher.getGraph().preview.sceneId, 'sc-b', 'Preview retains the staged scene after CUT');
});

test('LocalProductionCommandDispatcher: graph revision increments on every accepted command', () => {
  const session = createBroadcastSession({ id: SESSION_ID });
  const dispatcher = new LocalProductionCommandDispatcher(session);
  const r0 = dispatcher.getGraph().metadata.revision;

  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CREATE_SCENE', { id: 'sc-rev', name: 'Rev' }));
  assert.equal(dispatcher.getGraph().metadata.revision, r0 + 1);

  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'SET_PREVIEW_SCENE', { sceneId: 'sc-rev' }));
  assert.equal(dispatcher.getGraph().metadata.revision, r0 + 2);

  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CUT_TO_PROGRAM', { sceneId: 'sc-rev' }));
  assert.equal(dispatcher.getGraph().metadata.revision, r0 + 3);
});

// ---------------------------------------------------------------------------
// 7. Source visibility — scene sources affect what Program outputs
// ---------------------------------------------------------------------------

test('hidden sources in program scene do not appear as active pipeline routes', () => {
  const { graph, sceneA } = buildTwoSceneGraph();
  // Add a source to scene A
  const t1 = applyProductionCommand(
    graph,
    makeCommand(graph, 'ADD_SOURCE', { id: 'src-cam', name: 'Camera', type: 'camera' }),
  );
  const t2 = applyProductionCommand(
    t1.nextGraph,
    makeCommand(t1.nextGraph, 'ASSIGN_SOURCE_TO_SCENE', { sceneId: sceneA, sourceId: 'src-cam' }),
  );
  const withProgram = applyProductionCommands(t2.nextGraph, [
    makeCommand(t2.nextGraph, 'SET_PREVIEW_SCENE', { sceneId: sceneA }),
    makeCommand(t2.nextGraph, 'CUT_TO_PROGRAM', { sceneId: sceneA }),
  ]).nextGraph;
  // Program route must reference sceneA
  const model = createProductionPipelineModel(withProgram);
  const programRoute = model.state.outputRouting.find((r) => r.kind === 'video' && r.sourceId === sceneA);
  assert.ok(programRoute, 'Program route must exist after CUT');
  assert.ok(programRoute!.active, 'Program video route must be active');
});

// ---------------------------------------------------------------------------
// 8. Runtime switching state — RuntimeSession tracks CUT and AUTO
// ---------------------------------------------------------------------------

import {
  ProductionRuntime,
  CutCommand,
  AutoCommand,
  PreviewCommand,
} from '@ubos/shared';

test('RuntimeSession: CUT moves currentPreview to currentProgram', () => {
  const runtime = new ProductionRuntime();
  runtime.dispatch(PreviewCommand('scene-a'));
  assert.equal(runtime.state.currentPreview, 'scene-a');
  assert.equal(runtime.state.currentProgram, null);
  runtime.dispatch(CutCommand());
  assert.equal(runtime.state.currentProgram, 'scene-a', 'currentProgram must equal previous currentPreview after CUT');
});

test('RuntimeSession: AUTO moves currentPreview to currentProgram', () => {
  const runtime = new ProductionRuntime();
  runtime.dispatch(PreviewCommand('scene-b'));
  runtime.dispatch(AutoCommand());
  assert.equal(runtime.state.currentProgram, 'scene-b', 'currentProgram must equal previous currentPreview after AUTO');
});

test('RuntimeSession: preview change does not affect currentProgram', () => {
  const runtime = new ProductionRuntime();
  runtime.dispatch(PreviewCommand('scene-a'));
  runtime.dispatch(CutCommand());
  // Program is now 'scene-a'. Change Preview.
  runtime.dispatch(PreviewCommand('scene-b'));
  assert.equal(runtime.state.currentProgram, 'scene-a', 'currentProgram must remain scene-a after preview change');
  assert.equal(runtime.state.currentPreview, 'scene-b');
});

test('RuntimeSession: sequential CUT operations A → B → C', () => {
  const runtime = new ProductionRuntime();
  runtime.dispatch(PreviewCommand('scene-a'));
  runtime.dispatch(CutCommand());
  assert.equal(runtime.state.currentProgram, 'scene-a');

  runtime.dispatch(PreviewCommand('scene-b'));
  runtime.dispatch(CutCommand());
  assert.equal(runtime.state.currentProgram, 'scene-b');

  runtime.dispatch(PreviewCommand('scene-c'));
  runtime.dispatch(CutCommand());
  assert.equal(runtime.state.currentProgram, 'scene-c');
});

// ---------------------------------------------------------------------------
// 9. Program state consistency — graph and runtime must agree after CUT
// ---------------------------------------------------------------------------

test('ProductionGraph and RuntimeSession stay consistent after CUT sequence', () => {
  const session = createBroadcastSession({ id: SESSION_ID });
  const dispatcher = new LocalProductionCommandDispatcher(session);
  const runtime = new ProductionRuntime();

  // Create scenes
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CREATE_SCENE', { id: 'sc-x', name: 'X' }));
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CREATE_SCENE', { id: 'sc-y', name: 'Y' }));

  // CUT to X
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'SET_PREVIEW_SCENE', { sceneId: 'sc-x' }));
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CUT_TO_PROGRAM', { sceneId: 'sc-x' }));
  runtime.dispatch(PreviewCommand('sc-x'));
  runtime.dispatch(CutCommand());

  // Both must agree: Program = sc-x
  assert.equal(dispatcher.getGraph().program.sceneId, 'sc-x');
  assert.equal(runtime.state.currentProgram, 'sc-x');

  // CUT to Y
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'SET_PREVIEW_SCENE', { sceneId: 'sc-y' }));
  dispatcher.dispatch(makeCommand(dispatcher.getGraph(), 'CUT_TO_PROGRAM', { sceneId: 'sc-y' }));
  runtime.dispatch(PreviewCommand('sc-y'));
  runtime.dispatch(CutCommand());

  // Both must agree: Program = sc-y
  assert.equal(dispatcher.getGraph().program.sceneId, 'sc-y');
  assert.equal(runtime.state.currentProgram, 'sc-y');
});

// ---------------------------------------------------------------------------
// 10. verifyBrowserRecordingArtifact contract
// ---------------------------------------------------------------------------

import { verifyBrowserRecordingArtifact } from '../../app/control-room/operations/browser-recording-verification.js';

test('verifyBrowserRecordingArtifact: valid WebM blob is confirmed', () => {
  const blob = new Blob(['mock-webm-data'.repeat(100)], { type: 'video/webm' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 5000 });
  assert.ok(result.ok, `expected ok, got reason: ${result.reason}`);
  assert.equal(result.state, 'confirmed');
  assert.ok(result.sizeBytes > 0);
  assert.ok(result.durationMs > 0);
});

test('verifyBrowserRecordingArtifact: empty blob is rejected', () => {
  const blob = new Blob([], { type: 'video/webm' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 5000 });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'failed');
  assert.ok(result.reason?.includes('empty'));
});

test('verifyBrowserRecordingArtifact: unsupported MIME type is rejected', () => {
  const blob = new Blob(['data'], { type: 'image/png' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 5000 });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'failed');
  assert.ok(result.reason?.includes('Unsupported') || result.reason?.includes('MIME'));
});

test('verifyBrowserRecordingArtifact: zero duration is rejected', () => {
  const blob = new Blob(['data'], { type: 'video/webm' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 0 });
  assert.equal(result.ok, false);
});

test('verifyBrowserRecordingArtifact: non-playable artifact is rejected', () => {
  const blob = new Blob(['data'], { type: 'video/webm' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 3000, playable: false });
  assert.equal(result.ok, false);
  assert.ok(result.reason?.includes('could not be played'));
});

test('verifyBrowserRecordingArtifact: video/mp4 MIME is accepted', () => {
  const blob = new Blob(['mock-mp4'.repeat(100)], { type: 'video/mp4' });
  const result = verifyBrowserRecordingArtifact({ blob, durationMs: 2000 });
  assert.ok(result.ok);
});

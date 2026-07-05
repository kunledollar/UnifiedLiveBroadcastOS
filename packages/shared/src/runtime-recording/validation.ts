import {
  NullRecordingAdapter,
  createRecordingCommand,
  createRecordingRuntime,
  createDefaultRecordingProfile,
} from './index.js';
import type { RecordingCommand } from './index.js';
function ok(v: unknown, m = 'expected truthy') {
  if (!v) throw new Error(m);
}
function eq(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${String(b)}, received ${String(a)}`);
}
const runtime = createRecordingRuntime({}, new NullRecordingAdapter());
runtime.dispatch(createRecordingCommand('CREATE_RECORDING', { session: { id: 'rec-1' } }));
runtime.dispatch(
  createRecordingCommand('START_PROGRAM_RECORDING', {
    session: { id: 'program-1' },
    durationMs: 8000,
  }),
);
eq(runtime.state.programRecording?.state, 'recording');
runtime.dispatch(createRecordingCommand('PAUSE_RECORDING'));
eq(runtime.state.programRecording?.state, 'paused');
runtime.dispatch(createRecordingCommand('RESUME_RECORDING'));
eq(runtime.state.programRecording?.state, 'recording');
runtime.dispatch(createRecordingCommand('STOP_PROGRAM_RECORDING', { durationMs: 16000 }));
eq(runtime.state.programRecording?.state, 'stopped');
runtime.dispatch(
  createRecordingCommand('START_ISO_RECORDING', { session: { id: 'iso-1' }, sourceId: 'cam-1' }),
);
eq(runtime.state.isoRecordings.length, 1);
runtime.dispatch(createRecordingCommand('STOP_ISO_RECORDING', { sessionId: 'iso-1' }));
eq(runtime.state.isoRecordings[0]?.state, 'stopped');
runtime.dispatch(
  createRecordingCommand('CREATE_BOOKMARK', {
    bookmarkId: 'bm-1',
    sessionId: 'program-1',
    durationMs: 500,
    label: 'Replay',
  }),
);
eq(runtime.state.replayBookmarks.length, 1);
runtime.dispatch(
  createRecordingCommand('MARK_CLIP', {
    clipId: 'mark-1',
    inPointMs: 100,
    outPointMs: 400,
    bookmarkId: 'bm-1',
  }),
);
runtime.dispatch(
  createRecordingCommand('CREATE_CLIP', { clipId: 'clip-1', inPointMs: 100, outPointMs: 900 }),
);
eq(runtime.state.clipCatalog.at(-1)?.durationMs, 800);
runtime.dispatch(createRecordingCommand('DELETE_CLIP', { clipId: 'clip-1' }));
eq(runtime.state.clipCatalog.find((c) => c.id === 'clip-1')?.state, 'deleted');
runtime.dispatch(
  createRecordingCommand('CREATE_TIMESHIFT_BUFFER', {
    sessionId: 'ts-1',
    sourceId: 'program',
    durationMs: 30000,
  }),
);
eq(runtime.state.timeShiftBuffers[0]?.state, 'active');
runtime.dispatch(createRecordingCommand('CLEAR_TIMESHIFT_BUFFER', { sessionId: 'ts-1' }));
eq(runtime.state.timeShiftBuffers[0]?.state, 'cleared');
runtime.dispatch(
  createRecordingCommand('START_ARCHIVE_JOB', {
    archiveSessionId: 'archive-1',
    archiveFolder: {
      id: 'folder-1',
      name: 'Show',
      destinationId: 'destination-metadata',
      retentionDays: 7,
      locked: false,
    },
  }),
);
eq(runtime.state.archiveCatalog.jobs[0]?.state, 'running');
runtime.dispatch(createRecordingCommand('STOP_ARCHIVE_JOB', { archiveSessionId: 'archive-1' }));
eq(runtime.state.archiveCatalog.jobs[0]?.state, 'stopped');
runtime.dispatch(createRecordingCommand('VERIFY_RECORDING'));
runtime.dispatch(createRecordingCommand('EXPORT_METADATA'));
ok(runtime.state.operatorNotes.length >= 3);
ok(runtime.snapshot('test'));
ok(runtime.state.history.length > 1);
eq(runtime.state.queue.length, 0);
eq(runtime.health.metadataOnly, true);
ok(runtime.metrics.commandsExecuted > 0);
eq(JSON.parse(JSON.stringify(runtime.state)).containsRuntimeHandles, false);
runtime.dispatch(
  createRecordingCommand('START_PROGRAM_RECORDING', { session: { id: 'bad' }, durationMs: -1 }),
);
ok(runtime.metrics.droppedCommands >= 1);
runtime.dispatch(
  createRecordingCommand('START_PROGRAM_RECORDING', {
    profile: { ...createDefaultRecordingProfile(), id: 'bad-profile', valid: false },
  }),
);
ok(runtime.metrics.droppedCommands >= 2);
runtime.dispatch({
  ...createRecordingCommand('START_ISO_RECORDING'),
  runtimeHandle: undefined,
} as unknown as RecordingCommand);
ok(runtime.metrics.droppedCommands >= 3);
console.log('Runtime recording validation passed');

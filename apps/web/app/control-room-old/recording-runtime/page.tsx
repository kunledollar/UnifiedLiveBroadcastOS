import { createRecordingRuntime, createRecordingCommand } from '@ubos/shared';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';

const runtime = createRecordingRuntime();
runtime.dispatch(
  createRecordingCommand('START_PROGRAM_RECORDING', {
    session: { id: 'program-demo' },
    durationMs: 0,
  }),
);
runtime.dispatch(
  createRecordingCommand('START_ISO_RECORDING', {
    session: { id: 'iso-demo' },
    sourceId: 'camera-1',
  }),
);
runtime.dispatch(
  createRecordingCommand('CREATE_BOOKMARK', {
    bookmarkId: 'bookmark-demo',
    label: 'Opening moment',
    durationMs: 12000,
  }),
);
runtime.dispatch(
  createRecordingCommand('CREATE_TIMESHIFT_BUFFER', {
    sessionId: 'timeshift-demo',
    durationMs: 300000,
  }),
);
runtime.dispatch(createRecordingCommand('START_ARCHIVE_JOB', { archiveSessionId: 'archive-demo' }));
const state = runtime.state;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <BroadcastPanel>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="space-y-1 text-sm text-ubos-fg-muted">{children}</div>
    </BroadcastPanel>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="text-ubos-fg-primary">{value}</span>
    </div>
  );
}

export default function RecordingRuntimePage() {
  return (
    <main className="space-y-ubos-3 p-ubos-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Recording Runtime</h1>
          <p className="text-sm text-ubos-fg-muted">
            Metadata-only recording, archive, clip and TimeShift orchestration.
          </p>
        </div>
        <StatusBadge variant="warning">Metadata only</StatusBadge>
      </div>
      <div className="grid gap-ubos-3 lg:grid-cols-3">
        <Panel title="Recording Dashboard">
          <Row label="Program" value={state.programRecording?.state ?? 'idle'} />
          <Row label="ISO count" value={state.isoRecordings.length} />
          <Row label="Storage estimate" value={`${state.estimatedStorageMb.toFixed(2)} MB`} />
        </Panel>
        <Panel title="Program Recorder">
          <Row label="Session" value={state.programRecording?.id ?? 'None'} />
          <Row label="Profile" value={state.programRecording?.profileId ?? 'None'} />
        </Panel>
        <Panel title="ISO Recorder">
          <Row
            label="Active ISO"
            value={state.isoRecordings.filter((s) => s.state === 'recording').length}
          />
          <Row
            label="Sources"
            value={state.isoRecordings.map((s) => s.sourceId).join(', ') || 'None'}
          />
        </Panel>
        <Panel title="Archive Manager">
          <Row label="Jobs" value={state.archiveCatalog.jobs.length} />
          <Row label="Folders" value={state.archiveCatalog.folders.length} />
        </Panel>
        <Panel title="Clip Manager">
          <Row label="Clips" value={state.clipCatalog.length} />
          <Row label="Catalog" value="Metadata only" />
        </Panel>
        <Panel title="Bookmark Timeline">
          <Row label="Bookmarks" value={state.replayBookmarks.length} />
          <Row label="Latest" value={state.replayBookmarks.at(-1)?.label ?? 'None'} />
        </Panel>
        <Panel title="TimeShift Monitor">
          <Row label="Buffers" value={state.timeShiftBuffers.length} />
          <Row label="State" value={state.timeShiftBuffers.at(-1)?.state ?? 'idle'} />
        </Panel>
        <Panel title="Storage Inspector">
          <Row
            label="Storage"
            value={state.health.storageUnavailable ? 'Unavailable' : 'Available'}
          />
          <Row label="Retention" value={`${state.retentionPolicy.defaultDays} days`} />
        </Panel>
        <Panel title="Recording Queue">
          <Row label="Queued jobs" value={state.queue.length} />
          <Row label="Commands" value={state.metrics.commandsExecuted} />
        </Panel>
        <Panel title="Recording Health">
          <Row label="Recorder" value="Unavailable" />
          <Row label="Warnings" value={state.health.warnings.join(' · ')} />
        </Panel>
        <Panel title="Recording History">
          <Row label="Snapshots" value={state.history.length} />
          <Row label="Last" value={state.history.at(-1)?.operator ?? 'system'} />
        </Panel>
        <Panel title="Recording Runtime Inspector">
          <Row label="Runtime" value={state.id} />
          <Row label="Handles" value={String(state.containsRuntimeHandles)} />
        </Panel>
      </div>
    </main>
  );
}

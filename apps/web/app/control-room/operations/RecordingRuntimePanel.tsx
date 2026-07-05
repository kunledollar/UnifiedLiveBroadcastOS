'use client';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';
import type { RecordingRuntimeState } from '@ubos/shared';
import { createRecordingRuntimeState } from '@ubos/shared';

export function RecordingRuntimePanel({
  state = createRecordingRuntimeState(),
}: {
  state?: RecordingRuntimeState;
}) {
  return (
    <BroadcastPanel>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Recording Runtime</h3>
        <StatusBadge variant="warning">Metadata only</StatusBadge>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-ubos-fg-muted">Recording state</dt>
        <dd>{state.programRecording?.state ?? 'idle'}</dd>
        <dt className="text-ubos-fg-muted">Active sessions</dt>
        <dd>{Number(Boolean(state.programRecording)) + state.isoRecordings.length}</dd>
        <dt className="text-ubos-fg-muted">ISO count</dt>
        <dd>{state.isoRecordings.length}</dd>
        <dt className="text-ubos-fg-muted">Bookmarks</dt>
        <dd>{state.replayBookmarks.length}</dd>
        <dt className="text-ubos-fg-muted">Archive jobs</dt>
        <dd>{state.archiveCatalog.jobs.length}</dd>
        <dt className="text-ubos-fg-muted">Storage estimate</dt>
        <dd>{state.estimatedStorageMb.toFixed(2)} MB</dd>
        <dt className="text-ubos-fg-muted">Health</dt>
        <dd>{state.health.warnings.join(' · ')}</dd>
        <dt className="text-ubos-fg-muted">History</dt>
        <dd>{state.history.length}</dd>
      </dl>
    </BroadcastPanel>
  );
}

'use client';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';
import type { RecordingRuntimeState, SceneSourceType } from '@ubos/shared';
import { createRecordingRuntimeState } from '@ubos/shared';

export type BrowserRecordingState = 'idle' | 'preparing' | 'recording' | 'stopping' | 'completed' | 'failed';
export type BrowserRecordingHistoryEntry = {
  filename: string;
  durationMs: number;
  startedAt: string;
  stoppedAt: string;
  sourceType: SceneSourceType | 'none';
  fileSizeBytes: number;
};
export type BrowserRecordingPanelState = {
  state: BrowserRecordingState;
  filename: string | null;
  durationMs: number;
  startedAt: string | null;
  stoppedAt: string | null;
  sourceType: SceneSourceType | 'none';
  fileSizeBytes: number;
  downloadUrl: string | null;
  error: string | null;
  history: BrowserRecordingHistoryEntry[];
  supported: boolean;
};

const emptyBrowserState: BrowserRecordingPanelState = {
  state: 'idle',
  filename: null,
  durationMs: 0,
  startedAt: null,
  stoppedAt: null,
  sourceType: 'none',
  fileSizeBytes: 0,
  downloadUrl: null,
  error: null,
  history: [],
  supported: false,
};

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function badgeForState(state: BrowserRecordingState) {
  if (state === 'recording') return 'rec' as const;
  if (state === 'failed') return 'error' as const;
  if (state === 'completed') return 'success' as const;
  if (state === 'preparing' || state === 'stopping') return 'warning' as const;
  return 'neutral' as const;
}

export function RecordingRuntimePanel({
  state = createRecordingRuntimeState(),
  browserState = emptyBrowserState,
  onStart,
  onStop,
}: {
  state?: RecordingRuntimeState;
  browserState?: BrowserRecordingPanelState;
  onStart?: () => void;
  onStop?: () => void;
}) {
  const busy = browserState.state === 'preparing' || browserState.state === 'recording' || browserState.state === 'stopping';
  return (
    <div className="space-y-ubos-2">
      <BroadcastPanel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">Program Recording</h3>
          <StatusBadge variant={badgeForState(browserState.state)}>{browserState.state}</StatusBadge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-ubos-sm bg-red-500 px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!browserState.supported || busy}
            onClick={onStart}
          >
            Start Recording
          </button>
          <button
            type="button"
            className="rounded-ubos-sm bg-ubos-midnight px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-ubos-fg-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={browserState.state !== 'recording'}
            onClick={onStop}
          >
            Stop Recording
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ubos-fg-muted">Timer</dt><dd>{formatDuration(browserState.durationMs)}</dd>
          <dt className="text-ubos-fg-muted">File size estimate</dt><dd>{formatBytes(browserState.fileSizeBytes)}</dd>
          <dt className="text-ubos-fg-muted">Source type</dt><dd>{browserState.sourceType}</dd>
          <dt className="text-ubos-fg-muted">Filename</dt><dd className="break-all">{browserState.filename ?? '—'}</dd>
        </dl>
        {!browserState.supported ? <p className="mt-2 text-ubos-caption text-ubos-error-text">MediaRecorder is not supported in this browser.</p> : null}
        {browserState.error ? <p className="mt-2 text-ubos-caption text-ubos-error-text">{browserState.error}</p> : null}
        {browserState.downloadUrl && browserState.filename ? (
          <a className="mt-3 block rounded-ubos-sm bg-emerald-400 px-2 py-2 text-center text-xs font-black text-slate-950" href={browserState.downloadUrl} download={browserState.filename}>
            Download WebM
          </a>
        ) : null}
      </BroadcastPanel>
      <BroadcastPanel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">Recording History Metadata</h3>
          <StatusBadge variant="warning">Metadata only</StatusBadge>
        </div>
        {browserState.history.length ? (
          <div className="space-y-2 text-ubos-caption text-ubos-fg-secondary">
            {browserState.history.map((item) => (
              <div key={`${item.filename}:${item.startedAt}`} className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-2">
                <div className="font-bold text-ubos-fg-primary">{item.filename}</div>
                <div>{formatDuration(item.durationMs)} · {formatBytes(item.fileSizeBytes)} · {item.sourceType}</div>
                <div className="text-ubos-fg-muted">{item.startedAt} → {item.stoppedAt}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-ubos-caption text-ubos-fg-muted">No completed browser recordings yet.</p>}
      </BroadcastPanel>
      <BroadcastPanel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">Recording Runtime</h3>
          <StatusBadge variant="warning">Metadata only</StatusBadge>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ubos-fg-muted">Runtime state</dt><dd>{state.programRecording?.state ?? 'idle'}</dd>
          <dt className="text-ubos-fg-muted">Active sessions</dt><dd>{Number(Boolean(state.programRecording)) + state.isoRecordings.length}</dd>
          <dt className="text-ubos-fg-muted">Storage estimate</dt><dd>{state.estimatedStorageMb.toFixed(2)} MB</dd>
          <dt className="text-ubos-fg-muted">History</dt><dd>{state.history.length}</dd>
        </dl>
      </BroadcastPanel>
    </div>
  );
}

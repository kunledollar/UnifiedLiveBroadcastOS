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
export type NativeRecordingPanelState = {
  runtimeConnected: boolean;
  ffmpegAvailable: boolean;
  ffprobeAvailable: boolean;
  programMediaAvailable: boolean;
  outputWritable: boolean;
  adapterHealthy: boolean;
  /**
   * unavailable — one or more prerequisites are not met (blockedReason is set)
   * ready       — all prerequisites met; operator may start a recording
   * preparing   — capture is initialising, MediaRecorder not yet running
   * recording   — MediaRecorder is actively collecting chunks
   * stopping    — Stop was clicked; waiting for MediaRecorder to flush final chunk
   * finalizing  — WebM handed off to server; FFmpeg transcode running
   * verified    — FFprobe confirmed H.264/AAC MP4; artifact details are available
   * failed      — any error occurred; blockedReason and/or failure describe it
   */
  state: 'unavailable' | 'ready' | 'preparing' | 'recording' | 'stopping' | 'finalizing' | 'verified' | 'failed';
  elapsedMs: number;
  blockedReason: string | null;
  artifactPath: string | null;
  artifactSizeBytes: number;
  durationSeconds: number;
  videoCodec: string | null;
  audioCodec: string | null;
  failure: string | null;
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

const emptyNativeState: NativeRecordingPanelState = {
  runtimeConnected: false,
  ffmpegAvailable: false,
  ffprobeAvailable: false,
  programMediaAvailable: false,
  outputWritable: false,
  adapterHealthy: false,
  state: 'unavailable',
  elapsedMs: 0,
  blockedReason: 'Native runtime status has not loaded.',
  artifactPath: null,
  artifactSizeBytes: 0,
  durationSeconds: 0,
  videoCodec: null,
  audioCodec: null,
  failure: null,
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
  nativeState = emptyNativeState,
  onStart,
  onStop,
  onStartNative,
  onStopNative,
}: {
  state?: RecordingRuntimeState;
  browserState?: BrowserRecordingPanelState;
  nativeState?: NativeRecordingPanelState;
  onStart?: () => void;
  onStop?: () => void;
  onStartNative?: () => void;
  onStopNative?: () => void;
}) {
  const busy = browserState.state === 'preparing' || browserState.state === 'recording' || browserState.state === 'stopping';
  const nativeActive = nativeState.state === 'preparing' || nativeState.state === 'recording' || nativeState.state === 'stopping' || nativeState.state === 'finalizing';
  const nativeBadgeVariant =
    nativeState.state === 'failed' ? ('error' as const) :
    nativeState.state === 'verified' ? ('success' as const) :
    nativeState.state === 'recording' ? ('rec' as const) :
    nativeActive ? ('warning' as const) :
    nativeState.state === 'ready' ? ('success' as const) :
    ('neutral' as const);
  return (
    <div className="space-y-ubos-2">

      <BroadcastPanel>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">Native FFmpeg Recording</h3>
          <StatusBadge variant={nativeBadgeVariant}>{nativeState.state}</StatusBadge>
        </div>
        <p className="mb-2 text-ubos-caption text-ubos-fg-muted">Server-side FFmpeg recording captures the actual Program MediaStream as browser-uploaded WebM chunks, transcodes to H.264/AAC MP4 via FFmpeg, and validates with FFprobe. Browser MediaRecorder remains the labeled fallback below.</p>
        {nativeState.blockedReason ? <p className="mb-2 rounded-ubos-sm border border-amber-400/40 bg-amber-400/10 p-2 text-ubos-caption text-amber-100">{nativeState.blockedReason}</p> : null}
        {nativeState.failure ? <p className="mb-2 text-ubos-caption text-ubos-error-text">{nativeState.failure}</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-ubos-sm bg-red-500 px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={nativeState.state !== 'ready'}
            title={nativeState.blockedReason ?? 'Start native FFmpeg recording from actual Program output'}
            onClick={onStartNative}
          >
            Start Native
          </button>
          <button
            type="button"
            className="rounded-ubos-sm bg-ubos-midnight px-2 py-2 text-xs font-black uppercase tracking-[0.12em] text-ubos-fg-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={nativeState.state !== 'recording'}
            onClick={onStopNative}
          >
            Stop Native
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ubos-fg-muted">Elapsed</dt><dd>{formatDuration(nativeState.elapsedMs)}</dd>
          <dt className="text-ubos-fg-muted">FFmpeg / FFprobe</dt><dd>{nativeState.ffmpegAvailable ? 'FFmpeg OK' : 'FFmpeg blocked'} / {nativeState.ffprobeAvailable ? 'FFprobe OK' : 'FFprobe blocked'}</dd>
          <dt className="text-ubos-fg-muted">Artifact</dt><dd className="break-all">{nativeState.artifactPath ?? '—'}</dd>
          <dt className="text-ubos-fg-muted">Verified</dt><dd>{nativeState.videoCodec ? `${nativeState.videoCodec}${nativeState.audioCodec ? ` / ${nativeState.audioCodec}` : ''}` : '—'}</dd>
          {nativeState.state === 'verified' && nativeState.durationSeconds > 0 ? (
            <>
              <dt className="text-ubos-fg-muted">Duration</dt><dd>{nativeState.durationSeconds.toFixed(1)} s</dd>
              <dt className="text-ubos-fg-muted">Size</dt><dd>{formatBytes(nativeState.artifactSizeBytes)}</dd>
            </>
          ) : null}
        </dl>
      </BroadcastPanel>
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

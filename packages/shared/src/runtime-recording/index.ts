export type RecordingCommandType =
  | 'CREATE_RECORDING'
  | 'START_PROGRAM_RECORDING'
  | 'STOP_PROGRAM_RECORDING'
  | 'START_ISO_RECORDING'
  | 'STOP_ISO_RECORDING'
  | 'PAUSE_RECORDING'
  | 'RESUME_RECORDING'
  | 'MARK_CLIP'
  | 'CREATE_CLIP'
  | 'DELETE_CLIP'
  | 'CREATE_BOOKMARK'
  | 'DELETE_BOOKMARK'
  | 'CREATE_TIMESHIFT_BUFFER'
  | 'CLEAR_TIMESHIFT_BUFFER'
  | 'START_ARCHIVE_JOB'
  | 'STOP_ARCHIVE_JOB'
  | 'VERIFY_RECORDING'
  | 'EXPORT_METADATA';
export type RecordingState =
  'idle' | 'recording' | 'paused' | 'stopped' | 'verifying' | 'metadata_exported' | 'failed';
export interface RecordingProfile {
  id: string;
  name: string;
  container: 'mp4' | 'mov' | 'mkv' | 'metadata';
  videoCodec: 'none' | 'h264' | 'hevc' | 'prores';
  audioCodec: 'none' | 'aac' | 'pcm';
  estimatedMbps: number;
  retentionDays: number;
  valid: boolean;
}
export interface RecordingDestination {
  id: string;
  name: string;
  kind: 'archive' | 'local' | 'cloud' | 'metadata';
  uri: string;
  available: boolean;
  metadataOnly: boolean;
}
export interface RecordingManifest {
  id: string;
  profileId: string;
  destinationId: string;
  programSceneId?: string;
  previewSceneId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
export interface RecordingSession {
  id: string;
  mode: 'program' | 'iso';
  sourceId: string;
  state: RecordingState;
  profileId: string;
  destinationId: string;
  startedAt: string | null;
  stoppedAt: string | null;
  pausedAt: string | null;
  durationMs: number;
  operatorNotes: string[];
  manifest: RecordingManifest;
}
export interface RecordingJob {
  id: string;
  command: RecordingCommandType;
  sessionId?: string;
  status: 'queued' | 'running' | 'complete' | 'rejected';
  createdAt: string;
  message?: string;
}
export interface ClipBookmark {
  id: string;
  sessionId: string;
  label: string;
  timestampMs: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}
export interface ReplayBookmark extends ClipBookmark {
  replayEventId?: string;
  programSceneId?: string;
}
export interface ClipSession {
  id: string;
  sessionId: string;
  inPointMs: number;
  outPointMs: number;
  durationMs: number;
  bookmarkIds: string[];
  state: 'marked' | 'created' | 'deleted';
  createdAt: string;
}
export interface TimeShiftBuffer {
  id: string;
  sourceId: string;
  durationMs: number;
  startedAt: string;
  state: 'active' | 'cleared';
  metadataOnly: true;
}
export interface ArchiveFolder {
  id: string;
  name: string;
  destinationId: string;
  retentionDays: number;
  locked: boolean;
}
export interface ArchiveSession {
  id: string;
  folderId: string;
  destinationId: string;
  state: 'queued' | 'running' | 'stopped' | 'complete' | 'failed';
  sessionIds: string[];
  startedAt: string | null;
  stoppedAt: string | null;
}
export interface ArchiveCatalog {
  folders: ArchiveFolder[];
  jobs: ArchiveSession[];
  clips: ClipSession[];
}
export interface RecordingRuntimeHealth {
  runtimeAlive: boolean;
  recordingUnavailable: boolean;
  encoderUnavailable: boolean;
  storageUnavailable: boolean;
  metadataOnly: boolean;
  lastError: string | null;
  warnings: string[];
}
export interface RecordingRuntimeMetrics {
  commandsExecuted: number;
  droppedCommands: number;
  queueSize: number;
  historySize: number;
  activeIsoCount: number;
  bookmarkCount: number;
  archiveJobCount: number;
  estimatedStorageMb: number;
}
export interface RecordingRuntimeSnapshot {
  id: string;
  timestamp: string;
  operator: string;
  programRecordingId: string | null;
  isoCount: number;
  bookmarkCount: number;
  archiveJobCount: number;
  queueSize: number;
  health: RecordingRuntimeHealth;
  estimatedStorageMb: number;
}
export interface RecordingRuntimeState {
  id: string;
  programRecording: RecordingSession | null;
  isoRecordings: RecordingSession[];
  replayBookmarks: ReplayBookmark[];
  clipCatalog: ClipSession[];
  profiles: RecordingProfile[];
  destinations: RecordingDestination[];
  timeShiftBuffers: TimeShiftBuffer[];
  queue: RecordingJob[];
  history: RecordingRuntimeSnapshot[];
  health: RecordingRuntimeHealth;
  metrics: RecordingRuntimeMetrics;
  archiveCatalog: ArchiveCatalog;
  estimatedStorageMb: number;
  retentionPolicy: { defaultDays: number; deleteAfterDays: number | null };
  operatorNotes: string[];
  updatedAt: string;
  containsRuntimeHandles: false;
}
export interface RecordingCommand {
  id: string;
  type: RecordingCommandType;
  operator: string;
  timestamp: string;
  session?: Partial<RecordingSession>;
  profile?: RecordingProfile;
  destination?: RecordingDestination;
  sessionId?: string;
  sourceId?: string;
  durationMs?: number;
  inPointMs?: number;
  outPointMs?: number;
  label?: string;
  bookmarkId?: string;
  clipId?: string;
  archiveFolder?: ArchiveFolder;
  archiveSessionId?: string;
  metadata?: Record<string, unknown>;
  runtimeHandle?: never;
  file?: never;
  stream?: never;
  encoder?: never;
}
const now = () => new Date().toISOString();
const rid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const createDefaultRecordingProfile = (): RecordingProfile => ({
  id: 'profile-metadata',
  name: 'Metadata Only',
  container: 'metadata',
  videoCodec: 'none',
  audioCodec: 'none',
  estimatedMbps: 0,
  retentionDays: 30,
  valid: true,
});
export const createDefaultRecordingDestination = (): RecordingDestination => ({
  id: 'destination-metadata',
  name: 'Metadata Catalog',
  kind: 'metadata',
  uri: 'ubos://metadata-only',
  available: false,
  metadataOnly: true,
});
const nullHealth = (err: string | null = null): RecordingRuntimeHealth => ({
  runtimeAlive: true,
  recordingUnavailable: true,
  encoderUnavailable: true,
  storageUnavailable: true,
  metadataOnly: true,
  lastError: err,
  warnings: [
    'Recording unavailable',
    'Encoder unavailable',
    'Storage unavailable',
    'Metadata only',
  ],
});
export interface RecordingAdapterResult {
  ok: boolean;
  unavailable: boolean;
  message: string;
}
export interface RecordingAdapter {
  readonly name: string;
  readonly connected: boolean;
  execute(command: RecordingCommand, state: RecordingRuntimeState): RecordingAdapterResult;
}
export class NullRecordingAdapter implements RecordingAdapter {
  readonly name: string = 'null-recording-adapter';
  readonly connected = false;
  execute() {
    return {
      ok: false,
      unavailable: true,
      message: 'Recording unavailable; Encoder unavailable; Storage unavailable; Metadata only',
    };
  }
}
export class FutureFFmpegAdapter extends NullRecordingAdapter {
  override readonly name = 'future-ffmpeg-adapter-placeholder';
}
export class FutureHardwareRecorderAdapter extends NullRecordingAdapter {
  override readonly name = 'future-hardware-recorder-adapter-placeholder';
}
export class RecordingRuntimeQueue {
  private q: RecordingCommand[] = [];
  enqueue(c: RecordingCommand) {
    this.q.push(c);
  }
  dequeue() {
    return this.q.shift() ?? null;
  }
  snapshot() {
    return [...this.q];
  }
  get size() {
    return this.q.length;
  }
}
export class RecordingRuntimeHistory {
  snapshots: RecordingRuntimeSnapshot[] = [];
  record(s: RecordingRuntimeSnapshot) {
    this.snapshots.push(s);
  }
}
export const createRecordingCommand = (
  type: RecordingCommandType,
  input: Partial<RecordingCommand> = {},
): RecordingCommand => ({
  id: rid(type.toLowerCase()),
  type,
  operator: 'operator',
  timestamp: now(),
  ...input,
});
export function createRecordingRuntimeState(
  input: Partial<RecordingRuntimeState> = {},
): RecordingRuntimeState {
  const profile = createDefaultRecordingProfile(),
    destination = createDefaultRecordingDestination();
  return {
    id: rid('recording-runtime'),
    programRecording: null,
    isoRecordings: [],
    replayBookmarks: [],
    clipCatalog: [],
    profiles: [profile],
    destinations: [destination],
    timeShiftBuffers: [],
    queue: [],
    history: [],
    health: nullHealth(),
    metrics: {
      commandsExecuted: 0,
      droppedCommands: 0,
      queueSize: 0,
      historySize: 0,
      activeIsoCount: 0,
      bookmarkCount: 0,
      archiveJobCount: 0,
      estimatedStorageMb: 0,
    },
    archiveCatalog: { folders: [], jobs: [], clips: [] },
    estimatedStorageMb: 0,
    retentionPolicy: { defaultDays: 30, deleteAfterDays: null },
    operatorNotes: [],
    updatedAt: now(),
    ...input,
    containsRuntimeHandles: false,
  };
}
export function createRecordingRuntimeSnapshot(
  s: RecordingRuntimeState,
  operator = 'system',
): RecordingRuntimeSnapshot {
  return {
    id: rid('recording-snapshot'),
    timestamp: now(),
    operator,
    programRecordingId: s.programRecording?.id ?? null,
    isoCount: s.isoRecordings.filter((x) => x.state === 'recording' || x.state === 'paused').length,
    bookmarkCount: s.replayBookmarks.length,
    archiveJobCount: s.archiveCatalog.jobs.length,
    queueSize: s.queue.length,
    health: s.health,
    estimatedStorageMb: s.estimatedStorageMb,
  };
}
function unsafe(c: RecordingCommand) {
  return (
    ['runtimeHandle', 'file', 'stream', 'encoder'].some((k) =>
      Object.prototype.hasOwnProperty.call(c, k),
    ) ||
    Object.values(c.metadata ?? {}).some(
      (v) =>
        typeof v === 'function' ||
        (v &&
          typeof v === 'object' &&
          /File|Readable|Stream|Encoder/.test((v as object).constructor?.name ?? '')),
    )
  );
}
function validate(s: RecordingRuntimeState, c: RecordingCommand) {
  if (unsafe(c)) throw new Error('Unsafe runtime handle rejected');
  if ((c.durationMs ?? 0) < 0 || (c.inPointMs ?? 0) < 0 || (c.outPointMs ?? 0) < 0)
    throw new Error('Negative duration rejected');
  if (c.profile && (!c.profile.valid || c.profile.estimatedMbps < 0))
    throw new Error('Invalid recording profile');
  if (
    c.destination &&
    (!c.destination.id || (!c.destination.available && !c.destination.metadataOnly))
  )
    throw new Error('Invalid archive destination');
  if (
    c.session?.id &&
    [s.programRecording, ...s.isoRecordings].some((x) => x?.id === c.session?.id)
  )
    throw new Error('Duplicate recording ID rejected');
}
const session = (
  c: RecordingCommand,
  mode: 'program' | 'iso',
  state: RecordingRuntimeState,
): RecordingSession => {
  const p = c.profile?.id ?? c.session?.profileId ?? state.profiles[0]?.id ?? 'profile-metadata';
  const d =
    c.destination?.id ??
    c.session?.destinationId ??
    state.destinations[0]?.id ??
    'destination-metadata';
  return {
    id: c.session?.id ?? c.sessionId ?? rid(`${mode}-recording`),
    mode,
    sourceId: c.sourceId ?? c.session?.sourceId ?? mode,
    profileId: p,
    destinationId: d,
    state: 'recording',
    startedAt: now(),
    stoppedAt: null,
    pausedAt: null,
    durationMs: c.durationMs ?? 0,
    operatorNotes: [],
    manifest: {
      id: rid('manifest'),
      profileId: p,
      destinationId: d,
      metadata: c.metadata ?? {},
      createdAt: now(),
    },
  };
};
export class RecordingRuntimeExecutor {
  constructor(private adapter: RecordingAdapter = new NullRecordingAdapter()) {}
  execute(state: RecordingRuntimeState, c: RecordingCommand): RecordingRuntimeState {
    validate(state, c);
    let n = { ...state, updatedAt: now() };
    if (c.profile)
      n = { ...n, profiles: [...n.profiles.filter((p) => p.id !== c.profile!.id), c.profile] };
    if (c.destination)
      n = {
        ...n,
        destinations: [...n.destinations.filter((d) => d.id !== c.destination!.id), c.destination],
      };
    switch (c.type) {
      case 'CREATE_RECORDING':
        n = {
          ...n,
          operatorNotes: [
            ...n.operatorNotes,
            `Created recording manifest ${c.session?.id ?? c.sessionId ?? 'pending'}`,
          ],
        };
        break;
      case 'START_PROGRAM_RECORDING':
        n = { ...n, programRecording: session(c, 'program', n) };
        break;
      case 'STOP_PROGRAM_RECORDING':
        if (n.programRecording)
          n = {
            ...n,
            programRecording: {
              ...n.programRecording,
              state: 'stopped',
              stoppedAt: now(),
              durationMs: c.durationMs ?? n.programRecording.durationMs,
            },
          };
        break;
      case 'START_ISO_RECORDING':
        n = { ...n, isoRecordings: [...n.isoRecordings, session(c, 'iso', n)] };
        break;
      case 'STOP_ISO_RECORDING':
        n = {
          ...n,
          isoRecordings: n.isoRecordings.map((r) =>
            r.id === (c.sessionId ?? c.session?.id)
              ? {
                  ...r,
                  state: 'stopped',
                  stoppedAt: now(),
                  durationMs: c.durationMs ?? r.durationMs,
                }
              : r,
          ),
        };
        break;
      case 'PAUSE_RECORDING':
        n = {
          ...n,
          programRecording:
            n.programRecording && (!c.sessionId || n.programRecording.id === c.sessionId)
              ? { ...n.programRecording, state: 'paused', pausedAt: now() }
              : n.programRecording,
          isoRecordings: n.isoRecordings.map((r) =>
            r.id === c.sessionId ? { ...r, state: 'paused', pausedAt: now() } : r,
          ),
        };
        break;
      case 'RESUME_RECORDING':
        n = {
          ...n,
          programRecording:
            n.programRecording && (!c.sessionId || n.programRecording.id === c.sessionId)
              ? { ...n.programRecording, state: 'recording', pausedAt: null }
              : n.programRecording,
          isoRecordings: n.isoRecordings.map((r) =>
            r.id === c.sessionId ? { ...r, state: 'recording', pausedAt: null } : r,
          ),
        };
        break;
      case 'CREATE_BOOKMARK': {
        const b: ReplayBookmark = {
          id: c.bookmarkId ?? rid('bookmark'),
          sessionId: c.sessionId ?? n.programRecording?.id ?? 'program',
          label: c.label ?? 'Bookmark',
          timestampMs: c.durationMs ?? 0,
          createdAt: now(),
          metadata: c.metadata ?? {},
        };
        n = { ...n, replayBookmarks: [...n.replayBookmarks, b] };
        break;
      }
      case 'DELETE_BOOKMARK':
        n = { ...n, replayBookmarks: n.replayBookmarks.filter((b) => b.id !== c.bookmarkId) };
        break;
      case 'MARK_CLIP':
      case 'CREATE_CLIP': {
        const inn = c.inPointMs ?? 0,
          out = c.outPointMs ?? c.durationMs ?? inn;
        if (out < inn) throw new Error('Clip out point must be after in point');
        const clip: ClipSession = {
          id: c.clipId ?? rid('clip'),
          sessionId: c.sessionId ?? n.programRecording?.id ?? 'program',
          inPointMs: inn,
          outPointMs: out,
          durationMs: out - inn,
          bookmarkIds: c.bookmarkId ? [c.bookmarkId] : [],
          state: c.type === 'MARK_CLIP' ? 'marked' : 'created',
          createdAt: now(),
        };
        n = {
          ...n,
          clipCatalog: [...n.clipCatalog, clip],
          archiveCatalog: { ...n.archiveCatalog, clips: [...n.archiveCatalog.clips, clip] },
        };
        break;
      }
      case 'DELETE_CLIP':
        n = {
          ...n,
          clipCatalog: n.clipCatalog.map((x) =>
            x.id === c.clipId ? { ...x, state: 'deleted' } : x,
          ),
        };
        break;
      case 'CREATE_TIMESHIFT_BUFFER':
        n = {
          ...n,
          timeShiftBuffers: [
            ...n.timeShiftBuffers,
            {
              id: c.sessionId ?? rid('timeshift'),
              sourceId: c.sourceId ?? 'program',
              durationMs: c.durationMs ?? 0,
              startedAt: now(),
              state: 'active',
              metadataOnly: true,
            },
          ],
        };
        break;
      case 'CLEAR_TIMESHIFT_BUFFER':
        n = {
          ...n,
          timeShiftBuffers: n.timeShiftBuffers.map((b) =>
            !c.sessionId || b.id === c.sessionId ? { ...b, state: 'cleared' } : b,
          ),
        };
        break;
      case 'START_ARCHIVE_JOB': {
        const f = c.archiveFolder ?? {
          id: rid('folder'),
          name: 'Archive',
          destinationId: c.destination?.id ?? n.destinations[0]!.id,
          retentionDays: n.retentionPolicy.defaultDays,
          locked: false,
        };
        const job: ArchiveSession = {
          id: c.archiveSessionId ?? rid('archive'),
          folderId: f.id,
          destinationId: f.destinationId,
          state: 'running',
          sessionIds: c.sessionId ? [c.sessionId] : [],
          startedAt: now(),
          stoppedAt: null,
        };
        n = {
          ...n,
          archiveCatalog: {
            ...n.archiveCatalog,
            folders: [...n.archiveCatalog.folders.filter((x) => x.id !== f.id), f],
            jobs: [...n.archiveCatalog.jobs, job],
          },
        };
        break;
      }
      case 'STOP_ARCHIVE_JOB':
        n = {
          ...n,
          archiveCatalog: {
            ...n.archiveCatalog,
            jobs: n.archiveCatalog.jobs.map((j) =>
              j.id === c.archiveSessionId ? { ...j, state: 'stopped', stoppedAt: now() } : j,
            ),
          },
        };
        break;
      case 'VERIFY_RECORDING':
        n = { ...n, operatorNotes: [...n.operatorNotes, 'Recording metadata verified'] };
        break;
      case 'EXPORT_METADATA':
        n = { ...n, operatorNotes: [...n.operatorNotes, 'Recording metadata exported'] };
        break;
    }
    this.adapter.execute(c, n);
    const estimated = [n.programRecording, ...n.isoRecordings]
      .filter(Boolean)
      .reduce(
        (m, r) =>
          m +
          ((r as RecordingSession).durationMs / 8000) *
            (n.profiles.find((p) => p.id === (r as RecordingSession).profileId)?.estimatedMbps ??
              0),
        0,
      );
    const metrics = {
      ...n.metrics,
      commandsExecuted: n.metrics.commandsExecuted + 1,
      activeIsoCount: n.isoRecordings.filter((r) => r.state === 'recording' || r.state === 'paused')
        .length,
      bookmarkCount: n.replayBookmarks.length,
      archiveJobCount: n.archiveCatalog.jobs.length,
      estimatedStorageMb: estimated,
    };
    return { ...n, estimatedStorageMb: estimated, health: nullHealth(), metrics };
  }
}
export class RecordingRuntimeDispatcher {
  constructor(private runtime: RecordingRuntime) {}
  dispatch(c: RecordingCommand) {
    return this.runtime.dispatch(c);
  }
}
export class RecordingRuntime {
  state: RecordingRuntimeState;
  queue = new RecordingRuntimeQueue();
  history = new RecordingRuntimeHistory();
  executor: RecordingRuntimeExecutor;
  constructor(
    initial: Partial<RecordingRuntimeState> = {},
    adapter: RecordingAdapter = new NullRecordingAdapter(),
  ) {
    this.state = createRecordingRuntimeState(initial);
    this.executor = new RecordingRuntimeExecutor(adapter);
    this.record('system');
  }
  dispatch(c: RecordingCommand) {
    this.queue.enqueue(c);
    this.state = {
      ...this.state,
      queue: this.queue
        .snapshot()
        .map((x) => ({
          id: x.id,
          command: x.type,
          ...(x.sessionId ? { sessionId: x.sessionId } : {}),
          status: 'queued',
          createdAt: x.timestamp,
        })),
    };
    const next = this.queue.dequeue();
    if (!next) return this.state;
    try {
      this.state = this.executor.execute(this.state, next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.state = {
        ...this.state,
        health: nullHealth(msg),
        metrics: { ...this.state.metrics, droppedCommands: this.state.metrics.droppedCommands + 1 },
      };
    }
    this.record(next.operator);
    this.state = {
      ...this.state,
      queue: this.queue
        .snapshot()
        .map((x) => ({
          id: x.id,
          command: x.type,
          ...(x.sessionId ? { sessionId: x.sessionId } : {}),
          status: 'queued',
          createdAt: x.timestamp,
        })),
      history: this.history.snapshots,
      metrics: {
        ...this.state.metrics,
        queueSize: this.queue.size,
        historySize: this.history.snapshots.length,
      },
    };
    return this.state;
  }
  private record(operator: string) {
    this.history.record(createRecordingRuntimeSnapshot(this.state, operator));
  }
  snapshot(operator = 'system') {
    return createRecordingRuntimeSnapshot(this.state, operator);
  }
  get health() {
    return this.state.health;
  }
  get metrics() {
    return this.state.metrics;
  }
}
export const createRecordingRuntime = (
  initial: Partial<RecordingRuntimeState> = {},
  adapter?: RecordingAdapter,
) => new RecordingRuntime(initial, adapter ?? new NullRecordingAdapter());

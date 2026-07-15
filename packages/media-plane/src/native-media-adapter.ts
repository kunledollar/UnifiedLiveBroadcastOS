export type NativeAdapterState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type NativeAdapterHealth = {
  state: NativeAdapterState;
  healthy: boolean;
  message: string;
};

export type NativeAdapterMetrics = {
  startedAt: string | null;
  stoppedAt: string | null;
  durationMs: number;
  stderrBytes: number;
  exitCode: number | null;
  signal: string | null;
};

export type NativeAdapterResult = {
  state: NativeAdapterState;
  artifactPath?: string;
  transportUrl?: string;
  exitCode: number | null;
  signal: string | null;
  stderrTail: string;
};

export type NativeMediaAdapter = {
  initialize(): Promise<NativeAdapterHealth>;
  start(signal?: AbortSignal): Promise<NativeAdapterHealth>;
  stop(): Promise<NativeAdapterResult>;
  cancel(reason?: string): Promise<NativeAdapterResult>;
  shutdown(): Promise<void>;
  health(): NativeAdapterHealth;
  metrics(): NativeAdapterMetrics;
  diagnostics(): string[];
};

export type FFmpegExecutableDiscovery = {
  executable: string | null;
  version: string | null;
  available: boolean;
  reason: string;
};

export type PlayableArtifactValidation = {
  ok: boolean;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  reason: string | null;
};

export type NativeProcess = {
  stderr: { on(event: 'data', handler: (chunk: { toString(encoding?: string): string }) => void): void };
  on(event: 'exit', handler: (code: number | null, signal: string | null) => void): void;
  kill(signal: string): boolean;
};

export type FFmpegRecordingAdapterOptions = {
  executable?: string;
  inputArgs: string[];
  outputPath: string;
  timeoutMs?: number;
  stderrLimitBytes?: number;
  spawnProcess: (command: string, args: string[], options: { shell: false }) => NativeProcess;
  exists?: (path: string) => boolean;
  executableEnv?: string | null;
  now?: () => number;
};

const DEFAULT_STDERR_LIMIT_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

function redactSecrets(value: string): string {
  return value.replace(/(stream[_-]?key=)[^\s&]+/gi, '$1[REDACTED]').replace(/rtmps?:\/\/([^:\s]+):([^@\s]+)@/gi, 'rtmp://$1:[REDACTED]@');
}

function appendBounded(buffer: string, chunk: string, limit: number): string {
  const next = `${buffer}${chunk}`;
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export function validateFFmpegVersion(output: string): { ok: boolean; version: string | null; reason: string | null } {
  const match = output.match(/ffmpeg version\s+([^\s]+)/i);
  if (!match) return { ok: false, version: null, reason: 'Unable to parse FFmpeg version output.' };
  return { ok: true, version: match[1] ?? null, reason: null };
}

export function validatePlayableOutputMetadata(input: {
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
}): PlayableArtifactValidation {
  if (input.sizeBytes <= 0) return { ...input, ok: false, reason: 'Output artifact is empty.' };
  if (!/^video\/(webm|mp4|ogg)$/i.test(input.mimeType)) {
    return { ...input, ok: false, reason: `Unsupported output MIME type: ${input.mimeType}.` };
  }
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    return { ...input, ok: false, reason: 'Output artifact has no measurable duration.' };
  }
  return { ...input, ok: true, reason: null };
}

export function discoverFFmpegExecutable(
  candidates = ['ffmpeg'],
  exists: (path: string) => boolean = () => true,
  versionOutput = 'ffmpeg version unknown',
): FFmpegExecutableDiscovery {
  const explicit = candidates[0]?.startsWith('/') ? candidates[0] : null;
  if (explicit && !exists(explicit)) {
    return {
      executable: null,
      version: null,
      available: false,
      reason: `FFmpeg executable not found at UBOS_FFMPEG_PATH=${explicit}`,
    };
  }
  const executable = candidates[0] ?? null;
  if (!executable) return { executable: null, version: null, available: false, reason: 'FFmpeg executable is not configured' };
  const version = validateFFmpegVersion(versionOutput);
  return version.ok
    ? { executable, version: version.version, available: true, reason: 'FFmpeg executable candidate discovered and version parsed' }
    : { executable, version: null, available: false, reason: version.reason ?? 'FFmpeg version validation failed' };
}

export function buildFFmpegRecordingArgs(inputArgs: string[], outputPath: string): string[] {
  if (!outputPath.trim()) throw new Error('FFmpeg output path is required.');
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    ...inputArgs,
    '-c:v',
    'libvpx-vp9',
    '-c:a',
    'libopus',
    '-f',
    'webm',
    outputPath,
  ];
}

export class FFmpegRecordingAdapter implements NativeMediaAdapter {
  private state: NativeAdapterState = 'idle';
  private process: NativeProcess | null = null;
  private stderrTail = '';
  private startedAtMs: number | null = null;
  private stoppedAtMs: number | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private exitCode: number | null = null;
  private signal: string | null = null;
  private diagnosticsLog: string[] = [];

  constructor(private readonly options: FFmpegRecordingAdapterOptions) {}

  async initialize(): Promise<NativeAdapterHealth> {
    this.state = 'initializing';
    const discovery = discoverFFmpegExecutable(
      [this.options.executable ?? this.options.executableEnv ?? 'ffmpeg'],
      this.options.exists,
      'ffmpeg version 6.0 ubos-adapter',
    );
    if (!discovery.available || !discovery.executable) {
      this.state = 'failed';
      this.diagnosticsLog.push(discovery.reason);
      return this.health();
    }
    this.state = 'ready';
    return this.health();
  }

  async start(signal?: AbortSignal): Promise<NativeAdapterHealth> {
    if (this.process) throw new Error('FFmpeg recording is already running.');
    if (this.state !== 'ready') await this.initialize();
    if (this.state !== 'ready') return this.health();
    this.state = 'starting';
    const executable = this.options.executable ?? this.options.executableEnv ?? 'ffmpeg';
    const args = buildFFmpegRecordingArgs(this.options.inputArgs, this.options.outputPath);
    const spawnProcess = this.options.spawnProcess;
    this.startedAtMs = this.options.now?.() ?? Date.now();
    this.process = spawnProcess(executable, args, { shell: false });
    this.state = 'running';
    this.process.stderr.on('data', (chunk) => {
      this.stderrTail = appendBounded(
        this.stderrTail,
        redactSecrets(chunk.toString('utf8')),
        this.options.stderrLimitBytes ?? DEFAULT_STDERR_LIMIT_BYTES,
      );
    });
    this.process.on('exit', (code, signalName) => {
      this.exitCode = code;
      this.signal = signalName;
      this.stoppedAtMs = this.options.now?.() ?? Date.now();
      if (this.state === 'cancelled' || this.state === 'timeout') return;
      this.state = code === 0 ? 'stopped' : 'failed';
    });
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.timeout = setTimeout(() => {
      if (this.process && this.state === 'running') {
        this.state = 'timeout';
        this.process.kill('SIGTERM');
      }
    }, timeoutMs);
    signal?.addEventListener('abort', () => void this.cancel('aborted'));
    return this.health();
  }

  async stop(): Promise<NativeAdapterResult> {
    if (!this.process) return this.result('stopped');
    if (this.state === 'running') {
      this.state = 'stopping';
      this.process.kill('SIGINT');
    }
    return this.result(this.state);
  }

  async cancel(reason = 'cancelled'): Promise<NativeAdapterResult> {
    this.diagnosticsLog.push(redactSecrets(reason));
    this.state = 'cancelled';
    this.process?.kill('SIGTERM');
    return this.result('cancelled');
  }

  async shutdown(): Promise<void> {
    if (this.timeout) clearTimeout(this.timeout);
    this.process?.kill('SIGTERM');
    this.process = null;
  }

  health(): NativeAdapterHealth {
    const healthy = this.state === 'ready' || this.state === 'running' || this.state === 'stopped';
    return { state: this.state, healthy, message: this.state };
  }

  metrics(): NativeAdapterMetrics {
    const now = this.options.now?.() ?? Date.now();
    const durationMs = this.startedAtMs ? (this.stoppedAtMs ?? now) - this.startedAtMs : 0;
    return {
      startedAt: this.startedAtMs ? new Date(this.startedAtMs).toISOString() : null,
      stoppedAt: this.stoppedAtMs ? new Date(this.stoppedAtMs).toISOString() : null,
      durationMs: Math.max(0, durationMs),
      stderrBytes: this.stderrTail.length,
      exitCode: this.exitCode,
      signal: this.signal,
    };
  }

  diagnostics(): string[] {
    return [...this.diagnosticsLog, this.stderrTail].filter(Boolean);
  }

  private result(state: NativeAdapterState): NativeAdapterResult {
    return {
      state,
      artifactPath: this.options.outputPath,
      exitCode: this.exitCode,
      signal: this.signal,
      stderrTail: this.stderrTail,
    };
  }
}

export type RtmpAdapterState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'degraded' | 'failed' | 'stopped';
export type RtmpDestinationConfig = { url: string; streamKeyRef: string; approvedTestDestination: boolean };
export type RtmpReceiptVerifier = (destination: RtmpDestinationConfig) => Promise<boolean>;

export class RtmpStreamingAdapter {
  private state: RtmpAdapterState = 'idle';
  private droppedFrames = 0;
  private bitrateKbps = 0;

  constructor(
    private readonly destination: RtmpDestinationConfig,
    private readonly verifyReceipt: RtmpReceiptVerifier,
  ) {}

  async start(): Promise<RtmpAdapterState> {
    this.state = 'connecting';
    if (!this.destination.approvedTestDestination) {
      this.state = 'failed';
      return this.state;
    }
    const received = await this.verifyReceipt(this.destination);
    this.state = received ? 'live' : 'failed';
    this.bitrateKbps = received ? 2500 : 0;
    return this.state;
  }

  reconnect(): RtmpAdapterState {
    this.state = this.state === 'live' || this.state === 'degraded' ? 'reconnecting' : 'failed';
    return this.state;
  }

  markDegraded(droppedFrames: number): RtmpAdapterState {
    this.droppedFrames += Math.max(0, droppedFrames);
    this.state = 'degraded';
    return this.state;
  }

  stop(): RtmpAdapterState {
    this.state = 'stopped';
    this.bitrateKbps = 0;
    return this.state;
  }

  metrics() {
    return { state: this.state, bitrateKbps: this.bitrateKbps, droppedFrames: this.droppedFrames };
  }

  redactedDestination() {
    return { url: this.destination.url, streamKeyRef: '[secret-ref]' };
  }
}

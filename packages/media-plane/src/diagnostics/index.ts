export type DiagnosticsSeverity = 'info' | 'warning' | 'critical';
export type PipelineHealthState = 'healthy' | 'degraded' | 'critical' | 'unknown';
export type TracePhase = 'begin' | 'end' | 'instant';

export interface CpuUtilizationMetadata {
  estimatedPercent: number;
  sampleWindowMs: number;
  source: 'runtime_metadata';
}
export interface GpuUtilizationMetadata {
  estimatedPercent: number;
  memoryEstimatedMb: number;
  queueDepth: number;
  source: 'runtime_metadata';
}
export interface MemoryUsageMetadata {
  usedMb: number;
  reservedMb: number;
  peakMb: number;
  source: 'runtime_metadata';
}
export interface FrameTimingStatistics {
  frames: number;
  droppedFrames: number;
  averageFrameMs: number;
  minFrameMs: number;
  maxFrameMs: number;
  jitterMs: number;
  targetFrameMs: number;
}
export interface AudioLatencyMetrics {
  inputLatencyMs: number;
  processingLatencyMs: number;
  outputLatencyMs: number;
  totalLatencyMs: number;
}
export interface RenderLatencyMetrics {
  composeMs: number;
  renderMs: number;
  presentMs: number;
  totalLatencyMs: number;
}
export interface RuntimeMetricsModel {
  cpu: CpuUtilizationMetadata;
  gpu: GpuUtilizationMetadata;
  memory: MemoryUsageMetadata;
  frameTiming: FrameTimingStatistics;
  audioLatency: AudioLatencyMetrics;
  renderLatency: RenderLatencyMetrics;
}
export interface PipelineHealth {
  id: string;
  label: string;
  state: PipelineHealthState;
  lastUpdatedAt: string;
  checks: Array<{ name: string; state: PipelineHealthState; message: string }>;
}
export interface ExecutionTraceEvent {
  id: string;
  name: string;
  phase: TracePhase;
  timestampMs: number;
  metadata: Record<string, unknown>;
}
export interface PerformanceEvent {
  id: string;
  timestampMs: number;
  severity: DiagnosticsSeverity;
  category: string;
  message: string;
  metadata: Record<string, unknown>;
}
export interface DiagnosticsAlert {
  id: string;
  severity: Exclude<DiagnosticsSeverity, 'info'>;
  code: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}
export interface DiagnosticsSnapshot {
  id: string;
  createdAt: string;
  metrics: RuntimeMetricsModel;
  pipelines: PipelineHealth[];
  traces: ExecutionTraceEvent[];
  events: PerformanceEvent[];
  alerts: DiagnosticsAlert[];
  backend: {
    metadataOnly: true;
    usesOsPerformanceApis: false;
    usesBrowserApis: false;
    usesNativeProfiler: false;
    usesExternalTelemetry: false;
    persistsData: false;
  };
}

const nowIso = () => new Date().toISOString();
const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const round = (value: number) => Math.round(value * 100) / 100;

export class PerformanceProfiler {
  private frameDurations: number[] = [];
  private droppedFrames = 0;
  private audio: AudioLatencyMetrics = {
    inputLatencyMs: 0,
    processingLatencyMs: 0,
    outputLatencyMs: 0,
    totalLatencyMs: 0,
  };
  private render: RenderLatencyMetrics = {
    composeMs: 0,
    renderMs: 0,
    presentMs: 0,
    totalLatencyMs: 0,
  };

  constructor(
    private readonly targetFrameMs = 1000 / 60,
    private readonly historyLimit = 240,
  ) {}

  recordFrame(durationMs: number, dropped = false) {
    this.frameDurations.push(durationMs);
    if (this.frameDurations.length > this.historyLimit) this.frameDurations.shift();
    if (dropped) this.droppedFrames += 1;
  }
  recordAudioLatency(inputLatencyMs: number, processingLatencyMs: number, outputLatencyMs: number) {
    this.audio = {
      inputLatencyMs,
      processingLatencyMs,
      outputLatencyMs,
      totalLatencyMs: inputLatencyMs + processingLatencyMs + outputLatencyMs,
    };
  }
  recordRenderLatency(composeMs: number, renderMs: number, presentMs: number) {
    this.render = {
      composeMs,
      renderMs,
      presentMs,
      totalLatencyMs: composeMs + renderMs + presentMs,
    };
  }

  getFrameTiming(): FrameTimingStatistics {
    const values = this.frameDurations;
    const avg = average(values);
    return {
      frames: values.length,
      droppedFrames: this.droppedFrames,
      averageFrameMs: round(avg),
      minFrameMs: round(values.length ? Math.min(...values) : 0),
      maxFrameMs: round(values.length ? Math.max(...values) : 0),
      jitterMs: round(average(values.map((v) => Math.abs(v - avg)))),
      targetFrameMs: round(this.targetFrameMs),
    };
  }
  getAudioLatency() {
    return { ...this.audio };
  }
  getRenderLatency() {
    return { ...this.render };
  }
}

export class HealthMonitor {
  private pipelines = new Map<string, PipelineHealth>();
  updatePipeline(id: string, label: string, checks: PipelineHealth['checks']) {
    const rank = { healthy: 0, unknown: 1, degraded: 2, critical: 3 } as const;
    const state = checks.reduce<PipelineHealthState>(
      (worst, check) => (rank[check.state] > rank[worst] ? check.state : worst),
      'healthy',
    );
    const health = { id, label, state, checks, lastUpdatedAt: nowIso() };
    this.pipelines.set(id, health);
    return health;
  }
  listPipelines() {
    return [...this.pipelines.values()];
  }
}

export class DiagnosticsManager {
  readonly profiler: PerformanceProfiler;
  readonly healthMonitor = new HealthMonitor();
  private cpu: CpuUtilizationMetadata = {
    estimatedPercent: 0,
    sampleWindowMs: 1000,
    source: 'runtime_metadata',
  };
  private gpu: GpuUtilizationMetadata = {
    estimatedPercent: 0,
    memoryEstimatedMb: 0,
    queueDepth: 0,
    source: 'runtime_metadata',
  };
  private memory: MemoryUsageMetadata = {
    usedMb: 0,
    reservedMb: 0,
    peakMb: 0,
    source: 'runtime_metadata',
  };
  private traces: ExecutionTraceEvent[] = [];
  private events: PerformanceEvent[] = [];
  private alerts: DiagnosticsAlert[] = [];
  constructor(
    private readonly id = 'diagnostics-manager',
    options: { targetFrameMs?: number; historyLimit?: number } = {},
  ) {
    this.profiler = new PerformanceProfiler(options.targetFrameMs, options.historyLimit);
  }
  updateCpu(metadata: Partial<CpuUtilizationMetadata>) {
    this.cpu = { ...this.cpu, ...metadata, source: 'runtime_metadata' };
  }
  updateGpu(metadata: Partial<GpuUtilizationMetadata>) {
    this.gpu = { ...this.gpu, ...metadata, source: 'runtime_metadata' };
  }
  updateMemory(metadata: Partial<MemoryUsageMetadata>) {
    this.memory = {
      ...this.memory,
      ...metadata,
      peakMb: Math.max(
        metadata.peakMb ?? 0,
        metadata.usedMb ?? this.memory.usedMb,
        this.memory.peakMb,
      ),
      source: 'runtime_metadata',
    };
  }
  trace(name: string, phase: TracePhase, metadata: Record<string, unknown> = {}) {
    const event = {
      id: `trace:${this.traces.length + 1}`,
      name,
      phase,
      timestampMs: Date.now(),
      metadata,
    };
    this.traces.push(event);
    return event;
  }
  recordEvent(
    severity: DiagnosticsSeverity,
    category: string,
    message: string,
    metadata: Record<string, unknown> = {},
  ) {
    const event = {
      id: `perf:${this.events.length + 1}`,
      timestampMs: Date.now(),
      severity,
      category,
      message,
      metadata,
    };
    this.events.push(event);
    return event;
  }
  raiseAlert(severity: Exclude<DiagnosticsSeverity, 'info'>, code: string, message: string) {
    const alert = {
      id: `alert:${this.alerts.length + 1}`,
      severity,
      code,
      message,
      createdAt: nowIso(),
      acknowledged: false,
    };
    this.alerts.push(alert);
    return alert;
  }
  acknowledgeAlert(id: string) {
    const alert = this.alerts.find((candidate) => candidate.id === id);
    if (alert) alert.acknowledged = true;
    return alert;
  }
  getSnapshot(): DiagnosticsSnapshot {
    return {
      id: this.id,
      createdAt: nowIso(),
      metrics: {
        cpu: { ...this.cpu },
        gpu: { ...this.gpu },
        memory: { ...this.memory },
        frameTiming: this.profiler.getFrameTiming(),
        audioLatency: this.profiler.getAudioLatency(),
        renderLatency: this.profiler.getRenderLatency(),
      },
      pipelines: this.healthMonitor.listPipelines(),
      traces: [...this.traces],
      events: [...this.events],
      alerts: [...this.alerts],
      backend: {
        metadataOnly: true,
        usesOsPerformanceApis: false,
        usesBrowserApis: false,
        usesNativeProfiler: false,
        usesExternalTelemetry: false,
        persistsData: false,
      },
    };
  }
  exportJson() {
    return JSON.stringify(this.getSnapshot(), null, 2);
  }
}

export function createDiagnosticsManager(id?: string) {
  return new DiagnosticsManager(id);
}
export function createDiagnosticsDemo() {
  const manager = createDiagnosticsManager('diagnostics-demo');
  manager.updateCpu({ estimatedPercent: 42, sampleWindowMs: 1000 });
  manager.updateGpu({ estimatedPercent: 58, memoryEstimatedMb: 512, queueDepth: 2 });
  manager.updateMemory({ usedMb: 768, reservedMb: 1024 });
  manager.profiler.recordFrame(16.7);
  manager.profiler.recordFrame(18.4);
  manager.profiler.recordAudioLatency(4, 6, 8);
  manager.profiler.recordRenderLatency(3, 9, 2);
  manager.healthMonitor.updatePipeline('program-output', 'Program Output', [
    { name: 'frame cadence', state: 'healthy', message: 'Frame cadence inside target window' },
  ]);
  manager.trace('render_frame', 'instant', { frameId: 1 });
  manager.recordEvent('warning', 'frame_timing', 'Frame duration exceeded target', {
    frameMs: 18.4,
  });
  manager.raiseAlert(
    'warning',
    'UBOS_DIAG_FRAME_JITTER',
    'Frame jitter is above the configured metadata threshold',
  );
  return { manager, snapshot: manager.getSnapshot() };
}

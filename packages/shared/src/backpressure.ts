export type UBOSQueue =
  | 'COMMAND_QUEUE'
  | 'EVENT_QUEUE'
  | 'INTENT_QUEUE'
  | 'FRAME_QUEUE'
  | 'VIDEO_ROUTE_QUEUE'
  | 'AUDIO_ROUTE_QUEUE'
  | 'OUTPUT_QUEUE'
  | 'RENDER_QUEUE'
  | 'SYNC_QUEUE'
  | 'DIAGNOSTIC_QUEUE';

export type QueuePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';
export type QueueOverflowPolicy =
  | 'BLOCK'
  | 'DROP_NEWEST'
  | 'DROP_OLDEST'
  | 'MERGE'
  | 'COALESCE'
  | 'DEFER'
  | 'THROTTLE'
  | 'PAUSE_PRODUCER'
  | 'FAIL_FAST';
export type QueuePressureLevel = 'NORMAL' | 'BUSY' | 'HEAVY' | 'OVERLOADED' | 'CRITICAL';
export type QueueHealth = 'healthy' | 'busy' | 'stressed' | 'critical' | 'recovering';
export type SchedulerPressure = QueuePressureLevel;
export type LoadSheddingWork =
  | 'diagnostics'
  | 'metrics'
  | 'background_inspection'
  | 'preview_rendering'
  | 'multiview'
  | 'confidence_monitoring'
  | 'future_recording'
  | 'future_streaming';
export type DegradedOperationMode =
  | 'reduced_diagnostics'
  | 'reduced_preview_fps'
  | 'pause_multiview'
  | 'pause_confidence_monitor'
  | 'disable_background_inspection'
  | 'disable_expensive_profiling'
  | 'mock_only_rendering';

export interface QueueBudget {
  readonly queue: UBOSQueue;
  readonly maxSize: number;
  readonly priority: QueuePriority;
  readonly overflowPolicy: QueueOverflowPolicy;
  readonly busyAt: number;
  readonly heavyAt: number;
  readonly overloadedAt: number;
  readonly criticalAt: number;
}

export interface QueueMetrics {
  readonly queue: UBOSQueue;
  readonly depth: number;
  readonly oldestItemAgeMs: number;
  readonly enqueueRatePerSecond: number;
  readonly dequeueRatePerSecond: number;
  readonly recovering?: boolean;
}

export interface ExecutionBudget {
  readonly name: string;
  readonly priority: QueuePriority;
  readonly budgetMsPerFrame: number;
  readonly maxUtilization: number;
  readonly rollover: 'none' | 'bounded';
  readonly boundedRolloverMs?: number;
}

export interface SubsystemBudget extends ExecutionBudget {
  readonly subsystem:
    | 'planner'
    | 'renderer'
    | 'video_routing'
    | 'audio_routing'
    | 'outputs'
    | 'diagnostics'
    | 'future_recording'
    | 'future_streaming'
    | 'future_multiview';
}

export interface ResourceBudget {
  readonly cpuPercent: number;
  readonly memoryMb: number;
  readonly gpuPercent?: number;
  readonly networkKbps?: number;
}

export interface QueueHealthSummary {
  readonly queue: UBOSQueue;
  readonly pressure: QueuePressureLevel;
  readonly health: QueueHealth;
  readonly utilization: number;
  readonly shouldThrottle: boolean;
  readonly shouldDrop: boolean;
  readonly shouldPauseProducer: boolean;
}

export interface SystemLoadSummary {
  readonly pressure: SchedulerPressure;
  readonly maxQueuePressure: QueuePressureLevel;
  readonly activeDegradedModes: readonly DegradedOperationMode[];
  readonly shedWork: readonly LoadSheddingWork[];
  readonly schedulerUtilization: number;
}

const pressureRank: Record<QueuePressureLevel, number> = {
  NORMAL: 0,
  BUSY: 1,
  HEAVY: 2,
  OVERLOADED: 3,
  CRITICAL: 4,
};

const sheddingOrder: readonly LoadSheddingWork[] = [
  'diagnostics',
  'metrics',
  'background_inspection',
  'preview_rendering',
  'multiview',
  'confidence_monitoring',
  'future_recording',
  'future_streaming',
];

export function createQueueBudget(input: {
  queue: UBOSQueue;
  maxSize: number;
  priority?: QueuePriority;
  overflowPolicy?: QueueOverflowPolicy;
  busyAt?: number;
  heavyAt?: number;
  overloadedAt?: number;
  criticalAt?: number;
}): QueueBudget {
  if (input.maxSize <= 0) throw new Error('Queue budget maxSize must be greater than zero');
  return {
    queue: input.queue,
    maxSize: input.maxSize,
    priority: input.priority ?? 'NORMAL',
    overflowPolicy: input.overflowPolicy ?? 'DEFER',
    busyAt: input.busyAt ?? 0.5,
    heavyAt: input.heavyAt ?? 0.75,
    overloadedAt: input.overloadedAt ?? 0.9,
    criticalAt: input.criticalAt ?? 1,
  };
}

export function calculateQueuePressure(
  metrics: QueueMetrics,
  budget: QueueBudget,
): QueuePressureLevel {
  const utilization = metrics.depth / budget.maxSize;
  if (utilization >= budget.criticalAt) return 'CRITICAL';
  if (utilization >= budget.overloadedAt) return 'OVERLOADED';
  if (utilization >= budget.heavyAt) return 'HEAVY';
  if (utilization >= budget.busyAt) return 'BUSY';
  return 'NORMAL';
}

export function calculateSchedulerPressure(input: {
  utilization: number;
  queuePressures?: readonly QueuePressureLevel[];
}): SchedulerPressure {
  const utilizationPressure: SchedulerPressure =
    input.utilization >= 1
      ? 'CRITICAL'
      : input.utilization >= 0.9
        ? 'OVERLOADED'
        : input.utilization >= 0.75
          ? 'HEAVY'
          : input.utilization >= 0.5
            ? 'BUSY'
            : 'NORMAL';
  return [...(input.queuePressures ?? []), utilizationPressure].reduce(
    (max, pressure) => (pressureRank[pressure] > pressureRank[max] ? pressure : max),
    'NORMAL' as SchedulerPressure,
  );
}

export function shouldThrottleSubsystem(
  pressure: QueuePressureLevel,
  budget: Pick<ExecutionBudget, 'priority'>,
): boolean {
  if (budget.priority === 'CRITICAL') return pressure === 'CRITICAL';
  if (budget.priority === 'HIGH') return pressureRank[pressure] >= pressureRank.OVERLOADED;
  return pressureRank[pressure] >= pressureRank.HEAVY;
}

export function shouldDropWork(
  pressure: QueuePressureLevel,
  priority: QueuePriority,
  policy: QueueOverflowPolicy,
): boolean {
  if (policy === 'DROP_NEWEST' || policy === 'DROP_OLDEST')
    return pressureRank[pressure] >= pressureRank.OVERLOADED;
  if (priority === 'BACKGROUND') return pressureRank[pressure] >= pressureRank.HEAVY;
  if (priority === 'LOW') return pressureRank[pressure] >= pressureRank.OVERLOADED;
  return false;
}

export function shouldPauseProducer(
  pressure: QueuePressureLevel,
  policy: QueueOverflowPolicy,
): boolean {
  return policy === 'PAUSE_PRODUCER'
    ? pressureRank[pressure] >= pressureRank.HEAVY
    : pressure === 'CRITICAL';
}

export function summarizeQueueHealth(
  metrics: QueueMetrics,
  budget: QueueBudget,
): QueueHealthSummary {
  const pressure = calculateQueuePressure(metrics, budget);
  const health: QueueHealth = metrics.recovering
    ? 'recovering'
    : pressure === 'CRITICAL'
      ? 'critical'
      : pressure === 'OVERLOADED' || pressure === 'HEAVY'
        ? 'stressed'
        : pressure === 'BUSY'
          ? 'busy'
          : 'healthy';
  return {
    queue: metrics.queue,
    pressure,
    health,
    utilization: metrics.depth / budget.maxSize,
    shouldThrottle: shouldThrottleSubsystem(pressure, budget),
    shouldDrop: shouldDropWork(pressure, budget.priority, budget.overflowPolicy),
    shouldPauseProducer: shouldPauseProducer(pressure, budget.overflowPolicy),
  };
}

export function summarizeSystemLoad(input: {
  schedulerUtilization: number;
  queues: readonly QueueHealthSummary[];
  activeDegradedModes?: readonly DegradedOperationMode[];
}): SystemLoadSummary {
  const maxQueuePressure = input.queues.reduce(
    (max, queue) => (pressureRank[queue.pressure] > pressureRank[max] ? queue.pressure : max),
    'NORMAL' as QueuePressureLevel,
  );
  const pressure = calculateSchedulerPressure({
    utilization: input.schedulerUtilization,
    queuePressures: input.queues.map((queue) => queue.pressure),
  });
  const shedCount =
    pressure === 'CRITICAL'
      ? sheddingOrder.length
      : pressure === 'OVERLOADED'
        ? 6
        : pressure === 'HEAVY'
          ? 4
          : pressure === 'BUSY'
            ? 2
            : 0;
  return {
    pressure,
    maxQueuePressure,
    activeDegradedModes: input.activeDegradedModes ?? [],
    shedWork: sheddingOrder.slice(0, shedCount),
    schedulerUtilization: input.schedulerUtilization,
  };
}

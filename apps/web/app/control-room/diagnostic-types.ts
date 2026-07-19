export type DiagnosticScenarioId =
  | 'baseline'
  | 'static-shell'
  | 'audio-disabled'
  | 'video-disabled'
  | 'scenes-disabled'
  | 'recording-disabled'
  | 'runtime-disabled'
  | 'animations-disabled'
  | 'canvas-video-hidden'
  | 'all-live-subsystems-disabled';
export type GeometrySample = {
  timestamp: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type DiagnosticError = { timestamp: number; type: string; message: string; stack?: string };
export type ControlRoomDiagnostics = {
  enabled: boolean;
  ready: boolean;
  scenario: string;
  startedAt: number | null;
  stoppedAt: number | null;
  renders: Record<string, number>;
  stateWrites: Record<string, unknown>;
  observers: { mutations: number; mutationCallbacks: number; resizeCallbacks: number };
  timers: { raf: number; intervals: number; timeouts: number };
  performance: {
    layoutShiftCount: number;
    cumulativeLayoutShift: number;
    layoutShiftSources: unknown[];
    longTaskCount: number;
  };
  geometry: Record<string, GeometrySample[]>;
  errors: DiagnosticError[];
  visibilityChanges: number;
  viewport: { width: number; height: number; scrollWidth: number; scrollHeight: number };
  elementCounts: { video: number; canvas: number; animations: number };
  firstGeometryChange?: string;
};
export type DiagnosticRun = {
  id: string;
  scenario: DiagnosticScenarioId;
  status: 'complete' | 'failed';
  durationMs: number;
  result: ControlRoomDiagnostics;
  error?: string;
};

'use client';
import { useEffect } from 'react';
import type { ControlRoomDiagnostics, GeometrySample } from './diagnostic-types';
const targets = [
  'control-room-root',
  'scene-workspace',
  'program-monitor',
  'preview-monitor',
  'left-rail',
  'right-rail',
  'command-center-stage',
  'audio-panel',
];
const empty = (scenario: string): ControlRoomDiagnostics => ({
  enabled: true,
  ready: false,
  scenario,
  startedAt: null,
  stoppedAt: null,
  renders: {},
  stateWrites: {},
  observers: { mutations: 0, mutationCallbacks: 0, resizeCallbacks: 0 },
  timers: { raf: 0, intervals: 0, timeouts: 0 },
  performance: {
    layoutShiftCount: 0,
    cumulativeLayoutShift: 0,
    layoutShiftSources: [],
    longTaskCount: 0,
  },
  geometry: {},
  errors: [],
  visibilityChanges: 0,
  viewport: {
    width: innerWidth,
    height: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  },
  elementCounts: { video: 0, canvas: 0, animations: 0 },
});
function changed(last: GeometrySample | undefined, next: GeometrySample) {
  return (
    !last ||
    ['x', 'y', 'width', 'height'].some(
      (k) =>
        Math.abs(
          ((last[k as keyof GeometrySample] as number) - next[k as keyof GeometrySample]) as number,
        ) > 0.5,
    )
  );
}
export function DiagnosticRuntime({ scenario }: { scenario: string }) {
  useEffect(() => {
    const state = empty(scenario);
    window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ = state;
    const origin = location.origin;
    const sample = () => {
      state.viewport = {
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      };
      state.elementCounts = {
        video: document.querySelectorAll('video').length,
        canvas: document.querySelectorAll('canvas').length,
        animations: document.getAnimations?.().length ?? 0,
      };
      targets.forEach((target) => {
        const el = document.querySelector(
          `[data-ubos-diagnostic-target="${target}"], [data-ubos-${target}="true"]`,
        );
        if (!el) return;
        const r = el.getBoundingClientRect();
        const next = {
          timestamp: performance.now(),
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        };
        const bucket = state.geometry[target] ?? (state.geometry[target] = []);
        if (changed(bucket.at(-1), next)) {
          bucket.push(next);
          state.firstGeometryChange ??= target;
        }
      });
    };
    const mutation = new MutationObserver((records) => {
      if (state.startedAt) {
        state.observers.mutationCallbacks++;
        state.observers.mutations += records.length;
      }
    });
    mutation.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    const resize = new ResizeObserver(() => {
      if (state.startedAt) state.observers.resizeCallbacks++;
      sample();
    });
    resize.observe(document.documentElement);
    const perf = new PerformanceObserver((list) =>
      list.getEntries().forEach((entry) => {
        const shift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
          sources?: Array<{ node?: Element }>;
        };
        if (!state.startedAt) return;
        if (entry.entryType === 'layout-shift' && !shift.hadRecentInput) {
          state.performance.layoutShiftCount++;
          state.performance.cumulativeLayoutShift += shift.value ?? 0;
          state.performance.layoutShiftSources.push(
            shift.sources?.map(
              (s) => s.node?.getAttribute('data-ubos-diagnostic-target') ?? s.node?.tagName,
            ),
          );
        }
        if (entry.entryType === 'longtask') state.performance.longTaskCount++;
      }),
    );
    try {
      perf.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);
      perf.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
    } catch {
      /* browser does not expose these entries */
    }
    const frame = () => {
      if (state.startedAt) state.timers.raf++;
      requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    const error = (e: ErrorEvent) =>
      state.errors.push({
        timestamp: performance.now(),
        type: 'error',
        message: e.message,
        stack: e.error?.stack,
      });
    const rejection = (e: PromiseRejectionEvent) =>
      state.errors.push({
        timestamp: performance.now(),
        type: 'unhandledrejection',
        message: String(e.reason),
        stack: e.reason?.stack,
      });
    const visibility = () => state.visibilityChanges++;
    addEventListener('error', error);
    addEventListener('unhandledrejection', rejection);
    document.addEventListener('visibilitychange', visibility);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      if (event.data?.type === 'UBOS_DIAGNOSTICS_START') {
        Object.assign(state, empty(scenario), { ready: true, startedAt: performance.now() });
        sample();
      }
      if (event.data?.type === 'UBOS_DIAGNOSTICS_STOP') {
        state.stoppedAt = performance.now();
        sample();
        parent.postMessage({ type: 'UBOS_DIAGNOSTICS_RESULT', result: state }, origin);
      }
      if (event.data?.type === 'UBOS_DIAGNOSTICS_RESET')
        Object.assign(state, empty(scenario), { ready: true });
    };
    addEventListener('message', onMessage);
    state.ready = true;
    sample();
    parent.postMessage({ type: 'UBOS_DIAGNOSTICS_READY', scenario }, origin);
    return () => {
      cancelAnimationFrame(raf);
      mutation.disconnect();
      resize.disconnect();
      perf.disconnect();
      removeEventListener('message', onMessage);
      removeEventListener('error', error);
      removeEventListener('unhandledrejection', rejection);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [scenario]);
  return null;
}

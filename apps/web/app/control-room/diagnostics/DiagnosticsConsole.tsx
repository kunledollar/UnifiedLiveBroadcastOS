'use client';
import { useEffect, useRef, useState } from 'react';
import type {
  ControlRoomDiagnostics,
  DiagnosticRun,
  DiagnosticScenarioId,
} from '../diagnostic-types';
import { scenarios, scenarioUrl } from './diagnostic-scenarios';
import { rankRuns, totalRenders } from './diagnostic-ranking';
const ids = Object.keys(scenarios) as DiagnosticScenarioId[];
const download = (name: string, value: string, type: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([value], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};
export function DiagnosticsConsole() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [scenario, setScenario] = useState<DiagnosticScenarioId>('baseline');
  const [duration, setDuration] = useState(10);
  const [status, setStatus] = useState('idle');
  const [live, setLive] = useState<ControlRoomDiagnostics | null>(null);
  const [runs, setRuns] = useState<DiagnosticRun[]>([]);
  const result = useRef<((r: ControlRoomDiagnostics) => void) | undefined>(undefined);
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      if (e.data?.type === 'UBOS_DIAGNOSTICS_RESULT') result.current?.(e.data.result);
    };
    addEventListener('message', handler);
    return () => removeEventListener('message', handler);
  }, []);
  const execute = async (id: DiagnosticScenarioId) => {
    setStatus('loading');
    const f = frame.current!;
    f.src = scenarioUrl(id);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Diagnostic target did not become ready')),
        15000,
      );
      const ready = (e: MessageEvent) => {
        if (e.origin === location.origin && e.data?.type === 'UBOS_DIAGNOSTICS_READY') {
          removeEventListener('message', ready);
          clearTimeout(timeout);
          resolve();
        }
      };
      addEventListener('message', ready);
    });
    setStatus('stabilizing');
    await new Promise((r) => setTimeout(r, 2000));
    setStatus('measuring');
    f.contentWindow?.postMessage({ type: 'UBOS_DIAGNOSTICS_START' }, location.origin);
    const poll = setInterval(
      () => setLive(f.contentWindow?.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ ?? null),
      250,
    );
    await new Promise((r) => setTimeout(r, duration * 1000));
    const data = await new Promise<ControlRoomDiagnostics>((resolve) => {
      result.current = resolve;
      f.contentWindow?.postMessage({ type: 'UBOS_DIAGNOSTICS_STOP' }, location.origin);
    });
    clearInterval(poll);
    setLive(data);
    setRuns((v) => [
      ...v,
      {
        id: crypto.randomUUID(),
        scenario: id,
        status: 'complete',
        durationMs: duration * 1000,
        result: data,
      },
    ]);
    setStatus('complete');
  };
  const run = () => execute(scenario).catch((e) => setStatus(`failed: ${e.message}`));
  const matrix = async () => {
    for (const id of ids) {
      try {
        await execute(id);
      } catch (e) {
        setStatus(`failed: ${String(e)}`);
        break;
      }
    }
  };
  const payload = {
    applicationVersion: '1.0.0-rc.1',
    date: new Date().toISOString(),
    browserUserAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight },
    scenarioDefinitions: scenarios,
    rawRunResults: runs,
    rankedSuspects: rankRuns(runs),
    limitations: [
      'Paint metrics and console interception are unavailable through standard browser APIs.',
    ],
    conclusionStatus: 'inconclusive',
  };
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-bold">UBOS Control Room Diagnostics</h1>
      <p className="mb-4 text-sm text-slate-400">
        Same-origin, isolated iframe measurements. Measurements begin after a two-second
        stabilization delay.
      </p>
      <section className="grid gap-3 rounded bg-slate-900 p-4 md:grid-cols-4">
        <label>
          Scenario
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as DiagnosticScenarioId)}
            className="block w-full text-black"
          >
            {ids.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
        <label>
          Duration (seconds)
          <input
            className="block w-full text-black"
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        <div className="flex gap-2 items-end">
          <button onClick={run}>Start run</button>
          <button onClick={() => setStatus('idle')}>Stop</button>
          <button onClick={matrix}>Run matrix</button>
        </div>
        <div>
          Status: <strong>{status}</strong>
          <br />
          Runs: {runs.length}
        </div>
      </section>
      <section className="my-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded bg-slate-900 p-4">
          <h2>Live metrics</h2>
          <pre className="overflow-auto text-xs">
            {live
              ? JSON.stringify(
                  {
                    renders: totalRenders({ result: live } as DiagnosticRun),
                    mutations: live.observers.mutations,
                    layoutShifts: live.performance.layoutShiftCount,
                    cls: live.performance.cumulativeLayoutShift,
                    geometryChanges: Object.values(live.geometry).reduce((n, x) => n + x.length, 0),
                    raf: live.timers.raf,
                    errors: live.errors.length,
                  },
                  null,
                  2,
                )
              : 'No active measurement'}
          </pre>
        </div>
        <div className="rounded bg-slate-900 p-4">
          <h2>Export evidence</h2>
          <button
            onClick={() =>
              download(
                `ubos-control-room-diagnostics-${stamp}.json`,
                JSON.stringify(payload, null, 2),
                'application/json',
              )
            }
          >
            Export measurements.json
          </button>
          <button
            className="ml-2"
            onClick={() =>
              download(
                `ubos-control-room-diagnostics-${stamp}.html`,
                `<h1>UBOS Control Room Diagnostics</h1><pre>${JSON.stringify(payload, null, 2).replace(/</g, '&lt;')}</pre>`,
                'text/html',
              )
            }
          >
            Export report.html
          </button>
          <p className="text-sm text-slate-400">
            Capture current frame: unsupported without browser-level screenshot permission.
          </p>
        </div>
      </section>
      <section className="rounded bg-slate-900 p-4">
        <h2>Scenario comparison</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Status</th>
              <th>Renders/sec</th>
              <th>Mutations/sec</th>
              <th>CLS</th>
              <th>Errors</th>
              <th>Improvement</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => {
              const sec = r.durationMs / 1000;
              const suspect = rankRuns(runs).find((x) => x.scenario === r.scenario);
              return (
                <tr key={r.id}>
                  <td>{r.scenario}</td>
                  <td>{r.status}</td>
                  <td>{(totalRenders(r) / sec).toFixed(1)}</td>
                  <td>{(r.result.observers.mutations / sec).toFixed(1)}</td>
                  <td>{r.result.performance.cumulativeLayoutShift.toFixed(3)}</td>
                  <td>{r.result.errors.length}</td>
                  <td>
                    {suspect
                      ? `${suspect.renderReduction.toFixed(0)}% (${suspect.label})`
                      : 'baseline'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <iframe
        ref={frame}
        title="Control Room diagnostic target"
        className="mt-4 h-[600px] w-full border border-slate-600"
      />
    </main>
  );
}

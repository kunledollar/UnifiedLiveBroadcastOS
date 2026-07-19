import type { DiagnosticRun } from '../diagnostic-types';
export function reduction(baseline: number, value: number) {
  return baseline > 0 ? ((baseline - value) / baseline) * 100 : 0;
}
export function rankRuns(runs: DiagnosticRun[]) {
  const base = runs.filter((r) => r.scenario === 'baseline' && r.status === 'complete');
  const baseline = base.length ? base.reduce((n, r) => n + totalRenders(r), 0) / base.length : 0;
  return runs
    .filter((r) => r.scenario !== 'baseline' && r.status === 'complete')
    .map((r) => {
      const percent = reduction(baseline, totalRenders(r));
      const label =
        percent > 75 ? 'primary suspect' : percent >= 40 ? 'secondary suspect' : 'inconclusive';
      return { scenario: r.scenario, renderReduction: percent, label, proven: false };
    })
    .sort((a, b) => b.renderReduction - a.renderReduction);
}
export function totalRenders(run: DiagnosticRun) {
  return Object.values(run.result.renders).reduce((a, b) => a + b, 0);
}

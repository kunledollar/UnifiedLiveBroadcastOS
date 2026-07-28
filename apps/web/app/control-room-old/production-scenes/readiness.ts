import type { SceneReadiness, SceneReadinessState } from './types';
export function readinessSummary(readiness: SceneReadiness) { return Object.values(readiness).reduce((total, state) => ({ ...total, [state]: total[state] + 1 }), { ready:0, armed:0, warning:0, error:0, 'not-configured':0, inactive:0 } as Record<SceneReadinessState, number>); }

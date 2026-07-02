import type { ProductionGraph } from '../../shared/src/production-graph.js';
import type { SceneComposition } from './compositor/index.js';

export type VideoRouteTarget =
  | 'program'
  | 'preview'
  | 'vertical'
  | 'multiview'
  | 'recording'
  | 'stream'
  | 'monitor'
  | 'confidence'
  | 'external';
export type VideoRouteStatus =
  'idle' | 'planned' | 'active' | 'disabled' | 'failed' | 'unavailable';
export interface VideoRouteSource {
  readonly compositionId: string;
  readonly sceneId: string;
  readonly graphRevision: number;
}
export interface VideoRoute {
  readonly id: string;
  readonly sourceCompositionId: string;
  readonly sourceSceneId: string;
  readonly target: VideoRouteTarget;
  readonly targetId: string;
  readonly status: VideoRouteStatus;
  readonly enabled: boolean;
  readonly priority: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly graphRevision: number;
  readonly metadata: Record<string, unknown>;
}
export interface VideoRoutePlan {
  readonly id: string;
  readonly graphRevision: number;
  readonly routes: readonly VideoRoute[];
  readonly warnings: readonly string[];
  readonly createdAt: string;
  readonly metadata: Record<string, unknown>;
}
export interface VideoRouteGraph {
  readonly revision: number;
  readonly plan?: VideoRoutePlan;
  readonly routes: readonly VideoRoute[];
  readonly fanOut: Record<string, readonly VideoRoute[]>;
  readonly warnings: readonly string[];
}
export interface VideoRouteValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
export interface VideoRouteExecutionResult {
  readonly success: boolean;
  readonly routePlan?: VideoRoutePlan;
  readonly routeGraph?: VideoRouteGraph;
  readonly routes: readonly VideoRoute[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
export interface VideoRoutePlannerOptions {
  readonly includeRecording?: boolean;
  readonly includeStreams?: boolean;
  readonly includeConfidenceMonitor?: boolean;
  readonly now?: string;
}

const supportedTargets: readonly VideoRouteTarget[] = [
  'program',
  'preview',
  'vertical',
  'multiview',
  'recording',
  'stream',
  'monitor',
  'confidence',
  'external',
];
const routeId = (target: VideoRouteTarget, targetId: string, compositionId: string) =>
  `video-route:${target}:${targetId}:${compositionId}`;
const compositionForScene = (
  compositions: readonly SceneComposition[],
  sceneId?: string,
  target?: string,
) =>
  sceneId
    ? (compositions.find(
        (c) => c.sceneId === sceneId && (!target || c.renderTargets.includes(target as never)),
      ) ?? compositions.find((c) => c.sceneId === sceneId))
    : undefined;

function createRoute(input: {
  composition: SceneComposition;
  target: VideoRouteTarget;
  targetId?: string;
  priority: number;
  graph: ProductionGraph;
  now: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
  status?: VideoRouteStatus;
}): VideoRoute {
  return {
    id: routeId(input.target, input.targetId ?? input.target, input.composition.id),
    sourceCompositionId: input.composition.id,
    sourceSceneId: input.composition.sceneId,
    target: input.target,
    targetId: input.targetId ?? input.target,
    status: input.status ?? 'planned',
    enabled: input.enabled ?? true,
    priority: input.priority,
    createdAt: input.now,
    updatedAt: input.now,
    graphRevision: input.graph.metadata.revision,
    metadata: input.metadata ?? {},
  };
}

export function createVideoRoutePlan(
  graph: ProductionGraph,
  compositions: readonly SceneComposition[],
  options: VideoRoutePlannerOptions = {},
): VideoRoutePlan {
  const now = options.now ?? graph.metadata.updatedAt ?? new Date(0).toISOString();
  const routes: VideoRoute[] = [];
  const warnings: string[] = [];
  const addSceneTarget = (
    sceneId: string | undefined,
    target: VideoRouteTarget,
    priority: number,
    metadata: Record<string, unknown> = {},
  ) => {
    const composition = compositionForScene(compositions, sceneId, target);
    if (!sceneId) {
      warnings.push(`Missing scene for ${target} route`);
      return;
    }
    if (!composition) {
      warnings.push(`Missing composition for ${target} scene ${sceneId}`);
      return;
    }
    routes.push(createRoute({ composition, target, priority, graph, now, metadata }));
  };
  addSceneTarget(graph.program.sceneId, 'program', 100);
  addSceneTarget(graph.preview.sceneId, 'preview', 90);
  addSceneTarget(graph.program.sceneId, 'vertical', 80, { placeholder: true });
  addSceneTarget(graph.program.sceneId, 'multiview', 70, { placeholder: true });
  if (options.includeRecording ?? graph.recording.status === 'recording')
    addSceneTarget(graph.program.sceneId, 'recording', 60, { placeholder: true });
  const enabledDestinations = Object.values(graph.destinations).filter(
    (destination) => destination.enabled,
  );
  if ((options.includeStreams ?? enabledDestinations.length > 0) && graph.program.sceneId) {
    const composition = compositionForScene(compositions, graph.program.sceneId, 'program');
    if (composition)
      enabledDestinations.forEach((destination, index) =>
        routes.push(
          createRoute({
            composition,
            target: 'stream',
            targetId: destination.id,
            priority: 50 - index,
            graph,
            now,
            metadata: { destinationPlatform: destination.platform, placeholder: true },
          }),
        ),
      );
    else warnings.push(`Missing composition for stream scene ${graph.program.sceneId}`);
  }
  if (options.includeConfidenceMonitor && graph.program.sceneId)
    addSceneTarget(graph.program.sceneId, 'confidence', 40, { placeholder: true });
  const plan: VideoRoutePlan = {
    id: `video-route-plan:${graph.metadata.revision}`,
    graphRevision: graph.metadata.revision,
    routes,
    warnings,
    createdAt: now,
    metadata: { routeCount: routes.length },
  };
  return { ...plan, warnings: [...warnings, ...getVideoRouteWarnings(plan, graph, compositions)] };
}

export function validateVideoRoute(
  route: VideoRoute,
  graph?: ProductionGraph,
  compositions: readonly SceneComposition[] = [],
): VideoRouteValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!supportedTargets.includes(route.target)) errors.push(`Unsupported target ${route.target}`);
  if (!route.enabled) warnings.push(`Route ${route.id} is disabled`);
  if (!Number.isFinite(route.priority) || route.priority < 0)
    errors.push(`Invalid route priority for ${route.id}`);
  if (!route.targetId) warnings.push(`Missing output destination for ${route.id}`);
  if (graph && !graph.scenes[route.sourceSceneId])
    warnings.push(`Missing scene ${route.sourceSceneId}`);
  if (compositions.length > 0 && !compositions.some((c) => c.id === route.sourceCompositionId))
    warnings.push(`Missing composition ${route.sourceCompositionId}`);
  return { valid: errors.length === 0, warnings, errors };
}
export function validateVideoRoutePlan(
  plan: VideoRoutePlan,
  graph?: ProductionGraph,
  compositions: readonly SceneComposition[] = [],
): VideoRouteValidationResult {
  const routeResults = plan.routes.map((route) => validateVideoRoute(route, graph, compositions));
  const warnings = [...plan.warnings, ...routeResults.flatMap((result) => result.warnings)];
  const errors = routeResults.flatMap((result) => result.errors);
  const duplicateKeys = plan.routes
    .map((r) => `${r.target}:${r.targetId}`)
    .filter((key, index, keys) => keys.indexOf(key) !== index);
  warnings.push(...[...new Set(duplicateKeys)].map((key) => `Duplicate route target ${key}`));
  return { valid: errors.length === 0, warnings, errors };
}
export function getVideoRouteWarnings(
  plan: VideoRoutePlan,
  graph?: ProductionGraph,
  compositions: readonly SceneComposition[] = [],
) {
  return validateVideoRoutePlan({ ...plan, warnings: [] }, graph, compositions).warnings;
}
const updateStatus = (
  route: VideoRoute,
  status: VideoRouteStatus,
  metadata: Record<string, unknown> = {},
) => ({
  ...route,
  status,
  enabled: status === 'disabled' ? false : route.enabled,
  updatedAt: new Date().toISOString(),
  metadata: { ...route.metadata, ...metadata },
});
export const activateRoute = (route: VideoRoute) => updateStatus(route, 'active');
export const deactivateRoute = (route: VideoRoute) => updateStatus(route, 'idle');
export const failRoute = (route: VideoRoute, error?: string) =>
  updateStatus(route, 'failed', error ? { error } : {});
export const markRouteUnavailable = (route: VideoRoute, reason?: string) =>
  updateStatus(route, 'unavailable', reason ? { reason } : {});
export function createVideoRouteGraph(plan: VideoRoutePlan): VideoRouteGraph {
  const fanOut: Record<string, VideoRoute[]> = {};
  plan.routes.forEach((route) => {
    fanOut[route.sourceCompositionId] = [...(fanOut[route.sourceCompositionId] ?? []), route];
  });
  return {
    revision: plan.graphRevision,
    plan,
    routes: plan.routes,
    fanOut,
    warnings: plan.warnings,
  };
}
export class VideoRouteStore {
  private plan: VideoRoutePlan | undefined;
  setRoutePlan(plan: VideoRoutePlan) {
    this.plan = plan;
    return plan;
  }
  getRoutePlan() {
    return this.plan;
  }
  listRoutes() {
    return [...(this.plan?.routes ?? [])];
  }
  getRoutesByTarget(target: VideoRouteTarget) {
    return this.listRoutes().filter((route) => route.target === target);
  }
  getRoutesByScene(sceneId: string) {
    return this.listRoutes().filter((route) => route.sourceSceneId === sceneId);
  }
  clearRoutes() {
    this.plan = undefined;
  }
}

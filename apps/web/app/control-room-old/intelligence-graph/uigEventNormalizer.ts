/**
 * UIG Event Normalization Layer (UENL) — Step 82
 *
 * Converts raw engine events into a single canonical UIG event format so the
 * Intelligence Graph can reason consistently across Scene, Graphics, Audio,
 * Replay, Routing, Automation, Output, AI Crew, and Health.
 *
 * Pipeline:
 *   raw engine event → mapType → normalizeAttributes → confidence/lineage/context
 *   → CanonicalUigEvent → UBOSIntelligenceGraph
 */

export type CanonicalUigEventType =
  | 'scene.update'
  | 'scene.active'
  | 'scene.missing_source'
  | 'graphics.active'
  | 'graphics.error'
  | 'audio.level'
  | 'audio.route_change'
  | 'replay.clip_created'
  | 'replay.marker_added'
  | 'routing.path_change'
  | 'routing.destination_error'
  | 'output.health_update'
  | 'output.frame_drop'
  | 'automation.trigger_fired'
  | 'ai.insight'
  | 'operator.presence'
  | 'system.degraded'
  | 'system.healthy'
  | 'system.unknown';

export type RawUigEvent = {
  id?: string;
  type?: string;
  source?: string;
  workspace?: string | null;
  operator?: string | null;
  system?: string | null;
  /** Preferred raw payload field. */
  payload?: Record<string, unknown>;
  /** Alternate payload field used by some emitters. */
  attributes?: Record<string, unknown>;
  confidence?: number;
  timestamp?: number;
  lineage?: string[];
};

export type CanonicalUigEvent = {
  id: string;
  type: CanonicalUigEventType;
  source: string;
  workspace: string | null;
  operator: string | null;
  attributes: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  lineage: string[];
};

export type UigNormalizerContext = {
  workspace?: string | null;
  operator?: string | null;
  system?: string | null;
};

const CANONICAL_TYPES = new Set<string>([
  'scene.update',
  'scene.active',
  'scene.missing_source',
  'graphics.active',
  'graphics.error',
  'audio.level',
  'audio.route_change',
  'replay.clip_created',
  'replay.marker_added',
  'routing.path_change',
  'routing.destination_error',
  'output.health_update',
  'output.frame_drop',
  'automation.trigger_fired',
  'ai.insight',
  'operator.presence',
  'system.degraded',
  'system.healthy',
  'system.unknown',
]);

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `uig-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function readPayload(raw: RawUigEvent): Record<string, unknown> {
  if (raw.payload && typeof raw.payload === 'object') return raw.payload;
  if (raw.attributes && typeof raw.attributes === 'object') return raw.attributes;
  return {};
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export class UIGEventNormalizer {
  private context: UigNormalizerContext = {
    workspace: null,
    operator: null,
    system: 'ubos',
  };

  setContext(context: UigNormalizerContext): void {
    this.context = {
      workspace: context.workspace ?? this.context.workspace ?? null,
      operator: context.operator ?? this.context.operator ?? null,
      system: context.system ?? this.context.system ?? 'ubos',
    };
  }

  getContext(): Readonly<UigNormalizerContext> {
    return this.context;
  }

  normalize(raw: RawUigEvent): CanonicalUigEvent {
    const payload = readPayload(raw);
    const source = (raw.source && String(raw.source).trim()) || 'unknown';
    const type = this.mapType(raw);
    const attributes = this.normalizeAttributes(payload);
    const confidence = this.scoreConfidence(raw, type, attributes);
    const timestamp =
      typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp)
        ? raw.timestamp
        : Date.now();

    const lineage = [
      'engine',
      source,
      'normalizer',
      ...(Array.isArray(raw.lineage) ? raw.lineage.map(String) : []),
    ];

    // Enrich with system context without clobbering emitter fields
    if (attributes.system === undefined && this.context.system) {
      attributes.system = this.context.system;
    }

    return {
      id: raw.id && String(raw.id).trim() ? String(raw.id) : newId(),
      type,
      source,
      workspace: raw.workspace ?? this.context.workspace ?? null,
      operator: raw.operator ?? this.context.operator ?? null,
      attributes,
      confidence,
      timestamp,
      lineage,
    };
  }

  mapType(raw: RawUigEvent): CanonicalUigEventType {
    const t = String(raw.type ?? '').toLowerCase();
    const source = String(raw.source ?? '').toLowerCase();
    const payload = readPayload(raw);

    if (CANONICAL_TYPES.has(t)) return t as CanonicalUigEventType;

    const blob = `${t} ${source}`;
    const dropped =
      asNumber(payload.droppedFrames) ??
      asNumber(payload.dropped_frames) ??
      asNumber(payload.droppedframes) ??
      0;

    // Scene
    if (blob.includes('scene')) {
      if (
        payload.missing === true ||
        payload.missing_source === true ||
        payload.missingSource === true ||
        t.includes('missing')
      ) {
        return 'scene.missing_source';
      }
      if (payload.program === true || payload.active === true || t.includes('active')) {
        return 'scene.active';
      }
      return 'scene.update';
    }

    // Graphics
    if (blob.includes('graphics')) {
      if (
        payload.error === true ||
        payload.status === 'error' ||
        t.includes('error') ||
        t.includes('fail')
      ) {
        return 'graphics.error';
      }
      return 'graphics.active';
    }

    // Audio
    if (blob.includes('audio')) {
      if (
        payload.route_change === true ||
        payload.routeChange === true ||
        t.includes('route')
      ) {
        return 'audio.route_change';
      }
      return 'audio.level';
    }

    // Replay
    if (blob.includes('replay')) {
      if (
        t.includes('marker') ||
        payload.marker === true ||
        (payload.label !== undefined && payload.start === undefined && payload.end === undefined)
      ) {
        return 'replay.marker_added';
      }
      return 'replay.clip_created';
    }

    // Routing
    if (blob.includes('routing') || blob.includes('route')) {
      if (
        payload.broken === true ||
        payload.error === true ||
        payload.status === 'error' ||
        t.includes('error') ||
        t.includes('destination_error')
      ) {
        return 'routing.destination_error';
      }
      return 'routing.path_change';
    }

    // Output
    if (blob.includes('output')) {
      if (dropped > 0 || t.includes('frame_drop') || t.includes('framedrop')) {
        return 'output.frame_drop';
      }
      return 'output.health_update';
    }

    // Automation
    if (blob.includes('automation')) {
      return 'automation.trigger_fired';
    }

    // AI Crew
    if (blob.includes('ai') || blob.includes('insight') || blob.includes('crew')) {
      return 'ai.insight';
    }

    // Operator
    if (blob.includes('operator') || t === 'operatornode') {
      return 'operator.presence';
    }

    // Health / system
    if (blob.includes('health') || blob.includes('system')) {
      const status = String(payload.status ?? '').toLowerCase();
      if (status === 'ok' || status === 'healthy' || status === 'unknown') {
        return status === 'ok' || status === 'healthy' ? 'system.healthy' : 'system.unknown';
      }
      if (
        status === 'error' ||
        status === 'warning' ||
        status === 'degraded' ||
        payload.degraded === true
      ) {
        return 'system.degraded';
      }
      return 'system.degraded';
    }

    return 'system.unknown';
  }

  normalizeAttributes(payload: Record<string, unknown> | null | undefined): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') return {};

    const normalized: Record<string, unknown> = {};

    for (const key of Object.keys(payload)) {
      const lower = key.toLowerCase();
      normalized[lower] = payload[key];
    }

    // Canonical aliases for common engine field variants
    if (normalized.layerids === undefined && normalized.layer_ids !== undefined) {
      normalized.layerids = normalized.layer_ids;
    }
    if (normalized.sceneid === undefined && normalized.scene_id !== undefined) {
      normalized.sceneid = normalized.scene_id;
    }
    if (normalized.cameraid === undefined && normalized.camera_id !== undefined) {
      normalized.cameraid = normalized.camera_id;
    }
    if (normalized.droppedframes === undefined && normalized.dropped_frames !== undefined) {
      normalized.droppedframes = normalized.dropped_frames;
    }
    if (normalized.workspaceid === undefined && normalized.workspace_id !== undefined) {
      normalized.workspaceid = normalized.workspace_id;
    }
    if (normalized.targetid === undefined && normalized.target_id !== undefined) {
      normalized.targetid = normalized.target_id;
    }
    if (normalized.missing === undefined && normalized.missing_source !== undefined) {
      normalized.missing = normalized.missing_source;
    }
    if (normalized.runcount === undefined && normalized.run_count !== undefined) {
      normalized.runcount = normalized.run_count;
    }

    return normalized;
  }

  /** Confidence from emitter override, else heuristic from semantic severity. */
  scoreConfidence(
    raw: RawUigEvent,
    type: CanonicalUigEventType,
    attributes: Record<string, unknown>,
  ): number {
    if (typeof raw.confidence === 'number') {
      return clampConfidence(raw.confidence);
    }

    switch (type) {
      case 'scene.missing_source':
      case 'graphics.error':
      case 'routing.destination_error':
      case 'output.frame_drop':
      case 'system.degraded':
        return 0.95;
      case 'audio.level': {
        const peak = asNumber(attributes.peak) ?? 0;
        if (peak > 0.95) return 0.92;
        if (peak > 0.8) return 0.8;
        return 1;
      }
      case 'ai.insight':
        return 0.75;
      case 'system.unknown':
        return 0.4;
      default:
        return 1;
    }
  }
}

/** Map a canonical event type onto a UIG node category. */
export function canonicalTypeToNodeType(
  type: CanonicalUigEventType,
):
  | 'SceneNode'
  | 'GraphicsNode'
  | 'AudioNode'
  | 'ReplayNode'
  | 'RoutingNode'
  | 'AutomationNode'
  | 'OutputNode'
  | 'HealthNode'
  | 'OperatorNode'
  | 'SystemNode'
  | 'PredictionNode' {
  if (type.startsWith('scene.')) return 'SceneNode';
  if (type.startsWith('graphics.')) return 'GraphicsNode';
  if (type.startsWith('audio.')) return 'AudioNode';
  if (type.startsWith('replay.')) return 'ReplayNode';
  if (type.startsWith('routing.')) return 'RoutingNode';
  if (type.startsWith('automation.')) return 'AutomationNode';
  if (type.startsWith('output.')) return 'OutputNode';
  if (type === 'system.degraded' || type === 'system.healthy') return 'HealthNode';
  if (type === 'ai.insight') return 'PredictionNode';
  if (type.startsWith('operator.')) return 'OperatorNode';
  return 'SystemNode';
}

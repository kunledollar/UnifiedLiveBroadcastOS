/**
 * UBOS Intelligence Graph (UIG) — Steps 81–82
 *
 * Live, in-memory, event-driven knowledge graph that connects every engine,
 * workspace, operator action, and system state into a single semantic model.
 *
 * Step 81: graph foundation (nodes, edges, ingest, inference stubs)
 * Step 82: UIG Event Normalization Layer (UENL) — all raw engine events are
 *          converted to CanonicalUigEvent before node/edge materialization.
 *
 * Later steps expand:
 *   - weighted edge derivation
 *   - inference rule engine
 *   - prediction engine
 *   - operator guidance
 *   - UI emphasis / workspace intelligence
 */

import {
  UIGEventNormalizer,
  canonicalTypeToNodeType,
  type CanonicalUigEvent,
  type RawUigEvent,
  type UigNormalizerContext,
} from './uigEventNormalizer.js';

export type UigNodeType =
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
  | 'PredictionNode';

export type UigEdgeType =
  | 'depends_on'
  | 'feeds_into'
  | 'affects'
  | 'predicts'
  | 'conflicts_with'
  | 'enhances'
  | 'requires'
  | 'is_active_in'
  | 'is_selected_by'
  | 'is_degraded_by';

export type UigNode = {
  id: string;
  type: UigNodeType;
  attributes: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  /** Canonical event type from UENL (Step 82). */
  eventType?: string;
  source?: string;
  workspace?: string | null;
  operator?: string | null;
  lineage?: string[];
};

export type UigEdge = {
  id: string;
  from: string;
  to: string;
  type: UigEdgeType;
  weight: number;
  timestamp: number;
};

/** Raw engine event accepted by ingest (normalized via UENL). */
export type UigEvent = RawUigEvent & {
  id?: string;
  type: UigNodeType | string;
  source: string;
  payload?: Record<string, unknown>;
};

export type UigInsightKind =
  | 'prediction'
  | 'warning'
  | 'recommendation'
  | 'guidance';

export type UigInsight = {
  id: string;
  kind: UigInsightKind;
  message: string;
  confidence: number;
  relatedNodeIds: string[];
  timestamp: number;
};

export type UigSnapshot = {
  nodeCount: number;
  edgeCount: number;
  insightCount: number;
  eventCount: number;
  nodesByType: Partial<Record<UigNodeType, number>>;
  latestInsights: readonly UigInsight[];
  latestEvents: readonly CanonicalUigEvent[];
};

export class UBOSIntelligenceGraph {
  readonly nodes = new Map<string, UigNode>();
  readonly edges = new Map<string, UigEdge>();
  readonly normalizer = new UIGEventNormalizer();

  private insights: UigInsight[] = [];
  private recentEvents: CanonicalUigEvent[] = [];
  private readonly MAX_NODES = 200;
  private readonly MAX_EDGES = 400;
  private readonly MAX_INSIGHTS = 40;
  private readonly MAX_EVENTS = 80;
  private inferenceGeneration = 0;

  /** Default workspace / operator / system context for UENL. */
  setContext(context: UigNormalizerContext): void {
    this.normalizer.setContext(context);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  addNode(node: UigNode): void {
    this.nodes.set(node.id, node);
    this.pruneNodes();
  }

  addEdge(edge: UigEdge): void {
    const key = edge.id || `${edge.from}->${edge.to}:${edge.type}`;
    this.edges.set(key, { ...edge, id: key });
    this.pruneEdges();
  }

  ingest(event: UigEvent): UigNode {
    const canonical = this.normalizer.normalize(event);
    this.rememberEvent(canonical);
    const node = this.nodeFromCanonical(canonical);
    this.addNode(node);

    const derivedEdges = this.deriveEdges(node);
    for (const edge of derivedEdges) {
      this.addEdge(edge);
    }

    this.runInference();
    return node;
  }

  /** Ingest many engine signals in one pass; inference runs once at the end. */
  ingestBatch(events: UigEvent[]): void {
    for (const event of events) {
      const canonical = this.normalizer.normalize(event);
      this.rememberEvent(canonical);
      const node = this.nodeFromCanonical(canonical);
      this.addNode(node);
      for (const edge of this.deriveEdges(node)) {
        this.addEdge(edge);
      }
    }
    this.runInference();
  }

  // ── Normalization (Step 82 — delegates to UENL) ───────────────────────────

  /** Normalize a raw engine event into the canonical UIG event format. */
  normalizeRawEvent(event: UigEvent | RawUigEvent): CanonicalUigEvent {
    return this.normalizer.normalize(event);
  }

  /**
   * Legacy helper: raw event → graph node (via UENL).
   * Prefer normalizeRawEvent + nodeFromCanonical for Step 82+ callers.
   */
  normalizeEvent(event: UigEvent): UigNode {
    return this.nodeFromCanonical(this.normalizer.normalize(event));
  }

  nodeFromCanonical(event: CanonicalUigEvent): UigNode {
    return {
      id: event.id,
      type: canonicalTypeToNodeType(event.type),
      eventType: event.type,
      source: event.source,
      workspace: event.workspace,
      operator: event.operator,
      lineage: event.lineage,
      attributes: {
        ...event.attributes,
        event_type: event.type,
        // Preserve payload `source` (e.g. route endpoint); engine name lives here
        engine_source: event.source,
        workspace: event.workspace,
        operator: event.operator,
        lineage: event.lineage,
      },
      timestamp: event.timestamp,
      confidence: event.confidence,
    };
  }

  // ── Edge derivation (foundation — Step 83+ expands) ───────────────────────

  deriveEdges(node: UigNode): UigEdge[] {
    const now = Date.now();
    const edges: UigEdge[] = [];
    const attr = node.attributes;

    const link = (
      to: string | undefined,
      type: UigEdgeType,
      weight = 1,
    ): void => {
      if (!to || to === node.id) return;
      edges.push({
        id: `${node.id}->${to}:${type}`,
        from: node.id,
        to,
        type,
        weight,
        timestamp: now,
      });
    };

    switch (node.type) {
      case 'SceneNode': {
        const layerIds = Array.isArray(attr.layerids)
          ? (attr.layerids as string[])
          : Array.isArray(attr.layerIds)
            ? (attr.layerIds as string[])
            : [];
        for (const layerId of layerIds) {
          link(`graphics:${layerId}`, 'is_active_in', 0.9);
        }
        if (attr.program === true) {
          link('output:program', 'feeds_into', 1.0);
        }
        break;
      }
      case 'GraphicsNode': {
        const sceneId =
          typeof attr.sceneid === 'string'
            ? attr.sceneid
            : typeof attr.sceneId === 'string'
              ? attr.sceneId
              : null;
        link(sceneId ? `scene:${sceneId}` : 'scene:current', 'is_active_in', 0.8);
        link('output:program', 'feeds_into', 0.7);
        break;
      }
      case 'AudioNode':
        link('output:program', 'feeds_into', 0.9);
        if ((attr.peak as number | undefined) !== undefined && (attr.peak as number) > 0.9) {
          link('health:audio', 'is_degraded_by', 0.95);
        }
        break;
      case 'ReplayNode': {
        const cameraId =
          typeof attr.cameraid === 'string'
            ? attr.cameraid
            : typeof attr.cameraId === 'string'
              ? attr.cameraId
              : undefined;
        link(cameraId ? `system:camera:${cameraId}` : undefined, 'depends_on', 0.8);
        break;
      }
      case 'RoutingNode':
        if (typeof attr.source === 'string') {
          link(`system:source:${attr.source}`, 'depends_on', 1.0);
        }
        if (typeof attr.destination === 'string') {
          link(`system:dest:${attr.destination}`, 'feeds_into', 1.0);
        }
        if (attr.broken === true) link('health:routing', 'is_degraded_by', 1.0);
        break;
      case 'AutomationNode':
        if (typeof attr.target === 'string') link(attr.target as string, 'affects', 0.85);
        break;
      case 'OutputNode': {
        link('scene:current', 'depends_on', 0.9);
        const dropped =
          typeof attr.droppedframes === 'number'
            ? attr.droppedframes
            : typeof attr.droppedFrames === 'number'
              ? attr.droppedFrames
              : 0;
        if (dropped > 0) {
          link('health:output', 'is_degraded_by', 0.9);
        }
        break;
      }
      case 'HealthNode':
        if (attr.status === 'error' || attr.status === 'warning') {
          const subsystem = typeof attr.subsystem === 'string' ? attr.subsystem : 'system';
          link(`system:${subsystem}`, 'is_degraded_by', attr.status === 'error' ? 1.0 : 0.6);
        }
        break;
      case 'OperatorNode': {
        const workspaceId =
          typeof attr.workspaceid === 'string'
            ? attr.workspaceid
            : typeof attr.workspaceId === 'string'
              ? attr.workspaceId
              : typeof node.workspace === 'string'
                ? node.workspace
                : undefined;
        if (workspaceId) {
          link(`system:workspace:${workspaceId}`, 'is_selected_by', 1.0);
        }
        break;
      }
      case 'PredictionNode': {
        const targetId =
          typeof attr.targetid === 'string'
            ? attr.targetid
            : typeof attr.targetId === 'string'
              ? attr.targetId
              : undefined;
        if (targetId) link(targetId, 'predicts', node.confidence);
        break;
      }
      default:
        break;
    }

    return edges;
  }

  // ── Inference (foundation — Steps 83–90 expand) ───────────────────────────

  runInference(): void {
    this.inferenceGeneration += 1;
    const now = Date.now();
    const produced: UigInsight[] = [];

    const healthNodes = [...this.nodes.values()].filter((n) => n.type === 'HealthNode');
    for (const node of healthNodes) {
      const status = node.attributes.status;
      const subsystem = String(node.attributes.subsystem ?? 'system');
      if (status === 'error') {
        produced.push({
          id: `insight-health-error-${subsystem}-${this.inferenceGeneration}`,
          kind: 'warning',
          message: `${subsystem} reports error — investigate degradation path`,
          confidence: node.confidence,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      } else if (status === 'warning') {
        produced.push({
          id: `insight-health-warn-${subsystem}-${this.inferenceGeneration}`,
          kind: 'recommendation',
          message: `${subsystem} elevated — monitor before it becomes critical`,
          confidence: Math.min(node.confidence, 0.85),
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    const audioNodes = [...this.nodes.values()].filter((n) => n.type === 'AudioNode');
    for (const node of audioNodes) {
      const peak = Number(node.attributes.peak ?? 0);
      if (peak > 0.95) {
        produced.push({
          id: `insight-audio-clip-${node.id}-${this.inferenceGeneration}`,
          kind: 'warning',
          message: 'Audio clipping risk — reduce gain on hot channel',
          confidence: 0.92,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      } else if (peak > 0.8) {
        produced.push({
          id: `insight-audio-hot-${node.id}-${this.inferenceGeneration}`,
          kind: 'prediction',
          message: 'Audio approaching clip threshold',
          confidence: 0.75,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    const sceneNode = this.nodes.get('scene:current') ?? [...this.nodes.values()].find((n) => n.type === 'SceneNode');
    if (!sceneNode || sceneNode.attributes.missing === true) {
      produced.push({
        id: `insight-scene-missing-${this.inferenceGeneration}`,
        kind: 'guidance',
        message: 'No active scene — load or select a program scene',
        confidence: 0.9,
        relatedNodeIds: sceneNode ? [sceneNode.id] : [],
        timestamp: now,
      });
    }

    const routeNodes = [...this.nodes.values()].filter((n) => n.type === 'RoutingNode');
    if (routeNodes.length === 0) {
      produced.push({
        id: `insight-routing-empty-${this.inferenceGeneration}`,
        kind: 'recommendation',
        message: 'No active routes — signal path may be incomplete',
        confidence: 0.7,
        relatedNodeIds: [],
        timestamp: now,
      });
    } else if (routeNodes.some((n) => n.attributes.broken === true)) {
      produced.push({
        id: `insight-routing-broken-${this.inferenceGeneration}`,
        kind: 'warning',
        message: 'Broken route detected — destination or source unavailable',
        confidence: 0.88,
        relatedNodeIds: routeNodes.filter((n) => n.attributes.broken === true).map((n) => n.id),
        timestamp: now,
      });
    }

    // Merge newest insights, keep cap
    const byId = new Map<string, UigInsight>();
    for (const insight of [...this.insights, ...produced]) {
      byId.set(insight.id, insight);
    }
    this.insights = [...byId.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, this.MAX_INSIGHTS);
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getNode(id: string): UigNode | undefined {
    return this.nodes.get(id);
  }

  getNodes(): readonly UigNode[] {
    return [...this.nodes.values()];
  }

  getNodesByType(type: UigNodeType): readonly UigNode[] {
    return [...this.nodes.values()].filter((n) => n.type === type);
  }

  getEdges(): readonly UigEdge[] {
    return [...this.edges.values()];
  }

  getEdgesFor(nodeId: string): readonly UigEdge[] {
    return [...this.edges.values()].filter((e) => e.from === nodeId || e.to === nodeId);
  }

  getInsights(): readonly UigInsight[] {
    return this.insights;
  }

  getRecentEvents(): readonly CanonicalUigEvent[] {
    return this.recentEvents;
  }

  getSnapshot(): UigSnapshot {
    const nodesByType: Partial<Record<UigNodeType, number>> = {};
    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;
    }
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      insightCount: this.insights.length,
      eventCount: this.recentEvents.length,
      nodesByType,
      latestInsights: this.insights.slice(0, 8),
      latestEvents: this.recentEvents.slice(0, 10),
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.insights = [];
    this.recentEvents = [];
    this.inferenceGeneration = 0;
  }

  // ── Pruning ───────────────────────────────────────────────────────────────

  private rememberEvent(event: CanonicalUigEvent): void {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents = this.recentEvents.slice(0, this.MAX_EVENTS);
    }
  }

  private pruneNodes(): void {
    if (this.nodes.size <= this.MAX_NODES) return;
    const sorted = [...this.nodes.values()].sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = this.nodes.size - this.MAX_NODES;
    for (let i = 0; i < removeCount; i++) {
      const node = sorted[i];
      if (!node) continue;
      this.nodes.delete(node.id);
      for (const [key, edge] of this.edges) {
        if (edge.from === node.id || edge.to === node.id) this.edges.delete(key);
      }
    }
  }

  private pruneEdges(): void {
    if (this.edges.size <= this.MAX_EDGES) return;
    const sorted = [...this.edges.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const removeCount = this.edges.size - this.MAX_EDGES;
    for (let i = 0; i < removeCount; i++) {
      const entry = sorted[i];
      if (entry) this.edges.delete(entry[0]);
    }
  }
}

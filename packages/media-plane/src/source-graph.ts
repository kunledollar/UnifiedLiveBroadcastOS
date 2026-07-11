/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type RuntimeCommand,
  type TypedRuntimeCommandHandler,
} from './execution-engine.js';
import type { DevicePlatformSnapshot } from './device-discovery.js';
import type {
  SourceAcquisitionSnapshot,
  SourceDescriptor,
  SourceMediaFormat,
  SourceMediaKind,
} from './source-acquisition.js';

export type SourceGraphNodeKind =
  | 'DEVICE'
  | 'SOURCE_DESCRIPTOR'
  | 'SOURCE_INSTANCE'
  | 'STREAM'
  | 'ACQUISITION_PROCESSOR'
  | 'SOURCE_GROUP'
  | 'ROUTING_ENDPOINT'
  | 'FUTURE_CONSUMER'
  | 'EXTERNAL_REFERENCE'
  | 'VIDEO_PROCESSOR'
  | 'AUDIO_PROCESSOR'
  | 'SCENE'
  | 'GRAPHICS'
  | 'RECORDING'
  | 'STREAMING'
  | 'REPLAY';
export type SourceGraphEdgeKind =
  | 'DEVICE_EXPOSES_SOURCE'
  | 'SOURCE_INSTANCE_OF_DESCRIPTOR'
  | 'SOURCE_PRODUCES_STREAM'
  | 'STREAM_ACQUIRED_BY_PROCESSOR'
  | 'STREAM_MEMBER_OF_GROUP'
  | 'STREAM_ROUTABLE_TO_ENDPOINT'
  | 'DEPENDS_ON'
  | 'HEALTH_PROPAGATES_TO'
  | 'AVAILABILITY_PROPAGATES_TO'
  | 'ALIAS_OF'
  | 'EXTERNAL_MAPPING';
export type SourceGraphLifecycleState =
  'CREATED' | 'INITIALIZING' | 'READY' | 'ACTIVE' | 'DEGRADED' | 'STOPPING' | 'STOPPED' | 'FAILED';
export type SourceGraphAvailabilityState =
  'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN' | 'DISABLED' | 'REMOVED';
export type SourceGraphHealthState = 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'FAILED';
export type SourceGraphMediaKind = 'VIDEO' | 'AUDIO' | 'DATA' | 'METADATA';
export type SourceGraphMutationType =
  | 'ADD_NODE'
  | 'UPDATE_NODE'
  | 'REMOVE_NODE'
  | 'ADD_EDGE'
  | 'REMOVE_EDGE'
  | 'REPLACE_NODE'
  | 'SET_NODE_AVAILABILITY'
  | 'SET_NODE_HEALTH'
  | 'SET_NODE_ACTIVE'
  | 'SET_STREAM_FORMAT'
  | 'ADD_GROUP_MEMBERSHIP'
  | 'REMOVE_GROUP_MEMBERSHIP'
  | 'REBUILD_DEVICE_SOURCE_SUBGRAPH'
  | 'REBUILD_SOURCE_STREAM_SUBGRAPH';
export const SOURCE_GRAPH_COMMAND_TYPES = Object.freeze([
  'SOURCE_GRAPH_ADD_NODE',
  'SOURCE_GRAPH_UPDATE_NODE',
  'SOURCE_GRAPH_REMOVE_NODE',
  'SOURCE_GRAPH_ADD_EDGE',
  'SOURCE_GRAPH_REMOVE_EDGE',
  'SOURCE_GRAPH_APPLY_TRANSACTION',
  'SOURCE_GRAPH_SYNC_DEVICES',
  'SOURCE_GRAPH_SYNC_SOURCES',
  'SOURCE_GRAPH_VALIDATE',
  'SOURCE_GRAPH_SET_HEALTH',
  'SOURCE_GRAPH_SET_AVAILABILITY',
] as const);
export const SOURCE_GRAPH_WATCHDOG_INCIDENTS = Object.freeze([
  'SOURCE_GRAPH_STALE',
  'SOURCE_GRAPH_OUT_OF_SYNC',
  'SOURCE_GRAPH_INVALID',
  'SOURCE_GRAPH_ORPHAN_NODE',
  'SOURCE_GRAPH_DANGLING_EDGE',
  'SOURCE_GRAPH_CYCLE',
  'SOURCE_GRAPH_VERSION_REGRESSION',
  'SOURCE_GRAPH_SYNC_FAILED',
  'SOURCE_GRAPH_ROUTING_INCONSISTENT',
  'SOURCE_GRAPH_INVARIANT_FAILURE',
] as const);
const now = () => BigInt(Date.now()) * 1_000_000n;
const clone = <T>(v: T): T => structuredClone(v) as T;
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) freeze(x);
  }
  return v as Readonly<T>;
};
const safe = (v: unknown, depth = 0): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || depth > 2) return {};
  const o: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 32)) {
    if (/secret|token|serial|path|url|credential|password|key|handle/i.test(k)) {
      o[k] = '<redacted>';
      continue;
    }
    o[k] = val && typeof val === 'object' ? '[redacted-object]' : val;
  }
  return o;
};
const idpart = (s: string) => s.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 128);
export const sourceGraphIds = Object.freeze({
  device: (id: string) => `device:${idpart(id)}`,
  descriptor: (id: string) => `source-descriptor:${idpart(id)}`,
  instance: (id: string) => `source-instance:${idpart(id)}`,
  stream: (sid: string, k: SourceGraphMediaKind, o = 0) =>
    `stream:${idpart(sid)}:${k.toLowerCase()}:${o}`,
  processor: (id: string) => `processor:${idpart(id)}`,
  group: (id: string) => `group:${idpart(id)}`,
  endpoint: (id: string) => `endpoint:${idpart(id)}`,
  external: (ns: string, id: string) => `external:${idpart(ns)}:${idpart(id)}`,
  edge: (kind: SourceGraphEdgeKind, from: string, to: string) =>
    `${kind.toLowerCase()}:${from}->${to}`,
});
export interface SourceGraphNode {
  readonly id: string;
  readonly kind: SourceGraphNodeKind;
  readonly displayName: string;
  readonly sourceId?: string | undefined;
  readonly deviceId?: string | undefined;
  readonly providerId?: string | undefined;
  readonly streamId?: string | undefined;
  readonly mediaKind?: SourceGraphMediaKind | undefined;
  readonly lifecycleState?: string | undefined;
  readonly localHealth?: SourceGraphHealthState | undefined;
  readonly effectiveHealth?: SourceGraphHealthState | undefined;
  readonly availabilityState?: SourceGraphAvailabilityState | undefined;
  readonly enabled?: boolean | undefined;
  readonly active?: boolean | undefined;
  readonly connected?: boolean | undefined;
  readonly selectedFormat?: SourceMediaFormat | undefined;
  readonly supportedFormatsSummary?: readonly string[] | undefined;
  readonly clockDomain?: string | undefined;
  readonly criticality?: 'OPTIONAL' | 'IMPORTANT' | 'CRITICAL' | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined | undefined;
  readonly routingEligibility?: SourceGraphRoutingEligibility | undefined;
  readonly createdAtNs?: string | undefined;
  readonly updatedAtNs?: string | undefined;
  readonly version?: number | undefined;
  readonly generation?: number | undefined;
}
export type SourceGraphNodePatch = Partial<Omit<SourceGraphNode, 'id' | 'createdAtNs'>>;
export interface SourceGraphEdge {
  readonly id: string;
  readonly kind: SourceGraphEdgeKind;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly required?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly createdAtNs?: string;
  readonly updatedAtNs?: string;
  readonly version?: number;
}
export type SourceGraphNodeSnapshot = SourceGraphNode;
export type SourceGraphEdgeSnapshot = SourceGraphEdge;
export interface SourceGraphMutation {
  readonly mutationId: string;
  readonly mutationType: SourceGraphMutationType;
  readonly expectedGraphVersion?: string | undefined;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly requestedAtNs?: string | undefined;
  readonly correlationId?: string | undefined;
  readonly source?: string | undefined;
  readonly reason?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export interface SourceGraphTransaction {
  readonly transactionId: string;
  readonly mutations: readonly SourceGraphMutation[];
  readonly expectedGraphVersion?: string | undefined;
  readonly source?: string | undefined;
  readonly reason?: string | undefined;
  readonly requestedAtNs?: string | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export interface SourceGraphMutationResult {
  readonly ok: boolean;
  readonly mutationId: string;
  readonly graphVersion: string;
  readonly error?: string | undefined;
  readonly diff?: SourceGraphDiff | undefined;
}
export interface SourceGraphTransactionResult {
  readonly ok: boolean;
  readonly transactionId: string;
  readonly graphVersion: string;
  readonly appliedMutationIds: readonly string[];
  readonly error?: string | undefined;
  readonly diff?: SourceGraphDiff | undefined;
}
export interface SourceGraphDiff {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly addedNodeIds: readonly string[];
  readonly updatedNodeIds: readonly string[];
  readonly removedNodeIds: readonly string[];
  readonly addedEdgeIds: readonly string[];
  readonly removedEdgeIds: readonly string[];
  readonly healthChangedNodeIds: readonly string[];
  readonly availabilityChangedNodeIds: readonly string[];
}
export interface SourceGraphRoutingEligibility {
  readonly routable: boolean;
  readonly reasons: readonly string[];
  readonly compatibleEndpointIds: readonly string[];
}
export interface SourceGraphValidationIssue {
  readonly code: string;
  readonly severity: 'ERROR' | 'WARNING';
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeId?: string;
}
export interface SourceGraphValidationReport {
  readonly valid: boolean;
  readonly graphVersion: string;
  readonly generatedAtNs: string;
  readonly issueCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly issues: readonly SourceGraphValidationIssue[];
}
export interface SourceGraphTelemetrySnapshot {
  readonly graphVersion: string;
  readonly topologyVersion: string;
  readonly healthVersion: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly deviceNodeCount: number;
  readonly sourceDescriptorNodeCount: number;
  readonly sourceInstanceNodeCount: number;
  readonly streamNodeCount: number;
  readonly groupNodeCount: number;
  readonly endpointNodeCount: number;
  readonly availableNodeCount: number;
  readonly activeNodeCount: number;
  readonly degradedNodeCount: number;
  readonly failedNodeCount: number;
  readonly routableStreamCount: number;
  readonly unroutableStreamCount: number;
  readonly graphMutationCount: number;
  readonly graphTransactionCount: number;
  readonly graphTransactionRollbackCount: number;
  readonly graphValidationCount: number;
  readonly graphValidationFailureCount: number;
  readonly availabilityPropagationCount: number;
  readonly healthPropagationCount: number;
  readonly recentDiffCount: number;
  readonly lastMutation?: string | undefined;
  readonly lastValidation?: SourceGraphValidationReport | undefined;
  readonly graphHealthSummary: Readonly<Record<string, number>>;
}
export interface SourceGraphSnapshot {
  readonly lifecycleState: SourceGraphLifecycleState;
  readonly graphVersion: string;
  readonly topologyVersion: string;
  readonly healthVersion: string;
  readonly lastMutationId?: string | undefined;
  readonly lastTransactionId?: string | undefined;
  readonly generatedAtNs: string;
  readonly nodes: readonly SourceGraphNodeSnapshot[];
  readonly edges: readonly SourceGraphEdgeSnapshot[];
  readonly recentDiffs: readonly SourceGraphDiff[];
  readonly telemetry: SourceGraphTelemetrySnapshot;
}
export class SourceGraphError extends RuntimeEngineError {}
export class DuplicateSourceGraphNode extends SourceGraphError {
  constructor(id: string) {
    super('DuplicateSourceGraphNode', `Duplicate source graph node ${id}`, { id });
  }
}
export class SourceGraphNodeNotFound extends SourceGraphError {
  constructor(id: string) {
    super('SourceGraphNodeNotFound', `Source graph node not found ${id}`, { id });
  }
}
export class DuplicateSourceGraphEdge extends SourceGraphError {
  constructor(id: string) {
    super('DuplicateSourceGraphEdge', `Duplicate source graph edge ${id}`, { id });
  }
}
export class SourceGraphEdgeNotFound extends SourceGraphError {
  constructor(id: string) {
    super('SourceGraphEdgeNotFound', `Source graph edge not found ${id}`, { id });
  }
}
export class InvalidSourceGraphEdgeEndpoints extends SourceGraphError {
  constructor(msg: string) {
    super('InvalidSourceGraphEdgeEndpoints', msg);
  }
}
export class SourceGraphCycleDetected extends SourceGraphError {
  constructor(kind: string) {
    super('SourceGraphCycleDetected', `Source graph cycle detected for ${kind}`);
  }
}
export class SourceGraphVersionConflict extends SourceGraphError {
  constructor() {
    super('SourceGraphVersionConflict', 'Source graph optimistic version conflict');
  }
}
export class SourceGraphInvariantViolation extends SourceGraphError {
  constructor(msg: string) {
    super('SourceGraphInvariantViolation', msg);
  }
}
const allowed: Record<SourceGraphEdgeKind, readonly [SourceGraphNodeKind, SourceGraphNodeKind][]> =
  {
    DEVICE_EXPOSES_SOURCE: [['DEVICE', 'SOURCE_DESCRIPTOR']],
    SOURCE_INSTANCE_OF_DESCRIPTOR: [['SOURCE_INSTANCE', 'SOURCE_DESCRIPTOR']],
    SOURCE_PRODUCES_STREAM: [['SOURCE_INSTANCE', 'STREAM']],
    STREAM_ACQUIRED_BY_PROCESSOR: [['STREAM', 'ACQUISITION_PROCESSOR']],
    STREAM_MEMBER_OF_GROUP: [
      ['STREAM', 'SOURCE_GROUP'],
      ['SOURCE_INSTANCE', 'SOURCE_GROUP'],
      ['SOURCE_GROUP', 'SOURCE_GROUP'],
    ],
    STREAM_ROUTABLE_TO_ENDPOINT: [['STREAM', 'ROUTING_ENDPOINT']],
    DEPENDS_ON: [
      ['STREAM', 'SOURCE_INSTANCE'],
      ['SOURCE_INSTANCE', 'SOURCE_DESCRIPTOR'],
      ['SOURCE_DESCRIPTOR', 'DEVICE'],
      ['ROUTING_ENDPOINT', 'STREAM'],
      ['FUTURE_CONSUMER', 'STREAM'],
    ],
    HEALTH_PROPAGATES_TO: [
      ['DEVICE', 'SOURCE_DESCRIPTOR'],
      ['SOURCE_DESCRIPTOR', 'SOURCE_INSTANCE'],
      ['SOURCE_INSTANCE', 'STREAM'],
      ['STREAM', 'ROUTING_ENDPOINT'],
    ],
    AVAILABILITY_PROPAGATES_TO: [
      ['DEVICE', 'SOURCE_DESCRIPTOR'],
      ['SOURCE_DESCRIPTOR', 'SOURCE_INSTANCE'],
      ['SOURCE_INSTANCE', 'STREAM'],
      ['STREAM', 'ROUTING_ENDPOINT'],
    ],
    ALIAS_OF: [
      ['EXTERNAL_REFERENCE', 'DEVICE'],
      ['SOURCE_DESCRIPTOR', 'SOURCE_DESCRIPTOR'],
      ['STREAM', 'STREAM'],
    ],
    EXTERNAL_MAPPING: [
      ['EXTERNAL_REFERENCE', 'DEVICE'],
      ['EXTERNAL_REFERENCE', 'SOURCE_DESCRIPTOR'],
      ['EXTERNAL_REFERENCE', 'STREAM'],
    ],
  };
const topo = new Set<SourceGraphMutationType>([
  'ADD_NODE',
  'REMOVE_NODE',
  'ADD_EDGE',
  'REMOVE_EDGE',
  'REPLACE_NODE',
  'ADD_GROUP_MEMBERSHIP',
  'REMOVE_GROUP_MEMBERSHIP',
  'REBUILD_DEVICE_SOURCE_SUBGRAPH',
  'REBUILD_SOURCE_STREAM_SUBGRAPH',
]);
const health = new Set<SourceGraphMutationType>([
  'SET_NODE_AVAILABILITY',
  'SET_NODE_HEALTH',
  'SET_NODE_ACTIVE',
]);
export class DefaultSourceGraphManager {
  private nodes = new Map<string, SourceGraphNode>();
  private edges = new Map<string, SourceGraphEdge>();
  private graphVersion = 0n;
  private topologyVersion = 0n;
  private healthVersion = 0n;
  private lifecycleState: SourceGraphLifecycleState = 'CREATED';
  private diffs: SourceGraphDiff[] = [];
  private mutationCount = 0;
  private txCount = 0;
  private rollbackCount = 0;
  private validationCount = 0;
  private validationFailureCount = 0;
  private availabilityPropagationCount = 0;
  private healthPropagationCount = 0;
  private lastValidation?: SourceGraphValidationReport;
  private lastMutationId?: string;
  private lastTransactionId?: string;
  private syncedDeviceGeneration = 0;
  private syncedSourceGeneration = '0';
  constructor(
    private nowNs: () => bigint = now,
    private diffLimit = 64,
  ) {
    this.lifecycleState = 'READY';
  }
  addNode(node: SourceGraphNode) {
    return this.applyMutation({
      mutationId: `add-node:${node.id}:${this.graphVersion + 1n}`,
      mutationType: 'ADD_NODE',
      payload: { node },
    });
  }
  updateNode(nodeId: string, patch: SourceGraphNodePatch) {
    return this.applyMutation({
      mutationId: `update-node:${nodeId}:${this.graphVersion + 1n}`,
      mutationType: 'UPDATE_NODE',
      payload: { nodeId, patch },
    });
  }
  removeNode(nodeId: string) {
    return this.applyMutation({
      mutationId: `remove-node:${nodeId}:${this.graphVersion + 1n}`,
      mutationType: 'REMOVE_NODE',
      payload: { nodeId },
    });
  }
  addEdge(edge: SourceGraphEdge) {
    return this.applyMutation({
      mutationId: `add-edge:${edge.id}:${this.graphVersion + 1n}`,
      mutationType: 'ADD_EDGE',
      payload: { edge },
    });
  }
  removeEdge(edgeId: string) {
    return this.applyMutation({
      mutationId: `remove-edge:${edgeId}:${this.graphVersion + 1n}`,
      mutationType: 'REMOVE_EDGE',
      payload: { edgeId },
    });
  }
  applyMutation(m: SourceGraphMutation): SourceGraphMutationResult {
    const tx: SourceGraphTransaction = {
      transactionId: `tx:${m.mutationId}`,
      mutations: [m],
      ...(m.expectedGraphVersion !== undefined
        ? { expectedGraphVersion: m.expectedGraphVersion }
        : {}),
      ...(m.source !== undefined ? { source: m.source } : {}),
      ...(m.reason !== undefined ? { reason: m.reason } : {}),
    };
    const r = this.applyTransaction(tx);
    return freeze({
      ok: r.ok,
      mutationId: m.mutationId,
      graphVersion: r.graphVersion,
      ...(r.error ? { error: r.error } : {}),
      ...(r.diff ? { diff: r.diff } : {}),
    }) as SourceGraphMutationResult;
  }
  applyTransaction(tx: SourceGraphTransaction): SourceGraphTransactionResult {
    if (this.lifecycleState === 'STOPPED')
      return {
        ok: false,
        transactionId: tx.transactionId,
        graphVersion: String(this.graphVersion),
        appliedMutationIds: [],
        error: 'Source graph is stopped',
      };
    if (
      tx.expectedGraphVersion !== undefined &&
      tx.expectedGraphVersion !== String(this.graphVersion)
    )
      return {
        ok: false,
        transactionId: tx.transactionId,
        graphVersion: String(this.graphVersion),
        appliedMutationIds: [],
        error: 'SourceGraphVersionConflict',
      };
    const before = this.snapshotIds();
    const n = new Map(this.nodes),
      e = new Map(this.edges);
    try {
      for (const m of tx.mutations) this.applyTo(n, e, m);
      const vr = this.validateMaps(n, e);
      if (!vr.valid) throw new Error(vr.issues.map((i) => i.code).join(','));
      this.nodes = n;
      this.edges = e;
      this.graphVersion++;
      if (tx.mutations.some((m) => topo.has(m.mutationType))) this.topologyVersion++;
      if (tx.mutations.some((m) => health.has(m.mutationType))) this.healthVersion++;
      this.propagate();
      const diff = this.makeDiff(before, this.snapshotIds());
      this.pushDiff(diff);
      this.lastTransactionId = tx.transactionId;
      const lm = tx.mutations.at(-1)?.mutationId;
      if (lm) this.lastMutationId = lm;
      this.txCount++;
      this.mutationCount += tx.mutations.length;
      return freeze({
        ok: true,
        transactionId: tx.transactionId,
        graphVersion: String(this.graphVersion),
        appliedMutationIds: tx.mutations.map((m) => m.mutationId),
        diff,
      });
    } catch (err) {
      this.rollbackCount++;
      return freeze({
        ok: false,
        transactionId: tx.transactionId,
        graphVersion: String(this.graphVersion),
        appliedMutationIds: [],
        error: String((err as Error).message),
      });
    }
  }
  private normNode(node: SourceGraphNode): SourceGraphNode {
    const t = String(this.nowNs());
    return freeze({
      ...node,
      localHealth: node.localHealth ?? 'UNKNOWN',
      effectiveHealth: node.effectiveHealth ?? node.localHealth ?? 'UNKNOWN',
      availabilityState: node.availabilityState ?? 'UNKNOWN',
      enabled: node.enabled ?? true,
      active: node.active ?? false,
      connected: node.connected ?? false,
      tags: Object.freeze([...(node.tags ?? [])].sort()),
      metadata: freeze(safe(node.metadata)),
      createdAtNs: node.createdAtNs ?? t,
      updatedAtNs: t,
      version: node.version ?? 1,
      generation: node.generation ?? 0,
    }) as SourceGraphNode;
  }
  private normEdge(edge: SourceGraphEdge): SourceGraphEdge {
    const t = String(this.nowNs());
    return freeze({
      ...edge,
      metadata: freeze(safe(edge.metadata)),
      createdAtNs: edge.createdAtNs ?? t,
      updatedAtNs: t,
      version: edge.version ?? 1,
    }) as SourceGraphEdge;
  }
  private applyTo(
    nodes: Map<string, SourceGraphNode>,
    edges: Map<string, SourceGraphEdge>,
    m: SourceGraphMutation,
  ) {
    const p = m.payload as any;
    if (m.mutationType === 'ADD_NODE') {
      if (nodes.has(p.node.id)) throw new DuplicateSourceGraphNode(p.node.id);
      nodes.set(p.node.id, this.normNode(p.node));
      return;
    }
    if (
      m.mutationType === 'UPDATE_NODE' ||
      m.mutationType === 'SET_NODE_HEALTH' ||
      m.mutationType === 'SET_NODE_AVAILABILITY' ||
      m.mutationType === 'SET_NODE_ACTIVE' ||
      m.mutationType === 'SET_STREAM_FORMAT'
    ) {
      const id = p.nodeId;
      const cur = nodes.get(id);
      if (!cur) throw new SourceGraphNodeNotFound(id);
      nodes.set(
        id,
        this.normNode({
          ...cur,
          ...p.patch,
          localHealth: p.health ?? p.patch?.localHealth ?? cur.localHealth,
          effectiveHealth: p.health ?? p.patch?.effectiveHealth ?? cur.effectiveHealth,
          availabilityState: p.availability ?? p.patch?.availabilityState ?? cur.availabilityState,
          active: p.active ?? p.patch?.active ?? cur.active,
          selectedFormat: p.selectedFormat ?? p.patch?.selectedFormat ?? cur.selectedFormat,
          version: (cur.version ?? 1) + 1,
        }),
      );
      return;
    }
    if (m.mutationType === 'REMOVE_NODE') {
      if (!nodes.delete(p.nodeId)) throw new SourceGraphNodeNotFound(p.nodeId);
      for (const [id, ed] of [...edges])
        if (ed.fromNodeId === p.nodeId || ed.toNodeId === p.nodeId) edges.delete(id);
      return;
    }
    if (m.mutationType === 'REPLACE_NODE') {
      nodes.set(p.node.id, this.normNode(p.node));
      return;
    }
    if (m.mutationType === 'ADD_EDGE' || m.mutationType === 'ADD_GROUP_MEMBERSHIP') {
      const edge = p.edge ?? {
        kind: 'STREAM_MEMBER_OF_GROUP',
        fromNodeId: p.memberNodeId,
        toNodeId: p.groupNodeId,
        id: sourceGraphIds.edge('STREAM_MEMBER_OF_GROUP', p.memberNodeId, p.groupNodeId),
      };
      if (edges.has(edge.id)) throw new DuplicateSourceGraphEdge(edge.id);
      this.checkEdge(nodes, edge);
      edges.set(edge.id, this.normEdge(edge));
      return;
    }
    if (m.mutationType === 'REMOVE_EDGE' || m.mutationType === 'REMOVE_GROUP_MEMBERSHIP') {
      const id =
        p.edgeId ?? sourceGraphIds.edge('STREAM_MEMBER_OF_GROUP', p.memberNodeId, p.groupNodeId);
      if (!edges.delete(id)) throw new SourceGraphEdgeNotFound(id);
      return;
    }
  }
  private checkEdge(nodes: Map<string, SourceGraphNode>, edge: SourceGraphEdge) {
    const a = nodes.get(edge.fromNodeId),
      b = nodes.get(edge.toNodeId);
    if (!a || !b) throw new InvalidSourceGraphEdgeEndpoints('edge endpoints must exist');
    if (!allowed[edge.kind].some(([x, y]) => x === a.kind && y === b.kind))
      throw new InvalidSourceGraphEdgeEndpoints(`invalid ${edge.kind} ${a.kind}->${b.kind}`);
  }
  getNode(id: string) {
    return this.nodes.get(id);
  }
  getEdge(id: string) {
    return this.edges.get(id);
  }
  listNodes(f: Partial<SourceGraphNode> = {}) {
    return freeze(
      [...this.nodes.values()]
        .filter((n) => Object.entries(f).every(([k, v]) => (n as any)[k] === v))
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
  }
  listEdges(f: Partial<SourceGraphEdge> = {}) {
    return freeze(
      [...this.edges.values()]
        .filter((n) => Object.entries(f).every(([k, v]) => (n as any)[k] === v))
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
  }
  getUpstream(id: string) {
    return this.listEdges({ toNodeId: id })
      .map((e) => this.nodes.get(e.fromNodeId)!)
      .filter(Boolean);
  }
  getDownstream(id: string) {
    return this.listEdges({ fromNodeId: id })
      .map((e) => this.nodes.get(e.toNodeId)!)
      .filter(Boolean);
  }
  getPath(from: string, to: string) {
    const q: [[string, string[]]] = [[from, [from]]];
    const seen = new Set([from]);
    while (q.length) {
      const [id, path] = q.shift()!;
      if (id === to) return path;
      for (const e of this.listEdges({ fromNodeId: id })) {
        if (!seen.has(e.toNodeId)) {
          seen.add(e.toNodeId);
          q.push([e.toNodeId, [...path, e.toNodeId]]);
        }
      }
    }
    return undefined;
  }
  validate() {
    const r = this.validateMaps(this.nodes, this.edges);
    this.validationCount++;
    this.lastValidation = r;
    if (!r.valid) this.validationFailureCount++;
    return r;
  }
  private validateMaps(
    nodes: Map<string, SourceGraphNode>,
    edges: Map<string, SourceGraphEdge>,
  ): SourceGraphValidationReport {
    const issues: SourceGraphValidationIssue[] = [];
    for (const e of [...edges.values()].sort((a, b) => a.id.localeCompare(b.id))) {
      try {
        this.checkEdge(nodes, e);
      } catch {
        issues.push({
          code: 'INVALID_EDGE_ENDPOINTS',
          severity: 'ERROR',
          message: 'Invalid edge endpoints or kinds',
          edgeId: e.id,
        });
      }
    }
    for (const k of [
      'DEPENDS_ON',
      'HEALTH_PROPAGATES_TO',
      'AVAILABILITY_PROPAGATES_TO',
    ] as SourceGraphEdgeKind[])
      if (this.hasCycle(edges, k))
        issues.push({ code: 'SOURCE_GRAPH_CYCLE', severity: 'ERROR', message: `Cycle for ${k}` });
    const streams = new Set<string>();
    for (const n of nodes.values())
      if (n.kind === 'STREAM') {
        const key = `${n.sourceId}:${n.mediaKind}:${n.streamId}`;
        if (streams.has(key))
          issues.push({
            code: 'DUPLICATE_LOGICAL_STREAM',
            severity: 'ERROR',
            message: 'Duplicate logical stream',
            nodeId: n.id,
          });
        streams.add(key);
        if (!this.getUpstreamIn(nodes, edges, n.id).some((u) => u.kind === 'SOURCE_INSTANCE'))
          issues.push({
            code: 'ORPHAN_STREAM',
            severity: 'WARNING',
            message: 'Stream has no source instance',
            nodeId: n.id,
          });
      }
    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    return freeze({
      valid: errorCount === 0,
      graphVersion: String(this.graphVersion),
      generatedAtNs: String(this.nowNs()),
      issueCount: issues.length,
      errorCount,
      warningCount: issues.length - errorCount,
      issues,
    }) as SourceGraphValidationReport;
  }
  private getUpstreamIn(
    nodes: Map<string, SourceGraphNode>,
    edges: Map<string, SourceGraphEdge>,
    id: string,
  ) {
    return [...edges.values()]
      .filter((e) => e.toNodeId === id)
      .map((e) => nodes.get(e.fromNodeId)!)
      .filter(Boolean);
  }
  private hasCycle(edges: Map<string, SourceGraphEdge>, kind: SourceGraphEdgeKind) {
    const adj = new Map<string, string[]>();
    for (const e of edges.values())
      if (e.kind === kind) adj.set(e.fromNodeId, [...(adj.get(e.fromNodeId) ?? []), e.toNodeId]);
    const visiting = new Set<string>(),
      done = new Set<string>();
    const dfs = (id: string): boolean => {
      if (visiting.has(id)) return true;
      if (done.has(id)) return false;
      visiting.add(id);
      for (const n of adj.get(id) ?? []) if (dfs(n)) return true;
      visiting.delete(id);
      done.add(id);
      return false;
    };
    return [...adj.keys()].some(dfs);
  }
  private propagate() {
    const rank: Record<SourceGraphHealthState, number> = {
      FAILED: 5,
      UNHEALTHY: 4,
      DEGRADED: 3,
      HEALTHY: 2,
      UNKNOWN: 1,
    };
    const byKind = (k: SourceGraphEdgeKind) => this.listEdges({ kind: k });
    for (const e of byKind('AVAILABILITY_PROPAGATES_TO')) {
      const a = this.nodes.get(e.fromNodeId),
        b = this.nodes.get(e.toNodeId);
      if (
        a &&
        b &&
        a.availabilityState === 'UNAVAILABLE' &&
        b.availabilityState !== 'UNAVAILABLE'
      ) {
        this.nodes.set(b.id, this.normNode({ ...b, availabilityState: 'UNAVAILABLE' }));
        this.availabilityPropagationCount++;
      }
    }
    for (const e of byKind('HEALTH_PROPAGATES_TO')) {
      const a = this.nodes.get(e.fromNodeId),
        b = this.nodes.get(e.toNodeId);
      if (a && b && rank[a.effectiveHealth ?? 'UNKNOWN'] > rank[b.effectiveHealth ?? 'UNKNOWN']) {
        this.nodes.set(
          b.id,
          this.normNode({ ...b, effectiveHealth: a.effectiveHealth ?? 'UNKNOWN' }),
        );
        this.healthPropagationCount++;
      }
    }
    for (const n of this.nodes.values())
      if (n.kind === 'STREAM')
        this.nodes.set(
          n.id,
          this.normNode({ ...n, routingEligibility: this.evaluateRoutingEligibility(n.id) }),
        );
  }
  evaluateRoutingEligibility(streamId: string, endpointId?: string): SourceGraphRoutingEligibility {
    const n = this.nodes.get(streamId);
    const reasons: string[] = [];
    if (!n || n.kind !== 'STREAM') reasons.push('STREAM_NOT_FOUND');
    if (n && !n.enabled) reasons.push('STREAM_DISABLED');
    if (n && n.availabilityState !== 'AVAILABLE') reasons.push('STREAM_UNAVAILABLE');
    if (n && n.effectiveHealth === 'FAILED') reasons.push('STREAM_FAILED');
    if (n && !n.selectedFormat) reasons.push('FORMAT_UNKNOWN');
    const endpoints = this.listNodes({ kind: 'ROUTING_ENDPOINT' })
      .filter((ep) => !endpointId || ep.id === endpointId)
      .filter((ep) => !n?.mediaKind || !ep.mediaKind || ep.mediaKind === n.mediaKind)
      .map((ep) => ep.id);
    if (endpointId && !endpoints.length) reasons.push('ENDPOINT_INCOMPATIBLE');
    return freeze({
      routable: reasons.length === 0 && (!endpointId || endpoints.length > 0),
      reasons: reasons.sort(),
      compatibleEndpointIds: endpoints.sort(),
    }) as SourceGraphRoutingEligibility;
  }
  syncFromDeviceSnapshot(s: DevicePlatformSnapshot) {
    const muts: SourceGraphMutation[] = [];
    for (const d of [...s.devices].sort((a, b) => a.id.localeCompare(b.id))) {
      const id = sourceGraphIds.device(d.id);
      const node: SourceGraphNode = {
        id,
        kind: 'DEVICE',
        displayName: d.displayName,
        deviceId: d.id,
        providerId: d.providerId,
        availabilityState: d.available ? 'AVAILABLE' : 'UNAVAILABLE',
        localHealth:
          d.health.healthState === 'HEALTHY'
            ? 'HEALTHY'
            : d.health.healthState === 'FAILED'
              ? 'FAILED'
              : d.health.healthState === 'DEGRADED'
                ? 'DEGRADED'
                : 'UNKNOWN',
        effectiveHealth:
          d.health.healthState === 'HEALTHY'
            ? 'HEALTHY'
            : d.health.healthState === 'FAILED'
              ? 'FAILED'
              : d.health.healthState === 'DEGRADED'
                ? 'DEGRADED'
                : 'UNKNOWN',
        connected: d.connected,
        generation: s.generation,
        metadata: d.metadata,
      };
      muts.push({
        mutationId: `sync-device:${id}:${s.generation}`,
        mutationType: this.nodes.has(id) ? 'UPDATE_NODE' : 'ADD_NODE',
        payload: this.nodes.has(id) ? { nodeId: id, patch: node } : { node },
      });
      for (const sd of d.sources) this.addSourceDescriptorMutations(muts, sd, d.id, s.generation);
    }
    this.syncedDeviceGeneration = s.generation;
    return this.applyTransaction({
      transactionId: `sync-devices:${s.generation}`,
      mutations: muts,
      reason: 'device snapshot sync',
    });
  }
  syncFromSourceSnapshot(
    s: SourceAcquisitionSnapshot & {
      sources?: readonly {
        descriptor: SourceDescriptor;
        lifecycleState?: string;
        health?: {
          healthState?: string;
          available?: boolean;
          connected?: boolean;
          active?: boolean;
        };
        selectedFormat?: SourceMediaFormat;
      }[];
    },
  ) {
    const muts: SourceGraphMutation[] = [];
    for (const src of [...(s.sources ?? [])].sort((a, b) =>
      a.descriptor.id.localeCompare(b.descriptor.id),
    ))
      this.addSourceDescriptorMutations(
        muts,
        src.descriptor,
        (src.descriptor as SourceDescriptor & { deviceId?: string }).deviceId,
        Number(s.generatedAtNs) || 0,
      );
    this.syncedSourceGeneration = s.generatedAtNs;
    return this.applyTransaction({
      transactionId: `sync-sources:${s.generatedAtNs}`,
      mutations: muts,
      reason: 'source snapshot sync',
    });
  }
  private addSourceDescriptorMutations(
    muts: SourceGraphMutation[],
    d: SourceDescriptor,
    deviceId?: string,
    generation = 0,
  ) {
    const desc = sourceGraphIds.descriptor(d.id),
      inst = sourceGraphIds.instance(d.id);
    const common: Partial<SourceGraphNode> = {
      sourceId: d.id,
      providerId: d.providerId,
      displayName: d.displayName,
      availabilityState:
        d.availability === 'AVAILABLE'
          ? 'AVAILABLE'
          : d.availability === 'UNAVAILABLE'
            ? 'UNAVAILABLE'
            : 'UNKNOWN',
      localHealth: d.availability === 'AVAILABLE' ? 'HEALTHY' : 'UNKNOWN',
      effectiveHealth: d.availability === 'AVAILABLE' ? 'HEALTHY' : 'UNKNOWN',
      selectedFormat: d.defaultFormat,
      supportedFormatsSummary: d.supportedFormats.map((f) => f.id),
      clockDomain: d.clockDomain,
      tags: d.tags,
      metadata: d.metadata,
      generation,
    };
    const dn = {
      id: desc,
      kind: 'SOURCE_DESCRIPTOR' as const,
      ...common,
      ...(deviceId ? { deviceId } : {}),
    };
    const inn = {
      id: inst,
      kind: 'SOURCE_INSTANCE' as const,
      ...common,
      ...(deviceId ? { deviceId } : {}),
      active: false,
      connected: false,
    };
    muts.push({
      mutationId: `upsert:${desc}:${generation}`,
      mutationType: this.nodes.has(desc) ? 'UPDATE_NODE' : 'ADD_NODE',
      payload: this.nodes.has(desc) ? { nodeId: desc, patch: dn } : { node: dn as SourceGraphNode },
    });
    muts.push({
      mutationId: `upsert:${inst}:${generation}`,
      mutationType: this.nodes.has(inst) ? 'UPDATE_NODE' : 'ADD_NODE',
      payload: this.nodes.has(inst)
        ? { nodeId: inst, patch: inn }
        : { node: inn as SourceGraphNode },
    });
    if (deviceId) {
      const de = sourceGraphIds.edge(
        'DEVICE_EXPOSES_SOURCE',
        sourceGraphIds.device(deviceId),
        desc,
      );
      if (!this.edges.has(de))
        muts.push({
          mutationId: `edge:${de}`,
          mutationType: 'ADD_EDGE',
          payload: {
            edge: {
              id: de,
              kind: 'DEVICE_EXPOSES_SOURCE',
              fromNodeId: sourceGraphIds.device(deviceId),
              toNodeId: desc,
            },
          },
        });
    }
    const ie = sourceGraphIds.edge('SOURCE_INSTANCE_OF_DESCRIPTOR', inst, desc);
    if (!this.edges.has(ie))
      muts.push({
        mutationId: `edge:${ie}`,
        mutationType: 'ADD_EDGE',
        payload: {
          edge: { id: ie, kind: 'SOURCE_INSTANCE_OF_DESCRIPTOR', fromNodeId: inst, toNodeId: desc },
        },
      });
    for (const sn of generateSourceGraphStreamNodes(d, generation)) {
      muts.push({
        mutationId: `upsert:${sn.id}:${generation}`,
        mutationType: this.nodes.has(sn.id) ? 'UPDATE_NODE' : 'ADD_NODE',
        payload: this.nodes.has(sn.id) ? { nodeId: sn.id, patch: sn } : { node: sn },
      });
      const se = sourceGraphIds.edge('SOURCE_PRODUCES_STREAM', inst, sn.id);
      if (!this.edges.has(se))
        muts.push({
          mutationId: `edge:${se}`,
          mutationType: 'ADD_EDGE',
          payload: {
            edge: { id: se, kind: 'SOURCE_PRODUCES_STREAM', fromNodeId: inst, toNodeId: sn.id },
          },
        });
      for (const k of [
        'HEALTH_PROPAGATES_TO',
        'AVAILABILITY_PROPAGATES_TO',
      ] as SourceGraphEdgeKind[]) {
        const pe = sourceGraphIds.edge(k, inst, sn.id);
        if (!this.edges.has(pe))
          muts.push({
            mutationId: `edge:${pe}`,
            mutationType: 'ADD_EDGE',
            payload: { edge: { id: pe, kind: k, fromNodeId: inst, toNodeId: sn.id } },
          });
      }
    }
    if (deviceId)
      for (const k of [
        'HEALTH_PROPAGATES_TO',
        'AVAILABILITY_PROPAGATES_TO',
      ] as SourceGraphEdgeKind[]) {
        const a = sourceGraphIds.edge(k, sourceGraphIds.device(deviceId), desc),
          b = sourceGraphIds.edge(k, desc, inst);
        if (!this.edges.has(a))
          muts.push({
            mutationId: `edge:${a}`,
            mutationType: 'ADD_EDGE',
            payload: {
              edge: { id: a, kind: k, fromNodeId: sourceGraphIds.device(deviceId), toNodeId: desc },
            },
          });
        if (!this.edges.has(b))
          muts.push({
            mutationId: `edge:${b}`,
            mutationType: 'ADD_EDGE',
            payload: { edge: { id: b, kind: k, fromNodeId: desc, toNodeId: inst } },
          });
      }
  }
  getSnapshot() {
    return freeze({
      lifecycleState: this.lifecycleState,
      graphVersion: String(this.graphVersion),
      topologyVersion: String(this.topologyVersion),
      healthVersion: String(this.healthVersion),
      lastMutationId: this.lastMutationId,
      lastTransactionId: this.lastTransactionId,
      generatedAtNs: String(this.nowNs()),
      nodes: this.listNodes(),
      edges: this.listEdges(),
      recentDiffs: this.diffs,
      telemetry: this.getTelemetry(),
    }) as SourceGraphSnapshot;
  }
  getTelemetry() {
    const nodes = this.listNodes();
    const c = (p: (n: SourceGraphNode) => boolean) => nodes.filter(p).length;
    return freeze({
      graphVersion: String(this.graphVersion),
      topologyVersion: String(this.topologyVersion),
      healthVersion: String(this.healthVersion),
      nodeCount: nodes.length,
      edgeCount: this.edges.size,
      deviceNodeCount: c((n) => n.kind === 'DEVICE'),
      sourceDescriptorNodeCount: c((n) => n.kind === 'SOURCE_DESCRIPTOR'),
      sourceInstanceNodeCount: c((n) => n.kind === 'SOURCE_INSTANCE'),
      streamNodeCount: c((n) => n.kind === 'STREAM'),
      groupNodeCount: c((n) => n.kind === 'SOURCE_GROUP'),
      endpointNodeCount: c((n) => n.kind === 'ROUTING_ENDPOINT'),
      availableNodeCount: c((n) => n.availabilityState === 'AVAILABLE'),
      activeNodeCount: c((n) => !!n.active),
      degradedNodeCount: c((n) => n.effectiveHealth === 'DEGRADED'),
      failedNodeCount: c((n) => n.effectiveHealth === 'FAILED'),
      routableStreamCount: c((n) => n.kind === 'STREAM' && !!n.routingEligibility?.routable),
      unroutableStreamCount: c((n) => n.kind === 'STREAM' && !n.routingEligibility?.routable),
      graphMutationCount: this.mutationCount,
      graphTransactionCount: this.txCount,
      graphTransactionRollbackCount: this.rollbackCount,
      graphValidationCount: this.validationCount,
      graphValidationFailureCount: this.validationFailureCount,
      availabilityPropagationCount: this.availabilityPropagationCount,
      healthPropagationCount: this.healthPropagationCount,
      recentDiffCount: this.diffs.length,
      lastMutation: this.lastMutationId,
      lastValidation: this.lastValidation,
      graphHealthSummary: nodes.reduce(
        (a, n) => {
          a[n.effectiveHealth ?? 'UNKNOWN'] = (a[n.effectiveHealth ?? 'UNKNOWN'] ?? 0) + 1;
          return a;
        },
        {} as Record<string, number>,
      ),
    }) as SourceGraphTelemetrySnapshot;
  }
  private snapshotIds() {
    return {
      nodes: new Map([...this.nodes].map(([id, n]) => [id, JSON.stringify(n)])),
      edges: new Map([...this.edges].map(([id, e]) => [id, JSON.stringify(e)])),
    };
  }
  private makeDiff(
    a: { nodes: Map<string, string>; edges: Map<string, string> },
    b: { nodes: Map<string, string>; edges: Map<string, string> },
  ): SourceGraphDiff {
    const arr = (m: Map<string, string>) => [...m.keys()].sort();
    return freeze({
      fromVersion: String(this.graphVersion),
      toVersion: String(this.graphVersion + 1n),
      addedNodeIds: arr(b.nodes).filter((id) => !a.nodes.has(id)),
      updatedNodeIds: arr(b.nodes).filter(
        (id) => a.nodes.has(id) && a.nodes.get(id) !== b.nodes.get(id),
      ),
      removedNodeIds: arr(a.nodes).filter((id) => !b.nodes.has(id)),
      addedEdgeIds: arr(b.edges).filter((id) => !a.edges.has(id)),
      removedEdgeIds: arr(a.edges).filter((id) => !b.edges.has(id)),
      healthChangedNodeIds: arr(b.nodes).filter(
        (id) =>
          a.nodes.has(id) &&
          JSON.parse(a.nodes.get(id)!).effectiveHealth !==
            JSON.parse(b.nodes.get(id)!).effectiveHealth,
      ),
      availabilityChangedNodeIds: arr(b.nodes).filter(
        (id) =>
          a.nodes.has(id) &&
          JSON.parse(a.nodes.get(id)!).availabilityState !==
            JSON.parse(b.nodes.get(id)!).availabilityState,
      ),
    }) as SourceGraphDiff;
  }
  private pushDiff(d: SourceGraphDiff) {
    this.diffs = [...this.diffs, d].slice(-this.diffLimit);
  }
  assertInvariants() {
    const r = this.validate();
    if (!r.valid) throw new SourceGraphInvariantViolation(r.issues.map((i) => i.code).join(','));
    const t = this.getTelemetry();
    if (t.nodeCount !== this.nodes.size || t.edgeCount !== this.edges.size)
      throw new SourceGraphInvariantViolation('telemetry mismatch');
    if (this.diffs.length > this.diffLimit)
      throw new SourceGraphInvariantViolation('diff history unbounded');
  }
  async shutdown() {
    this.lifecycleState = 'STOPPED';
  }
  getWatchdogDiagnostics(latestDeviceGeneration = 0, latestSourceGeneration = '0') {
    const incidents: string[] = [];
    if (latestDeviceGeneration > this.syncedDeviceGeneration) incidents.push('SOURCE_GRAPH_STALE');
    if (BigInt(latestSourceGeneration) > BigInt(this.syncedSourceGeneration || '0'))
      incidents.push('SOURCE_GRAPH_OUT_OF_SYNC');
    if (!this.validate().valid) incidents.push('SOURCE_GRAPH_INVALID');
    return freeze({
      healthy: incidents.length === 0,
      incidents,
      graphVersion: String(this.graphVersion),
    });
  }
}
export function generateSourceGraphStreamNodes(
  d: SourceDescriptor,
  generation = 0,
): SourceGraphNode[] {
  const kinds: SourceGraphMediaKind[] = [];
  if (d.supportsVideo || d.mediaKinds.includes('VIDEO') || d.mediaKinds.includes('AUDIO_VIDEO'))
    kinds.push('VIDEO');
  if (d.supportsAudio || d.mediaKinds.includes('AUDIO') || d.mediaKinds.includes('AUDIO_VIDEO'))
    kinds.push('AUDIO');
  if (d.mediaKinds.includes('DATA')) kinds.push('DATA');
  if (d.supportsMetadata) kinds.push('METADATA');
  return kinds
    .map((k, o) => ({
      id: sourceGraphIds.stream(d.id, k, 0),
      kind: 'STREAM' as const,
      displayName: `${d.displayName} ${k}`,
      sourceId: d.id,
      streamId: sourceGraphIds.stream(d.id, k, 0),
      providerId: d.providerId,
      mediaKind: k,
      availabilityState: (d.availability === 'AVAILABLE'
        ? 'AVAILABLE'
        : 'UNAVAILABLE') as SourceGraphAvailabilityState,
      localHealth: (d.availability === 'AVAILABLE'
        ? 'HEALTHY'
        : 'UNKNOWN') as SourceGraphHealthState,
      effectiveHealth: (d.availability === 'AVAILABLE'
        ? 'HEALTHY'
        : 'UNKNOWN') as SourceGraphHealthState,
      selectedFormat:
        d.defaultFormat?.kind === k || (d.defaultFormat?.kind === 'DATA' && k === 'METADATA')
          ? d.defaultFormat
          : undefined,
      supportedFormatsSummary: d.supportedFormats
        .filter((f) => f.kind === k || (f.kind === 'DATA' && k === 'METADATA'))
        .map((f) => f.id),
      clockDomain: d.clockDomain,
      tags: d.tags,
      metadata: { ordinal: o, acquisitionMode: d.acquisitionMode, containsMediaPayloads: false },
      generation,
    }))
    .sort(
      (a, b) =>
        ['VIDEO', 'AUDIO', 'DATA', 'METADATA'].indexOf(a.mediaKind!) -
          ['VIDEO', 'AUDIO', 'DATA', 'METADATA'].indexOf(b.mediaKind!) || a.id.localeCompare(b.id),
    );
}
export const createSourceGraphManager = (nowNs?: () => bigint) =>
  new DefaultSourceGraphManager(nowNs);
export function createSourceGraphCommandHandlers(
  manager: DefaultSourceGraphManager,
): Record<string, TypedRuntimeCommandHandler<any, unknown>> {
  const h = (type: string, fn: (p: any) => unknown): TypedRuntimeCommandHandler<any, unknown> => ({
    commandType: type,
    idempotent: true,
    execute: (c: RuntimeCommand<any>) => ({ status: 'SUCCEEDED', value: fn(c.payload) }),
  });
  return {
    SOURCE_GRAPH_ADD_NODE: h('SOURCE_GRAPH_ADD_NODE', (p) => manager.addNode(p.node)),
    SOURCE_GRAPH_UPDATE_NODE: h('SOURCE_GRAPH_UPDATE_NODE', (p) =>
      manager.updateNode(p.nodeId, p.patch),
    ),
    SOURCE_GRAPH_REMOVE_NODE: h('SOURCE_GRAPH_REMOVE_NODE', (p) => manager.removeNode(p.nodeId)),
    SOURCE_GRAPH_ADD_EDGE: h('SOURCE_GRAPH_ADD_EDGE', (p) => manager.addEdge(p.edge)),
    SOURCE_GRAPH_REMOVE_EDGE: h('SOURCE_GRAPH_REMOVE_EDGE', (p) => manager.removeEdge(p.edgeId)),
    SOURCE_GRAPH_APPLY_TRANSACTION: h('SOURCE_GRAPH_APPLY_TRANSACTION', (p) =>
      manager.applyTransaction(p.transaction),
    ),
    SOURCE_GRAPH_SYNC_DEVICES: h('SOURCE_GRAPH_SYNC_DEVICES', (p) =>
      manager.syncFromDeviceSnapshot(p.snapshot),
    ),
    SOURCE_GRAPH_SYNC_SOURCES: h('SOURCE_GRAPH_SYNC_SOURCES', (p) =>
      manager.syncFromSourceSnapshot(p.snapshot),
    ),
    SOURCE_GRAPH_VALIDATE: h('SOURCE_GRAPH_VALIDATE', () => manager.validate()),
    SOURCE_GRAPH_SET_HEALTH: h('SOURCE_GRAPH_SET_HEALTH', (p) =>
      manager.applyMutation({
        mutationId: p.mutationId ?? `health:${p.nodeId}`,
        mutationType: 'SET_NODE_HEALTH',
        expectedGraphVersion: p.expectedGraphVersion,
        payload: { nodeId: p.nodeId, health: p.health },
      }),
    ),
    SOURCE_GRAPH_SET_AVAILABILITY: h('SOURCE_GRAPH_SET_AVAILABILITY', (p) =>
      manager.applyMutation({
        mutationId: p.mutationId ?? `availability:${p.nodeId}`,
        mutationType: 'SET_NODE_AVAILABILITY',
        expectedGraphVersion: p.expectedGraphVersion,
        payload: { nodeId: p.nodeId, availability: p.availability },
      }),
    ),
  };
}
export function createSyntheticSourceGraphFixture() {
  const g = createSourceGraphManager(() => 1n);
  const group = {
    id: sourceGraphIds.group('operators'),
    kind: 'SOURCE_GROUP' as const,
    displayName: 'Camera bank',
    availabilityState: 'AVAILABLE' as const,
  };
  const ep = {
    id: sourceGraphIds.endpoint('preview'),
    kind: 'ROUTING_ENDPOINT' as const,
    displayName: 'Preview bus',
    mediaKind: 'VIDEO' as const,
    availabilityState: 'AVAILABLE' as const,
  };
  g.addNode(group);
  g.addNode(ep);
  return g;
}

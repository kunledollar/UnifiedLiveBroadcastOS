/**
 * Workspace Intelligence Engine (WIE) — Step 89
 *
 * Bridge between intelligence and interface. Converts fused insights,
 * predictions, operator guidance, confidence, and temporal patterns into
 * UI-level signals: highlight, dim, warn, pulse, prepare, suppress, elevate.
 *
 * Transforms UBOS from "I know what’s happening" into
 * "I visually show you what matters."
 */

import type { FusionCluster, FusedInsight } from './insightFusionEngine.js';
import type { GuidanceAction, GuidanceRole } from './operatorGuidanceEngine.js';
import { normalizeRole } from './operatorGuidanceEngine.js';
import type { Prediction } from './predictiveEngine.js';
import type { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

export type UiPanelId =
  | 'scenePanel'
  | 'graphicsPanel'
  | 'audioPanel'
  | 'routingPanel'
  | 'programOutputPanel'
  | 'replayPanel'
  | 'automationPanel'
  | 'operatorPanel'
  | 'systemPanel'
  | 'guidancePanel'
  | 'workspaceShell';

export type UiSignalAction =
  | 'highlight'
  | 'dim'
  | 'warn'
  | 'pulse'
  | 'prepare'
  | 'suppress'
  | 'elevate';

export type WorkspaceUiSignal = {
  id: string;
  action: UiSignalAction;
  panel: UiPanelId;
  cluster?: FusionCluster;
  confidence: number;
  reason: string;
  timestamp: number;
};

/** Role → panels that should stay prominent. */
const ROLE_PANELS: Record<GuidanceRole, UiPanelId[]> = {
  Director: ['scenePanel', 'programOutputPanel', 'graphicsPanel', 'guidancePanel'],
  'Technical Director': ['routingPanel', 'programOutputPanel', 'scenePanel', 'systemPanel', 'automationPanel'],
  'Graphics Operator': ['graphicsPanel', 'scenePanel', 'guidancePanel'],
  'Audio Engineer': ['audioPanel', 'guidancePanel'],
  'Replay Operator': ['replayPanel', 'scenePanel', 'programOutputPanel'],
  'Streaming Operator': ['programOutputPanel', 'routingPanel', 'systemPanel'],
  'Solo Streamer': [
    'scenePanel',
    'graphicsPanel',
    'audioPanel',
    'programOutputPanel',
    'guidancePanel',
  ],
  'Compact Operator': ['scenePanel', 'audioPanel', 'programOutputPanel', 'guidancePanel'],
};

const ALL_PANELS: UiPanelId[] = [
  'scenePanel',
  'graphicsPanel',
  'audioPanel',
  'routingPanel',
  'programOutputPanel',
  'replayPanel',
  'automationPanel',
  'operatorPanel',
  'systemPanel',
  'guidancePanel',
  'workspaceShell',
];

const CLUSTER_PANEL: Record<FusionCluster, UiPanelId> = {
  scene: 'scenePanel',
  graphics: 'graphicsPanel',
  audio: 'audioPanel',
  routing: 'routingPanel',
  output: 'programOutputPanel',
  operator: 'operatorPanel',
  automation: 'automationPanel',
  system: 'systemPanel',
};

const NOISE_THRESHOLD = 0.45;

function signalPriority(action: UiSignalAction): number {
  switch (action) {
    case 'highlight':
      return 5;
    case 'warn':
      return 4;
    case 'pulse':
      return 3;
    case 'prepare':
      return 2;
    case 'elevate':
      return 2;
    case 'dim':
      return 1;
    case 'suppress':
      return 0;
    default:
      return 0;
  }
}

export class WorkspaceIntelligenceEngine {
  private readonly graph: UBOSIntelligenceGraph;

  workspaceSignals: WorkspaceUiSignal[] = [];

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  /**
   * Compute UI intelligence signals for the active role/workspace.
   */
  compute(
    operatorRole?: string | null,
    workspace?: string | null,
  ): WorkspaceUiSignal[] {
    const guidanceCtx = this.graph.guidanceEngine.getContext();
    const role = normalizeRole(operatorRole ?? guidanceCtx.role);
    const ws =
      workspace ??
      guidanceCtx.workspace ??
      this.graph.normalizer.getContext().workspace ??
      null;

    const fused = this.graph.fusedInsights ?? [];
    const predictions = this.graph.predictiveEngine.getPredictions();
    const guidance = this.graph.operatorGuidance ?? [];
    const now = Date.now();
    const uiSignals: WorkspaceUiSignal[] = [];

    // Rule 6 — Elevate active workspace shell
    uiSignals.push({
      id: `wie-elevate-workspace-${now}`,
      action: 'elevate',
      panel: 'workspaceShell',
      confidence: 1,
      reason: `Active workspace${ws ? `: ${ws}` : ''}`,
      timestamp: now,
    });

    // Always elevate guidance panel when OGE has actions
    if (guidance.length > 0) {
      uiSignals.push({
        id: `wie-elevate-guidance-${now}`,
        action: 'elevate',
        panel: 'guidancePanel',
        confidence: Math.max(...guidance.map((g) => g.confidence)),
        reason: 'Operator guidance available',
        timestamp: now,
      });
    }

    for (const signal of fused) {
      // Rule 7 — Suppress noise
      if (signal.confidence < NOISE_THRESHOLD) {
        const panel = this.mapClusterToPanel(signal.cluster) ?? this.mapNodeToPanel(signal.nodeId);
        if (panel) {
          uiSignals.push({
            id: `wie-suppress-${signal.id}`,
            action: 'suppress',
            panel,
            cluster: signal.cluster,
            confidence: signal.confidence,
            reason: 'Low-confidence noise',
            timestamp: now,
          });
        }
        continue;
      }

      const panelId =
        this.mapClusterToPanel(signal.cluster) ?? this.mapNodeToPanel(signal.nodeId);
      if (!panelId) continue;

      // Rule 1 — Highlight critical panels
      if (signal.severity === 'critical') {
        uiSignals.push({
          id: `wie-highlight-${signal.id}`,
          action: 'highlight',
          panel: panelId,
          cluster: signal.cluster,
          confidence: signal.confidence,
          reason: signal.message,
          timestamp: now,
        });
      }

      // Rule 2 — Warn on degraded output / warnings
      if (
        signal.severity === 'warning' ||
        signal.cluster === 'output' ||
        signal.message.toLowerCase().includes('output')
      ) {
        if (signal.severity !== 'info') {
          uiSignals.push({
            id: `wie-warn-${signal.id}`,
            action: 'warn',
            panel: panelId,
            cluster: signal.cluster,
            confidence: signal.confidence,
            reason: signal.message,
            timestamp: now,
          });
        }
      }

      // Rule 3 — Prepare for scene transition
      if (
        signal.severity === 'prediction' &&
        (signal.cluster === 'scene' || signal.message.toLowerCase().includes('scene'))
      ) {
        uiSignals.push({
          id: `wie-prepare-scene-${signal.id}`,
          action: 'prepare',
          panel: 'scenePanel',
          cluster: 'scene',
          confidence: signal.confidence,
          reason: signal.message,
          timestamp: now,
        });
      }

      // Rule 4 — Pulse graphics panel
      if (
        signal.severity === 'prediction' &&
        (signal.cluster === 'graphics' || signal.message.toLowerCase().includes('graphics'))
      ) {
        uiSignals.push({
          id: `wie-pulse-graphics-${signal.id}`,
          action: 'pulse',
          panel: 'graphicsPanel',
          cluster: 'graphics',
          confidence: signal.confidence,
          reason: signal.message,
          timestamp: now,
        });
      }

      // Predictive audio / routing emphasis
      if (signal.severity === 'prediction' && signal.cluster === 'audio') {
        uiSignals.push({
          id: `wie-pulse-audio-${signal.id}`,
          action: 'pulse',
          panel: 'audioPanel',
          cluster: 'audio',
          confidence: signal.confidence,
          reason: signal.message,
          timestamp: now,
        });
      }
      if (signal.severity === 'prediction' && signal.cluster === 'routing') {
        uiSignals.push({
          id: `wie-prepare-routing-${signal.id}`,
          action: 'prepare',
          panel: 'routingPanel',
          cluster: 'routing',
          confidence: signal.confidence,
          reason: signal.message,
          timestamp: now,
        });
      }

      // Rule 5 — Dim panels not relevant to role (emitted once per irrelevant panel below)
    }

    // Predictions can also drive prepare/pulse even if fusion collapsed them
    for (const prediction of predictions) {
      uiSignals.push(...this.signalsFromPrediction(prediction, now));
    }

    // Operator guidance elevates related panels
    for (const action of guidance) {
      uiSignals.push(...this.signalsFromGuidance(action, now));
    }

    // Role-based dim/suppress for non-relevant panels
    uiSignals.push(...this.roleDimSignals(role, fused, now));

    // Deduplicate: keep highest-priority action per panel
    this.workspaceSignals = this.dedupeByPanel(uiSignals);
    return this.workspaceSignals;
  }

  mapNodeToPanel(nodeId: string | null | undefined): UiPanelId | null {
    if (!nodeId) return null;
    const id = nodeId.toLowerCase();
    if (id.includes('scene')) return 'scenePanel';
    if (id.includes('graphics') || id.includes('graphic')) return 'graphicsPanel';
    if (id.includes('audio')) return 'audioPanel';
    if (id.includes('routing') || id.includes('route')) return 'routingPanel';
    if (id.includes('output') || id.includes('program')) return 'programOutputPanel';
    if (id.includes('replay')) return 'replayPanel';
    if (id.includes('automation')) return 'automationPanel';
    if (id.includes('operator')) return 'operatorPanel';
    if (id.includes('health') || id.includes('system')) return 'systemPanel';
    return null;
  }

  mapClusterToPanel(cluster: FusionCluster): UiPanelId {
    return CLUSTER_PANEL[cluster];
  }

  isRelevantToRole(signal: FusedInsight, role: GuidanceRole): boolean {
    const panels = ROLE_PANELS[role];
    const panel = this.mapClusterToPanel(signal.cluster);
    if (panels.includes(panel)) return true;

    // Skeleton-style message checks
    const msg = signal.message.toLowerCase();
    if (role === 'Audio Engineer') return msg.includes('audio') || signal.cluster === 'audio';
    if (role === 'Graphics Operator') {
      return msg.includes('graphics') || signal.cluster === 'graphics' || signal.cluster === 'scene';
    }
    if (role === 'Director') {
      return msg.includes('scene') || signal.cluster === 'scene' || signal.cluster === 'output';
    }
    if (role === 'Streaming Operator') {
      return msg.includes('output') || signal.cluster === 'output' || signal.cluster === 'routing';
    }
    if (role === 'Solo Streamer' || role === 'Compact Operator') return true;
    return panels.includes(panel);
  }

  getSignals(): readonly WorkspaceUiSignal[] {
    return this.workspaceSignals;
  }

  getSignalsForPanel(panel: UiPanelId): readonly WorkspaceUiSignal[] {
    return this.workspaceSignals.filter((s) => s.panel === panel);
  }

  /** Effective action for a panel after dedupe (highest priority). */
  getPanelAction(panel: UiPanelId): UiSignalAction | null {
    return this.workspaceSignals.find((s) => s.panel === panel)?.action ?? null;
  }

  reset(): void {
    this.workspaceSignals = [];
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private signalsFromPrediction(prediction: Prediction, now: number): WorkspaceUiSignal[] {
    const msg = prediction.message.toLowerCase();
    const out: WorkspaceUiSignal[] = [];

    if (msg.includes('scene transition') || prediction.category === 'scene_transition') {
      out.push({
        id: `wie-pred-prepare-${prediction.id}`,
        action: 'prepare',
        panel: 'scenePanel',
        cluster: 'scene',
        confidence: prediction.confidence,
        reason: prediction.message,
        timestamp: now,
      });
    }
    if (msg.includes('graphics') || prediction.category === 'graphics_activation') {
      out.push({
        id: `wie-pred-pulse-${prediction.id}`,
        action: 'pulse',
        panel: 'graphicsPanel',
        cluster: 'graphics',
        confidence: prediction.confidence,
        reason: prediction.message,
        timestamp: now,
      });
    }
    if (msg.includes('output') || prediction.category === 'output_degradation') {
      out.push({
        id: `wie-pred-warn-output-${prediction.id}`,
        action: 'warn',
        panel: 'programOutputPanel',
        cluster: 'output',
        confidence: prediction.confidence,
        reason: prediction.message,
        timestamp: now,
      });
    }
    if (msg.includes('audio') || prediction.category === 'audio_clipping') {
      out.push({
        id: `wie-pred-pulse-audio-${prediction.id}`,
        action: 'pulse',
        panel: 'audioPanel',
        cluster: 'audio',
        confidence: prediction.confidence,
        reason: prediction.message,
        timestamp: now,
      });
    }
    if (msg.includes('routing') || prediction.category === 'routing_failure') {
      out.push({
        id: `wie-pred-warn-routing-${prediction.id}`,
        action: 'warn',
        panel: 'routingPanel',
        cluster: 'routing',
        confidence: prediction.confidence,
        reason: prediction.message,
        timestamp: now,
      });
    }
    return out;
  }

  private signalsFromGuidance(action: GuidanceAction, now: number): WorkspaceUiSignal[] {
    const panel = this.mapClusterToPanel(action.cluster);
    if (action.severity === 'Critical Action') {
      return [{
        id: `wie-guide-highlight-${action.id}`,
        action: 'highlight',
        panel,
        cluster: action.cluster,
        confidence: action.confidence,
        reason: action.message,
        timestamp: now,
      }];
    }
    if (action.severity === 'Warning Action') {
      return [{
        id: `wie-guide-warn-${action.id}`,
        action: 'warn',
        panel,
        cluster: action.cluster,
        confidence: action.confidence,
        reason: action.message,
        timestamp: now,
      }];
    }
    if (action.severity === 'Prepare Action') {
      return [{
        id: `wie-guide-prepare-${action.id}`,
        action: 'prepare',
        panel,
        cluster: action.cluster,
        confidence: action.confidence,
        reason: action.message,
        timestamp: now,
      }];
    }
    return [];
  }

  private roleDimSignals(
    role: GuidanceRole,
    fused: FusedInsight[],
    now: number,
  ): WorkspaceUiSignal[] {
    const relevant = new Set(ROLE_PANELS[role]);
    // Panels mentioned by strong fused signals stay undimmed
    for (const signal of fused) {
      if (signal.confidence < NOISE_THRESHOLD) continue;
      if (this.isRelevantToRole(signal, role)) {
        relevant.add(this.mapClusterToPanel(signal.cluster));
      }
    }

    const out: WorkspaceUiSignal[] = [];
    for (const panel of ALL_PANELS) {
      if (panel === 'workspaceShell' || panel === 'guidancePanel') continue;
      if (relevant.has(panel)) continue;
      // Compact/Solo dim fewer panels
      if (role === 'Solo Streamer') continue;
      out.push({
        id: `wie-dim-${panel}-${now}`,
        action: 'dim',
        panel,
        confidence: 0.7,
        reason: `Not primary for ${role}`,
        timestamp: now,
      });
    }
    return out;
  }

  private dedupeByPanel(signals: WorkspaceUiSignal[]): WorkspaceUiSignal[] {
    const best = new Map<UiPanelId, WorkspaceUiSignal>();
    for (const signal of signals) {
      const existing = best.get(signal.panel);
      if (!existing) {
        best.set(signal.panel, signal);
        continue;
      }
      const pNew = signalPriority(signal.action);
      const pOld = signalPriority(existing.action);
      if (pNew > pOld || (pNew === pOld && signal.confidence > existing.confidence)) {
        best.set(signal.panel, signal);
      }
    }
    return [...best.values()].sort(
      (a, b) => signalPriority(b.action) - signalPriority(a.action) || b.confidence - a.confidence,
    );
  }
}

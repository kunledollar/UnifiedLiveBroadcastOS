export type RecommendationPriority = 'low' | 'normal' | 'high' | 'critical' | 'emergency';
export type RecommendationConfidence = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type RecommendationLifecycle =
  'proposed' | 'queued' | 'pending_approval' | 'approved' | 'rejected' | 'expired' | 'dispatched';
export type RecommendationType =
  | 'switch_scene'
  | 'prepare_scene'
  | 'load_graphics'
  | 'take_lower_third'
  | 'show_sponsor'
  | 'hide_graphics'
  | 'load_replay'
  | 'prepare_replay'
  | 'queue_media'
  | 'adjust_audio'
  | 'invite_guest'
  | 'mute_guest'
  | 'start_recording'
  | 'stop_recording'
  | 'enable_output'
  | 'disable_output'
  | 'activate_automation'
  | 'pause_automation'
  | 'route_output'
  | 'archive_recording'
  | 'recover_failure'
  | 'optimize_resources'
  | 'notify_operator';
export type ProductionRisk =
  | 'production_delay'
  | 'guest_offline'
  | 'graphics_missing'
  | 'media_missing'
  | 'audio_issue'
  | 'dropped_frames'
  | 'storage_low'
  | 'output_failure'
  | 'device_offline'
  | 'security_warning'
  | 'automation_conflict'
  | 'cluster_failure';
export type ProductionOptimization =
  | 'scene_flow'
  | 'graphics_timing'
  | 'audio_balance'
  | 'replay_timing'
  | 'guest_experience'
  | 'recording_efficiency'
  | 'resource_allocation'
  | 'operator_workload'
  | 'automation_efficiency'
  | 'output_reliability';
export type ProductionScenario =
  'pre_show' | 'live_show' | 'intermission' | 'post_show' | 'incident_response';
export interface RecommendationReason {
  code: string;
  message: string;
  source: string;
  metadataOnly: true;
}
export interface RecommendationDependency {
  id: string;
  recommendationId: string;
  requiredRecommendationId: string;
  metadataOnly: true;
}
export interface RecommendationPolicy {
  operatorApprovalRequired: true;
  autonomousExecutionAllowed: false;
  metadataOnly: true;
}
export interface RecommendationApproval {
  id: string;
  recommendationId: string;
  status: 'pending' | 'approved' | 'rejected';
  operatorId?: string;
  decidedAt?: string;
  note?: string;
  metadataOnly: true;
}
export interface ProductionRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  confidence: RecommendationConfidence;
  reasons: RecommendationReason[];
  lifecycle: RecommendationLifecycle;
  policy: RecommendationPolicy;
  dependencies: RecommendationDependency[];
  createdAt: string;
  metadataOnly: true;
}
export interface RecommendationGroup {
  id: string;
  title: string;
  recommendations: ProductionRecommendation[];
  metadataOnly: true;
}
export interface RecommendationHistory {
  events: Array<{
    id: string;
    recommendationId: string;
    lifecycle: RecommendationLifecycle;
    at: string;
    metadataOnly: true;
  }>;
  metadataOnly: true;
}
export interface RecommendationSnapshot {
  id: string;
  recommendations: ProductionRecommendation[];
  approvals: RecommendationApproval[];
  at: string;
  metadataOnly: true;
}
export interface RecommendationMetrics {
  total: number;
  pendingApprovals: number;
  byPriority: Record<RecommendationPriority, number>;
  byConfidence: Record<RecommendationConfidence, number>;
  riskCount: number;
  optimizationCount: number;
  metadataOnly: true;
}
export interface RecommendationQueue {
  items: ProductionRecommendation[];
  metadataOnly: true;
}
export interface ProductionObjective {
  id: string;
  label: string;
  priority: RecommendationPriority;
  metadataOnly: true;
}
export interface ProductionPrediction {
  id: string;
  label: string;
  confidence: RecommendationConfidence;
  horizonSeconds: number;
  metadataOnly: true;
}
export interface ProductionTimelineAnalysis {
  currentSegment?: string;
  nextSegment?: string;
  predictions: ProductionPrediction[];
  metadataOnly: true;
}
export interface ProductionInsight {
  id: string;
  title: string;
  detail: string;
  category: 'state' | 'risk' | 'optimization' | 'approval';
  metadataOnly: true;
}
export interface OperatorIntent {
  id: string;
  label: string;
  requestedAt: string;
  metadataOnly: true;
}
export interface OperatorDecision {
  id: string;
  recommendationId: string;
  decision: 'approve' | 'reject';
  operatorId: string;
  metadataOnly: true;
}
export interface ProductionContext {
  productionGraph?: unknown;
  currentScene?: string;
  preview?: string;
  program?: string;
  switchHistory?: unknown[];
  mediaPlayback?: Record<string, unknown>;
  replay?: Record<string, unknown>;
  graphics?: Record<string, unknown>;
  audioMix?: Record<string, unknown>;
  recording?: Record<string, unknown>;
  streaming?: Record<string, unknown>;
  distribution?: Record<string, unknown>;
  guestStatus?: Record<string, string>;
  automation?: Record<string, unknown>;
  monitoring?: Record<string, unknown>;
  security?: Record<string, unknown>;
  cluster?: Record<string, unknown>;
  cloud?: Record<string, unknown>;
  pluginState?: Record<string, unknown>;
  metadataOnly: true;
}
export interface ProductionAnalysis {
  id: string;
  scenario: ProductionScenario;
  objectives: ProductionObjective[];
  risks: Array<{
    type: ProductionRisk;
    severity: RecommendationPriority;
    reason: string;
    metadataOnly: true;
  }>;
  optimizations: Array<{
    type: ProductionOptimization;
    impact: RecommendationPriority;
    reason: string;
    metadataOnly: true;
  }>;
  timeline: ProductionTimelineAnalysis;
  insights: ProductionInsight[];
  metadataOnly: true;
}
export interface AIDirectorDashboard {
  analysis: ProductionAnalysis;
  queue: RecommendationQueue;
  metrics: RecommendationMetrics;
  approvals: RecommendationApproval[];
  history: RecommendationHistory;
  snapshots: RecommendationSnapshot[];
  metadataOnly: true;
}
const now = () => new Date().toISOString();
const id = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const unsafe = [
  'runtimeHandle',
  'handle',
  'socket',
  'connection',
  'endpoint',
  'url',
  'apiKey',
  'token',
  'credentials',
  'openai',
  'anthropic',
  'gemini',
  'modelWeights',
  'inference',
  'execute',
  'autonomousExecution',
];
export class RecommendationValidator {
  validate(input: unknown): void {
    const seen = new Set<unknown>();
    const walk = (v: unknown, path = ''): void => {
      if (!v || typeof v !== 'object' || seen.has(v)) return;
      seen.add(v);
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (unsafe.some((u) => k.toLowerCase().includes(u.toLowerCase())))
          throw new Error(`AI Director rejected unsafe field: ${path}${k}`);
        if (
          typeof val === 'string' &&
          /(openai|anthropic|gemini|llm|model weights|inference|autonomous execution)/iu.test(val)
        )
          throw new Error(`AI Director rejected unsafe value at ${path}${k}`);
        walk(val, `${path}${k}.`);
      }
    };
    walk(input);
  }
}
export class RecommendationDispatcher {
  dispatch(rec: ProductionRecommendation, approval?: RecommendationApproval) {
    if (!approval || approval.status !== 'approved')
      throw new Error('Operator approval required before dispatch');
    return { ...rec, lifecycle: 'dispatched' as const, metadataOnly: true };
  }
}
export class AIDirectorRuntime {
  validator = new RecommendationValidator();
  dispatcher = new RecommendationDispatcher();
  analyze(context: ProductionContext): ProductionAnalysis {
    this.validator.validate(context);
    const risks: ProductionAnalysis['risks'] = [];
    const opts: ProductionAnalysis['optimizations'] = [];
    const addRisk = (type: ProductionRisk, severity: RecommendationPriority, reason: string) =>
      risks.push({ type, severity, reason, metadataOnly: true });
    if (context.monitoring?.status === 'critical' || context.monitoring?.droppedFrames)
      addRisk('dropped_frames', 'critical', 'Monitoring metadata indicates critical video health.');
    if (
      context.guestStatus &&
      Object.values(context.guestStatus).some((s) => /offline|disconnected|reconnecting/u.test(s))
    )
      addRisk('guest_offline', 'high', 'Guest metadata contains offline or reconnecting state.');
    if (context.graphics?.missing)
      addRisk('graphics_missing', 'normal', 'Graphics metadata reports missing assets.');
    if (context.mediaPlayback?.missing)
      addRisk('media_missing', 'high', 'Media playback metadata reports missing media.');
    if (context.audioMix?.clipping || context.audioMix?.mutedProgram)
      addRisk('audio_issue', 'critical', 'Audio mix metadata reports clipping or muted program.');
    if (context.recording?.storageLow)
      addRisk('storage_low', 'critical', 'Recording metadata reports low storage.');
    if (context.distribution?.outputFailure)
      addRisk('output_failure', 'critical', 'Distribution metadata reports an output failure.');
    if (context.security?.warning)
      addRisk('security_warning', 'critical', 'Security runtime metadata reports a warning.');
    if (context.automation?.conflict)
      addRisk('automation_conflict', 'high', 'Automation metadata reports cue conflicts.');
    if (context.cluster?.failure)
      addRisk('cluster_failure', 'critical', 'Cluster metadata reports node failure.');
    opts.push(
      {
        type: 'scene_flow',
        impact: 'normal',
        reason: 'Compare preview and program to reduce operator switching workload.',
        metadataOnly: true,
      },
      {
        type: 'output_reliability',
        impact: context.distribution?.outputFailure ? 'critical' : 'normal',
        reason: 'Keep distribution routes and health visible before program changes.',
        metadataOnly: true,
      },
      {
        type: 'operator_workload',
        impact: risks.length > 2 ? 'high' : 'normal',
        reason: 'Group related recommendations by subsystem.',
        metadataOnly: true,
      },
    );
    return {
      id: id('analysis'),
      scenario: context.program ? 'live_show' : 'pre_show',
      objectives: [
        {
          id: 'obj-safe-show',
          label: 'Maintain operator-approved production flow',
          priority: 'critical',
          metadataOnly: true,
        },
      ],
      risks,
      optimizations: opts,
      timeline: {
        ...(context.program ? { currentSegment: context.program } : {}),
        ...(context.preview ? { nextSegment: context.preview } : {}),
        predictions: risks.map((r) => ({
          id: id('prediction'),
          label: r.reason,
          confidence: r.severity === 'critical' ? 'high' : 'medium',
          horizonSeconds: 60,
          metadataOnly: true,
        })),
        metadataOnly: true,
      },
      insights: [
        {
          id: id('insight'),
          title: 'Metadata-only AI Director',
          detail: 'No model scoring or direct command execution are enabled.',
          category: 'state',
          metadataOnly: true,
        },
      ],
      metadataOnly: true,
    };
  }
  recommend(analysis: ProductionAnalysis, context: ProductionContext): ProductionRecommendation[] {
    this.validator.validate({ analysis, context });
    const recs: ProductionRecommendation[] = [];
    const add = (
      type: RecommendationType,
      title: string,
      priority: RecommendationPriority,
      confidence: RecommendationConfidence,
      reason: string,
    ) =>
      recs.push({
        id: id('rec'),
        type,
        title,
        description: reason,
        priority,
        confidence,
        reasons: [
          {
            code: type,
            message: reason,
            source: 'deterministic-metadata-rule',
            metadataOnly: true,
          },
        ],
        lifecycle: 'pending_approval',
        policy: {
          operatorApprovalRequired: true,
          autonomousExecutionAllowed: false,
          metadataOnly: true,
        },
        dependencies: [],
        createdAt: now(),
        metadataOnly: true,
      });
    if (context.preview && context.preview !== context.program)
      add(
        'prepare_scene',
        `Prepare ${context.preview}`,
        'normal',
        'high',
        'Preview differs from program and is ready for operator review.',
      );
    for (const risk of analysis.risks) {
      const map: Partial<Record<ProductionRisk, RecommendationType>> = {
        guest_offline: 'notify_operator',
        audio_issue: 'adjust_audio',
        output_failure: 'recover_failure',
        storage_low: 'archive_recording',
        automation_conflict: 'pause_automation',
        security_warning: 'notify_operator',
        cluster_failure: 'notify_operator',
        media_missing: 'queue_media',
        graphics_missing: 'load_graphics',
        dropped_frames: 'optimize_resources',
      };
      add(
        map[risk.type] ?? 'notify_operator',
        `Review ${risk.type.replace(/_/gu, ' ')}`,
        risk.severity,
        risk.severity === 'normal' ? 'medium' : 'high',
        risk.reason,
      );
    }
    return this.order(recs);
  }
  order(recs: ProductionRecommendation[]) {
    const rank: Record<RecommendationPriority, number> = {
      emergency: 5,
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    return [...recs].sort((a, b) => rank[b.priority] - rank[a.priority]);
  }
  metrics(
    recommendations: ProductionRecommendation[],
    analysis: ProductionAnalysis,
  ): RecommendationMetrics {
    const byPriority = { low: 0, normal: 0, high: 0, critical: 0, emergency: 0 };
    const byConfidence = { very_low: 0, low: 0, medium: 0, high: 0, very_high: 0 };
    for (const r of recommendations) {
      byPriority[r.priority]++;
      byConfidence[r.confidence]++;
    }
    return {
      total: recommendations.length,
      pendingApprovals: recommendations.filter((r) => r.lifecycle === 'pending_approval').length,
      byPriority,
      byConfidence,
      riskCount: analysis.risks.length,
      optimizationCount: analysis.optimizations.length,
      metadataOnly: true,
    };
  }
}
export class AIDirectorSession {
  history: RecommendationHistory = { events: [], metadataOnly: true };
  approvals: RecommendationApproval[] = [];
  snapshots: RecommendationSnapshot[] = [];
  constructor(public runtime = new AIDirectorRuntime()) {}
  createDashboard(context: ProductionContext): AIDirectorDashboard {
    const analysis = this.runtime.analyze(context);
    const recommendations = this.runtime.recommend(analysis, context);
    return {
      analysis,
      queue: { items: recommendations, metadataOnly: true },
      metrics: this.runtime.metrics(recommendations, analysis),
      approvals: this.approvals,
      history: this.history,
      snapshots: this.snapshots,
      metadataOnly: true,
    };
  }
  decide(decision: OperatorDecision): RecommendationApproval {
    const approval: RecommendationApproval = {
      id: id('approval'),
      recommendationId: decision.recommendationId,
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      operatorId: decision.operatorId,
      decidedAt: now(),
      metadataOnly: true,
    };
    this.approvals.push(approval);
    return approval;
  }
  snapshot(recommendations: ProductionRecommendation[]): RecommendationSnapshot {
    const snap = {
      id: id('snapshot'),
      recommendations: JSON.parse(JSON.stringify(recommendations)) as ProductionRecommendation[],
      approvals: [...this.approvals],
      at: now(),
      metadataOnly: true as const,
    };
    this.snapshots.push(snap);
    return snap;
  }
}
export function createAIDirectorContext(
  input: Omit<ProductionContext, 'metadataOnly'> = {},
): ProductionContext {
  return { ...input, metadataOnly: true };
}

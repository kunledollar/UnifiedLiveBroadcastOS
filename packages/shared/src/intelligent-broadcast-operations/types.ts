import type { ProductionCommand, ProductionCommandType, ProductionGraph, StableId } from '../production-graph.js';

export type AgentLifecycleState = 'registered' | 'enabled' | 'disabled' | 'error';
export type AgentCapability =
  | 'active-speaker-detection' | 'scene-recommendation' | 'camera-framing' | 'layout-recommendation' | 'idle-scene-detection' | 'transition-suggestion' | 'guest-spotlight'
  | 'audio-level-analysis' | 'clipping-detection' | 'silence-detection' | 'noise-detection' | 'echo-detection' | 'music-ducking'
  | 'lower-third-suggestion' | 'title-update' | 'sponsor-card' | 'qr-code' | 'timer' | 'overlay-trigger'
  | 'schedule-monitoring' | 'break-suggestion' | 'checklist-monitoring' | 'show-progress'
  | 'spam-detection' | 'abuse-detection' | 'question-highlighting' | 'faq-detection'
  | 'captioning' | 'translation' | 'clip-suggestion' | 'analytics';
export type AgentSubscription = 'production-graph' | 'audio-levels' | 'guests' | 'agenda' | 'timeline' | 'chat' | 'captions' | 'engagement' | 'health';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'ignored';
export type IBOAutomationMode = 'manual' | 'supervised' | 'auto-director';

export interface AgentDefinition {
  id: StableId; name: string; version: string; capabilities: AgentCapability[]; subscriptions: AgentSubscription[];
  emittedCommands: ProductionCommandType[]; emittedSuggestions: string[];
}
export interface AgentRuntimeState { definition: AgentDefinition; lifecycle: AgentLifecycleState; enabled: boolean; lastObservedAt?: string; suggestionCount: number; acceptedCount: number; rejectedCount: number; averageConfidence: number; metadata: Record<string, unknown>; }
export interface AgentObservationContext { graph: ProductionGraph; mode: IBOAutomationMode; timestamp: string; audio?: Record<string, unknown>; chatMessages?: Array<{ id: string; author: string; text: string; timestamp: string }>; timeline?: Record<string, unknown>; metadata?: Record<string, unknown>; }
export interface AgentSuggestion { id: StableId; agentId: StableId; agentName: string; title: string; recommendation: string; confidence: number; reasoning: Record<string, unknown>; createdAt: string; status: SuggestionStatus; targetType: string; targetId: string; command?: ProductionCommand; auditTrail: Array<{ at: string; action: string; actorId: string; note?: string }>; }
export interface BroadcastAgent { definition: AgentDefinition; observe(context: AgentObservationContext): AgentSuggestion[]; }
export interface AIProviderRequest { providerId: string; capability: AgentCapability; prompt: string; context: Record<string, unknown>; }
export interface AIProviderResponse { text: string; confidence?: number; metadata: Record<string, unknown>; }
export interface AIProvider { id: string; name: string; supports: AgentCapability[]; complete(request: AIProviderRequest): Promise<AIProviderResponse>; }
export interface AutomationRule { id: StableId; name: string; enabled: boolean; trigger: string; condition: Record<string, unknown>; commandTemplate: Pick<ProductionCommand, 'type' | 'payload'>; createdBy: StableId; }
export interface AnalyticsInsight { id: string; label: string; score: number; status: 'good' | 'warning' | 'critical'; rationale: string; }

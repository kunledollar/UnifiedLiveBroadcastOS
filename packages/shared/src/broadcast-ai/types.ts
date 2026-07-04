export type AIAssistantStatus = 'disabled' | 'idle' | 'analyzing' | 'unavailable';

export type AIAssistantMode = 'advisory' | 'supervised' | 'automatic_disabled';

export type AIRecommendationType =
  | 'scene'
  | 'graphics'
  | 'audio'
  | 'media'
  | 'guest'
  | 'replay'
  | 'automation'
  | 'risk'
  | 'highlight';

export type AIRecommendationStatus = 'suggested' | 'accepted' | 'dismissed' | 'unavailable';

export type AIRiskSeverity = 'info' | 'warning' | 'critical';

export type AITargetType =
  | 'scene'
  | 'graphics'
  | 'audio'
  | 'media'
  | 'guest'
  | 'replay'
  | 'automation'
  | 'output'
  | 'segment';

export interface AIAssistantState {
  status: AIAssistantStatus;
  mode: AIAssistantMode;
  lastUpdated: string;
  containsRuntimeHandles: false;
}

export interface AIRecommendation {
  id: string;
  type: AIRecommendationType;
  title: string;
  description: string;
  confidence: number;
  riskLevel: AIRiskSeverity;
  targetType: AITargetType;
  targetId: string;
  requiresApproval: true;
  status: AIRecommendationStatus;
}

export interface AIRiskSignal {
  id: string;
  severity: AIRiskSeverity;
  message: string;
  targetType: AITargetType;
  targetId: string;
  suggestedAction?: string;
}

export interface AIAssistantManifest {
  assistant: AIAssistantState;
  recommendations: AIRecommendation[];
  riskSignals: AIRiskSignal[];
  containsRuntimeHandles: false;
}

export const AI_COMMAND_STUBS = [
  'SET_ASSISTANT_MODE',
  'ACCEPT_RECOMMENDATION',
  'DISMISS_RECOMMENDATION',
  'ACKNOWLEDGE_RISK',
  'REQUEST_ANALYSIS',
] as const;

export type AICommandStub = (typeof AI_COMMAND_STUBS)[number];

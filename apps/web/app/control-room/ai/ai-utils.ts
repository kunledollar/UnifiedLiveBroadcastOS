import type {
  AIAssistantMode,
  AIAssistantState,
  AIAssistantStatus,
  AIRecommendation,
  AIRecommendationStatus,
  AIRiskSeverity,
  AIRiskSignal,
} from '@ubos/shared';

export function aiStatusLabel(assistant: AIAssistantState): string {
  if (assistant.status === 'disabled') return 'AI Disabled';
  if (assistant.status === 'unavailable') return 'AI Unavailable';
  if (assistant.status === 'analyzing') return 'AI Advisory';
  if (assistant.mode === 'advisory') return 'AI Advisory';
  return 'AI Idle';
}

export function aiStatusVariant(
  status: AIAssistantStatus,
): 'offline' | 'neutral' | 'warning' | 'success' {
  switch (status) {
    case 'disabled':
    case 'unavailable':
      return 'offline';
    case 'analyzing':
      return 'warning';
    case 'idle':
      return 'success';
    default:
      return 'neutral';
  }
}

export function aiModeLabel(mode: AIAssistantMode): string {
  switch (mode) {
    case 'advisory':
      return 'Advisory';
    case 'supervised':
      return 'Supervised';
    case 'automatic_disabled':
      return 'Automatic disabled';
    default:
      return mode;
  }
}

export function confidenceLabel(confidence: number): string {
  if (!Number.isFinite(confidence)) return 'unavailable';
  return `${Math.round(confidence * 100)}%`;
}

export function riskSeverityVariant(
  severity: AIRiskSeverity,
): 'neutral' | 'warning' | 'live' {
  switch (severity) {
    case 'critical':
      return 'live';
    case 'warning':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function recommendationStatusVariant(
  status: AIRecommendationStatus,
): 'neutral' | 'success' | 'warning' | 'offline' {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'dismissed':
      return 'offline';
    case 'unavailable':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getSuggestedRecommendations(recommendations: AIRecommendation[]): AIRecommendation[] {
  return recommendations.filter((recommendation) => recommendation.status === 'suggested');
}

export function getCriticalRiskSignals(signals: AIRiskSignal[]): AIRiskSignal[] {
  return signals.filter((signal) => signal.severity === 'critical' || signal.severity === 'warning');
}

export function getProductionSummaryLines(input: {
  programSceneName?: string;
  previewSceneName?: string;
  guestCount?: number;
  automationSegmentName?: string;
  riskCount?: number;
  recommendationCount?: number;
}): string[] {
  const lines: string[] = [];
  if (input.programSceneName) lines.push(`Program: ${input.programSceneName}`);
  if (input.previewSceneName) lines.push(`Preview: ${input.previewSceneName}`);
  if (input.guestCount !== undefined) lines.push(`Guests: ${input.guestCount}`);
  if (input.automationSegmentName) lines.push(`Rundown: ${input.automationSegmentName}`);
  if (input.riskCount !== undefined) lines.push(`Active risks: ${input.riskCount}`);
  if (input.recommendationCount !== undefined) {
    lines.push(`Open recommendations: ${input.recommendationCount}`);
  }
  return lines;
}

import type { AIAssistantState, AIRecommendation, AIRiskSignal } from './types.js';

const RUNTIME_HANDLE_KEYS = [
  'stream',
  'timer',
  'interval',
  'timeout',
  'canvas',
  'element',
  'ref',
  'blob',
  'mediastream',
  'webrtc',
  'process',
  'llm',
  'model',
  'inference',
] as const;

export type AIValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function aiMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): AIValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = aiMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
      if (nested) return nested;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (RUNTIME_HANDLE_KEYS.some((handle) => lowerKey.includes(handle))) {
      return {
        code: 'RUNTIME_HANDLE_REJECTED',
        message: `Runtime handle key "${key}" is not allowed in ${path}.`,
        field: `${path}.${key}`,
      };
    }
    const child = aiMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function sanitizeAIText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

export function validateAIRecommendation(
  recommendation: AIRecommendation,
  recommendations: AIRecommendation[],
): AIValidationIssue[] {
  const issues: AIValidationIssue[] = [];
  if (recommendations.some((item) => item.id === recommendation.id && item !== recommendation)) {
    issues.push({ code: 'DUPLICATE_RECOMMENDATION_ID', message: 'Recommendation id must be unique.' });
  }
  if (!recommendation.title.trim()) {
    issues.push({ code: 'MISSING_TITLE', message: 'Recommendation title is required.' });
  }
  const sanitizedTitle = sanitizeAIText(recommendation.title);
  const sanitizedDescription = sanitizeAIText(recommendation.description);
  if (sanitizedTitle !== recommendation.title || sanitizedDescription !== recommendation.description) {
    issues.push({ code: 'UNSAFE_HTML', message: 'Recommendation text cannot contain unsafe HTML.' });
  }
  if (!recommendation.requiresApproval) {
    issues.push({
      code: 'APPROVAL_REQUIRED',
      message: 'All AI recommendations must require operator approval.',
    });
  }
  if (!Number.isFinite(recommendation.confidence) || recommendation.confidence < 0 || recommendation.confidence > 1) {
    issues.push({ code: 'INVALID_CONFIDENCE', message: 'Confidence must be between 0 and 1.' });
  }
  return issues;
}

export function validateAIRiskSignal(signal: AIRiskSignal): AIValidationIssue[] {
  const issues: AIValidationIssue[] = [];
  if (!signal.message.trim()) {
    issues.push({ code: 'MISSING_RISK_MESSAGE', message: 'Risk signal message is required.' });
  }
  const sanitized = sanitizeAIText(signal.message);
  if (sanitized !== signal.message) {
    issues.push({ code: 'UNSAFE_HTML', message: 'Risk signal text cannot contain unsafe HTML.' });
  }
  if (signal.suggestedAction) {
    const sanitizedAction = sanitizeAIText(signal.suggestedAction);
    if (sanitizedAction !== signal.suggestedAction) {
      issues.push({ code: 'UNSAFE_ACTION_HTML', message: 'Suggested action cannot contain unsafe HTML.' });
    }
  }
  return issues;
}

export function validateAIAssistantState(state: AIAssistantState): AIValidationIssue[] {
  const issues: AIValidationIssue[] = [];
  if (state.containsRuntimeHandles !== false) {
    issues.push({ code: 'RUNTIME_HANDLES_FORBIDDEN', message: 'AI assistant state cannot contain runtime handles.' });
  }
  if (state.mode === 'automatic_disabled' && state.status === 'analyzing') {
    issues.push({
      code: 'AUTONOMOUS_DISABLED',
      message: 'Automatic execution is disabled; analysis must remain advisory.',
    });
  }
  return issues;
}

export function validateAIAssistantManifest(manifest: {
  assistant: AIAssistantState;
  recommendations: AIRecommendation[];
  riskSignals: AIRiskSignal[];
}): AIValidationIssue[] {
  const issues: AIValidationIssue[] = [];
  issues.push(...validateAIAssistantState(manifest.assistant));
  for (const recommendation of manifest.recommendations) {
    issues.push(...validateAIRecommendation(recommendation, manifest.recommendations));
  }
  for (const signal of manifest.riskSignals) {
    issues.push(...validateAIRiskSignal(signal));
  }
  return issues;
}

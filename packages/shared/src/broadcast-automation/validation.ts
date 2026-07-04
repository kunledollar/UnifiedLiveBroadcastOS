import type {
  AutomationMacro,
  ProductionCue,
  RunOfShow,
  ShowSegment,
} from './types.js';

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
] as const;

export type AutomationValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function automationMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): AutomationValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = automationMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
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
    const child = automationMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function sanitizeAutomationText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

export function validateAutomationDurationMs(
  durationMs: number,
): AutomationValidationIssue | null {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return { code: 'INVALID_DURATION', message: 'Duration cannot be negative.', field: 'durationMs' };
  }
  return null;
}

export function validateProductionCue(
  cue: ProductionCue,
  cues: ProductionCue[],
): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];
  if (cues.some((item) => item.id === cue.id && item !== cue)) {
    issues.push({ code: 'DUPLICATE_CUE_ID', message: 'Cue id must be unique.' });
  }
  const durationIssue = validateAutomationDurationMs(cue.offsetMs);
  if (durationIssue) issues.push(durationIssue);
  if (cue.timing === 'countdown' && cue.offsetMs <= 0) {
    issues.push({ code: 'INVALID_COUNTDOWN', message: 'Countdown cues require positive offset.' });
  }
  if (!cue.safeForAuto && !cue.requiresConfirmation && cue.timing !== 'manual') {
    issues.push({
      code: 'UNSAFE_AUTO_CUE',
      message: 'Automatic cues must be explicitly marked safe or require confirmation.',
    });
  }
  const runtimeIssue = automationMetadataContainsRuntimeHandle(cue.metadata);
  if (runtimeIssue) issues.push(runtimeIssue);
  return issues;
}

export function validateShowSegment(
  segment: ShowSegment,
  segments: ShowSegment[],
): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];
  if (segments.some((item) => item.id === segment.id && item !== segment)) {
    issues.push({ code: 'DUPLICATE_SEGMENT_ID', message: 'Segment id must be unique.' });
  }
  if (segments.some((item) => item.order === segment.order && item.id !== segment.id)) {
    issues.push({ code: 'DUPLICATE_SEGMENT_ORDER', message: 'Segment order must be unique.' });
  }
  const durationIssue = validateAutomationDurationMs(segment.durationMs);
  if (durationIssue) issues.push(durationIssue);
  if (segment.notes) {
    const sanitized = sanitizeAutomationText(segment.notes);
    if (sanitized !== segment.notes) {
      issues.push({ code: 'UNSAFE_NOTES_HTML', message: 'Segment notes cannot contain unsafe HTML.' });
    }
  }
  for (const cue of segment.cues) {
    issues.push(...validateProductionCue(cue, segment.cues));
  }
  return issues;
}

export function validateRunOfShow(runOfShow: RunOfShow): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];
  const durationIssue = validateAutomationDurationMs(runOfShow.estimatedDurationMs);
  if (durationIssue) issues.push(durationIssue);
  for (const segment of runOfShow.segments) {
    issues.push(...validateShowSegment(segment, runOfShow.segments));
  }
  if (
    runOfShow.currentSegmentId &&
    !runOfShow.segments.some((segment) => segment.id === runOfShow.currentSegmentId)
  ) {
    issues.push({ code: 'UNKNOWN_CURRENT_SEGMENT', message: 'Current segment reference is missing.' });
  }
  return issues;
}

export function validateAutomationMacro(macro: AutomationMacro): AutomationValidationIssue[] {
  const issues: AutomationValidationIssue[] = [];
  if (!macro.name.trim()) issues.push({ code: 'MISSING_MACRO_NAME', message: 'Macro name is required.' });
  if (macro.mode === 'automatic' && macro.steps.some((step) => !step.safeForAuto)) {
    issues.push({
      code: 'UNSAFE_MACRO_AUTO',
      message: 'Automatic macros cannot include unsafe steps.',
    });
  }
  return issues;
}

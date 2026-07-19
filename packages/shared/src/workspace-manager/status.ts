import type { WorkspaceDefinition } from './types.js';
export type WorkspaceStatusValue =
  'Healthy' | 'Warning' | 'Critical' | 'Available' | 'Unavailable' | 'Not configured';
export type ResolvedWorkspaceStatus = {
  label: string;
  value: WorkspaceStatusValue;
  tone: 'good' | 'warning' | 'critical' | 'muted';
};
/** Honest fallback resolver. Runtime integrations may override supported labels. */
export function resolveWorkspaceStatus(
  definition: WorkspaceDefinition,
  available: Partial<Record<string, ResolvedWorkspaceStatus>> = {},
): ResolvedWorkspaceStatus[] {
  return definition.statusIndicators.map(
    (label) => available[label] ?? { label, value: 'Unavailable', tone: 'muted' },
  );
}

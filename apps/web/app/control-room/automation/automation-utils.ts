import type {
  AutomationMode,
  ProductionCue,
  RunOfShow,
  ShowSegment,
} from '@ubos/shared';

export function formatDurationMs(durationMs?: number): string {
  if (durationMs === undefined || !Number.isFinite(durationMs)) return 'unavailable';
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function automationModeLabel(mode: AutomationMode): string {
  switch (mode) {
    case 'semi_auto':
      return 'Semi-Auto';
    case 'automatic':
      return 'Auto';
    default:
      return 'Manual';
  }
}

export function segmentStatusVariant(
  status: ShowSegment['status'],
): 'live' | 'preview' | 'success' | 'warning' | 'offline' | 'neutral' {
  switch (status) {
    case 'active':
      return 'live';
    case 'completed':
      return 'success';
    case 'skipped':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function cueStatusVariant(
  status: ProductionCue['status'],
): 'live' | 'preview' | 'success' | 'warning' | 'offline' | 'neutral' {
  switch (status) {
    case 'armed':
      return 'preview';
    case 'executed':
      return 'success';
    case 'failed':
      return 'offline';
    case 'skipped':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getCurrentSegment(runOfShow: RunOfShow): ShowSegment | null {
  if (!runOfShow.currentSegmentId) return null;
  return runOfShow.segments.find((segment) => segment.id === runOfShow.currentSegmentId) ?? null;
}

export function getNextSegment(runOfShow: RunOfShow): ShowSegment | null {
  if (!runOfShow.nextSegmentId) return null;
  return runOfShow.segments.find((segment) => segment.id === runOfShow.nextSegmentId) ?? null;
}

export function getRemainingDurationMs(runOfShow: RunOfShow): number {
  const current = getCurrentSegment(runOfShow);
  if (!current) return runOfShow.estimatedDurationMs;
  const currentIndex = runOfShow.segments.findIndex((segment) => segment.id === current.id);
  if (currentIndex < 0) return 0;
  return runOfShow.segments.slice(currentIndex).reduce((sum, segment) => sum + segment.durationMs, 0);
}

export function getAllCues(runOfShow: RunOfShow): ProductionCue[] {
  return runOfShow.segments.flatMap((segment) => segment.cues);
}

export function getSegmentCueCount(segment: ShowSegment): number {
  return segment.cues.length;
}

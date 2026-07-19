import type {
  AutomationMacro,
  AutomationManifest,
  AutomationMode,
  ProductionCue,
  RunOfShow,
  ShowSegment,
  ShowSegmentType,
} from './types.js';

export function createDefaultRunOfShow(
  name = 'Show Rundown',
  options: { id?: string; updatedAt?: string } = {},
): RunOfShow {
  const now = options.updatedAt ?? new Date().toISOString();
  const segmentDefs: Array<{ name: string; type: ShowSegmentType; durationMs: number }> = [
    { name: 'Opening', type: 'opening', durationMs: 30_000 },
    { name: 'Countdown', type: 'countdown', durationMs: 10_000 },
    { name: 'Intro', type: 'intro', durationMs: 60_000 },
    { name: 'Guest 1', type: 'guest', durationMs: 300_000 },
    { name: 'Video', type: 'media', durationMs: 90_000 },
    { name: 'Sponsor', type: 'sponsor', durationMs: 30_000 },
    { name: 'Guest 2', type: 'guest', durationMs: 300_000 },
    { name: 'Replay', type: 'replay', durationMs: 45_000 },
    { name: 'Closing', type: 'closing', durationMs: 60_000 },
  ];

  const segments: ShowSegment[] = segmentDefs.map((def, index) => ({
    id: `segment-${index + 1}`,
    name: def.name,
    type: def.type,
    durationMs: def.durationMs,
    status: index === 0 ? 'active' : 'pending',
    order: index + 1,
    cues: [],
  }));

  const estimatedDurationMs = segments.reduce((sum, segment) => sum + segment.durationMs, 0);

  return {
    id: options.id ?? `ros-${Date.now()}`,
    name,
    status: 'draft',
    segments,
    ...(segments[0]?.id ? { currentSegmentId: segments[0].id } : {}),
    ...(segments[1]?.id ? { nextSegmentId: segments[1].id } : {}),
    estimatedDurationMs,
    updatedAt: now,
  };
}

export function createAutomationManifest(input: {
  runOfShow: RunOfShow;
  macros?: AutomationMacro[];
  automationMode?: AutomationMode;
}): AutomationManifest {
  const cues = input.runOfShow.segments.flatMap((segment) => segment.cues);
  return {
    runOfShow: input.runOfShow,
    macros: input.macros ?? [],
    cues,
    automationMode: input.automationMode ?? 'manual',
    containsRuntimeHandles: false,
  };
}

export function isAutomationManifestReplaySafe(manifest: AutomationManifest): boolean {
  return manifest.containsRuntimeHandles === false;
}

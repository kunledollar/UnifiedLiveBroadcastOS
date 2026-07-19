import type { AutomationMacro, ProductionCue, RunOfShow } from '@ubos/shared';

export function enrichRunOfShowWithSampleCues(
  runOfShow: RunOfShow,
  updatedAt = runOfShow.updatedAt,
): RunOfShow {
  const cueTemplates: Record<string, ProductionCue[]> = {
    intro: [
      {
        id: 'cue-intro-scene',
        segmentId: 'segment-3',
        name: 'Take intro scene',
        type: 'scene',
        targetType: 'scene',
        targetId: 'intro',
        timing: 'at_segment_start',
        offsetMs: 0,
        status: 'pending',
        requiresConfirmation: true,
        safeForAuto: false,
      },
      {
        id: 'cue-intro-graphics',
        segmentId: 'segment-3',
        name: 'Show show logo',
        type: 'graphics',
        targetType: 'graphics',
        targetId: 'show-logo',
        timing: 'offset',
        offsetMs: 2000,
        status: 'pending',
        requiresConfirmation: false,
        safeForAuto: true,
      },
    ],
    media: [
      {
        id: 'cue-media-play',
        segmentId: 'segment-5',
        name: 'Play segment video',
        type: 'media',
        targetType: 'media',
        targetId: 'segment-video',
        timing: 'manual',
        offsetMs: 0,
        status: 'pending',
        requiresConfirmation: true,
        safeForAuto: false,
      },
    ],
    replay: [
      {
        id: 'cue-replay-clip',
        segmentId: 'segment-8',
        name: 'Stage replay clip',
        type: 'replay',
        targetType: 'replay',
        targetId: 'highlight-1',
        timing: 'countdown',
        offsetMs: 5000,
        status: 'pending',
        requiresConfirmation: true,
        safeForAuto: false,
      },
    ],
  };

  const segments = runOfShow.segments.map((segment) => ({
    ...segment,
    cues: cueTemplates[segment.type] ?? segment.cues,
  }));

  return { ...runOfShow, segments, updatedAt };
}

export function createSampleMacros(): AutomationMacro[] {
  return [
    {
      id: 'macro-open-show',
      name: 'Open Show',
      description: 'Intro scene and show logo graphics',
      mode: 'semi_auto',
      status: 'ready',
      containsRuntimeHandles: false,
      steps: [
        {
          id: 'step-intro-scene',
          label: 'Take intro scene',
          cueType: 'scene',
          targetType: 'scene',
          targetId: 'intro',
          requiresConfirmation: true,
          safeForAuto: false,
        },
        {
          id: 'step-show-logo',
          label: 'Show logo lower third',
          cueType: 'graphics',
          targetType: 'graphics',
          targetId: 'show-logo',
          requiresConfirmation: false,
          safeForAuto: true,
        },
      ],
    },
    {
      id: 'macro-break-package',
      name: 'Break Package',
      description: 'Sponsor bumper and break slate',
      mode: 'manual',
      status: 'draft',
      containsRuntimeHandles: false,
      steps: [
        {
          id: 'step-sponsor-media',
          label: 'Play sponsor bumper',
          cueType: 'media',
          targetType: 'media',
          targetId: 'sponsor-bumper',
          requiresConfirmation: true,
          safeForAuto: false,
        },
        {
          id: 'step-break-slate',
          label: 'Show break slate',
          cueType: 'graphics',
          targetType: 'graphics',
          targetId: 'break-slate',
          requiresConfirmation: true,
          safeForAuto: false,
        },
      ],
    },
    {
      id: 'macro-close-show',
      name: 'Close Show',
      description: 'Closing scene and output fade',
      mode: 'automatic',
      status: 'disabled',
      containsRuntimeHandles: false,
      steps: [
        {
          id: 'step-closing-scene',
          label: 'Take closing scene',
          cueType: 'scene',
          targetType: 'scene',
          targetId: 'closing',
          requiresConfirmation: false,
          safeForAuto: true,
        },
        {
          id: 'step-output-fade',
          label: 'Fade program output',
          cueType: 'output',
          targetType: 'output',
          targetId: 'program-output',
          requiresConfirmation: true,
          safeForAuto: false,
        },
      ],
    },
  ];
}

export type RunOfShowStatus = 'draft' | 'ready' | 'active' | 'paused' | 'completed';

export type ShowSegmentType =
  | 'opening'
  | 'countdown'
  | 'intro'
  | 'guest'
  | 'media'
  | 'graphics'
  | 'replay'
  | 'sponsor'
  | 'break'
  | 'closing'
  | 'custom';

export type ShowSegmentStatus = 'pending' | 'active' | 'completed' | 'skipped';

export type ProductionCueType =
  | 'scene'
  | 'graphics'
  | 'media'
  | 'replay'
  | 'audio'
  | 'output'
  | 'note'
  | 'wait'
  | 'manual';

export type CueTimingMode = 'manual' | 'at_segment_start' | 'offset' | 'countdown';

export type ProductionCueStatus = 'pending' | 'armed' | 'executed' | 'skipped' | 'failed';

export type AutomationMode = 'manual' | 'semi_auto' | 'automatic';

export type MacroStatus = 'draft' | 'ready' | 'disabled';

export type CueTargetType =
  | 'scene'
  | 'graphics'
  | 'media'
  | 'replay'
  | 'audio'
  | 'output'
  | 'note';

export interface ProductionCue {
  id: string;
  segmentId: string;
  name: string;
  type: ProductionCueType;
  targetType: CueTargetType;
  targetId: string;
  timing: CueTimingMode;
  offsetMs: number;
  status: ProductionCueStatus;
  requiresConfirmation: boolean;
  safeForAuto: boolean;
  metadata?: Record<string, unknown>;
}

export interface ShowSegment {
  id: string;
  name: string;
  type: ShowSegmentType;
  durationMs: number;
  status: ShowSegmentStatus;
  notes?: string;
  cues: ProductionCue[];
  order: number;
}

export interface RunOfShow {
  id: string;
  name: string;
  status: RunOfShowStatus;
  segments: ShowSegment[];
  currentSegmentId?: string;
  nextSegmentId?: string;
  estimatedDurationMs: number;
  startedAt?: string;
  updatedAt: string;
}

export interface AutomationMacroStep {
  id: string;
  label: string;
  cueType: ProductionCueType;
  targetType: CueTargetType;
  targetId: string;
  requiresConfirmation: boolean;
  safeForAuto: boolean;
}

export interface AutomationMacro {
  id: string;
  name: string;
  description?: string;
  steps: AutomationMacroStep[];
  mode: AutomationMode;
  status: MacroStatus;
  containsRuntimeHandles: false;
}

export interface AutomationManifest {
  runOfShow: RunOfShow;
  macros: AutomationMacro[];
  cues: ProductionCue[];
  automationMode: AutomationMode;
  containsRuntimeHandles: false;
}

export const AUTOMATION_COMMAND_STUBS = [
  'CREATE_RUN_OF_SHOW',
  'UPDATE_RUN_OF_SHOW',
  'ACTIVATE_SEGMENT',
  'SKIP_SEGMENT',
  'ARM_CUE',
  'EXECUTE_CUE',
  'SKIP_CUE',
  'ARM_MACRO',
  'SET_AUTOMATION_MODE',
] as const;

export type AutomationCommandStub = (typeof AUTOMATION_COMMAND_STUBS)[number];

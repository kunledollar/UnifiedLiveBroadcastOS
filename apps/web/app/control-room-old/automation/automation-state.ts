import type {
  AutomationMacro,
  AutomationMode,
  ProductionCue,
  RunOfShow,
  ShowSegment,
} from '@ubos/shared';
import { createAutomationCommandIntent } from '@ubos/shared';

export type AutomationState = {
  runOfShow: RunOfShow;
  macros: AutomationMacro[];
  automationMode: AutomationMode;
  selectedSegmentId: string | null;
  selectedCueId: string | null;
  commandLog: ReturnType<typeof createAutomationCommandIntent>[];
};

export type AutomationAction =
  | { type: 'SET_RUN_OF_SHOW'; runOfShow: RunOfShow }
  | { type: 'SET_AUTOMATION_MODE'; mode: AutomationMode }
  | { type: 'SELECT_SEGMENT'; segmentId: string | null }
  | { type: 'SELECT_CUE'; cueId: string | null }
  | { type: 'ACTIVATE_SEGMENT'; segmentId: string }
  | { type: 'SKIP_SEGMENT'; segmentId: string }
  | { type: 'ARM_CUE'; cueId: string }
  | { type: 'EXECUTE_CUE'; cueId: string }
  | { type: 'SKIP_CUE'; cueId: string }
  | { type: 'ARM_MACRO'; macroId: string }
  | { type: 'DISABLE_MACRO'; macroId: string };

function updateSegments(
  runOfShow: RunOfShow,
  updater: (segments: ShowSegment[]) => ShowSegment[],
): RunOfShow {
  const segments = updater(runOfShow.segments);
  const current = segments.find((segment) => segment.status === 'active');
  const currentIndex = current ? segments.findIndex((segment) => segment.id === current.id) : -1;
  const next = currentIndex >= 0 ? segments[currentIndex + 1] : segments[0];
  return {
    ...runOfShow,
    segments,
    ...(current?.id ? { currentSegmentId: current.id } : {}),
    ...(next?.id ? { nextSegmentId: next.id } : {}),
    estimatedDurationMs: segments.reduce((sum, segment) => sum + segment.durationMs, 0),
    updatedAt: new Date().toISOString(),
  };
}

function updateCueInSegments(
  segments: ShowSegment[],
  cueId: string,
  updater: (cue: ProductionCue) => ProductionCue,
): ShowSegment[] {
  return segments.map((segment) => ({
    ...segment,
    cues: segment.cues.map((cue) => (cue.id === cueId ? updater(cue) : cue)),
  }));
}

export function createInitialAutomationState(
  runOfShow: RunOfShow,
  macros: AutomationMacro[] = [],
): AutomationState {
  return {
    runOfShow,
    macros,
    automationMode: 'manual',
    selectedSegmentId: runOfShow.currentSegmentId ?? null,
    selectedCueId: null,
    commandLog: [],
  };
}

export function automationReducer(state: AutomationState, action: AutomationAction): AutomationState {
  const appendCommand = (command: ReturnType<typeof createAutomationCommandIntent>) => ({
    commandLog: [command, ...state.commandLog].slice(0, 50),
  });

  switch (action.type) {
    case 'SET_RUN_OF_SHOW':
      return { ...state, runOfShow: action.runOfShow };
    case 'SET_AUTOMATION_MODE':
      return {
        ...state,
        automationMode: action.mode,
        ...appendCommand(createAutomationCommandIntent('SET_AUTOMATION_MODE', { mode: action.mode })),
      };
    case 'SELECT_SEGMENT':
      return { ...state, selectedSegmentId: action.segmentId, selectedCueId: null };
    case 'SELECT_CUE':
      return { ...state, selectedCueId: action.cueId };
    case 'ACTIVATE_SEGMENT':
      return {
        ...state,
        runOfShow: updateSegments(state.runOfShow, (segments) =>
          segments.map((segment) => ({
            ...segment,
            status:
              segment.id === action.segmentId
                ? 'active'
                : segment.status === 'active'
                  ? 'completed'
                  : segment.status,
          })),
        ),
        selectedSegmentId: action.segmentId,
        ...appendCommand(createAutomationCommandIntent('ACTIVATE_SEGMENT', { segmentId: action.segmentId })),
      };
    case 'SKIP_SEGMENT':
      return {
        ...state,
        runOfShow: updateSegments(state.runOfShow, (segments) =>
          segments.map((segment) =>
            segment.id === action.segmentId ? { ...segment, status: 'skipped' as const } : segment,
          ),
        ),
        ...appendCommand(createAutomationCommandIntent('SKIP_SEGMENT', { segmentId: action.segmentId })),
      };
    case 'ARM_CUE':
      return {
        ...state,
        runOfShow: {
          ...state.runOfShow,
          segments: updateCueInSegments(state.runOfShow.segments, action.cueId, (cue) => ({
            ...cue,
            status: 'armed' as const,
          })),
          updatedAt: new Date().toISOString(),
        },
        ...appendCommand(createAutomationCommandIntent('ARM_CUE', { cueId: action.cueId })),
      };
    case 'EXECUTE_CUE':
      return {
        ...state,
        runOfShow: {
          ...state.runOfShow,
          segments: updateCueInSegments(state.runOfShow.segments, action.cueId, (cue) => ({
            ...cue,
            status: 'executed' as const,
          })),
          updatedAt: new Date().toISOString(),
        },
        ...appendCommand(createAutomationCommandIntent('EXECUTE_CUE', { cueId: action.cueId })),
      };
    case 'SKIP_CUE':
      return {
        ...state,
        runOfShow: {
          ...state.runOfShow,
          segments: updateCueInSegments(state.runOfShow.segments, action.cueId, (cue) => ({
            ...cue,
            status: 'skipped' as const,
          })),
          updatedAt: new Date().toISOString(),
        },
        ...appendCommand(createAutomationCommandIntent('SKIP_CUE', { cueId: action.cueId })),
      };
    case 'ARM_MACRO':
      return {
        ...state,
        macros: state.macros.map((macro) =>
          macro.id === action.macroId ? { ...macro, status: 'ready' as const } : macro,
        ),
        ...appendCommand(createAutomationCommandIntent('ARM_MACRO', { macroId: action.macroId })),
      };
    case 'DISABLE_MACRO':
      return {
        ...state,
        macros: state.macros.map((macro) =>
          macro.id === action.macroId ? { ...macro, status: 'disabled' as const } : macro,
        ),
      };
    default:
      return state;
  }
}

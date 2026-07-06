import type { AutomationMacro, AutomationMode } from './types.js';

export type MacroActionType =
  | 'CUT' | 'TAKE' | 'AUTO' | 'SCENE_CHANGE' | 'SOURCE_VISIBILITY' | 'AUDIO_MUTE' | 'AUDIO_UNMUTE'
  | 'REPLAY' | 'GRAPHICS_ON' | 'GRAPHICS_OFF' | 'RECORDING_START' | 'RECORDING_STOP'
  | 'STREAMING_START' | 'STREAMING_STOP' | 'DELAY' | 'WAIT' | 'LOOP' | 'CONDITIONAL_BRANCH';
export type MacroScheduleMode = 'immediate' | 'after_delay' | 'at_time' | 'repeat' | 'daily' | 'weekly' | 'manual';
export type MacroTriggerType = 'scene_change' | 'recording_state' | 'streaming_state' | 'replay_event' | 'timer_completion' | 'manual_activation';
export type MacroExecutionStatus = 'queued' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed' | 'retrying' | 'rolled_back';
export type MacroExecutionMode = 'sequential' | 'parallel';

export interface ProductionMacroAction {
  id: string; type: MacroActionType; label: string; targetId?: string; durationMs?: number; enabled?: boolean;
  retries?: number; rollbackActionId?: string; condition?: string; loopCount?: number; metadata?: Record<string, unknown>;
}
export interface MacroSchedule { id: string; macroId: string; mode: MacroScheduleMode; delayMs?: number; runAt?: string; repeatEveryMs?: number; daysOfWeek?: number[]; enabled: boolean; }
export interface MacroHotkeyBinding { id: string; macroId: string; type: 'keyboard' | 'toolbar' | 'midi_controller'; binding: string; enabled: boolean; }
export interface MacroTrigger { id: string; macroId: string; type: MacroTriggerType; sourceId?: string; enabled: boolean; }
export interface MacroExecutionHistoryEntry { id: string; macroId: string; macroName: string; status: MacroExecutionStatus; startedAt: string; endedAt?: string; durationMs: number; currentStep: number; errors: string[]; actionTypes: MacroActionType[]; containsRuntimeHandles: false; }
export interface MacroRuntimeTask { id: string; macroId: string; status: MacroExecutionStatus; currentStep: number; startedAt: string; updatedAt: string; executionMode: MacroExecutionMode; locked: boolean; errors: string[]; rollbackStack: string[]; }
export interface MacroAutomationWorkspaceModel { macros: AutomationMacro[]; sequences: ProductionMacroAction[][]; triggers: MacroTrigger[]; runningTasks: MacroRuntimeTask[]; executionHistory: MacroExecutionHistoryEntry[]; schedules: MacroSchedule[]; hotkeys: MacroHotkeyBinding[]; containsRuntimeHandles: false; }

const now = () => new Date().toISOString();
const stepActions = (macro: AutomationMacro): ProductionMacroAction[] => macro.steps.map((step) => ({
  id: step.id, label: step.label, type: cueToAction(step.cueType), targetId: step.targetId, metadata: { targetType: step.targetType },
}));
export function cueToAction(cueType: string): MacroActionType { return cueType === 'replay' ? 'REPLAY' : cueType === 'graphics' ? 'GRAPHICS_ON' : cueType === 'audio' ? 'AUDIO_MUTE' : cueType === 'media' ? 'TAKE' : cueType === 'output' ? 'STREAMING_START' : cueType === 'wait' ? 'WAIT' : 'SCENE_CHANGE'; }
export function createMacroWorkspaceModel(input: Partial<MacroAutomationWorkspaceModel> = {}): MacroAutomationWorkspaceModel { return { macros: input.macros ?? [], sequences: input.sequences ?? [], triggers: input.triggers ?? [], runningTasks: input.runningTasks ?? [], executionHistory: input.executionHistory ?? [], schedules: input.schedules ?? [], hotkeys: input.hotkeys ?? [], containsRuntimeHandles: false }; }
export function createProductionMacro(input: { id: string; name: string; actions: ProductionMacroAction[]; description?: string; category?: string; favorite?: boolean; mode?: AutomationMode }): AutomationMacro {
  const macro: AutomationMacro = { id: input.id, name: input.name, mode: input.mode ?? 'manual', status: 'draft', containsRuntimeHandles: false, steps: input.actions.map((action) => ({ id: action.id, label: action.label, cueType: action.type === 'REPLAY' ? 'replay' : action.type.startsWith('GRAPHICS') ? 'graphics' : action.type.startsWith('AUDIO') ? 'audio' : action.type.includes('RECORDING') || action.type.includes('STREAMING') ? 'output' : action.type === 'WAIT' || action.type === 'DELAY' ? 'wait' : 'scene', targetType: action.type === 'REPLAY' ? 'replay' : action.type.startsWith('GRAPHICS') ? 'graphics' : action.type.startsWith('AUDIO') ? 'audio' : action.type.includes('RECORDING') || action.type.includes('STREAMING') ? 'output' : 'scene', targetId: action.targetId ?? action.type.toLowerCase(), requiresConfirmation: ['STREAMING_START','RECORDING_STOP','STREAMING_STOP'].includes(action.type), safeForAuto: !['STREAMING_START','STREAMING_STOP'].includes(action.type) })) };
  return input.description ? { ...macro, description: input.description } : macro;
}

export function startMacroExecution(model: MacroAutomationWorkspaceModel, macroId: string, executionMode: MacroExecutionMode = 'sequential') {
  if (model.runningTasks.some((task) => task.macroId === macroId && ['queued','running','paused','retrying'].includes(task.status))) throw new Error(`Macro ${macroId} is already executing`);
  const macro = model.macros.find((item) => item.id === macroId); if (!macro) throw new Error(`Macro ${macroId} not found`);
  const task: MacroRuntimeTask = { id: `task:${macroId}:${Date.now()}`, macroId, status: 'running', currentStep: 0, startedAt: now(), updatedAt: now(), executionMode, locked: true, errors: [], rollbackStack: [] };
  return { ...model, runningTasks: [task, ...model.runningTasks] };
}
export function completeMacroExecution(model: MacroAutomationWorkspaceModel, taskId: string, status: MacroExecutionStatus = 'completed', errors: string[] = []) {
  const task = model.runningTasks.find((item) => item.id === taskId); if (!task) return model;
  const macro = model.macros.find((item) => item.id === task.macroId); const endedAt = now();
  const history: MacroExecutionHistoryEntry = { id: `history:${task.id}`, macroId: task.macroId, macroName: macro?.name ?? task.macroId, status, startedAt: task.startedAt, endedAt, durationMs: Date.parse(endedAt) - Date.parse(task.startedAt), currentStep: task.currentStep, errors, actionTypes: macro ? stepActions(macro).map((action) => action.type) : [], containsRuntimeHandles: false };
  return { ...model, runningTasks: model.runningTasks.filter((item) => item.id !== taskId), executionHistory: [history, ...model.executionHistory].slice(0, 100) };
}

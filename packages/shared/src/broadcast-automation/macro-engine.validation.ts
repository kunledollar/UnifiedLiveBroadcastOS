import { createMacroWorkspaceModel, createProductionMacro, startMacroExecution, completeMacroExecution } from './macro-engine.js';

const macro = createProductionMacro({
  id: 'macro-smoke',
  name: 'Smoke Production Flow',
  category: 'smoke-tests',
  favorite: true,
  actions: [
    { id: 'cut', type: 'CUT', label: 'CUT automation', targetId: 'preview' },
    { id: 'take', type: 'TAKE', label: 'TAKE automation', targetId: 'preview' },
    { id: 'record', type: 'RECORDING_START', label: 'Recording automation' },
    { id: 'stream', type: 'STREAMING_START', label: 'Streaming automation' },
    { id: 'replay', type: 'REPLAY', label: 'Replay automation', targetId: 'clip-1' },
  ],
});
let model = createMacroWorkspaceModel({
  macros: [macro],
  schedules: [{ id: 'schedule-now', macroId: macro.id, mode: 'immediate', enabled: true }],
  hotkeys: [{ id: 'hotkey-1', macroId: macro.id, type: 'keyboard', binding: 'Shift+F1', enabled: true }],
  triggers: [{ id: 'trigger-manual', macroId: macro.id, type: 'manual_activation', enabled: true }],
});
if (!model.macros.length) throw new Error('Macro creation failed');
model = startMacroExecution(model, macro.id);
if (model.runningTasks.length !== 1) throw new Error('Macro execution failed to start');
const taskId = model.runningTasks[0]?.id;
if (!taskId) throw new Error('Missing task id');
model = completeMacroExecution(model, taskId);
if (model.executionHistory.length !== 1) throw new Error('Execution history failed');
if (model.containsRuntimeHandles !== false || model.executionHistory[0]?.containsRuntimeHandles !== false) throw new Error('Runtime handle metadata violation');
console.log('broadcast automation macro engine validation passed');

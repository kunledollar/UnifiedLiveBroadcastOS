import { createMacroWorkspaceModel, completeMacroExecution, startMacroExecution } from '@ubos/shared';
import { createSampleMacros, enrichRunOfShowWithSampleCues } from './automation-seed';
import { AutomationPanel } from './AutomationPanel';
import { createInitialAutomationState } from './automation-state';
import { AutomationMacroEnginePanel } from './AutomationMacroEnginePanel';
import { createDefaultRunOfShow } from '@ubos/shared';

export default function AutomationPage() {
  const runOfShow = enrichRunOfShowWithSampleCues(createDefaultRunOfShow());
  const macros = createSampleMacros().map((macro, index) => ({ ...macro, category: index === 0 ? 'Show Control' : 'Packages', favorite: index === 0, ...(index === 0 ? { hotkey: 'Shift+F1' } : {}), updatedAt: '2026-07-06T00:00:00.000Z' }));
  let model = createMacroWorkspaceModel({
    macros,
    sequences: [macros[0]?.steps.map((step) => ({ id: step.id, label: step.label, type: step.cueType === 'replay' ? 'REPLAY' : step.cueType === 'graphics' ? 'GRAPHICS_ON' : 'TAKE', targetId: step.targetId })) ?? []],
    schedules: [{ id: 'schedule-open-show', macroId: 'macro-open-show', mode: 'manual', enabled: true }],
    hotkeys: [{ id: 'hotkey-open-show', macroId: 'macro-open-show', type: 'keyboard', binding: 'Shift+F1', enabled: true }, { id: 'toolbar-break', macroId: 'macro-break-package', type: 'toolbar', binding: 'Automation toolbar', enabled: true }],
    triggers: [{ id: 'trigger-manual-open', macroId: 'macro-open-show', type: 'manual_activation', enabled: true }, { id: 'trigger-replay-close', macroId: 'macro-close-show', type: 'replay_event', enabled: false }],
  });
  model = startMacroExecution(model, 'macro-open-show');
  model = completeMacroExecution(model, model.runningTasks[0]?.id ?? '', 'completed');
  return <main className="min-h-screen bg-ubos-graphite p-ubos-4 text-ubos-fg-primary"><div className="mx-auto flex max-w-ubos-wide flex-col gap-ubos-3"><AutomationPanel state={createInitialAutomationState(runOfShow, macros)} dispatch={() => undefined} /><AutomationMacroEnginePanel model={model} selectedMacro={macros[0] ?? null} /></div></main>;
}

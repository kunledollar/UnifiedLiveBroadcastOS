'use client';

import type { AutomationMacro, MacroAutomationWorkspaceModel } from '@ubos/shared';
import { BroadcastPanel, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

const actionTypes = ['CUT','TAKE','AUTO','Scene Change','Source Visibility','Audio Mute','Audio Unmute','Replay','Graphics On','Graphics Off','Recording Start','Recording Stop','Streaming Start','Streaming Stop','Delay','Wait','Loop','Conditional Branch'];
const editorTools = ['Create','Rename','Duplicate','Delete','Import','Export','Favorite','Search','Categories'];
const scheduler = ['Run immediately','Run after delay','Run at time','Repeat','Daily','Weekly','Manual trigger'];
const triggers = ['Scene change','Recording state','Streaming state','Replay events','Timer completion','Manual activation'];
const execution = ['Sequential execution','Parallel execution','Pause','Resume','Cancel','Retry'];

function ChipList({ items }: { items: string[] }) { return <div className="flex flex-wrap gap-1">{items.map((item) => <span key={item} className="rounded-ubos-sm border border-ubos-border-subtle px-2 py-1 text-ubos-caption text-ubos-fg-muted">{item}</span>)}</div>; }

export function AutomationMacroEnginePanel({ model, selectedMacro }: { model: MacroAutomationWorkspaceModel; selectedMacro: AutomationMacro | null }) {
  const latest = model.executionHistory[0];
  return (
    <div className="grid min-h-0 gap-ubos-2 xl:grid-cols-[1.2fr_0.8fr]">
      <BroadcastPanel variant="inset" className="space-y-ubos-3">
        <div className="flex items-start justify-between gap-ubos-2">
          <div><h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Production Automation & Macro Engine</h3><p className="text-ubos-metadata text-ubos-fg-muted">Version 3.10 metadata-first automation definitions, schedules, triggers, hotkeys, and history.</p></div>
          <StatusBadge variant="success">No runtime handles persisted</StatusBadge>
        </div>
        <section><h4 className="mb-1 text-ubos-caption font-semibold uppercase tracking-ubos-wide text-ubos-fg-muted">Macro Builder Actions</h4><ChipList items={actionTypes} /></section>
        <section><h4 className="mb-1 text-ubos-caption font-semibold uppercase tracking-ubos-wide text-ubos-fg-muted">Macro Editor</h4><ChipList items={editorTools} /></section>
        <section><h4 className="mb-1 text-ubos-caption font-semibold uppercase tracking-ubos-wide text-ubos-fg-muted">Scheduler</h4><ChipList items={scheduler} /></section>
        <section><h4 className="mb-1 text-ubos-caption font-semibold uppercase tracking-ubos-wide text-ubos-fg-muted">Trigger Engine</h4><ChipList items={triggers} /></section>
        <section><h4 className="mb-1 text-ubos-caption font-semibold uppercase tracking-ubos-wide text-ubos-fg-muted">Execution Engine</h4><ChipList items={execution} /></section>
      </BroadcastPanel>
      <BroadcastPanel variant="inset" className="space-y-ubos-2">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Inspector</h3>
        <InspectorRow label="Macro ID" value={selectedMacro?.id ?? 'none selected'} />
        <InspectorRow label="Current Step" value={model.runningTasks[0]?.currentStep.toString() ?? 'idle'} />
        <InspectorRow label="Execution Time" value={latest ? `${latest.durationMs} ms` : 'not run'} />
        <InspectorRow label="Status" value={model.runningTasks[0]?.status ?? latest?.status ?? 'idle'} />
        <InspectorRow label="Last Run" value={latest?.endedAt ?? selectedMacro?.lastRunAt ?? 'never'} />
        <InspectorRow label="Errors" value={latest?.errors.length ? latest.errors.join(', ') : 'none'} />
      </BroadcastPanel>
    </div>
  );
}

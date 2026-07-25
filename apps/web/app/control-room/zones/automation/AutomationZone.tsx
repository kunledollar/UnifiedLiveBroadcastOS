'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { TriggerRegistration } from '../../automation-engine/automationEngine';

// ── Built-in example triggers ──────────────────────────────────────────────

const EXAMPLE_TRIGGERS: TriggerRegistration[] = [
  {
    name: 'Auto Route Replay',
    condition: (ctx) => {
      const ws = ctx as typeof workspaceState;
      return ws.replayEngine.getClips().length > 0;
    },
    action: (ctx) => {
      const ws = ctx as typeof workspaceState;
      if (!ws.routingEngine.hasRoute('replay', 'program')) {
        ws.routingEngine.addRoute('replay', 'program', 'video');
      }
    },
  },
  {
    name: 'Auto Lower Music on Chat Spike',
    condition: (ctx) => {
      const ws = ctx as typeof workspaceState;
      return ws.audioEngine.layers.some((l) => l.source === 'music' && l.gain > 0.5);
    },
    action: (ctx) => {
      const ws = ctx as typeof workspaceState;
      ws.audioEngine.setGain(
        ws.audioEngine.layers.find((l) => l.source === 'music')?.id ?? '',
        0.3,
      );
    },
  },
];

export function AutomationZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const engine = workspaceState.automationEngine;
  const triggers = engine.getTriggers();

  const handleAddExample = (registration: TriggerRegistration) => {
    workspaceState.registerAutomationTrigger(registration);
    forceRender((n) => n + 1);
  };

  const handleToggle = (id: number) => {
    engine.toggleTrigger(id);
    forceRender((n) => n + 1);
  };

  const handleRemove = (id: number) => {
    engine.removeTrigger(id);
    forceRender((n) => n + 1);
  };

  const handleEvaluate = () => {
    workspaceState.evaluateAutomation();
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Automation
        </h4>
        <div className="flex items-center gap-2 text-[9px] text-[#334155]">
          <span>{engine.enabledTriggerCount}/{engine.triggerCount} active</span>
          <span>·</span>
          <span>{engine.totalRunCount} runs</span>
        </div>
      </div>

      {/* Trigger list */}
      <div className="mb-3 flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {triggers.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No triggers registered — add an example below</p>
        ) : (
          triggers.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 ${
                t.enabled ? 'border-[#1e3a5f] bg-[#0d1117]' : 'border-[#1e2530] bg-[#080c12] opacity-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-[#94a3b8]">{t.name}</p>
                <p className="text-[8px] text-[#334155]">
                  Condition: {t.condition.name || 'anonymous'} · Action: {t.action.name || 'anonymous'}
                </p>
                {t.runCount > 0 && (
                  <p className="text-[8px] text-[#7c6af7]/70">Fired {t.runCount}×</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggle(t.id)}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${
                  t.enabled
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[#1e2530] text-[#334155]'
                }`}
              >
                {t.enabled ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(t.id)}
                className="shrink-0 text-[8px] text-red-400/50 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 space-y-1.5 border-t border-[#1e2530] pt-2">
        <button
          type="button"
          onClick={handleEvaluate}
          className="w-full rounded bg-[#7c6af7]/15 px-2 py-1.5 text-[9px] font-bold text-[#7c6af7] hover:bg-[#7c6af7]/25"
        >
          ▶ Evaluate All Triggers
        </button>
        {EXAMPLE_TRIGGERS.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleAddExample(ex)}
            className="w-full rounded bg-[#0a1628] px-2 py-1.5 text-[9px] text-[#334155] hover:bg-[#1e2530] hover:text-[#475569]"
          >
            + {ex.name}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { DockablePanel } from './DockablePanel';

export function SplitMonitorBay({
  programMonitor,
  previewMonitor,
  programLabel,
  previewLabel,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
  programFlexWeight = 55,
  previewFlexWeight = 35,
}: {
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programLabel: string;
  previewLabel: string;
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  programFlexWeight?: number;
  previewFlexWeight?: number;
}) {
  return (
    <DockablePanel
      title="Program / Preview"
      subtitle={`${programLabel} · ${previewLabel}`}
      accent="program"
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      className="h-full"
      compactHeader
    >
      <div
        className="grid h-full min-h-0 gap-2 p-2"
        style={{ gridTemplateColumns: `${programFlexWeight}fr ${previewFlexWeight}fr` }}
      >
        <div
          data-ubos-program-monitor="true"
          className="min-h-0 rounded-lg border border-red-600/50 bg-black p-1 shadow-[0_0_34px_rgba(220,38,38,0.15)]"
        >
          <div className="mb-1 flex items-center justify-between px-1 text-xs font-black uppercase tracking-[0.16em] text-red-400">
            <span>Program</span>
            <span className="font-mono text-[10px] normal-case tracking-normal text-red-200/80">
              {programLabel}
            </span>
          </div>
          <div className="h-[calc(100%-1.25rem)] min-h-0">{programMonitor}</div>
        </div>
        <div className="min-h-0 rounded-lg border border-emerald-500/50 bg-black p-1 shadow-[0_0_28px_rgba(16,185,129,0.1)]">
          <div className="mb-1 flex items-center justify-between px-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-400">
            <span>Preview</span>
            <span className="font-mono text-[10px] normal-case tracking-normal text-emerald-200/80">
              {previewLabel}
            </span>
          </div>
          <div className="h-[calc(100%-1.25rem)] min-h-0">{previewMonitor}</div>
        </div>
      </div>
    </DockablePanel>
  );
}

'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function CenterProgramPreviewDeck({
  programMonitor,
  previewMonitor,
  programLabel,
  previewLabel,
  switcherContent,
  programFlexWeight = 58,
  previewFlexWeight = 42,
  className,
}: {
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programLabel: string;
  previewLabel: string;
  switcherContent: ReactNode;
  programFlexWeight?: number;
  previewFlexWeight?: number;
  className?: string;
}) {
  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden', className)}
      aria-label="Program and preview monitors"
    >
      <div
        className="grid min-h-0 flex-1 gap-2"
        style={{ gridTemplateColumns: `${programFlexWeight}fr ${previewFlexWeight}fr` }}
      >
        <div
          data-ubos-program-monitor="true"
          className="flex min-h-0 flex-col overflow-hidden rounded-ubos-md border border-red-600/45 bg-black shadow-[0_0_40px_rgba(220,38,38,0.14)]"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-red-900/40 bg-[#120608] px-ubos-2 py-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-red-400">
              Program
            </span>
            <span className="font-mono text-[10px] text-red-200/75">{programLabel}</span>
          </header>
          <div className="min-h-0 flex-1 p-1">{programMonitor}</div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-ubos-md border border-emerald-500/45 bg-black shadow-[0_0_32px_rgba(16,185,129,0.12)]">
          <header className="flex shrink-0 items-center justify-between border-b border-emerald-900/35 bg-[#06120c] px-ubos-2 py-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">
              Preview
            </span>
            <span className="font-mono text-[10px] text-emerald-200/75">{previewLabel}</span>
          </header>
          <div className="min-h-0 flex-1 p-1">{previewMonitor}</div>
        </div>
      </div>

      <div className="shrink-0 overflow-hidden rounded-ubos-md border border-ubos-border-subtle bg-[#060a12] shadow-ubos-raised">
        {switcherContent}
      </div>
    </section>
  );
}

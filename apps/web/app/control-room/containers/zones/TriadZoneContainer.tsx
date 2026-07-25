'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

// UBDS color semantics (Step 92): Program = Program Red, Preview = Preview
// Green, Confidence (an intelligence readout, not a risk warning) = Active
// Blue — it reflects operator focus on the current prediction, not danger.
const laneClassName: Record<string, string> = {
  Program: 'border-ubos-program-border bg-ubos-program-muted text-ubos-program-text',
  Preview: 'border-ubos-preview-border bg-ubos-preview-muted text-ubos-preview-text',
  Confidence: 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text',
};

export function TriadZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="triad"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="grid grid-cols-3 gap-2 overflow-hidden rounded-lg border border-ubos-border bg-ubos-midnight p-2"
    >
      {['Program', 'Preview', 'Confidence'].map((label) => (
        <div
          key={label}
          className={`flex flex-col items-center justify-center rounded border text-[10px] font-bold uppercase tracking-widest ${laneClassName[label]}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

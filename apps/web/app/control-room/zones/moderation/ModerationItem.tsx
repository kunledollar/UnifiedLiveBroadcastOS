'use client';

import type { EvaluatedItem } from './moderationEngine';

const severityStyles: Record<EvaluatedItem['severity'], string> = {
  critical: 'border-red-500/70 bg-red-500/5',
  flagged:  'border-amber-500/50 bg-amber-500/5',
  normal:   'border-[#1e2530] bg-[#0d1117]',
};

const reasonColor: Record<EvaluatedItem['severity'], string> = {
  critical: 'text-red-400',
  flagged:  'text-amber-400',
  normal:   'text-[#334155]',
};

const actionConfig = [
  { label: 'Approve', style: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' },
  { label: 'Mute',    style: 'bg-[#0a1628] text-[#475569] hover:bg-[#1e2530] hover:text-[#94a3b8]' },
  { label: 'Ban',     style: 'bg-red-500/10 text-red-400 hover:bg-red-500/20' },
  { label: 'Escalate',style: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' },
];

export function ModerationItem({ item }: { item: EvaluatedItem }) {
  return (
    <div className={`mod-item rounded-lg border p-3 ${severityStyles[item.severity]}`}>
      {/* Header */}
      <div className="mod-header mb-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <strong className="font-semibold text-[#e2e8f0]">{item.user}</strong>
        <span className="rounded bg-[#1e2530] px-1.5 py-0.5 text-[8px] uppercase text-[#475569]">{item.platform}</span>
        <span className="text-[#334155]">{item.time}</span>
        {item.severity !== 'normal' && (
          <span className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            item.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {item.severity}
          </span>
        )}
      </div>

      {/* Message text */}
      <div className="mod-text mb-2 text-[11px] leading-relaxed text-[#94a3b8]">{item.text}</div>

      {/* Engine verdict */}
      <div className={`mod-reason mb-2 text-[9px] font-bold uppercase tracking-wide ${reasonColor[item.severity]}`}>
        {item.severity === 'normal'
          ? 'No violations detected'
          : `Violations: ${item.reason}`}
      </div>

      {/* Operator actions */}
      <div className="mod-actions flex flex-wrap gap-1">
        {actionConfig.map(({ label, style }) => (
          <button
            key={label}
            type="button"
            className={`rounded px-2.5 py-1 text-[9px] font-medium transition-colors ${style}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

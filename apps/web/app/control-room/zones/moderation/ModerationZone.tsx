'use client';

import type { ProductionState } from '@ubos/shared';
import { evaluateModerationRules } from './moderationEngine';
import { ModerationItem } from './ModerationItem';
import './Moderation.css';

export function ModerationZone({ state }: { state: ProductionState }) {
  const { moderationQueue } = state;

  // Engine: evaluate every item in the queue against the rule set
  const evaluated = (moderationQueue ?? []).map(evaluateModerationRules);

  // Sort: critical first, then flagged, then normal
  const sorted = [...evaluated].sort((a, b) => {
    const order = { critical: 0, flagged: 1, normal: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="moderation-zone">
      <h4 className="shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
        Moderation Queue
        {sorted.length > 0 && (
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[8px] font-bold ${
            sorted.some((i) => i.severity === 'critical')
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {sorted.length}
          </span>
        )}
      </h4>

      {sorted.length === 0 ? (
        <div className="mod-empty">No items in queue</div>
      ) : (
        <div className="mod-list">
          {sorted.map((item) => (
            <ModerationItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

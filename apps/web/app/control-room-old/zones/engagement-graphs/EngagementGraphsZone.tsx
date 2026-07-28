'use client';

import type { ProductionState } from '@ubos/shared';
import { EngagementTimeline } from './EngagementTimeline';
import { PlatformBars }       from './PlatformBars';
import { ReactionHeatmap }    from './ReactionHeatmap';
import './EngagementGraphs.css';

export function EngagementGraphsZone({ state }: { state: ProductionState }) {
  const { engagement } = state;

  if (!engagement) {
    return (
      <div className="engagement-graphs-zone">
        <div className="eg-empty">No engagement data</div>
      </div>
    );
  }

  return (
    <div className="engagement-graphs-zone">
      <EngagementTimeline timeline={engagement.timeline  ?? []} />
      <PlatformBars       platforms={engagement.platforms ?? []} />
      <ReactionHeatmap    reactions={engagement.reactions ?? []} />
    </div>
  );
}

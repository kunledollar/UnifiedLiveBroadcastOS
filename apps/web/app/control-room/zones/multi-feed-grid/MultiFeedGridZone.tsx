'use client';

import type { ProductionState } from '@ubos/shared';
import { MultiFeedTile } from './MultiFeedTile';
import './MultiFeedGrid.css';

export function MultiFeedGridZone({ state }: { state: ProductionState }) {
  const { feeds } = state;

  return (
    <div className="multi-feed-grid-zone">
      {(!feeds || feeds.length === 0) ? (
        <div className="mfg-empty">No feeds available</div>
      ) : (
        <div className="mfg-grid">
          {feeds.map((feed) => (
            <MultiFeedTile key={feed.id} feed={feed} />
          ))}
        </div>
      )}
    </div>
  );
}

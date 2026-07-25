'use client';

import type { ProductionState } from '@ubos/shared';
import { CameraGridItem } from './CameraGridItem';
import './CameraGrid.css';

export function CameraGridZone({ state }: { state: ProductionState }) {
  const { cameras } = state;

  return (
    <div className="camera-grid-zone">
      {(!cameras || cameras.length === 0) ? (
        <div className="cg-empty">No cameras available</div>
      ) : (
        <div className="cg-grid">
          {cameras.map((cam) => (
            <CameraGridItem key={cam.id} camera={cam} />
          ))}
        </div>
      )}
    </div>
  );
}

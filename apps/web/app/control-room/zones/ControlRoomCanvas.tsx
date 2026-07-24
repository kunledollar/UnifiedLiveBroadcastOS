'use client';

/**
 * ControlRoomCanvas — Step 50
 *
 * Geometry-driven Control Room root. Subscribes to WorkspaceManager via
 * useGeometry(), then renders each zone as an absolutely positioned div
 * using pixel coordinates from computeZones().
 *
 * This component is the bridge between the GeometryEngine and the UI.
 * Every geometry recompute instantly repositions all zone divs.
 */
import { useGeometry } from '../hooks/useGeometry';
import { ZoneRenderer } from './ZoneRenderer';

export function ControlRoomCanvas() {
  const zones = useGeometry();

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#080c12]"
      data-testid="control-room-canvas"
    >
      {Object.values(zones).map((zone) => (
        <div
          key={zone.id}
          data-zone={zone.id}
          style={{
            position: 'absolute',
            left:   `${zone.rect.x}px`,
            top:    `${zone.rect.y}px`,
            width:  `${zone.rect.width}px`,
            height: `${zone.rect.height}px`,
          }}
        >
          <ZoneRenderer id={zone.id} state={zone.state} />
        </div>
      ))}
    </div>
  );
}

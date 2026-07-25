'use client';

/**
 * ControlRoomCanvas — Step 50 (+ Step 90 UIIL)
 *
 * Geometry-driven Control Room root. Subscribes to WorkspaceManager via
 * useGeometry(), then renders each zone as an absolutely positioned div
 * using pixel coordinates from computeZones().
 *
 * Step 90: zone wrappers receive UI intelligence classes from UIIL so
 * WIE signals (highlight/dim/warn/pulse/prepare/suppress/elevate) shape
 * the live Control Room without redesigning zone interiors.
 */
import { useEffect } from 'react';
import { useGeometry } from '../hooks/useGeometry';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import { ZoneRenderer } from './ZoneRenderer';
import { workspaceState } from '../workspace/workspaceState';
import '../intelligence-graph/ui-intelligence.css';

export function ControlRoomCanvas() {
  const zones = useGeometry();
  // Re-render when UIIL panel state changes (orchestration feeds WIE/UIIL)
  useUiIntelligence();

  // Start the global orchestration tick loop on canvas mount.
  // Stops cleanly on unmount to prevent memory leaks.
  useEffect(() => {
    workspaceState.initializeOrchestration();
    return () => workspaceState.stopOrchestration();
  }, []);

  const graph = workspaceState.intelligenceGraph;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#080c12]"
      data-testid="control-room-canvas"
      data-ui-intelligence="canvas"
    >
      {Object.values(zones).map((zone) => {
        const uiClass = graph.getZoneUiClassName(zone.id);
        return (
          <div
            key={zone.id}
            data-zone={zone.id}
            data-ui-action={graph.uiIntegration.actionForZone(zone.id) ?? undefined}
            className={uiClass || undefined}
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
        );
      })}
    </div>
  );
}

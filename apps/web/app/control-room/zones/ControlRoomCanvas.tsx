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
 *
 * Step 109: while Studio Automation is active, Triad 2.0/Inspector 2.0/
 * Program Output 2.0's zone wrappers carry a named
 * `data-ubos-autonomous-workspace-mode` ("Autonomous Triad Mode"/
 * "Autonomous Diagnostics Mode"/"Autonomous Output Mode") — data-only,
 * per Steps 105/106's precedent, so this never redesigns the zones
 * themselves.
 */
import { useEffect } from 'react';
import { useGeometry } from '../hooks/useGeometry';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import { ZoneRenderer } from './ZoneRenderer';
import { workspaceState } from '../workspace/workspaceState';
import { autonomousStudioModeController } from '../hud/autonomousStudioMode';
import '../intelligence-graph/ui-intelligence.css';

/** Named autonomous workspace modes for the three zones the Step 109 spec calls out by name. */
const AUTONOMOUS_WORKSPACE_MODE_NAME: Readonly<Record<string, string>> = {
  triad: 'Autonomous Triad Mode',
  inspector: 'Autonomous Diagnostics Mode',
  output: 'Autonomous Output Mode',
};

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
  // Reads the controller's cached result (`OperatorHUD` is the one call
  // site that advances it each tick — see its module doc).
  const autonomousMode = autonomousStudioModeController.getResult();
  const autonomousActive = autonomousMode.mode !== 'disabled';

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-ubos-carbon"
      data-testid="control-room-canvas"
      data-ui-intelligence="canvas"
    >
      {Object.values(zones).map((zone) => {
        const uiClass = graph.getZoneUiClassName(zone.id);
        const autonomousWorkspaceMode =
          autonomousActive ? AUTONOMOUS_WORKSPACE_MODE_NAME[zone.id] : undefined;
        return (
          <div
            key={zone.id}
            data-zone={zone.id}
            data-ui-action={graph.uiIntegration.actionForZone(zone.id) ?? undefined}
            data-ubos-autonomous-workspace-mode={autonomousWorkspaceMode}
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

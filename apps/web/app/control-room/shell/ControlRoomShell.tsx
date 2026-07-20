import { SceneControlAdapter } from '../scene-control/SceneControlAdapter';
import type {
  AudioChannel,
  ChatMessage,
  Destination,
  Guest,
  GuestInvite,
  MediaRoute,
  ProductionAsset,
  ProductionSwitchingState,
  Scene,
  SceneLayout,
  StreamHealthMetric,
} from '@ubos/shared';

export function ControlRoomShell({
  scenes,
  productionState,
  // These inputs remain part of the server shell contract while their dedicated
  // routes own their runtime UIs.  The scene adapter deliberately receives only
  // serializable scene-control data.
}: {
  scenes: Scene[];
  productionState: ProductionSwitchingState;
  layouts: SceneLayout[];
  channels: AudioChannel[];
  assets: ProductionAsset[];
  mediaRoutes: MediaRoute[];
  guests: Guest[];
  invites: GuestInvite[];
  persistenceDiagnostics: Record<string, unknown> & { currentGraphRevision?: number };
  destinations?: Destination[];
  messages?: ChatMessage[];
  healthMetrics?: StreamHealthMetric[];
}) {
  return (
    <main data-testid="workspace-shell" className="ubos-workstation h-screen overflow-hidden bg-ubos-carbon text-ubos-fg-primary">
      <SceneControlAdapter scenes={scenes} productionState={productionState} />
    </main>
  );
}

import { memo } from 'react';
import { SceneWorkspace } from '../scene-workspace';
import { useRenderForensics } from '../render-forensics';
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

export const ControlRoomShell = memo(function ControlRoomShell({
  scenes,
  productionState,
  layouts,
  channels,
  assets,
  mediaRoutes,
  guests,
  invites,
  persistenceDiagnostics,
  destinations = [],
  messages = [],
  healthMetrics = [],
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
  useRenderForensics('ControlRoomShell');
  return (
    <main data-ubos-control-room-root="true" data-ubos-diagnostic-target="control-room-root" className="ubos-workstation h-screen overflow-hidden bg-ubos-carbon text-ubos-fg-primary">
      <div data-ubos-scene-workspace="true" data-ubos-diagnostic-target="scene-workspace" className="h-full">
      <SceneWorkspace
        initialScenes={scenes}
        initialProductionState={productionState}
        layouts={layouts}
        channels={channels}
        assets={assets}
        mediaRoutes={mediaRoutes}
        guests={guests}
        invites={invites}
        destinations={destinations}
        messages={messages}
        streamHealthMetrics={healthMetrics}
        persistenceDiagnostics={persistenceDiagnostics}
        broadcastId="demo-broadcast"
        workspaceId="demo-workspace"
      />
      </div>
    </main>
  );
});

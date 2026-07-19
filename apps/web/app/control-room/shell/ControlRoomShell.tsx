import { memo } from 'react';
import { SceneWorkspace } from '../scene-workspace';
import { ControlRoomRenderForensicsMarker } from './ControlRoomRenderForensicsMarker';
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
  // Server Components may render this shell, so only pass a compact,
  // serializable snapshot to the client-side diagnostics marker. In particular,
  // do not pass the full production payload or any runtime handles.
  const renderForensicsSummary = {
    sceneCount: scenes.length,
    sceneIds: scenes.map((scene) => scene.id).join(','),
    programSceneId: productionState.programSceneId,
    previewSceneId: productionState.previewSceneId,
    layoutCount: layouts.length,
    channelCount: channels.length,
    assetCount: assets.length,
    mediaRouteCount: mediaRoutes.length,
    guestCount: guests.length,
    inviteCount: invites.length,
    destinationCount: destinations.length,
    messageCount: messages.length,
    healthMetricCount: healthMetrics.length,
    graphRevision: persistenceDiagnostics.currentGraphRevision ?? null,
  };
  return (
    <main data-ubos-control-room-root="true" className="ubos-workstation h-screen overflow-hidden bg-ubos-carbon text-ubos-fg-primary">
      <ControlRoomRenderForensicsMarker summary={renderForensicsSummary} />
      <div data-ubos-scene-workspace="true" className="h-full">
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

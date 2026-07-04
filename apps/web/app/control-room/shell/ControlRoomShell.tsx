import { SceneWorkspace } from '../scene-workspace';
import { GuestManagement } from '../guest-management';
import { MediaRoutingPanel } from '../media-routing-panel';
import { ControlRoomRealtime } from '../_components/control-room-realtime';
import { HostDeviceControls } from '../_components/host-device-controls';
import { ProductionTeamPanel } from '../_components/production-team-panel';
import {
  CrossFollowPanel,
  DestinationPanel,
  StreamHealthPanel,
  UnifiedChatPanel,
} from '@ubos/ui';
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
  return (
    <main className="ubos-workstation h-screen overflow-hidden bg-ubos-carbon text-ubos-fg-primary">
      <SceneWorkspace
        initialScenes={scenes}
        initialProductionState={productionState}
        layouts={layouts}
        channels={channels}
        assets={assets}
        mediaRoutes={mediaRoutes}
        guests={guests}
        operationsTabs={[
          {
            id: 'guests',
            content: (
              <GuestManagement guests={guests} invites={invites} broadcastId="demo-broadcast" />
            ),
          },
          {
            id: 'inspector',
            content: (
              <div className="space-y-3">
                <HostDeviceControls />
                <ProductionTeamPanel
                  currentGraphRevision={persistenceDiagnostics.currentGraphRevision ?? 0}
                />
                <dl className="grid grid-cols-2 gap-2 text-xs text-ubos-fg-secondary">
                  {Object.entries(persistenceDiagnostics).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-2"
                    >
                      <dt className="text-ubos-metadata font-medium text-ubos-fg-muted">
                        {label}
                      </dt>
                      <dd className="mt-1 ubos-truncate font-mono text-ubos-fg-primary">
                        {String(value ?? 'none')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ),
          },
          {
            id: 'routing',
            content: (
              <MediaRoutingPanel
                guests={guests}
                routes={mediaRoutes}
                scenes={scenes}
                broadcastId="demo-broadcast"
              />
            ),
          },
          {
            id: 'outputs',
            content: <DestinationPanel destinations={destinations} />,
          },
          {
            id: 'health',
            content: (
              <div className="space-y-3">
                <ControlRoomRealtime workspaceId="demo-workspace" broadcastId="demo-broadcast" />
                <StreamHealthPanel metrics={healthMetrics} />
              </div>
            ),
          },
          {
            id: 'logs',
            content: (
              <div className="space-y-3">
                <UnifiedChatPanel messages={messages} />
                <CrossFollowPanel platforms={[]} />
              </div>
            ),
          },
          {
            id: 'ai',
            content: (
              <p className="text-ubos-caption text-ubos-fg-muted">AI assistant not configured.</p>
            ),
          },
        ]}
      />
    </main>
  );
}

import { SceneWorkspace } from '../scene-workspace';
import { GuestManagement } from '../guest-management';
import { MediaRoutingPanel } from '../media-routing-panel';
import { RightSidebarTabs } from '../right-sidebar-tabs';
import { ControlRoomRealtime } from '../_components/control-room-realtime';
import { HostDeviceControls } from '../_components/host-device-controls';
import { ProductionTeamPanel } from '../_components/production-team-panel';
import { CrossFollowPanel, DestinationPanel, StreamHealthPanel, UnifiedChatPanel } from '@ubos/ui';
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
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(220,38,38,.10),transparent_26%),#020617] p-2 text-slate-100 xl:h-screen xl:overflow-hidden">
      <div className="h-full min-h-0 w-full">
        <SceneWorkspace
          initialScenes={scenes}
          initialProductionState={productionState}
          layouts={layouts}
          channels={channels}
          assets={assets}
          mediaRoutes={mediaRoutes}
          guests={guests}
          rightSidebar={
            <RightSidebarTabs
              tabs={[
                {
                  id: 'guests',
                  label: 'Guests',
                  content: (
                    <GuestManagement
                      guests={guests}
                      invites={invites}
                      broadcastId="demo-broadcast"
                    />
                  ),
                },
                {
                  id: 'outputs',
                  label: 'Outputs',
                  content: <DestinationPanel destinations={destinations} />,
                },
                {
                  id: 'chat',
                  label: 'Chat',
                  content: (
                    <div className="space-y-3">
                      <UnifiedChatPanel messages={messages} />
                      <CrossFollowPanel platforms={[]} />
                    </div>
                  ),
                },
                {
                  id: 'routing',
                  label: 'Routing',
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
                  id: 'inspector',
                  label: 'Inspector',
                  content: (
                    <div className="space-y-3">
                      <HostDeviceControls />
                      <ProductionTeamPanel
                        currentGraphRevision={persistenceDiagnostics.currentGraphRevision ?? 0}
                      />
                      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        {Object.entries(persistenceDiagnostics).map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-white/10 bg-slate-950/50 p-2"
                          >
                            <dt className="font-bold uppercase tracking-[0.12em] text-slate-500">
                              {label}
                            </dt>
                            <dd className="mt-1 truncate font-mono text-cyan-200">
                              {String(value ?? 'none')}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ),
                },
                {
                  id: 'health',
                  label: 'Health',
                  content: (
                    <div className="space-y-3">
                      <ControlRoomRealtime
                        workspaceId="demo-workspace"
                        broadcastId="demo-broadcast"
                      />
                      <StreamHealthPanel metrics={healthMetrics} />
                    </div>
                  ),
                },
              ]}
            />
          }
        />
      </div>
    </main>
  );
}

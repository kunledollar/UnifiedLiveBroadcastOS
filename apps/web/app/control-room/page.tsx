import { getProductionState, getScenes } from './scene-actions';
import { SceneWorkspace } from './scene-workspace';
import { GuestManagement } from './guest-management';
import { listGuests, listInvites } from './guest-actions';
import { loadMediaRoutes } from './media-route-actions';
import { MediaRoutingPanel } from './media-routing-panel';
import { ControlRoomRealtime } from './_components/control-room-realtime';
import { HostDeviceControls } from './_components/host-device-controls';
import { ProductionTeamPanel } from './_components/production-team-panel';

import { CrossFollowPanel, DestinationPanel, StreamHealthPanel, UnifiedChatPanel } from '@ubos/ui';
import {
  ChatModerationStatus,
  ChatPlatform,
  DestinationPlatform,
  DestinationStatus,
  type AudioChannel,
  type ChatMessage,
  type Destination,
  type ProductionAsset,
  type SceneLayout,
  type StreamHealthMetric,
} from '@ubos/shared';

const layouts: SceneLayout[] = [
  'solo',
  'interview',
  'grid',
  'screen_share',
  'vertical_split',
  'picture_in_picture',
];

const destinations: Destination[] = [
  {
    id: 'youtube',
    workspaceId: 'w1',
    platform: DestinationPlatform.YouTube,
    label: 'YouTube Main',
    enabled: true,
    status: DestinationStatus.Connected,
  },
  {
    id: 'facebook',
    workspaceId: 'w1',
    platform: DestinationPlatform.Facebook,
    label: 'Facebook Page',
    enabled: true,
    status: DestinationStatus.Connected,
  },
  {
    id: 'tiktok',
    workspaceId: 'w1',
    platform: DestinationPlatform.TikTok,
    label: 'TikTok Vertical',
    enabled: false,
    status: DestinationStatus.Disconnected,
  },
  {
    id: 'rtmp',
    workspaceId: 'w1',
    platform: DestinationPlatform.CustomRtmp,
    label: 'Custom RTMP',
    enabled: false,
    status: DestinationStatus.Disconnected,
  },
];

const messages: ChatMessage[] = [
  {
    id: 'm1',
    sessionId: 's1',
    authorName: 'Sam',
    body: 'Audio sounds clean from here.',
    platform: ChatPlatform.YouTube,
    moderationStatus: ChatModerationStatus.Visible,
    createdAt: '2026-06-29T12:00:00.000Z',
  },
  {
    id: 'm2',
    sessionId: 's1',
    authorName: 'Nia',
    body: 'Vertical crop looks good on mobile.',
    platform: ChatPlatform.TikTok,
    moderationStatus: ChatModerationStatus.Visible,
    createdAt: '2026-06-29T12:01:00.000Z',
  },
  {
    id: 'm3',
    sessionId: 's1',
    authorName: 'Leo',
    body: 'Can you show the dashboard next?',
    platform: ChatPlatform.Facebook,
    moderationStatus: ChatModerationStatus.Visible,
    createdAt: '2026-06-29T12:02:00.000Z',
  },
];

const healthMetrics: StreamHealthMetric[] = [
  { id: 'bitrate', label: 'Bitrate', value: '6,200 kbps', status: 'good', helperText: 'Stable' },
  { id: 'latency', label: 'Latency', value: '2.4s', status: 'good', helperText: 'Low latency' },
  { id: 'frames', label: 'Dropped', value: '0', status: 'good', helperText: 'No drops' },
  { id: 'cpu', label: 'CPU', value: '38%', status: 'warning', helperText: 'Monitor under load' },
];

const audioChannels: AudioChannel[] = [
  { id: 'host-mic', label: 'Host Mic', level: 72, muted: false, kind: 'mic' },
  { id: 'guest-mic', label: 'Guest Mic', level: 64, muted: false, kind: 'guest' },
  { id: 'system', label: 'System Audio', level: 28, muted: false, kind: 'system' },
  { id: 'music', label: 'Music Bed', level: 0, muted: true, kind: 'media' },
];

const assets: ProductionAsset[] = [
  { id: 'asset-intro', name: 'Intro Sting', type: 'video', status: 'ready' },
  { id: 'asset-lower-third', name: 'Guest Lower Third', type: 'lower_third', status: 'ready' },
  { id: 'asset-bg', name: 'Gradient Background', type: 'background', status: 'ready' },
  { id: 'asset-logo', name: 'Sponsor Bug', type: 'overlay', status: 'queued' },
];

export const dynamic = 'force-dynamic';

export default async function ControlRoomPage() {
  const [scenes, productionState, guests, invites, mediaRoutes] = await Promise.all([
    getScenes(),
    getProductionState(),
    listGuests(),
    listInvites(),
    loadMediaRoutes(),
  ]);

  return (
    <main className="min-h-screen overflow-y-auto xl:h-screen xl:overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(79,70,229,.18),transparent_30%),#020617] p-1.5 text-slate-100 md:p-2">
      <div className="h-full min-h-0 w-full">
        <div className="grid min-h-0 gap-2 xl:h-full xl:grid-cols-[17rem_minmax(0,1fr)_22rem] 2xl:grid-cols-[19rem_minmax(0,1fr)_24rem]">
          <SceneWorkspace
            initialScenes={scenes}
            initialProductionState={productionState}
            layouts={layouts}
            channels={audioChannels}
            assets={assets}
            mediaRoutes={mediaRoutes}
            guests={guests}
          />
          <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 max-xl:max-h-[42rem]">
            <GuestManagement guests={guests} invites={invites} broadcastId="demo-broadcast" />
            <MediaRoutingPanel
              guests={guests}
              routes={mediaRoutes}
              scenes={scenes}
              broadcastId="demo-broadcast"
            />
            <HostDeviceControls />
            <ProductionTeamPanel />
            <details className="group rounded-2xl border border-white/10 bg-slate-900/55">
              <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 group-open:border-b group-open:border-white/10">
                Destinations
              </summary>
              <div className="p-3">
                <DestinationPanel destinations={destinations} />
              </div>
            </details>
            <details className="group rounded-2xl border border-white/10 bg-slate-900/55">
              <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 group-open:border-b group-open:border-white/10">
                Chat / Follow
              </summary>
              <div className="space-y-3 p-3">
                <UnifiedChatPanel messages={messages} />
                <CrossFollowPanel platforms={['YouTube', 'TikTok', 'Instagram', 'Facebook']} />
              </div>
            </details>
            <details className="group rounded-2xl border border-white/10 bg-slate-900/55">
              <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 group-open:border-b group-open:border-white/10">
                Sync / Stream Health
              </summary>
              <div className="space-y-3 p-3">
                <ControlRoomRealtime workspaceId="demo-workspace" broadcastId="demo-broadcast" />
                <StreamHealthPanel metrics={healthMetrics} />
              </div>
            </details>
          </aside>
        </div>
      </div>
    </main>
  );
}

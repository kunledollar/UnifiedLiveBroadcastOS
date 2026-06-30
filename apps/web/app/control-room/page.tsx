import { getScenes } from './scene-actions';
import { SceneWorkspace } from './scene-workspace';
import { GuestManagement } from './guest-management';
import { listGuests, listInvites } from './guest-actions';

import {
  BroadcastToolbar,
  CrossFollowPanel,
  DestinationPanel,
  StreamHealthPanel,
  UnifiedChatPanel,
} from '@ubos/ui';
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
  const [scenes, guests, invites] = await Promise.all([getScenes(), listGuests(), listInvites()]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(79,70,229,.18),transparent_30%),#020617] p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <BroadcastToolbar title="Launch Day Broadcast" status="offline" elapsed="00:00:00" />
        <div className="grid gap-5 2xl:grid-cols-[20rem_minmax(0,1fr)_24rem]">
          <SceneWorkspace
            initialScenes={scenes}
            layouts={layouts}
            channels={audioChannels}
            assets={assets}
          />
          <aside className="space-y-5">
            <GuestManagement guests={guests} invites={invites} broadcastId="demo-broadcast" />
            <DestinationPanel destinations={destinations} />
            <UnifiedChatPanel messages={messages} />
            <CrossFollowPanel platforms={['YouTube', 'TikTok', 'Instagram', 'Facebook']} />
            <StreamHealthPanel metrics={healthMetrics} />
          </aside>
        </div>
      </div>
    </main>
  );
}

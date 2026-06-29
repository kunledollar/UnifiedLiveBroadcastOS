import {
  BroadcastToolbar,
  CrossFollowPanel,
  DestinationPanel,
  GuestPanel,
  LayoutSelector,
  ProductionDock,
  ProgramPreview,
  SceneList,
  StreamHealthPanel,
  UnifiedChatPanel,
  VerticalPreview,
} from '@ubos/ui';
import {
  ChatModerationStatus,
  ChatPlatform,
  DestinationPlatform,
  DestinationStatus,
  GuestRole,
  GuestStatus,
  type AudioChannel,
  type ChatMessage,
  type Destination,
  type Guest,
  type ProductionAsset,
  type Scene,
  type SceneLayout,
  type StreamHealthMetric,
} from '@ubos/shared';

const scenes: Scene[] = [
  {
    id: 'scene-opening',
    name: 'Opening Countdown',
    layout: 'screen_share',
    isActive: false,
    canvases: [
      { id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'YouTube + Facebook' },
      { id: 'vertical', label: 'Vertical', aspectRatio: '9:16', destinationHint: 'TikTok + Instagram' },
    ],
    sources: [
      { id: 'source-countdown', type: 'media', label: 'Countdown Video', visible: true },
      { id: 'source-music', type: 'audio', label: 'Pre-show Music', visible: true },
    ],
  },
  {
    id: 'scene-host-guest',
    name: 'Host + Guest Interview',
    layout: 'interview',
    isActive: true,
    canvases: [
      { id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'Primary destinations' },
      { id: 'vertical', label: 'Vertical', aspectRatio: '9:16', destinationHint: 'Short-form destinations' },
      { id: 'square', label: 'Square', aspectRatio: '1:1', destinationHint: 'Future social crop' },
    ],
    sources: [
      { id: 'source-host', type: 'camera', label: 'Host Camera', visible: true },
      { id: 'source-guest', type: 'camera', label: 'Avery Guest', visible: true },
      { id: 'source-lower-third', type: 'overlay', label: 'Guest Lower Third', visible: true },
    ],
  },
  {
    id: 'scene-demo',
    name: 'Product Demo + PiP',
    layout: 'picture_in_picture',
    isActive: false,
    canvases: [{ id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'Demo output' }],
    sources: [
      { id: 'source-screen', type: 'screen', label: 'Demo Screen', visible: true },
      { id: 'source-host-pip', type: 'camera', label: 'Host PiP', visible: true },
    ],
  },
];

const layouts: SceneLayout[] = ['solo', 'interview', 'grid', 'screen_share', 'vertical_split', 'picture_in_picture'];

const guests: Guest[] = [
  { id: 'g1', sessionId: 's1', displayName: 'Maya Host', status: GuestStatus.OnAir, role: GuestRole.Host },
  { id: 'g2', sessionId: 's1', displayName: 'Avery Guest', status: GuestStatus.OnAir, role: GuestRole.Guest },
  { id: 'g3', sessionId: 's1', displayName: 'Producer Cam', status: GuestStatus.Waiting, role: GuestRole.Producer },
];

const destinations: Destination[] = [
  { id: 'youtube', workspaceId: 'w1', platform: DestinationPlatform.YouTube, label: 'YouTube Main', enabled: true, status: DestinationStatus.Connected },
  { id: 'facebook', workspaceId: 'w1', platform: DestinationPlatform.Facebook, label: 'Facebook Page', enabled: true, status: DestinationStatus.Connected },
  { id: 'tiktok', workspaceId: 'w1', platform: DestinationPlatform.TikTok, label: 'TikTok Vertical', enabled: false, status: DestinationStatus.Disconnected },
  { id: 'rtmp', workspaceId: 'w1', platform: DestinationPlatform.CustomRtmp, label: 'Custom RTMP', enabled: false, status: DestinationStatus.Disconnected },
];

const messages: ChatMessage[] = [
  { id: 'm1', sessionId: 's1', authorName: 'Sam', body: 'Audio sounds clean from here.', platform: ChatPlatform.YouTube, moderationStatus: ChatModerationStatus.Visible, createdAt: '2026-06-29T12:00:00.000Z' },
  { id: 'm2', sessionId: 's1', authorName: 'Nia', body: 'Vertical crop looks good on mobile.', platform: ChatPlatform.TikTok, moderationStatus: ChatModerationStatus.Visible, createdAt: '2026-06-29T12:01:00.000Z' },
  { id: 'm3', sessionId: 's1', authorName: 'Leo', body: 'Can you show the dashboard next?', platform: ChatPlatform.Facebook, moderationStatus: ChatModerationStatus.Visible, createdAt: '2026-06-29T12:02:00.000Z' },
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

export default function ControlRoomPage() {
  const activeScene = scenes.find((scene) => scene.isActive) ?? scenes[0]!;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(79,70,229,.18),transparent_30%),#020617] p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <BroadcastToolbar title="Launch Day Broadcast" status="offline" elapsed="00:00:00" />
        <div className="grid gap-5 2xl:grid-cols-[20rem_minmax(0,1fr)_24rem]">
          <aside className="space-y-5">
            <SceneList scenes={scenes} />
            <LayoutSelector layouts={layouts} />
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-300">
              <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">Assets Library</button>
              <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">Overlay Controls</button>
            </div>
          </aside>
          <section className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <ProgramPreview scene={activeScene} />
              <VerticalPreview scene={activeScene} />
            </div>
            <ProductionDock channels={audioChannels} assets={assets} />
          </section>
          <aside className="space-y-5">
            <GuestPanel guests={guests} />
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

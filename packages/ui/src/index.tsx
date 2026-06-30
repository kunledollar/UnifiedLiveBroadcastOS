import { SceneType } from '@ubos/shared';
import type {
  AudioChannel,
  ChatMessage,
  Destination,
  Guest,
  ProductionAsset,
  ProductionStatus,
  Scene,
  SceneLayout,
  SceneSource,
  SceneSourceType,
  MediaRoute,
  MediaLayoutPreset,
  StreamHealth,
  StreamHealthMetric,
} from '@ubos/shared';
import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'live';

const typeLabels: Record<SceneType, string> = {
  intro: 'Intro',
  countdown: 'Countdown',
  camera: 'Camera',
  interview: 'Interview',
  screen_share: 'Screen Share',
  break: 'Break',
  outro: 'Outro',
  custom: 'Custom',
};

const layoutLabels: Record<SceneLayout, string> = {
  solo: 'Solo Host',
  interview: 'Interview',
  grid: 'Guest Grid',
  screen_share: 'Screen Share',
  vertical_split: 'Vertical Split',
  picture_in_picture: 'Picture-in-Picture',
};

export function Button({
  children,
  variant = 'primary',
}: {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  const cls = {
    primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
    ghost: 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
  }[variant];

  return (
    <button className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${cls}`}>
      {children}
    </button>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 backdrop-blur">
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const cls = {
    neutral: 'bg-slate-700 text-slate-200 ring-slate-500/20',
    success: 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/20',
    warning: 'bg-amber-400/15 text-amber-300 ring-amber-300/20',
    danger: 'bg-rose-500/15 text-rose-300 ring-rose-300/20',
    live: 'bg-red-500 text-white ring-red-300/30 shadow-lg shadow-red-950/40',
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls}`}
    >
      {children}
    </span>
  );
}

export function BroadcastToolbar({
  title,
  status,
  elapsed,
}: {
  title: string;
  status: ProductionStatus;
  elapsed: string;
}) {
  const isLive = status === 'live';

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/30 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Broadcast Studio
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
          <Badge tone={isLive ? 'live' : 'warning'}>{isLive ? 'LIVE' : 'OFFLINE'}</Badge>
          <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 font-mono text-xs text-slate-300">
            {elapsed}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost">Record</Button>
        <Button>Go Live</Button>
        <Button variant="danger">End Broadcast</Button>
        <Button variant="secondary">Settings</Button>
      </div>
    </header>
  );
}

export function SceneCard({
  scene,
  index,
  total,
  onRename,
  onSwitch,
  onDuplicate,
  onDelete,
  onMove,
}: {
  scene: Scene;
  index: number;
  total: number;
  onRename: ((sceneId: string, name: string) => void) | undefined;
  onSwitch: ((sceneId: string) => void) | undefined;
  onDuplicate: ((sceneId: string) => void) | undefined;
  onDelete: ((sceneId: string) => void) | undefined;
  onMove: ((sceneId: string, direction: 'up' | 'down') => void) | undefined;
}) {
  const sceneLayout = scene.layout ?? 'picture_in_picture';

  return (
    <div
      className={`rounded-2xl border p-3 transition ${scene.isActive ? 'border-cyan-300 bg-cyan-300/10 shadow-lg shadow-cyan-950/20' : 'border-white/10 bg-slate-950/50 hover:bg-slate-800/80'}`}
    >
      <button className="w-full text-left" onClick={() => onSwitch?.(scene.id)} type="button">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{scene.name}</p>
            <p className="mt-1 text-xs text-slate-400">{layoutLabels[sceneLayout]}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone="neutral">{typeLabels[scene.type]}</Badge>
            {scene.isActive ? <Badge tone="success">● Active</Badge> : null}
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {scene.canvases.map((canvas) => (
            <span
              key={canvas.id}
              className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300"
            >
              {canvas.aspectRatio}
            </span>
          ))}
        </div>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px] font-bold text-slate-200">
        <button
          className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-40"
          disabled={index === 0}
          onClick={() => onMove?.(scene.id, 'up')}
          type="button"
        >
          ↑ Up
        </button>
        <button
          className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-40"
          disabled={index === total - 1}
          onClick={() => onMove?.(scene.id, 'down')}
          type="button"
        >
          ↓ Down
        </button>
        <button
          className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
          onClick={() => onDuplicate?.(scene.id)}
          type="button"
        >
          Duplicate
        </button>
        <button
          className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
          onClick={() => {
            const name = window.prompt('Rename scene', scene.name);
            if (name) onRename?.(scene.id, name);
          }}
          type="button"
        >
          Rename
        </button>
        <button
          className="col-span-2 rounded-lg bg-rose-500/80 px-2 py-1 text-white hover:bg-rose-500 disabled:opacity-40"
          disabled={total <= 1}
          onClick={() => {
            if (window.confirm(`Delete ${scene.name}?`)) onDelete?.(scene.id);
          }}
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function SceneList({
  scenes,
  sceneTypes = [],
  isPending = false,
  onAdd,
  onRename,
  onSwitch,
  onDuplicate,
  onDelete,
  onMove,
}: {
  scenes: Scene[];
  sceneTypes?: SceneType[];
  isPending?: boolean;
  onAdd: ((input: { name: string; type: SceneType }) => void) | undefined;
  onRename: ((sceneId: string, name: string) => void) | undefined;
  onSwitch: ((sceneId: string) => void) | undefined;
  onDuplicate: ((sceneId: string) => void) | undefined;
  onDelete: ((sceneId: string) => void) | undefined;
  onMove: ((sceneId: string, direction: 'up' | 'down') => void) | undefined;
}) {
  return (
    <Panel
      title="Scenes"
      action={
        onAdd ? (
          <button
            className="rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            disabled={isPending}
            onClick={() => {
              const name = window.prompt('New scene name', 'New Scene');
              if (name) onAdd({ name, type: sceneTypes[0] ?? SceneType.Custom });
            }}
            type="button"
          >
            + Add
          </button>
        ) : null
      }
    >
      <div className="space-y-3">
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={index}
            total={scenes.length}
            onRename={onRename}
            onSwitch={onSwitch}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </Panel>
  );
}

const sourceTypeLabels: Record<SceneSourceType, string> = {
  camera: 'Camera',
  screen: 'Screen',
  media: 'Media',
  overlay: 'Overlay',
  browser: 'Browser',
  audio: 'Audio',
};

export function SourceManager({
  scene,
  sourceTypes,
  isPending = false,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  onMove,
  onToggleVisibility,
  onToggleLock,
}: {
  scene: Scene;
  sourceTypes: SceneSourceType[];
  isPending?: boolean;
  onAdd: ((input: { sceneId: string; name: string; type: SceneSourceType }) => void) | undefined;
  onRename: (sourceId: string, name: string) => void;
  onDuplicate: (sourceId: string) => void;
  onDelete: (sourceId: string) => void;
  onMove: (sourceId: string, direction: 'up' | 'down') => void;
  onToggleVisibility: ((sourceId: string) => void) | undefined;
  onToggleLock: ((sourceId: string) => void) | undefined;
}) {
  const sources = [...scene.sources].sort((a, b) => a.order - b.order);

  return (
    <Panel
      title="Sources"
      action={
        <button
          className="rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          disabled={isPending}
          onClick={() => {
            const name = window.prompt('New source name', 'Camera Source');
            if (name) onAdd?.({ sceneId: scene.id, name, type: sourceTypes[0] ?? 'camera' });
          }}
          type="button"
        >
          + Add
        </button>
      }
    >
      <div className="mb-3 grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-200">
        {sourceTypes.map((type) => (
          <button
            key={type}
            className="rounded-lg bg-slate-950/70 px-2 py-2 hover:bg-slate-800"
            onClick={() =>
              onAdd?.({ sceneId: scene.id, name: `${sourceTypeLabels[type]} Source`, type })
            }
            type="button"
          >
            + {sourceTypeLabels[type]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {sources.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No sources yet. Add placeholders for camera, screen, media, overlays, browser, or audio.
          </p>
        ) : null}
        {sources.map((source, index) => (
          <div
            key={source.id}
            className={`rounded-xl border p-3 ${source.isVisible ? 'border-white/10 bg-slate-950/60' : 'border-white/5 bg-slate-950/30 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{source.name}</p>
                <p className="text-xs text-slate-400">
                  {sourceTypeLabels[source.type]} · Layer {index + 1}
                </p>
              </div>
              <div className="flex gap-1">
                <Badge tone={source.isVisible ? 'success' : 'neutral'}>
                  {source.isVisible ? 'Shown' : 'Hidden'}
                </Badge>
                {source.isLocked ? <Badge tone="warning">Locked</Badge> : null}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5 text-[11px] font-bold text-slate-200">
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-40"
                disabled={index === 0 || source.isLocked}
                onClick={() => onMove?.(source.id, 'up')}
                type="button"
              >
                ↑
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-40"
                disabled={index === sources.length - 1 || source.isLocked}
                onClick={() => onMove?.(source.id, 'down')}
                type="button"
              >
                ↓
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
                onClick={() => onToggleVisibility?.(source.id)}
                type="button"
              >
                {source.isVisible ? 'Hide' : 'Show'}
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
                onClick={() => onToggleLock?.(source.id)}
                type="button"
              >
                {source.isLocked ? 'Unlock' : 'Lock'}
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
                onClick={() => {
                  const name = window.prompt('Rename source', source.name);
                  if (name) onRename?.(source.id, name);
                }}
                type="button"
              >
                Rename
              </button>
              <button
                className="rounded-lg bg-slate-800 px-2 py-1 hover:bg-slate-700"
                onClick={() => onDuplicate?.(source.id)}
                type="button"
              >
                Duplicate
              </button>
              <button
                className="col-span-2 rounded-lg bg-rose-500/80 px-2 py-1 text-white hover:bg-rose-500"
                onClick={() => {
                  if (window.confirm(`Delete ${source.name}?`)) onDelete?.(source.id);
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SourceLayers({ sources, compact = false }: { sources: SceneSource[]; compact?: boolean }) {
  const visibleSources = sources
    .filter((source) => source.isVisible)
    .sort((a, b) => a.order - b.order);
  if (!visibleSources.length)
    return (
      <div className="absolute inset-8 grid place-items-center rounded-xl border border-dashed border-white/15 text-sm font-semibold text-slate-400">
        No visible sources
      </div>
    );
  return (
    <div className="absolute inset-8 grid gap-3">
      {visibleSources.map((source, index) => (
        <div
          key={source.id}
          className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-slate-950/70 p-3 text-white shadow-lg shadow-black/30 backdrop-blur"
          style={{
            marginLeft: compact ? 0 : index * 14,
            marginTop: compact ? index * 8 : index * 10,
          }}
        >
          <span className="font-bold">{source.name}</span>
          <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
            {sourceTypeLabels[source.type]}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LayoutSelector({ layouts }: { layouts: SceneLayout[] }) {
  return (
    <Panel title="Layout Templates">
      <div className="grid grid-cols-2 gap-2">
        {layouts.map((layout) => (
          <button
            key={layout}
            className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-left text-xs font-semibold text-slate-200 hover:border-cyan-300/50"
          >
            <div className="mb-2 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-950 ring-1 ring-white/10" />
            {layoutLabels[layout]}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function ProgramPreview({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
}) {
  const programRoute = routes.find((route) => route.isOnProgram);
  const routedNames = routes
    .filter((route) => route.isActive)
    .map((route) => `${route.displayName}${route.layoutSlot ? ` (${route.layoutSlot})` : ''}`)
    .join(' · ');
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Program 16:9</p>
          <h2 className="text-xl font-bold text-white">
            {programRoute?.displayName ?? scene.name}
          </h2>
          <p className="text-xs text-slate-400">
            Layout preset: {layoutPreset.replaceAll('_', ' ')}
          </p>
        </div>
        <Badge tone="live">LIVE</Badge>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.22),transparent_30%),linear-gradient(135deg,#0f172a,#020617)]">
        <SafeZone label="Title Safe" />
        <SourceLayers sources={scene.sources} />
        {programRoute ? (
          <div className="absolute inset-10 grid place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-950/30 text-center backdrop-blur-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                Routed Program Placeholder
              </p>
              <p className="mt-2 text-3xl font-black text-white">{programRoute.displayName}</p>
              <p className="mt-1 text-sm text-slate-300">
                {programRoute.isMuted ? 'Muted' : 'Audio active'} · Slot{' '}
                {programRoute.layoutSlot ?? 'auto'}
              </p>
            </div>
          </div>
        ) : null}
        <div className="absolute inset-x-8 bottom-8 rounded-xl border border-white/10 bg-black/45 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Current Scene</p>
          <p className="text-2xl font-black text-white">{scene.name}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">
            {routedNames || typeLabels[scene.type]}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function VerticalPreview({ scene, routes = [] }: { scene: Scene; routes?: MediaRoute[] }) {
  const programRoute = routes.find((route) => route.isOnProgram);
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vertical 9:16</p>
        <Badge tone="neutral">TikTok / Reels</Badge>
      </div>
      <div className="mx-auto aspect-[9/16] max-h-[34rem] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-800 to-slate-950 p-3 shadow-inner shadow-black">
        <div className="relative h-full rounded-[1.5rem] border border-cyan-300/20 bg-slate-950">
          <SafeZone label="Vertical Safe" />
          <SourceLayers sources={scene.sources} compact />
          {programRoute ? (
            <div className="absolute inset-x-5 top-16 rounded-2xl border border-cyan-300/20 bg-cyan-950/40 p-3 text-center text-white">
              Vertical route: {programRoute.displayName}
            </div>
          ) : null}
          <div className="absolute inset-x-4 bottom-6 rounded-xl bg-black/55 p-3 text-center">
            <p className="text-sm font-bold text-white">{scene.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-cyan-200">
              {typeLabels[scene.type]} · Mobile output mock
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SafeZone({ label }: { label: string }) {
  return (
    <div className="absolute inset-6 flex items-start justify-center rounded-xl border border-dashed border-white/20 text-[10px] uppercase tracking-[0.25em] text-white/35">
      {label}
    </div>
  );
}

export function GuestPanel({ guests }: { guests: Guest[] }) {
  return (
    <Panel title="Guests">
      <div className="grid gap-3">
        {guests.map((guest) => (
          <GuestTile key={guest.id} guest={guest} />
        ))}
      </div>
    </Panel>
  );
}

export function DestinationPanel({ destinations }: { destinations: Destination[] }) {
  return (
    <Panel title="Destinations">
      <div className="space-y-3">
        {destinations.map((destination) => (
          <DestinationToggle key={destination.id} destination={destination} />
        ))}
      </div>
    </Panel>
  );
}

export function UnifiedChatPanel({ messages }: { messages: ChatMessage[] }) {
  return (
    <Panel title="Unified Chat">
      <div className="space-y-3">
        {messages.map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}
      </div>
    </Panel>
  );
}

export function CrossFollowPanel({ platforms }: { platforms: string[] }) {
  return (
    <Panel title="Cross-Follow">
      <p className="text-sm text-slate-300">
        Promote follows across active platforms after destination integrations are connected.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Badge key={platform}>{platform}</Badge>
        ))}
      </div>
    </Panel>
  );
}

export function StreamHealthPanel({ metrics }: { metrics: StreamHealthMetric[] }) {
  return (
    <Panel title="Stream Health">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <Metric key={metric.id} label={metric.label} value={metric.value} tone={metric.status} />
        ))}
      </div>
    </Panel>
  );
}

export function AudioMixer({ channels }: { channels: AudioChannel[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {channels.map((channel) => (
        <div key={channel.id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{channel.label}</p>
            <Badge tone={channel.muted ? 'danger' : 'success'}>
              {channel.muted ? 'Muted' : channel.kind}
            </Badge>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${channel.level}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductionDock({
  channels,
  assets,
}: {
  channels: AudioChannel[];
  assets: ProductionAsset[];
}) {
  const assetGroups = ['media', 'lower_third', 'background', 'overlay'] as const;

  return (
    <Panel title="Production Dock">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Audio Mixer
          </p>
          <AudioMixer channels={channels} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {assetGroups.map((group) => (
            <div key={group} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {group.replace('_', ' ')}s
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {assets.filter((asset) => getAssetDockGroup(asset) === group).length}
              </p>
              <p className="text-xs text-slate-500">placeholder bin</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function GuestTile({ guest }: { guest: Guest }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4">
      <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-700 to-slate-950" />
      <p className="mt-3 font-medium">{guest.displayName}</p>
      <p className="text-xs text-slate-400">{guest.status}</p>
    </div>
  );
}

export function DestinationToggle({ destination }: { destination: Destination }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-800 p-4">
      <div>
        <p className="font-medium">{destination.label}</p>
        <p className="text-xs text-slate-400">{destination.platform}</p>
      </div>
      <Badge tone={destination.enabled ? 'success' : 'neutral'}>{destination.status}</Badge>
    </div>
  );
}

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  return (
    <article className="rounded-xl bg-slate-800/80 p-3">
      <p className="text-xs text-cyan-300">
        {message.authorName} · {message.platform}
      </p>
      <p className="text-sm text-slate-100">{message.body}</p>
    </article>
  );
}

export function StreamHealthCard({ health }: { health: StreamHealth }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <Metric label="Bitrate" value={`${health.bitrateKbps} kbps`} />
      <Metric label="Resolution" value={health.resolution} />
      <Metric label="Dropped" value={`${health.droppedFrames}`} />
      <Metric label="CPU" value={`${health.cpuPercent}%`} />
    </div>
  );
}

function getAssetDockGroup(asset: ProductionAsset) {
  return asset.type === 'video' || asset.type === 'image' ? 'media' : asset.type;
}

function Metric({
  label,
  value,
  tone = 'good',
}: {
  label: string;
  value: string;
  tone?: StreamHealthMetric['status'];
}) {
  const color =
    tone === 'critical'
      ? 'text-rose-300'
      : tone === 'warning'
        ? 'text-amber-300'
        : 'text-emerald-300';
  return (
    <div className="rounded-xl bg-slate-800 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`font-semibold ${color}`}>{value}</p>
    </div>
  );
}

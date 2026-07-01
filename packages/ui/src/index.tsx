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

type OutputKind = 'program' | 'vertical';

type RoutedStreamMap = Record<string, MediaStream | undefined>;

type LayerBox = {
  left: string;
  top: string;
  width: string;
  height: string;
};

const mediaLayoutLabels: Record<MediaLayoutPreset, string> = {
  full_screen: 'Full Screen',
  side_by_side: 'Side by Side',
  picture_in_picture: 'Picture in Picture',
  '2x2_grid': '2x2 Grid',
  speaker_focus: 'Speaker Focus',
};

const routeTypeLabels = {
  guest_camera: 'Guest Camera',
  guest_screen_share: 'Guest Screen',
  host_camera: 'Host Camera',
  media_source: 'Media Source',
  screen_share: 'Screen Share',
  placeholder: 'Placeholder',
} satisfies Record<MediaRoute['routeType'], string>;

const sourceBackgrounds: Record<SceneSourceType, string> = {
  camera: 'from-sky-500/25 to-slate-950/80',
  screen: 'from-violet-500/25 to-slate-950/80',
  media: 'from-emerald-500/25 to-slate-950/80',
  overlay: 'from-fuchsia-500/25 to-slate-950/80',
  browser: 'from-amber-500/25 to-slate-950/80',
  audio: 'from-rose-500/25 to-slate-950/80',
};

function sortedVisibleSources(sources: SceneSource[]) {
  return [...sources]
    .filter((source) => source.isVisible && source.visible !== false)
    .sort((a, b) => a.order - b.order);
}

function sortedRoutes(routes: MediaRoute[]) {
  return [...routes]
    .filter((route) => route.isActive)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const slotCompare = (a.layoutSlot ?? '').localeCompare(b.layoutSlot ?? '');
      return slotCompare || a.order - b.order;
    });
}

function programRoutes(routes: MediaRoute[]) {
  const onProgram = sortedRoutes(routes.filter((route) => route.isOnProgram));
  return onProgram.length ? onProgram : sortedRoutes(routes).slice(0, 1);
}

function verticalRoutes(routes: MediaRoute[]) {
  const explicit = sortedRoutes(routes.filter((route) => route.metadata?.onVertical === true));
  return explicit.length ? explicit : programRoutes(routes).slice(0, 1);
}

function routeConnectionState(route: MediaRoute) {
  const metadataState = route.metadata?.connectionState;
  if (typeof metadataState === 'string') return metadataState;
  return route.guest?.status ?? (route.isActive ? 'ready' : 'inactive');
}

function getLayerBox(
  preset: MediaLayoutPreset,
  index: number,
  total: number,
  output: OutputKind,
): LayerBox {
  if (output === 'vertical') {
    if (preset === 'side_by_side' && total > 1)
      return { left: '6%', top: `${8 + index * 42}%`, width: '88%', height: '38%' };
    if (preset === 'picture_in_picture' && index > 0)
      return { left: '56%', top: '8%', width: '36%', height: '22%' };
    if (preset === '2x2_grid')
      return {
        left: `${6 + (index % 2) * 45}%`,
        top: `${10 + Math.floor(index / 2) * 32}%`,
        width: '39%',
        height: '28%',
      };
    if (preset === 'speaker_focus' && index > 0)
      return { left: `${8 + ((index - 1) % 3) * 29}%`, top: '70%', width: '25%', height: '18%' };
    return { left: '6%', top: '10%', width: '88%', height: index === 0 ? '62%' : '22%' };
  }

  if (preset === 'side_by_side')
    return { left: `${3 + index * 48}%`, top: '13%', width: '45%', height: '68%' };
  if (preset === 'picture_in_picture' && index > 0)
    return { left: '68%', top: '58%', width: '25%', height: '26%' };
  if (preset === '2x2_grid')
    return {
      left: `${4 + (index % 2) * 47}%`,
      top: `${10 + Math.floor(index / 2) * 40}%`,
      width: '43%',
      height: '34%',
    };
  if (preset === 'speaker_focus' && index > 0)
    return { left: `${5 + ((index - 1) % 3) * 22}%`, top: '68%', width: '19%', height: '20%' };
  return {
    left: index === 0 ? '4%' : '70%',
    top: index === 0 ? '8%' : '62%',
    width: index === 0 ? '92%' : '24%',
    height: index === 0 ? '78%' : '24%',
  };
}

function routeCapacity(preset: MediaLayoutPreset) {
  return preset === 'full_screen'
    ? 1
    : preset === 'picture_in_picture'
      ? 2
      : preset === 'speaker_focus'
        ? 4
        : preset === '2x2_grid'
          ? 4
          : 2;
}

export function BroadcastCanvas({
  aspect,
  children,
}: {
  aspect: 'video' | 'vertical';
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-cyan-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.22),transparent_30%),linear-gradient(135deg,#0f172a,#020617)] shadow-inner shadow-black ${aspect === 'video' ? 'aspect-video rounded-2xl' : 'aspect-[9/16] rounded-[1.5rem]'}`}
    >
      {children}
    </div>
  );
}

export function SafeAreaOverlay({ label, output }: { label: string; output: OutputKind }) {
  return (
    <div
      className={`pointer-events-none absolute ${output === 'vertical' ? 'inset-x-6 inset-y-10' : 'inset-6'} z-30 flex items-start justify-center rounded-xl border border-dashed border-white/20 pt-1 text-[10px] uppercase tracking-[0.25em] text-white/35`}
    >
      {label}
    </div>
  );
}

export function LayerFrame({
  children,
  box,
  zIndex = 10,
}: {
  children: ReactNode;
  box: LayerBox;
  zIndex?: number;
}) {
  return (
    <div className="absolute" style={{ ...box, zIndex }}>
      {children}
    </div>
  );
}

function RoutedVideo({ stream }: { stream?: MediaStream | undefined }) {
  if (!stream) return null;
  return (
    <video
      ref={(element) => {
        if (element && element.srcObject !== stream) element.srcObject = stream;
      }}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function RoutedMediaTile({
  route,
  stream,
  output,
}: {
  route?: MediaRoute | undefined;
  stream?: MediaStream | undefined;
  output: OutputKind;
}) {
  if (!route) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/15 bg-slate-950/55 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
        Empty slot
      </div>
    );
  }
  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl shadow-black/35">
      <RoutedVideo stream={stream} />
      {!stream ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,.2),transparent_36%)] p-4 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              No media connected
            </p>
            <p className="mt-2 text-2xl font-black text-white">{route.displayName}</p>
            <p className="mt-1 text-xs text-slate-300">
              {routeTypeLabels[route.routeType]} · {routeConnectionState(route)}
            </p>
          </div>
        </div>
      ) : null}
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/55 p-2 backdrop-blur">
        <span className="mr-auto text-xs font-black text-white">{route.displayName}</span>
        <Badge tone={output === 'program' && route.isOnProgram ? 'live' : 'neutral'}>
          {output === 'program' ? 'Program' : 'Vertical'}
        </Badge>
        {route.isPinned ? <Badge tone="success">Pinned</Badge> : null}
        {route.isMuted ? <Badge tone="danger">Muted</Badge> : <Badge tone="success">Audio</Badge>}
        {route.layoutSlot ? <Badge tone="neutral">Slot {route.layoutSlot}</Badge> : null}
      </div>
    </div>
  );
}

export function CompositorLayer({
  route,
  box,
  stream,
  output,
  zIndex,
}: {
  route?: MediaRoute | undefined;
  box: LayerBox;
  stream?: MediaStream | undefined;
  output: OutputKind;
  zIndex: number;
}) {
  return (
    <LayerFrame box={box} zIndex={zIndex}>
      <RoutedMediaTile route={route} stream={stream} output={output} />
    </LayerFrame>
  );
}

function SourceLayers({ sources, compact = false }: { sources: SceneSource[]; compact?: boolean }) {
  const visibleSources = sortedVisibleSources(sources);
  if (!visibleSources.length)
    return (
      <div className="absolute inset-8 z-0 grid place-items-center rounded-xl border border-dashed border-white/15 text-sm font-semibold text-slate-400">
        No visible sources
      </div>
    );
  return (
    <div className="absolute inset-0 z-0">
      {visibleSources.map((source, index) => (
        <div
          key={source.id}
          className={`absolute flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br ${sourceBackgrounds[source.type]} p-3 text-white shadow-lg shadow-black/30 backdrop-blur`}
          style={{
            left: compact ? '8%' : `${5 + index * 3}%`,
            top: compact ? `${8 + index * 9}%` : `${8 + index * 6}%`,
            width: compact ? '84%' : `${78 - index * 4}%`,
            minHeight: compact ? 42 : 54,
            zIndex: index,
          }}
        >
          <span className="font-bold">{source.name}</span>
          <span className="flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">
            {source.isLocked ? '🔒 ' : ''}
            {sourceTypeLabels[source.type]}
          </span>
        </div>
      ))}
    </div>
  );
}

function SceneFooter({
  scene,
  output,
  layoutPreset,
}: {
  scene: Scene;
  output: OutputKind;
  layoutPreset: MediaLayoutPreset;
}) {
  return (
    <div className="absolute inset-x-5 bottom-5 z-40 rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">
        Active Scene · {output}
      </p>
      <p className="text-lg font-black text-white">{scene.name}</p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300">
        {typeLabels[scene.type]} · {mediaLayoutLabels[layoutPreset]}
      </p>
    </div>
  );
}

function BaseCompositor({
  scene,
  routes,
  layoutPreset,
  output,
  streams = {},
}: {
  scene: Scene;
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
  output: OutputKind;
  streams?: RoutedStreamMap | undefined;
}) {
  const selectedRoutes = output === 'vertical' ? verticalRoutes(routes) : programRoutes(routes);
  const capacity = routeCapacity(layoutPreset);
  const slots = Array.from({ length: capacity }, (_, index) => selectedRoutes[index]);
  return (
    <BroadcastCanvas aspect={output === 'vertical' ? 'vertical' : 'video'}>
      <SourceLayers sources={scene.sources} compact={output === 'vertical'} />
      {slots.map((route, index) => (
        <CompositorLayer
          key={route?.id ?? `empty-${index}`}
          route={route}
          stream={route ? streams[route.id] : undefined}
          output={output}
          box={getLayerBox(layoutPreset, index, slots.length, output)}
          zIndex={10 + index}
        />
      ))}
      <SafeAreaOverlay
        label={output === 'vertical' ? 'Mobile Safe' : 'Title Safe'}
        output={output}
      />
      <SceneFooter scene={scene} output={output} layoutPreset={layoutPreset} />
    </BroadcastCanvas>
  );
}

export function ProgramCompositor({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
}) {
  return (
    <BaseCompositor
      scene={scene}
      routes={routes}
      layoutPreset={layoutPreset}
      output="program"
      streams={streams}
    />
  );
}

export function VerticalCompositor({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
}) {
  return (
    <BaseCompositor
      scene={scene}
      routes={routes}
      layoutPreset={layoutPreset}
      output="vertical"
      streams={streams}
    />
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
  streams,
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
}) {
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Program 16:9</p>
          <h2 className="text-xl font-bold text-white">{scene.name}</h2>
          <p className="text-xs text-slate-400">Layout preset: {mediaLayoutLabels[layoutPreset]}</p>
        </div>
        <Badge tone="live">PROGRAM</Badge>
      </div>
      <ProgramCompositor
        scene={scene}
        routes={routes}
        layoutPreset={layoutPreset}
        streams={streams}
      />
    </Panel>
  );
}

export function VerticalPreview({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
}) {
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vertical 9:16</p>
          <h2 className="text-lg font-bold text-white">{scene.name}</h2>
          <p className="text-xs text-slate-400">Vertical route with program fallback</p>
        </div>
        <Badge tone="neutral">TikTok / Reels</Badge>
      </div>
      <div className="mx-auto max-h-[34rem]">
        <VerticalCompositor
          scene={scene}
          routes={routes}
          layoutPreset={layoutPreset}
          streams={streams}
        />
      </div>
    </Panel>
  );
}

function SafeZone({ label }: { label: string }) {
  return <SafeAreaOverlay label={label} output="program" />;
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

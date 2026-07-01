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
  previewSceneId,
  programSceneId,
}: {
  scene: Scene;
  index: number;
  total: number;
  onRename: ((sceneId: string, name: string) => void) | undefined;
  onSwitch: ((sceneId: string) => void) | undefined;
  onDuplicate: ((sceneId: string) => void) | undefined;
  onDelete: ((sceneId: string) => void) | undefined;
  onMove: ((sceneId: string, direction: 'up' | 'down') => void) | undefined;
  previewSceneId?: string | undefined;
  programSceneId?: string | undefined;
}) {
  const sceneLayout = scene.layout ?? 'picture_in_picture';
  const isProgram = scene.id === programSceneId || scene.isActive;
  const isPreview = scene.id === previewSceneId;

  return (
    <div
      className={`rounded-2xl border p-3 transition ${isProgram ? 'border-red-400 bg-red-500/10 shadow-lg shadow-red-950/20' : isPreview ? 'border-emerald-300 bg-emerald-300/10 shadow-lg shadow-emerald-950/20' : 'border-white/10 bg-slate-950/50 hover:bg-slate-800/80'}`}
    >
      <button className="w-full text-left" onClick={() => onSwitch?.(scene.id)} type="button">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{scene.name}</p>
            <p className="mt-1 text-xs text-slate-400">{layoutLabels[sceneLayout]}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone="neutral">{typeLabels[scene.type]}</Badge>
            {isProgram ? <Badge tone="live">● Program</Badge> : null}
            {isPreview ? <Badge tone="success">● Preview</Badge> : null}
            {!isProgram && !isPreview ? <Badge tone="neutral">Standby</Badge> : null}
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
  previewSceneId,
  programSceneId,
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
  previewSceneId?: string | undefined;
  programSceneId?: string | undefined;
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
      <div className="mb-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-300">
        Select a scene to stage it in Preview. Use Take/Cut/Fade from the operator toolbar to move
        Preview to Program.
      </div>
      <div className="space-y-3">
        {scenes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No scenes yet. Add a scene to build your rundown.
          </p>
        ) : null}
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
            previewSceneId={previewSceneId}
            programSceneId={programSceneId}
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

type RouteTheme = {
  gradient: string;
  ring: string;
  accent: string;
  chip: string;
  glyph: string;
};

const routeThemes: Record<MediaRoute['routeType'], RouteTheme> = {
  guest_camera: {
    gradient: 'from-sky-500/35 via-slate-900 to-slate-950',
    ring: 'border-sky-300/45',
    accent: 'text-sky-200',
    chip: 'bg-sky-400/20 text-sky-100 ring-sky-300/40',
    glyph: '🎥',
  },
  guest_screen_share: {
    gradient: 'from-violet-500/35 via-slate-900 to-slate-950',
    ring: 'border-violet-300/45',
    accent: 'text-violet-200',
    chip: 'bg-violet-400/20 text-violet-100 ring-violet-300/40',
    glyph: '🖥️',
  },
  host_camera: {
    gradient: 'from-emerald-500/35 via-slate-900 to-slate-950',
    ring: 'border-emerald-300/45',
    accent: 'text-emerald-200',
    chip: 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/40',
    glyph: '⭐',
  },
  media_source: {
    gradient: 'from-amber-500/35 via-slate-900 to-slate-950',
    ring: 'border-amber-300/45',
    accent: 'text-amber-200',
    chip: 'bg-amber-400/20 text-amber-100 ring-amber-300/40',
    glyph: '🎬',
  },
  screen_share: {
    gradient: 'from-indigo-500/35 via-slate-900 to-slate-950',
    ring: 'border-indigo-300/45',
    accent: 'text-indigo-200',
    chip: 'bg-indigo-400/20 text-indigo-100 ring-indigo-300/40',
    glyph: '🖥️',
  },
  placeholder: {
    gradient: 'from-slate-600/40 via-slate-900 to-slate-950',
    ring: 'border-slate-400/35',
    accent: 'text-slate-200',
    chip: 'bg-slate-500/25 text-slate-100 ring-slate-300/25',
    glyph: '▢',
  },
};

type SourceTheme = { glyph: string; ring: string; accent: string };

const sourceThemes: Record<SceneSourceType, SourceTheme> = {
  camera: { glyph: '🎥', ring: 'border-sky-300/45', accent: 'text-sky-100' },
  screen: { glyph: '🖥️', ring: 'border-violet-300/45', accent: 'text-violet-100' },
  media: { glyph: '🎬', ring: 'border-emerald-300/45', accent: 'text-emerald-100' },
  overlay: { glyph: '✨', ring: 'border-fuchsia-300/45', accent: 'text-fuchsia-100' },
  browser: { glyph: '🌐', ring: 'border-amber-300/45', accent: 'text-amber-100' },
  audio: { glyph: '🎧', ring: 'border-rose-300/45', accent: 'text-rose-100' },
};

type TileSize = 'lg' | 'md' | 'sm';

type ConnectionMeta = { label: string; dot: string; pulse: boolean };

function humanizeState(state: string): string {
  return (
    state
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
      .join(' ') || 'Unknown'
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function connectionMeta(state: string): ConnectionMeta {
  switch (state) {
    case 'on_air':
      return { label: 'On Air', dot: 'bg-red-400', pulse: true };
    case 'connected':
      return { label: 'Connected', dot: 'bg-emerald-400', pulse: true };
    case 'ready':
      return { label: 'Ready', dot: 'bg-emerald-400', pulse: false };
    case 'green_room':
      return { label: 'Green Room', dot: 'bg-amber-400', pulse: false };
    case 'muted':
      return { label: 'Muted', dot: 'bg-amber-400', pulse: false };
    case 'reconnecting':
      return { label: 'Reconnecting', dot: 'bg-amber-400', pulse: true };
    case 'waiting':
    case 'invited':
      return { label: humanizeState(state), dot: 'bg-slate-400', pulse: false };
    case 'disconnected':
    case 'rejected':
    case 'removed':
      return { label: humanizeState(state), dot: 'bg-rose-400', pulse: false };
    case 'inactive':
      return { label: 'Inactive', dot: 'bg-slate-500', pulse: false };
    default:
      return { label: humanizeState(state), dot: 'bg-slate-400', pulse: false };
  }
}

function tileSize(preset: MediaLayoutPreset, index: number): TileSize {
  if (preset === 'full_screen') return 'lg';
  if (preset === 'picture_in_picture' || preset === 'speaker_focus')
    return index === 0 ? 'lg' : 'sm';
  return 'md';
}

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

function dedupeById(routes: MediaRoute[]) {
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.id)) return false;
    seen.add(route.id);
    return true;
  });
}

// Fill the program output up to the layout capacity. Routes explicitly sent to
// program come first, then any other active routes back-fill the remaining
// slots so a multi-slot layout is not left mostly empty when live sources exist.
function programRoutes(routes: MediaRoute[], capacity: number) {
  const active = sortedRoutes(routes);
  const onProgram = active.filter((route) => route.isOnProgram);
  const ordered = dedupeById([...onProgram, ...active]);
  return ordered.slice(0, Math.max(capacity, 1));
}

// Vertical mirrors program, but any route flagged for vertical takes priority so
// the 9:16 output can diverge from the horizontal program when desired.
function verticalRoutes(routes: MediaRoute[], capacity: number) {
  const active = sortedRoutes(routes);
  const onVertical = active.filter((route) => route.metadata?.onVertical === true);
  const ordered = dedupeById([...onVertical, ...programRoutes(routes, capacity)]);
  return ordered.slice(0, Math.max(capacity, 1));
}

function routeConnectionState(route: MediaRoute) {
  const metadataState = route.metadata?.connectionState;
  if (typeof metadataState === 'string') return metadataState;
  return route.guest?.status ?? (route.isActive ? 'ready' : 'inactive');
}

// The canvas reserves a top band for the HUD and a bottom band for the scene
// footer. Tiles are laid out inside this content region so their own badges and
// footers never collide with the canvas chrome.
const CONTENT_REGION = { top: 13, bottom: 85, left: 3, right: 97 } as const;
const REGION_HEIGHT = CONTENT_REGION.bottom - CONTENT_REGION.top;
const REGION_WIDTH = CONTENT_REGION.right - CONTENT_REGION.left;

// Map a fractional rectangle (0..1) within the content region to CSS percentages.
function regionBox(fx: number, fy: number, fw: number, fh: number): LayerBox {
  return {
    left: `${CONTENT_REGION.left + fx * REGION_WIDTH}%`,
    top: `${CONTENT_REGION.top + fy * REGION_HEIGHT}%`,
    width: `${fw * REGION_WIDTH}%`,
    height: `${fh * REGION_HEIGHT}%`,
  };
}

function getLayerBox(preset: MediaLayoutPreset, index: number, output: OutputKind): LayerBox {
  if (output === 'vertical') {
    if (preset === 'side_by_side') return regionBox(0, index * 0.51, 1, 0.49);
    if (preset === 'picture_in_picture')
      return index === 0 ? regionBox(0, 0, 1, 1) : regionBox(0.6, 0.03, 0.37, 0.22);
    if (preset === '2x2_grid')
      return regionBox((index % 2) * 0.51, Math.floor(index / 2) * 0.51, 0.49, 0.49);
    if (preset === 'speaker_focus')
      return index === 0
        ? regionBox(0, 0, 1, 0.66)
        : regionBox(((index - 1) % 3) * 0.345, 0.7, 0.31, 0.28);
    return regionBox(0, 0, 1, 1);
  }

  if (preset === 'side_by_side') return regionBox(index * 0.51, 0, 0.49, 1);
  if (preset === 'picture_in_picture')
    return index === 0 ? regionBox(0, 0, 1, 1) : regionBox(0.69, 0.66, 0.29, 0.32);
  if (preset === '2x2_grid')
    return regionBox((index % 2) * 0.51, Math.floor(index / 2) * 0.51, 0.49, 0.49);
  if (preset === 'speaker_focus')
    return index === 0
      ? regionBox(0, 0, 0.73, 1)
      : regionBox(0.76, (index - 1) * 0.345, 0.24, 0.32);
  return regionBox(0, 0, 1, 1);
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

export function SafeAreaOverlay({ output }: { label?: string; output: OutputKind }) {
  return (
    <div
      className={`pointer-events-none absolute ${output === 'vertical' ? 'inset-x-5 inset-y-8' : 'inset-4'} z-30 rounded-xl border border-dashed border-white/10`}
    />
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
    <div className="absolute transition-all duration-500 ease-out" style={{ ...box, zIndex }}>
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

function SimulatedFeed({
  route,
  theme,
  size,
}: {
  route: MediaRoute;
  theme: RouteTheme;
  size: TileSize;
}) {
  const big = size === 'lg';
  const small = size === 'sm';
  // The centered content clears the top badge row and the bottom identity
  // footer so nothing overlaps. Name/type live in the footer to avoid duplication.
  const contentInset = big ? 'top-9 bottom-14' : small ? 'top-5 bottom-8' : 'top-8 bottom-11';
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,.16) 0 2px, transparent 2px 10px)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.12),transparent_60%)]" />
      <div
        className={`absolute inset-x-0 ${contentInset} flex flex-col items-center justify-center gap-1.5 px-3 text-center`}
      >
        <div
          className={`grid shrink-0 place-items-center rounded-full border ${theme.ring} bg-slate-950/60 font-black ${theme.accent} ${
            big ? 'h-16 w-16 text-2xl' : small ? 'h-7 w-7 text-[9px]' : 'h-9 w-9 text-xs'
          }`}
        >
          {initials(route.displayName)}
        </div>
        {big ? (
          <>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${theme.chip}`}
            >
              <span>{theme.glyph}</span>
              {routeTypeLabels[route.routeType]}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/40">
              Simulated Feed
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function EmptySlot({
  output,
  size,
  hasGuests,
}: {
  output: OutputKind;
  size: TileSize;
  hasGuests: boolean;
}) {
  const big = size === 'lg';
  const label = hasGuests ? 'Assign guest to Program' : 'Empty slot';
  const sub = hasGuests
    ? 'Send a guest here from Media Routing'
    : output === 'vertical'
      ? 'Route a vertical source'
      : 'Route a source to fill';
  return (
    <div className="grid h-full w-full place-items-center rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/40">
      <div className="flex flex-col items-center gap-1.5 px-3 text-center">
        <div
          className={`grid place-items-center rounded-full border border-dashed border-white/25 font-black text-white/45 ${
            big ? 'h-12 w-12 text-2xl' : 'h-8 w-8 text-base'
          }`}
        >
          +
        </div>
        <p
          className={`font-black uppercase tracking-wide text-white/55 ${big ? 'text-xs' : 'text-[10px]'}`}
        >
          {label}
        </p>
        {big ? <p className="text-[10px] text-white/35">{sub}</p> : null}
      </div>
    </div>
  );
}

function CanvasHud({
  output,
  layoutPreset,
}: {
  output: OutputKind;
  layoutPreset: MediaLayoutPreset;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1 backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${output === 'program' ? 'bg-red-500 animate-pulse' : 'bg-fuchsia-400'}`}
        />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
          {output === 'program' ? 'Program · 16:9' : 'Vertical · 9:16'}
        </span>
      </span>
      <span className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
        {mediaLayoutLabels[layoutPreset]}
      </span>
    </div>
  );
}

export function RoutedMediaTile({
  route,
  stream,
  output,
  size = 'md',
  hasGuests = false,
}: {
  route?: MediaRoute | undefined;
  stream?: MediaStream | undefined;
  output: OutputKind;
  size?: TileSize;
  hasGuests?: boolean;
}) {
  if (!route) {
    return <EmptySlot output={output} size={size} hasGuests={hasGuests} />;
  }
  const theme = routeThemes[route.routeType];
  const conn = connectionMeta(routeConnectionState(route));
  const onVertical = route.metadata?.onVertical === true;
  const big = size === 'lg';
  const small = size === 'sm';
  return (
    <div
      className={`group relative h-full w-full overflow-hidden rounded-2xl border ${theme.ring} bg-gradient-to-br ${theme.gradient} shadow-2xl shadow-black/45`}
    >
      <RoutedVideo stream={stream} />
      {!stream ? <SimulatedFeed route={route} theme={theme} size={size} /> : null}

      <div
        className={`absolute left-2 top-2 z-20 flex flex-wrap items-center gap-1 ${small ? 'origin-top-left scale-90' : ''}`}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ${theme.chip}`}
        >
          <span>{theme.glyph}</span>
          {!small ? routeTypeLabels[route.routeType] : null}
        </span>
        {route.isPinned ? (
          <span className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-100 ring-1 ring-emerald-300/30">
            📌 Pin
          </span>
        ) : null}
        {output === 'program' && onVertical ? (
          <span className="rounded-md bg-fuchsia-500/25 px-1.5 py-0.5 text-[10px] font-black uppercase text-fuchsia-100 ring-1 ring-fuchsia-300/30">
            ▽ Vert
          </span>
        ) : null}
      </div>

      <div
        className={`absolute right-2 top-2 z-20 flex flex-col items-end gap-1 ${small ? 'origin-top-right scale-90' : ''}`}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/10 backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${conn.dot} ${conn.pulse ? 'animate-pulse' : ''}`}
          />
          {conn.label}
        </span>
        {output === 'program' && route.isOnProgram ? (
          <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/40">
            ● Program
          </span>
        ) : null}
        {output === 'vertical' ? (
          <span
            className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${onVertical ? 'bg-fuchsia-500 text-white' : 'bg-white/10 text-slate-200'}`}
          >
            {onVertical ? '● Vertical' : 'Fallback'}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-2 bottom-2 z-20 flex items-end justify-between gap-2 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur">
        <div className="min-w-0">
          <p
            className={`truncate font-black text-white ${big ? 'text-lg' : small ? 'text-[11px]' : 'text-sm'}`}
          >
            {route.displayName}
          </p>
          {!small ? (
            <p className={`truncate text-[10px] uppercase tracking-wide ${theme.accent}`}>
              {routeTypeLabels[route.routeType]}
              {route.layoutSlot ? ` · Slot ${route.layoutSlot}` : ''}
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${route.isMuted ? 'bg-rose-500/80 text-white' : 'bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30'}`}
        >
          {route.isMuted ? '🔇 Mute' : '🔊 Live'}
        </span>
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
  size = 'md',
  hasGuests = false,
}: {
  route?: MediaRoute | undefined;
  box: LayerBox;
  stream?: MediaStream | undefined;
  output: OutputKind;
  zIndex: number;
  size?: TileSize;
  hasGuests?: boolean;
}) {
  return (
    <LayerFrame box={box} zIndex={zIndex}>
      <RoutedMediaTile
        route={route}
        stream={stream}
        output={output}
        size={size}
        hasGuests={hasGuests}
      />
    </LayerFrame>
  );
}

function SourceLayers({ sources, output }: { sources: SceneSource[]; output: OutputKind }) {
  const visibleSources = sortedVisibleSources(sources);
  if (!visibleSources.length) return null;
  return (
    <div
      className={`pointer-events-none absolute z-20 flex flex-col gap-1.5 ${output === 'vertical' ? 'inset-x-4 top-16' : 'left-4 top-16 w-56'}`}
    >
      <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
        Scene Layers
      </span>
      {visibleSources.map((source, index) => {
        const theme = sourceThemes[source.type];
        return (
          <div
            key={source.id}
            className={`flex items-center justify-between gap-2 rounded-lg border border-dashed ${theme.ring} bg-slate-950/70 px-2 py-1 backdrop-blur`}
            style={{ zIndex: 20 + index }}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-white">
              <span>{theme.glyph}</span>
              <span className="truncate">{source.name}</span>
            </span>
            <span
              className={`flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-wide ${theme.accent}`}
            >
              {source.isLocked ? <span title="Locked">🔒</span> : null}
              {sourceTypeLabels[source.type]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SceneFooter({
  scene,
  layoutPreset,
  routeCount,
  hasGuests,
}: {
  scene: Scene;
  layoutPreset: MediaLayoutPreset;
  routeCount: number;
  hasGuests: boolean;
}) {
  const status = routeCount > 0 ? `${routeCount} on air` : hasGuests ? 'Assign guests' : 'Standby';
  return (
    <div className="absolute inset-x-3 bottom-2 z-40 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/55 px-3 py-1.5 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black text-white">{scene.name}</p>
        <p className="truncate text-[9px] uppercase tracking-[0.16em] text-slate-300">
          {typeLabels[scene.type]} · {mediaLayoutLabels[layoutPreset]}
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-100">
        {status}
      </span>
    </div>
  );
}

function BaseCompositor({
  scene,
  routes,
  layoutPreset,
  output,
  streams = {},
  guests = [],
}: {
  scene: Scene;
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
  output: OutputKind;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  const capacity = routeCapacity(layoutPreset);
  const selectedRoutes =
    output === 'vertical' ? verticalRoutes(routes, capacity) : programRoutes(routes, capacity);
  const slots = Array.from({ length: capacity }, (_, index) => selectedRoutes[index]);
  const hasGuests = guests.length > 0;
  const activeRouteCount = selectedRoutes.filter(Boolean).length;
  return (
    <BroadcastCanvas aspect={output === 'vertical' ? 'vertical' : 'video'}>
      <CanvasHud output={output} layoutPreset={layoutPreset} />
      {slots.map((route, index) => (
        <CompositorLayer
          key={route?.id ?? `empty-${index}`}
          route={route}
          stream={route ? streams[route.id] : undefined}
          output={output}
          size={tileSize(layoutPreset, index)}
          hasGuests={hasGuests}
          box={getLayerBox(layoutPreset, index, output)}
          zIndex={10 + index}
        />
      ))}
      <SourceLayers sources={scene.sources} output={output} />
      <SafeAreaOverlay output={output} />
      <SceneFooter
        scene={scene}
        layoutPreset={layoutPreset}
        routeCount={activeRouteCount}
        hasGuests={hasGuests}
      />
    </BroadcastCanvas>
  );
}

export function ProgramCompositor({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
  guests = [],
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  return (
    <BaseCompositor
      scene={scene}
      routes={routes}
      layoutPreset={layoutPreset}
      output="program"
      streams={streams}
      guests={guests}
    />
  );
}

export function VerticalCompositor({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
  guests = [],
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  return (
    <BaseCompositor
      scene={scene}
      routes={routes}
      layoutPreset={layoutPreset}
      output="vertical"
      streams={streams}
      guests={guests}
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

function BroadcastMonitorFrame({
  label,
  scene,
  meta,
  status,
  statusTone = 'neutral',
  children,
  className = '',
}: {
  label: string;
  scene: Scene;
  meta: ReactNode;
  status: ReactNode;
  statusTone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-slate-700/70 bg-slate-950/95 shadow-xl shadow-black/25 ${className}`}
    >
      <div className="flex min-h-8 items-center justify-between gap-2 border-b border-slate-800/90 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-black text-slate-100">{label}</span>
          <span className="hidden text-slate-500 sm:inline">{meta}</span>
          <span className="truncate normal-case tracking-normal text-slate-400">{scene.name}</span>
        </div>
        <Badge tone={statusTone}>{status}</Badge>
      </div>
      <div className="bg-black p-1">{children}</div>
    </section>
  );
}

export function ProgramPreview({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
  guests = [],
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  const onProgramCount = routes.filter((route) => route.isActive && route.isOnProgram).length;
  return (
    <BroadcastMonitorFrame
      label="PROGRAM"
      scene={scene}
      meta="1920×1080 · 60 FPS"
      status={onProgramCount > 0 ? 'LIVE' : 'PROGRAM'}
      statusTone="live"
    >
      <ProgramCompositor
        scene={scene}
        routes={routes}
        layoutPreset={layoutPreset}
        streams={streams}
        guests={guests}
      />
    </BroadcastMonitorFrame>
  );
}

export function PreviewMonitor({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
  guests = [],
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  return (
    <BroadcastMonitorFrame
      label="PREVIEW"
      scene={scene}
      meta={mediaLayoutLabels[layoutPreset]}
      status="READY"
      statusTone="success"
    >
      <ProgramCompositor
        scene={scene}
        routes={routes}
        layoutPreset={layoutPreset}
        streams={streams}
        guests={guests}
      />
    </BroadcastMonitorFrame>
  );
}

export function VerticalPreview({
  scene,
  routes = [],
  layoutPreset = 'full_screen',
  streams,
  guests = [],
}: {
  scene: Scene;
  routes?: MediaRoute[];
  layoutPreset?: MediaLayoutPreset;
  streams?: RoutedStreamMap | undefined;
  guests?: Guest[];
}) {
  const hasVerticalRoute = routes.some(
    (route) => route.isActive && route.metadata?.onVertical === true,
  );
  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vertical 9:16</p>
          <h2 className="text-lg font-bold text-white">{scene.name}</h2>
          <p className="text-xs text-slate-400">
            {hasVerticalRoute ? 'Dedicated vertical route' : 'Mirroring program route'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={hasVerticalRoute ? 'warning' : 'neutral'}>
            {hasVerticalRoute ? 'VERTICAL' : 'FALLBACK'}
          </Badge>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            TikTok / Reels
          </span>
        </div>
      </div>
      <div className="mx-auto max-h-[34rem]">
        <VerticalCompositor
          scene={scene}
          routes={routes}
          layoutPreset={layoutPreset}
          streams={streams}
          guests={guests}
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

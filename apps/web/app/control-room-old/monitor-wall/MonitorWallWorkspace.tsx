'use client';

import { memo, useCallback, useMemo, useState } from 'react';

type LayoutPreset = '2 View' | '4 View' | '6 View' | '8 View' | '9 View' | '12 View' | '16 View' | '24 View' | 'Custom';
type SourceType = 'program' | 'preview' | 'camera' | 'screen' | 'media' | 'browser' | 'replay' | 'graphics' | 'audio' | 'status' | 'clock' | 'system';
type Tally = 'program' | 'preview' | 'recording' | 'streaming' | 'offline' | 'none';
type SafeArea = 'titleSafe' | 'actionSafe' | 'centerCross' | 'thirds' | 'grid';

type Source = {
  id: string;
  label: string;
  type: SourceType;
  state: 'live' | 'standby' | 'recording' | 'streaming' | 'offline';
  fps: number;
  resolution: string;
  latencyMs: number;
  droppedFrames: number;
  cpu: number;
  gpu: number;
  muted?: boolean;
  level: number;
  metadata: Record<string, string | number | boolean>;
};

type Tile = {
  id: string;
  sourceId: string;
  label: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | 'fill';
  borderColor: string;
  showAudio: boolean;
  pinned: boolean;
  locked: boolean;
  hidden: boolean;
};

type Layout = {
  id: string;
  name: string;
  preset: LayoutPreset;
  favorite: boolean;
  tiles: Tile[];
  preferences: { safeAreas: SafeArea[]; virtualizeInactiveTiles: boolean; throttleHiddenTiles: boolean; reuseStreams: boolean };
  inspectorMetadata: Record<string, string | number | boolean>;
};

const presetCounts: Record<LayoutPreset, number> = { '2 View': 2, '4 View': 4, '6 View': 6, '8 View': 8, '9 View': 9, '12 View': 12, '16 View': 16, '24 View': 24, Custom: 10 };
const tallyStyles: Record<Tally, string> = { program: 'border-red-500 text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.45)]', preview: 'border-green-500 text-green-100 shadow-[0_0_22px_rgba(34,197,94,0.35)]', recording: 'border-yellow-400 text-yellow-100', streaming: 'border-blue-400 text-blue-100', offline: 'border-zinc-500 text-zinc-300', none: 'border-zinc-700 text-zinc-100' };
const sourceTypes: SourceType[] = ['program', 'preview', 'camera', 'screen', 'media', 'browser', 'replay', 'graphics', 'audio', 'status', 'clock', 'system'];

const sources: Source[] = [
  { id: 'program', label: 'Program', type: 'program', state: 'live', fps: 59.94, resolution: '1920×1080', latencyMs: 32, droppedFrames: 0, cpu: 14, gpu: 22, level: 74, metadata: { sceneId: 'scene-main', outputBus: 'program' } },
  { id: 'preview', label: 'Preview', type: 'preview', state: 'standby', fps: 59.94, resolution: '1920×1080', latencyMs: 28, droppedFrames: 0, cpu: 9, gpu: 17, level: 42, metadata: { sceneId: 'scene-next', outputBus: 'preview' } },
  { id: 'cam-1', label: 'Camera 1', type: 'camera', state: 'live', fps: 59.94, resolution: '3840×2160', latencyMs: 45, droppedFrames: 1, cpu: 7, gpu: 12, level: 55, metadata: { device: 'DeckLink Quad', tally: 'program' } },
  { id: 'cam-2', label: 'Camera 2', type: 'camera', state: 'standby', fps: 59.94, resolution: '3840×2160', latencyMs: 47, droppedFrames: 0, cpu: 7, gpu: 11, level: 35, metadata: { device: 'NDI HX', tally: 'preview' } },
  { id: 'screen-1', label: 'Screen Share', type: 'screen', state: 'live', fps: 30, resolution: '2560×1440', latencyMs: 62, droppedFrames: 3, cpu: 11, gpu: 19, level: 20, metadata: { capture: 'window', app: 'Slides' } },
  { id: 'media-a', label: 'Media Player A', type: 'media', state: 'recording', fps: 29.97, resolution: '1920×1080', latencyMs: 18, droppedFrames: 0, cpu: 5, gpu: 8, level: 69, metadata: { clip: 'intro-sting.mov', playlist: 'show-open' } },
  { id: 'browser-lower', label: 'Browser Graphics', type: 'browser', state: 'streaming', fps: 60, resolution: '1920×1080', latencyMs: 40, droppedFrames: 0, cpu: 8, gpu: 15, level: 0, muted: true, metadata: { url: 'graphics://lower-thirds', transparent: true } },
  { id: 'replay-1', label: 'Replay Output', type: 'replay', state: 'standby', fps: 59.94, resolution: '1920×1080', latencyMs: 24, droppedFrames: 0, cpu: 6, gpu: 10, level: 48, metadata: { bank: 'A', angle: 'wide' } },
  { id: 'graphics-preview', label: 'Graphics Preview', type: 'graphics', state: 'standby', fps: 60, resolution: '1920×1080', latencyMs: 16, droppedFrames: 0, cpu: 4, gpu: 9, level: 0, muted: true, metadata: { layer: 'preview', template: 'scorebug' } },
  { id: 'audio-master', label: 'Master Audio', type: 'audio', state: 'live', fps: 0, resolution: '48 kHz', latencyMs: 8, droppedFrames: 0, cpu: 3, gpu: 0, level: 82, metadata: { bus: 'master', loudness: '-16 LUFS' } },
  { id: 'recording', label: 'Recording Status', type: 'status', state: 'recording', fps: 0, resolution: 'ProRes 422', latencyMs: 0, droppedFrames: 0, cpu: 10, gpu: 0, level: 0, metadata: { path: '/recordings/show-2026-07-06.mov', elapsed: '00:42:18' } },
  { id: 'streaming', label: 'Streaming Status', type: 'status', state: 'streaming', fps: 59.94, resolution: '1080p60', latencyMs: 2100, droppedFrames: 5, cpu: 13, gpu: 6, level: 76, metadata: { destinations: 3, bitrate: '8.5 Mbps' } },
  { id: 'clock', label: 'Clock', type: 'clock', state: 'live', fps: 0, resolution: 'UTC', latencyMs: 0, droppedFrames: 0, cpu: 1, gpu: 0, level: 0, metadata: { showTimecode: '01:12:44:08', wallClock: '2026-07-06 00:00 UTC' } },
  { id: 'cpu', label: 'CPU', type: 'system', state: 'live', fps: 0, resolution: '24 cores', latencyMs: 0, droppedFrames: 0, cpu: 42, gpu: 0, level: 0, metadata: { packageTemp: '61°C', renderThreads: 12 } },
  { id: 'gpu', label: 'GPU', type: 'system', state: 'live', fps: 0, resolution: 'RTX', latencyMs: 0, droppedFrames: 0, cpu: 0, gpu: 58, level: 0, metadata: { vram: '7.2 GB', encoder: 'NVENC' } },
  { id: 'drops', label: 'Dropped Frames', type: 'system', state: 'offline', fps: 0, resolution: 'session', latencyMs: 0, droppedFrames: 9, cpu: 0, gpu: 0, level: 0, metadata: { render: 3, network: 6 } },
];
const fallbackSource = sources[0] as Source;

function createLayout(preset: LayoutPreset, name = `${preset} Monitor Wall`): Layout {
  const count = presetCounts[preset];
  return { id: `layout-${preset.toLowerCase().replace(/\W+/g, '-')}-${Date.now()}`, name, preset, favorite: preset === '9 View', tiles: Array.from({ length: count }, (_, index) => { const source = sources[index % sources.length] ?? fallbackSource; return ({ id: `tile-${index + 1}`, sourceId: source.id, label: source.label, aspectRatio: '16:9', borderColor: '#38bdf8', showAudio: true, pinned: index < 2, locked: false, hidden: false }); }), preferences: { safeAreas: ['titleSafe', 'actionSafe', 'centerCross'], virtualizeInactiveTiles: true, throttleHiddenTiles: true, reuseStreams: true }, inspectorMetadata: { version: '3.11', persistedState: 'layouts,tile assignments,preferences,inspector metadata', runtimeVideoPersisted: false } };
}

function getTally(source: Source): Tally {
  if (source.state === 'offline') return 'offline';
  if (source.type === 'program' || source.metadata.tally === 'program') return 'program';
  if (source.type === 'preview' || source.metadata.tally === 'preview') return 'preview';
  if (source.state === 'recording') return 'recording';
  if (source.state === 'streaming') return 'streaming';
  return 'none';
}

const AudioMeter = memo(function AudioMeter({ level }: { level: number }) {
  return <div className="h-2 rounded-full bg-zinc-900"><div className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-500" style={{ width: `${Math.min(100, level)}%` }} /></div>;
});

const SafeAreaOverlay = memo(function SafeAreaOverlay({ areas }: { areas: SafeArea[] }) {
  return <div className="pointer-events-none absolute inset-0">{areas.includes('titleSafe') ? <div className="absolute inset-[10%] border border-white/30" /> : null}{areas.includes('actionSafe') ? <div className="absolute inset-[5%] border border-white/20" /> : null}{areas.includes('centerCross') ? <><div className="absolute left-1/2 top-[42%] h-[16%] border-l border-cyan-300/50" /><div className="absolute left-[42%] top-1/2 w-[16%] border-t border-cyan-300/50" /></> : null}{areas.includes('thirds') ? <><div className="absolute left-1/3 top-0 h-full border-l border-amber-300/30" /><div className="absolute left-2/3 top-0 h-full border-l border-amber-300/30" /><div className="absolute left-0 top-1/3 w-full border-t border-amber-300/30" /><div className="absolute left-0 top-2/3 w-full border-t border-amber-300/30" /></> : null}{areas.includes('grid') ? <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.10)_1px,transparent_1px)] bg-[size:20%_20%]" /> : null}</div>;
});

const MonitorTile = memo(function MonitorTile({ tile, source, safeAreas, fullscreen, onAssign, onSelect, onFullscreen, onSwap }: { tile: Tile; source: Source; safeAreas: SafeArea[]; fullscreen: boolean; onAssign: (tileId: string, sourceId: string) => void; onSelect: (tileId: string) => void; onFullscreen: (tileId: string) => void; onSwap: (fromTileId: string, toTileId: string) => void }) {
  const tally = getTally(source);
  if (tile.hidden && !fullscreen) return <button className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-3 text-left text-xs text-zinc-500" onClick={() => onSelect(tile.id)}>Hidden tile throttled</button>;
  return <section className={`group relative overflow-hidden rounded-xl border-2 bg-zinc-950 ${tallyStyles[tally]} ${fullscreen ? 'fixed inset-4 z-50' : ''}`} draggable={!tile.locked} onDragStart={(event) => event.dataTransfer.setData('text/plain', tile.id)} onDrop={(event) => { event.preventDefault(); onSwap(event.dataTransfer.getData('text/plain'), tile.id); }} onDragOver={(event) => event.preventDefault()} onDoubleClick={() => onFullscreen(tile.id)} onClick={() => onSelect(tile.id)}><div className="aspect-video bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,.35),transparent_30%),linear-gradient(135deg,#111827,#020617)]"><SafeAreaOverlay areas={safeAreas} /><div className="absolute inset-0 flex items-center justify-center text-4xl font-black uppercase tracking-[0.2em] text-white/15">{source.type}</div></div><div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-bold uppercase">{tile.label}</div><div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs uppercase">{tally}</div><div className="absolute bottom-0 left-0 right-0 space-y-1 bg-black/75 p-2 text-[11px]"><div className="flex items-center justify-between"><select aria-label={`Source for ${tile.label}`} className="max-w-[55%] rounded bg-zinc-900 px-1 py-0.5" value={tile.sourceId} onChange={(event) => onAssign(tile.id, event.target.value)}>{sources.map((available) => <option key={available.id} value={available.id}>{available.label}</option>)}</select><span>{source.fps || '—'} FPS · {source.resolution}</span></div>{tile.showAudio ? <AudioMeter level={source.level} /> : null}<div className="flex justify-between text-zinc-300"><span>{source.latencyMs} ms latency · {source.droppedFrames} drops</span><span>{source.muted ? '🔇' : '🔊'} {source.state === 'offline' ? '⚠ offline' : ''}</span></div></div></section>;
});

export function MonitorWallWorkspace() {
  const [layouts, setLayouts] = useState<Layout[]>(() => [createLayout('9 View', 'Main Production Wall'), createLayout('16 View', 'Engineering Wall'), createLayout('4 View', 'Producer Focus')]);
  const [activeLayoutId, setActiveLayoutId] = useState(layouts[0]?.id ?? '');
  const [selectedTileId, setSelectedTileId] = useState('tile-1');
  const [fullscreenTileId, setFullscreenTileId] = useState<string | null>(null);
  const activeLayout = layouts.find((layout) => layout.id === activeLayoutId) ?? layouts[0] ?? createLayout('9 View');
  const selectedTile = activeLayout.tiles.find((tile) => tile.id === selectedTileId) ?? activeLayout.tiles[0];
  const selectedSource = sources.find((source) => source.id === selectedTile?.sourceId) ?? fallbackSource;
  const columns = useMemo(() => activeLayout.preset === '2 View' ? 'grid-cols-2' : activeLayout.preset === '24 View' ? 'grid-cols-6' : activeLayout.tiles.length > 12 ? 'grid-cols-4' : activeLayout.tiles.length > 8 ? 'grid-cols-4' : activeLayout.tiles.length > 4 ? 'grid-cols-3' : 'grid-cols-2', [activeLayout.preset, activeLayout.tiles.length]);
  const updateActiveLayout = useCallback((updater: (layout: Layout) => Layout) => setLayouts((current) => current.map((layout) => layout.id === activeLayout.id ? updater(layout) : layout)), [activeLayout.id]);
  const assignSource = useCallback((tileId: string, sourceId: string) => updateActiveLayout((layout) => ({ ...layout, tiles: layout.tiles.map((tile) => tile.id === tileId ? { ...tile, sourceId, label: sources.find((source) => source.id === sourceId)?.label ?? tile.label } : tile) })), [updateActiveLayout]);
  const swapTiles = useCallback((fromTileId: string, toTileId: string) => updateActiveLayout((layout) => { const from = layout.tiles.find((tile) => tile.id === fromTileId); const to = layout.tiles.find((tile) => tile.id === toTileId); if (!from || !to || from.locked || to.locked) return layout; return { ...layout, tiles: layout.tiles.map((tile) => tile.id === from.id ? { ...tile, sourceId: to.sourceId, label: to.label } : tile.id === to.id ? { ...tile, sourceId: from.sourceId, label: from.label } : tile) }; }), [updateActiveLayout]);
  const duplicateLayout = () => setLayouts((current) => [...current, { ...activeLayout, id: `layout-copy-${Date.now()}`, name: `${activeLayout.name} Copy`, favorite: false, tiles: activeLayout.tiles.map((tile) => ({ ...tile })) }]);
  const exportLayout = () => navigator.clipboard?.writeText(JSON.stringify({ ...activeLayout, note: 'Metadata-only export: no runtime video or decoded frame payloads.' }, null, 2)).catch(() => undefined);
  const importLayout = () => setLayouts((current) => [...current, createLayout('Custom', 'Imported Metadata Layout')]);
  return <div className="mx-auto flex max-w-[1800px] flex-col gap-4"><header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-4"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">UBOS Version 3.11</p><h1 className="text-3xl font-black">Professional Multiview & Monitor Wall</h1><p className="text-sm text-zinc-400">Metadata-first confidence monitoring with stream reuse, inactive tile virtualization, hidden tile throttling, and no persisted runtime video.</p></div><div className="flex flex-wrap gap-2">{(Object.keys(presetCounts) as LayoutPreset[]).map((preset) => <button key={preset} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={() => { const layout = createLayout(preset); setLayouts((current) => [...current, layout]); setActiveLayoutId(layout.id); }}>{preset}</button>)}</div></header><div className="grid gap-4 xl:grid-cols-[260px_1fr_340px]"><aside className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><h2 className="font-bold">Layouts</h2>{layouts.map((layout) => <button key={layout.id} className={`w-full rounded-lg p-2 text-left text-sm ${layout.id === activeLayout.id ? 'bg-cyan-500/20 text-cyan-100' : 'bg-white/5'}`} onClick={() => setActiveLayoutId(layout.id)}>{layout.favorite ? '★ ' : '☆ '}{layout.name}<span className="block text-xs text-zinc-400">{layout.preset} · {layout.tiles.length} tiles</span></button>)}<div className="grid grid-cols-2 gap-2 text-xs"><button className="rounded bg-white/10 p-2" onClick={duplicateLayout}>Duplicate</button><button className="rounded bg-white/10 p-2" onClick={() => updateActiveLayout((layout) => ({ ...layout, name: `${layout.name} Renamed` }))}>Rename</button><button className="rounded bg-white/10 p-2" onClick={() => updateActiveLayout((layout) => ({ ...layout, favorite: !layout.favorite }))}>Favorite</button><button className="rounded bg-white/10 p-2" onClick={() => setLayouts((current) => current.filter((layout) => layout.id !== activeLayout.id))}>Delete</button><button className="rounded bg-white/10 p-2" onClick={exportLayout}>Export</button><button className="rounded bg-white/10 p-2" onClick={importLayout}>Import</button></div><h3 className="pt-2 text-sm font-bold">Safe areas</h3>{(['titleSafe', 'actionSafe', 'centerCross', 'thirds', 'grid'] as SafeArea[]).map((area) => <label key={area} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={activeLayout.preferences.safeAreas.includes(area)} onChange={() => updateActiveLayout((layout) => ({ ...layout, preferences: { ...layout.preferences, safeAreas: layout.preferences.safeAreas.includes(area) ? layout.preferences.safeAreas.filter((item) => item !== area) : [...layout.preferences.safeAreas, area] } }))} />{area}</label>)}</aside><section className={`grid auto-rows-min gap-3 ${columns}`}>{activeLayout.tiles.map((tile) => <MonitorTile key={tile.id} tile={tile} source={sources.find((source) => source.id === tile.sourceId) ?? fallbackSource} safeAreas={activeLayout.preferences.safeAreas} fullscreen={fullscreenTileId === tile.id} onAssign={assignSource} onSelect={setSelectedTileId} onFullscreen={(tileId) => setFullscreenTileId((current) => current === tileId ? null : tileId)} onSwap={swapTiles} />)}</section><aside className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950/70 p-3"><h2 className="font-bold">Inspector</h2>{selectedTile && selectedSource ? <div className="space-y-2 text-sm"><p className="text-cyan-200">{selectedTile.label}</p>{[['Source ID', selectedSource.id], ['Source type', selectedSource.type], ['Current state', selectedSource.state], ['FPS', selectedSource.fps], ['Resolution', selectedSource.resolution], ['Dropped frames', selectedSource.droppedFrames], ['Latency', `${selectedSource.latencyMs} ms`], ['CPU', `${selectedSource.cpu}%`], ['GPU', `${selectedSource.gpu}%`], ['Runtime state', selectedSource.state]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-white/10 pb-1"><span className="text-zinc-400">{label}</span><span>{value}</span></div>)}<pre className="max-h-44 overflow-auto rounded bg-black/50 p-2 text-xs text-zinc-300">{JSON.stringify({ tile: selectedTile, metadata: selectedSource.metadata, persisted: activeLayout.inspectorMetadata }, null, 2)}</pre><div className="grid grid-cols-2 gap-2 text-xs"><button className="rounded bg-white/10 p-2" onClick={() => setFullscreenTileId(selectedTile.id)}>Fullscreen</button><button className="rounded bg-white/10 p-2" onClick={() => updateActiveLayout((layout) => ({ ...layout, tiles: layout.tiles.map((tile) => tile.id === selectedTile.id ? { ...tile, pinned: !tile.pinned } : tile) }))}>Pin</button><button className="rounded bg-white/10 p-2" onClick={() => updateActiveLayout((layout) => ({ ...layout, tiles: layout.tiles.map((tile) => tile.id === selectedTile.id ? { ...tile, locked: !tile.locked } : tile) }))}>Lock</button><button className="rounded bg-white/10 p-2" onClick={() => updateActiveLayout((layout) => ({ ...layout, tiles: layout.tiles.map((tile) => tile.id === selectedTile.id ? { ...tile, hidden: !tile.hidden } : tile) }))}>Hide</button><button className="col-span-2 rounded bg-cyan-500/20 p-2" onClick={() => setFullscreenTileId(selectedTile.id)}>Solo monitor</button></div></div> : null}<h3 className="font-bold">Audio monitoring</h3>{sources.filter((source) => ['audio', 'program', 'preview', 'camera', 'media', 'browser', 'replay'].includes(source.type)).map((source) => <div key={source.id} className="text-xs"><div className="mb-1 flex justify-between"><span>{source.label}</span><span>{source.level}%</span></div><AudioMeter level={source.level} /></div>)}</aside></div></div>;
}

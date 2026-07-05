'use client';
import { AssetList, AssetRow, BroadcastPanel, ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { ReactNode } from 'react';
import { createCompositorManifest } from '@ubos/shared';
const manifest = createCompositorManifest();
function UnavailableBadge({ children = 'Metadata only' }: { children?: string }) { return <StatusBadge variant="neutral">{children}</StatusBadge>; }
function Panel({ title, className, children }: { title: string; className: string; children: ReactNode }) { return <BroadcastPanel className={className}><h2 className={cn(ubosTypographyClasses.section, 'mb-ubos-2 text-ubos-fg-primary')}>{title}</h2>{children}</BroadcastPanel>; }
export function CompositorWorkspace() {
  const { compositor, shaders } = manifest;
  const layers = compositor.composition.layers;
  return <div className="grid h-full min-h-0 grid-cols-12 gap-ubos-3 overflow-auto p-ubos-3">
    <Panel title="Compositor Dashboard" className="col-span-12 lg:col-span-4"><ConsoleSection title="Renderer State"><InspectorRow label="Renderer" value={<UnavailableBadge>Renderer inactive</UnavailableBadge>} /><InspectorRow label="GPU" value={<UnavailableBadge>GPU not connected</UnavailableBadge>} /><InspectorRow label="Mode" value={<UnavailableBadge />} /></ConsoleSection></Panel>
    <Panel title="Layer Stack" className="col-span-12 lg:col-span-4"><AssetList isEmpty={false}>{layers.map((l)=><AssetRow key={l.id} title={l.name} subtitle={`${l.layerType} · z ${l.zOrder}`} status={<UnavailableBadge>{l.visible ? 'Visible metadata' : 'Hidden metadata'}</UnavailableBadge>} />)}</AssetList></Panel>
    <Panel title="Render Graph" className="col-span-12 lg:col-span-4"><AssetList isEmpty={false}>{compositor.graph.edges.map((e)=><AssetRow key={`${e.from}-${e.to}`} title={e.from} subtitle={`↓ ${e.to}`} status={<UnavailableBadge>No execution</UnavailableBadge>} />)}</AssetList></Panel>
    <Panel title="Transition Library" className="col-span-12 lg:col-span-3"><AssetList isEmpty={false}>{compositor.composition.transitions.map((t)=><AssetRow key={t.id} title={t.name} subtitle={`${t.durationMs}ms metadata`} status={<UnavailableBadge />} />)}</AssetList></Panel>
    <Panel title="Effect Library" className="col-span-12 lg:col-span-3"><AssetList isEmpty={false}>{compositor.composition.effects.map((e)=><AssetRow key={e.id} title={e.name} subtitle="Effect definition" status={<UnavailableBadge />} />)}</AssetList></Panel>
    <Panel title="Composition Inspector" className="col-span-12 lg:col-span-3"><InspectorRow label="Layers" value={String(layers.length)} /><InspectorRow label="Groups" value={String(compositor.composition.groups.length)} /><InspectorRow label="Runtime" value="Unavailable" /></Panel>
    <Panel title="Layer Properties" className="col-span-12 lg:col-span-3"><InspectorRow label="Opacity" value="Metadata only" /><InspectorRow label="Blend Mode" value="Metadata only" /><InspectorRow label="Position / Scale" value="Metadata only" /></Panel>
    <Panel title="Render Statistics" className="col-span-12 lg:col-span-3"><InspectorRow label="Frame Queue" value="Unavailable" /><InspectorRow label="FPS" value="Unavailable" /><InspectorRow label="Buffers" value="Unavailable" /></Panel>
    <Panel title="Preview Surface" className="col-span-12 lg:col-span-3"><div className="flex h-36 items-center justify-center rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon"><p className={cn(ubosTypographyClasses.metadata,'text-ubos-fg-muted')}>Unavailable · no display output</p></div></Panel>
    <Panel title="Output Surface" className="col-span-12 lg:col-span-3"><div className="flex h-36 items-center justify-center rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon"><p className={cn(ubosTypographyClasses.metadata,'text-ubos-fg-muted')}>Renderer inactive · metadata only</p></div></Panel>
    <Panel title="Shader Library" className="col-span-12 lg:col-span-3"><AssetList isEmpty={false}>{shaders.map((s)=><AssetRow key={s.id} title={s.name} subtitle={`${s.stage} contract`} status={<UnavailableBadge>No shader source</UnavailableBadge>} />)}</AssetList></Panel>
    <Panel title="Render Health" className="col-span-12"><p className="text-ubos-metadata text-ubos-fg-muted">Unavailable · Renderer inactive · GPU not connected · Metadata only.</p></Panel>
  </div>;
}

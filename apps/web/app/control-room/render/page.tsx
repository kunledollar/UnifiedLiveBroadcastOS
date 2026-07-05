import type { ReactNode } from 'react';
import { createRenderRuntime } from '@ubos/shared';

const runtime = createRenderRuntime();
const health = runtime.health;
const queue = runtime.session.queue.snapshot();

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-slate-800 bg-slate-950 p-4"><h2 className="text-sm font-semibold text-cyan-200">{title}</h2><div className="mt-3 text-sm text-slate-300">{children}</div></section>;
}

export default function RenderRuntimePage() {
  return <main className="min-h-screen bg-slate-950 p-6 text-slate-100"><div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3"><header className="lg:col-span-3"><p className="text-xs uppercase tracking-widest text-cyan-300">Phase 23</p><h1 className="text-3xl font-bold">GPU Compositor & Rendering Runtime</h1><p className="text-slate-400">Renderer unavailable · GPU unavailable · Frame builder active · Metadata only</p></header><Panel title="Render Dashboard"><p>Renderer: {String(health.rendererAvailable)}</p><p>GPU: {String(health.gpuAvailable)}</p><p>Frames built: {health.framesBuilt}</p></Panel><Panel title="Frame Queue"><p>Pending Frames: {queue.pending}</p><p>Current Frame: {queue.currentFrameId ?? 'none'}</p><p>Next Frame: {queue.nextFrameId ?? 'none'}</p><p>Dropped Frames: {queue.dropped}</p></Panel><Panel title="Composition Graph"><p>Scene ↓ Composition ↓ Layers ↓ Effects ↓ Transitions ↓ Frame ↓ Output Manifest</p></Panel><Panel title="Layer Resolver"><p>Show, hide, move, reorder, opacity, crop, scale, rotation, anchor, lock, solo, groups, nested groups.</p></Panel><Panel title="Frame Inspector"><p>Current Frame: none</p><p>Layer Count: 0</p><p>Effect Count: 0</p></Panel><Panel title="Transition Runtime"><p>CUT · FADE · DISSOLVE · WIPE · SLIDE · PUSH · ZOOM · STINGER placeholder</p></Panel><Panel title="Effect Chain"><p>Blur · Shadow · Glow · Border · Crop · Mask · Color Correction · Chroma Key · Luma Key · Opacity · Transform · Corner Pin · Perspective</p></Panel><Panel title="Output Resolver"><p>Output resolution: metadata only</p><p>Renderer unavailable</p></Panel><Panel title="Render Metrics"><p>Frame Queue: {health.queueLength}</p><p>Frame Build: {health.buildTimeMs}ms</p><p>Cache: {Math.round(health.cacheHitRatio * 100)}%</p></Panel><Panel title="Render Health"><p>Health: {health.status}</p>{health.messages.map((m) => <p key={m}>{m}</p>)}</Panel></div></main>;
}

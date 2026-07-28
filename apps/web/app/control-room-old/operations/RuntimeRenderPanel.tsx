import { createRenderRuntime } from '@ubos/shared';

export function RuntimeRenderPanel() {
  const runtime = createRenderRuntime();
  const health = runtime.health;
  const queue = runtime.session.queue.snapshot();
  return <section className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"><h2 className="text-sm font-semibold text-cyan-200">Runtime Render</h2><div className="mt-3 grid gap-1"><p>Current Frame: {queue.currentFrameId ?? 'none'}</p><p>Next Frame: {queue.nextFrameId ?? 'none'}</p><p>Frame Queue: {queue.pending}</p><p>Layer Count: 0</p><p>Effect Count: 0</p><p>Transition: metadata only</p><p>Health: {health.status}</p><p>Renderer unavailable · GPU unavailable · Frame builder active · Metadata only</p></div></section>;
}

'use client';
import type { Rect } from '@ubos/shared';

interface ProductionNode {
  id: string;
  label: string;
  type: 'source' | 'scene' | 'output' | 'mixer' | 'encoder';
  health: 'healthy' | 'degraded' | 'offline';
}

interface ProductionGraphVisualizerProps {
  nodes: ProductionNode[];
  /** Container rect from the GeometryEngine. */
  rect?: Rect;
  className?: string;
}

const healthColor: Record<ProductionNode['health'], string> = {
  healthy:  'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
  degraded: 'border-amber-500/60 bg-amber-500/10 text-amber-300',
  offline:  'border-red-500/60 bg-red-500/10 text-red-300',
};

const typeLabel: Record<ProductionNode['type'], string> = {
  source:  '◫',
  scene:   '▦',
  output:  '⇪',
  mixer:   '♫',
  encoder: '⊞',
};

/**
 * ProductionGraphVisualizer — renders the production signal flow graph.
 * Shows sources → scenes → mixer → encoder → output as a node network
 * with live health indicators.
 */
export function ProductionGraphVisualizer({
  nodes,
  rect,
  className,
}: ProductionGraphVisualizerProps) {
  const style = rect
    ? { position: 'absolute' as const, left: rect.x, top: rect.y, width: rect.width, height: rect.height }
    : undefined;

  return (
    <div
      data-graph="production"
      style={style}
      className={className ?? 'flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#080c12] p-3'}
    >
      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
        Production Graph
      </p>
      <div className="flex flex-1 flex-wrap gap-2 overflow-auto">
        {nodes.length === 0 && (
          <p className="text-[11px] text-[#334155]">No production nodes registered.</p>
        )}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-3 py-2 text-[10px] ${healthColor[node.health]}`}
          >
            <span className="text-sm" aria-hidden="true">{typeLabel[node.type]}</span>
            <span className="font-bold">{node.label}</span>
            <span className="text-[9px] opacity-70 capitalize">{node.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

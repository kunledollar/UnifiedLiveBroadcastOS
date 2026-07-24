'use client';
import type { Rect } from '@ubos/shared';

interface SceneGraphVisualizerProps {
  /** Scene ids to include in the graph. */
  sceneIds: string[];
  /** Currently active program scene id. */
  programSceneId: string | null;
  /** Currently active preview scene id. */
  previewSceneId: string | null;
  /** Container rect from the GeometryEngine. */
  rect?: Rect;
  className?: string;
}

/**
 * SceneGraphVisualizer — renders the scene composition graph.
 * Shows scenes as nodes and their source dependencies as edges.
 * Highlights program (red border) and preview (green border) nodes.
 */
export function SceneGraphVisualizer({
  sceneIds,
  programSceneId,
  previewSceneId,
  rect,
  className,
}: SceneGraphVisualizerProps) {
  const style = rect
    ? { position: 'absolute' as const, left: rect.x, top: rect.y, width: rect.width, height: rect.height }
    : undefined;

  return (
    <div
      data-graph="scene"
      style={style}
      className={className ?? 'flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#080c12] p-3'}
    >
      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
        Scene Graph
      </p>
      <div className="flex flex-1 flex-wrap gap-2 overflow-auto">
        {sceneIds.length === 0 && (
          <p className="text-[11px] text-[#334155]">No scenes registered.</p>
        )}
        {sceneIds.map((id) => {
          const isProgram = id === programSceneId;
          const isPreview = id === previewSceneId;
          return (
            <div
              key={id}
              className={[
                'flex flex-col items-center justify-center rounded-md border px-3 py-2 text-[10px]',
                isProgram ? 'border-red-500/60 bg-red-500/10 text-red-300' :
                isPreview ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300' :
                'border-[#1e2530] bg-[#0d1117] text-[#475569]',
              ].join(' ')}
            >
              <span className="font-bold">{id}</span>
              {isProgram && <span className="text-[9px]">PROGRAM</span>}
              {isPreview && <span className="text-[9px]">PREVIEW</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

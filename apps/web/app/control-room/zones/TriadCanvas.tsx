'use client';

import type { ProductionState } from '@ubos/shared';
import { SceneRenderer } from './SceneRenderer';
import { AiCrewOverlay } from './AiCrewOverlay';

type TriadScene = {
  id: string;
  name?: string;
  layers?: Array<{
    id: string;
    type: 'video' | 'image' | 'text' | 'graphics';
    src?: string;
    text?: string;
  }>;
};

type TriadCanvasProps = {
  id: 'scene' | 'preview' | 'program';
  scene: TriadScene | null | undefined;
  aspect?: string;
  state: ProductionState;
};

const borderColor: Record<TriadCanvasProps['id'], string> = {
  scene:   'border-t-2 border-[#1e3a5f]',
  preview: 'border-t-2 border-emerald-500/60',
  program: 'border-t-2 border-red-500/60',
};

const labelColor: Record<TriadCanvasProps['id'], string> = {
  scene:   'bg-[#0d1117] text-[#334155]',
  preview: 'bg-emerald-500/10 text-emerald-400',
  program: 'bg-red-500/15 text-red-400',
};

export function TriadCanvas({ id, scene, aspect, state }: TriadCanvasProps) {
  const label = id.toUpperCase();

  if (!scene) {
    return (
      <div
        className={`triad-canvas triad-${id} empty relative flex flex-1 flex-col overflow-hidden ${borderColor[id]}`}
        style={{ aspectRatio: aspect ?? '16 / 9' }}
      >
        <div className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${labelColor[id]}`}>
          {label}
        </div>
        <div className="flex flex-1 items-center justify-center bg-black text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f]">
          {label} — Empty
        </div>
      </div>
    );
  }

  return (
    <div
      className={`triad-canvas triad-${id} relative flex flex-1 flex-col overflow-hidden ${borderColor[id]}`}
      style={{ aspectRatio: aspect ?? '16 / 9' }}
    >
      {/* Canvas label */}
      <div className={`shrink-0 px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${labelColor[id]}`}>
        {label} {scene.name ? `· ${scene.name}` : ''}
      </div>

      {/* Scene content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SceneRenderer scene={scene} />

        {/* AI Crew Overlay — floats on top of Program canvas */}
        {id === 'program' && state.aiCrewActive && (
          <div className="pointer-events-none absolute inset-0 z-10">
            <AiCrewOverlay state={state} />
          </div>
        )}
      </div>
    </div>
  );
}

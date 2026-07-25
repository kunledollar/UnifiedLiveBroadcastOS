'use client';

import { useMemo } from 'react';
import type { ProductionState } from '@ubos/shared';
import { TriadCanvas } from './TriadCanvas';
import { workspaceState } from '../workspace/workspaceState';
import './TriadZone.css';

export function TriadZone({ state }: { state: ProductionState }) {
  const { previewScene, programScene, aspectRatios } = state;

  const triad = useMemo(() => {
    // Prefer data from SceneGraphEngine when scenes are loaded
    const engineCurrent = workspaceState.sceneGraph.getCurrentScene();
    const enginePreview = workspaceState.sceneGraph.getPreviewScene();

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scene:   (engineCurrent ?? state.currentScene ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preview: (enginePreview ?? previewScene ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      program: (engineCurrent ?? programScene ?? null) as any,
    };
  }, [state.currentScene, previewScene, programScene]);

  return (
    <div className="triad-zone">
      <div className="triad-row">

        {/* Scene — left */}
        <TriadCanvas
          id="scene"
          scene={triad.scene}
          aspect={aspectRatios?.scene ?? '16 / 9'}
          state={state}
        />

        {/* Preview — center */}
        <TriadCanvas
          id="preview"
          scene={triad.preview}
          aspect={aspectRatios?.preview ?? '16 / 9'}
          state={state}
        />

        {/* Program — right */}
        <TriadCanvas
          id="program"
          scene={triad.program}
          aspect={aspectRatios?.program ?? '16 / 9'}
          state={state}
        />

      </div>
    </div>
  );
}
